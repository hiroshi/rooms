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

  def addLabel(data)
    message = Message.find(data['id'])
  end
end
