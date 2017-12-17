class CurrentUserChannel < ApplicationCable::Channel
  def subscribed
    if current_user
      stream_for current_user
      CurrentUserChannel.broadcast_to(current_user, id: current_user.id)
    end
  end

  def unsubscribed
  end
end
