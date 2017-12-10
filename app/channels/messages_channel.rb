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
    messages = Message.query(data&.[]('query')).order(created_at: :desc).limit(10)
    ActionCable.server.broadcast(@broadcasting, messages: messages)
  end

  def push(data)
    # puts "params: #{params}"
    # puts "data: #{data}"
    # puts "last message: #{@message&.content}"
    Message.create!(data.slice('content'))
    ActionCable.server.broadcast('messages', refresh: true)
  end
end
