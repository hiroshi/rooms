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
    query_tag = "q=#{data['q']}"
    messages = room.messages.tags('query').no_tags(query_tag).order(updated_at: :desc).limit(10)
    messages = messages.as_json(
      only: :id,
      methods: :first_line,
    )
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
