module ApplicationCable
  class Channel < ActionCable::Channel::Base

    private

    def broadcast_messages
      ActionCable.server.broadcast('messages', Message.order(created_at: :desc).limit(10).all)
    end
  end
end
