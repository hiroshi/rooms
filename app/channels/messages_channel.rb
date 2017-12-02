class MessagesChannel < ApplicationCable::Channel
  def subscribed
    stream_from "messages"
    broadcast_messages
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    logger.info "unsubscribed"
  end

  def push(data)
    # puts "params: #{params}"
    # puts "data: #{data}"
    # puts "last message: #{@message&.content}"
    Message.create!(data.slice('content'))
    broadcast_messages
  end
end
