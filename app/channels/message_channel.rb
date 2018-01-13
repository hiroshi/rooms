class MessageChannel < ApplicationCable::Channel
  def subscribed
    unless room
      reject
      return
    end
    stream_for message
  end

  def update(data)
    message.update!(content: data['content'])
    ActionCable.server.broadcast('messages', refresh: true)
  end

  def create(data)
    current_user.messages.create!(content: data['content'], room_id: data['room_id'])
    ActionCable.server.broadcast('messages', refresh: true)
  end

  def reply(data)
    ActiveRecord::Base.transaction do
      room = message.room
      child = current_user.messages.create!(data.slice('content').merge(room: room))
      message.descendant_relationships.create!(child: child, order: 0)
    end
    ActionCable.server.broadcast('messages', refresh: true)
  end

  private

  def room
    current_user.rooms.find_by(id: params['room'])
  end

  def message
    @message ||= room.message.find_by(id: params[:id])
  end
end
