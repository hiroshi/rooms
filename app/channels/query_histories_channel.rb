class QueryHistoriesChannel < ApplicationCable::Channel
  def subscribed
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
    # q = data['q']
    messages = room.messages.tags('query').order(updated_at: :desc).limit(10)
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
    Room.find(params['room'])
  end
end
