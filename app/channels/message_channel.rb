class MessageChannel < ApplicationCable::Channel
  def subscribed
    message = Message.find(params[:id])
    stream_for message
  end

  def save(data)
    message = Message.find(data['id'])
    message.update!(content: data['content'])
    ActionCable.server.broadcast('messages', refresh: true)
  end

  # def addLabel(data)
  #   message = Message.find(data['id'])
  # end

  def reply(data)
    ActiveRecord::Base.transaction do
      room = message.room
      child = Message.create!(data.slice('content').merge(user: current_user, room: room))
      message.descendant_relationships.create!(child: child, order: 0)
    end
    ActionCable.server.broadcast('messages', refresh: true)
  end

  private

  def message
    Message.find(params[:id])
  end
end
