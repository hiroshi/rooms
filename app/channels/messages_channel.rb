class MessagesChannel < ApplicationCable::Channel
  def subscribed
    stream_from "messages"
    query(nil)
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    logger.info "unsubscribed"
  end

  def query(data)
    criteria = Message.all
    if data
      criteria = criteria.tags(*data['query'].scan(/\#(\w+)/).map {|tag, _| tag })
      criteria = criteria.no_tags(*data['query'].scan(/\!(\w+)/).map {|tag, _| tag })
    end
    ActionCable.server.broadcast('messages', messages: criteria.order(created_at: :desc).limit(10))
  end

  def push(data)
    # puts "params: #{params}"
    # puts "data: #{data}"
    # puts "last message: #{@message&.content}"
    Message.create!(data.slice('content'))
    ActionCable.server.broadcast('messages', refresh: true)
  end
end
