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

  def query(data)
    messages = room.messages.query(data['q']).order(created_at: :desc).limit(10)
    ActionCable.server.broadcast(@broadcasting, messages: messages)
  end

  def push(data)
    room.messages.create!(data.slice('content'))
    ActionCable.server.broadcast('messages', refresh: true)
  end

  private

  def room
    Room.find(params['room'])
  end
end
