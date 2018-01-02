class MessagesChannel < ApplicationCable::Channel
  def subscribed
    stream_from 'messages'
    @broadcasting = "messages/" + SecureRandom.uuid
    stream_from @broadcasting
    query(params)
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    logger.info "unsubscribed"
  end

  # data: { q: }
  def query(data)
    q = data['q']
    messages = room.messages.query(q).order(created_at: :desc).limit(10)
    messages = messages.as_json(
      only: [:id, :content, :meta, :room_id],
      include: {
        user: { only: :id, methods: :name },
        ancestors: { only: :id },
        descendants: { only: :id }
      }
    )
    ActionCable.server.broadcast(@broadcasting, messages: messages, query: Message.parse_query(q))
  end

  # data: { id:, tag: }
  def add_tag(data)
    message = room.messages.find(data['id'])
    message.content += " ##{data['tag']}"
    message.save!
    ActionCable.server.broadcast('messages', refresh: true)
  end

  private

  def room
    Room.find(params['room'])
  end
end
