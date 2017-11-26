class ChatChannel < ApplicationCable::Channel
  def subscribed
    # stream_from "some_channel"
    logger.info "subscribed"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    logger.info "unsubscribed"
  end
end
