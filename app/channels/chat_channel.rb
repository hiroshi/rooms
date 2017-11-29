class ChatChannel < ApplicationCable::Channel
  def subscribed
    stream_from "hoge"
    logger.info "subscribed"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    logger.info "unsubscribed"
  end

  def push(data)
    logger.info "push: #{data}"
    ActionCable.server.broadcast('hoge', data)
  end
end
