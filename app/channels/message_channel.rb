class MessageChannel < ApplicationCable::Channel
  def subscribed
    unless room
      reject
      return
    end
    if message.id
      stream_for message
    else
      stream_from 'new message'
    end
  end

  def update(data)
    message.update!(content: data['content'])
    ActionCable.server.broadcast('messages', refresh: true)
  end

  # def create(data)
  #   current_user.messages.create!(content: data['content'], room_id: data['room_id'])
  #   ActionCable.server.broadcast('messages', refresh: true)
  # end

  private

  def room
    current_user.rooms.find_by(id: message.room_id)
  end

  def message
    if params[:id]
      Message.find_by(id: params[:id])
    else
      Message.new(room_id: params[:room], user: current_user)
    end
  end
end
