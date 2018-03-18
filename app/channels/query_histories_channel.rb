class QueryHistoriesChannel < ApplicationCable::Channel
  def subscribed
    unless room
      reject
      return
    end
    @broadcasting = "query_histories/" + SecureRandom.uuid
    stream_from @broadcasting
    histories(params)
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    logger.info "unsubscribed"
  end

  # data: { q: }
  def histories(data)
    q = (data['q'] || '').strip
    content = <<~CONTENT
      #{q}
      #query
    CONTENT
    messages = room.messages.tags('query').where.not(content: content).order(updated_at: :desc).limit(20)
    messages = messages.as_json(
      only: :id,
      methods: :first_line,
    ).each do |m|
      m[:count] = room.messages.query(m['first_line']).count
    end
    ActionCable.server.broadcast(
      @broadcasting,
      histories: messages
    )
  end

  private

  def room
    current_user.rooms.find_by(id: params['room'])
  end
end
