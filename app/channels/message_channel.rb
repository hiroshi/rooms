class MessageChannel < ApplicationCable::Channel
  def subscribed
    message = Message.find(params[:id])
    stream_for message
  end

  def save(data)
    message = Message.find(data['id'])
    message.update!(content: data['content'])
    broadcast_messages
  end
end
