class MessageChannel < ApplicationCable::Channel
  def subscribed
    stream_from "messages"
    logger.info "subscribed"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    logger.info "unsubscribed"
  end

  def push(data)
    puts "params: #{params}"
    puts "data: #{data}"
    message = Message.create!(data.slice('content'))
    ActionCable.server.broadcast('messages', message)
  end
end
