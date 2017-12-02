class MessageChannel < ApplicationCable::Channel
  def subscribed
    stream_from "messages"
    # stream_from "hoge"
    logger.info "subscribed"
    broadcast_messages
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    logger.info "unsubscribed"
  end

  def push(data)
    puts "params: #{params}"
    puts "data: #{data}"
    puts "last message: #{@message&.content}"
    Message.create!(data.slice('content'))
    broadcast_messages
  end

  private

  def broadcast_messages
    ActionCable.server.broadcast('messages', Message.order(created_at: :desc).limit(10).all)
  end
end
