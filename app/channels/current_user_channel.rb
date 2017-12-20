class CurrentUserChannel < ApplicationCable::Channel
  def subscribed
    if current_user
      stream_for current_user
      data = current_user.as_json(only: [:id], include: { rooms: { only: [:id, :name] } })
      CurrentUserChannel.broadcast_to(current_user, data)
    end
  end

  def unsubscribed
  end
end
