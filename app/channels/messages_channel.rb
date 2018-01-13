class MessagesChannel < ApplicationCable::Channel
  def subscribed
    unless room
      reject
      return
    end
    stream_from 'messages'
    @broadcasting = "messages/" + SecureRandom.uuid
    stream_from @broadcasting
    query(params)
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    logger.info "unsubscribed"
  end

  # data: { q: }
  def query(data)
    q = data['q']
    messages = room.messages.query(q).order(created_at: :desc).limit(10)
    messages = messages.as_json(
      only: [:id, :content, :meta, :room_id, :created_at],
      include: {
        user: { only: :id, methods: :name },
        ancestors: { only: :id },
        descendants: { only: :id }
      }
    )
    ActionCable.server.broadcast(
      @broadcasting,
      messages: messages,
      query: Message.parse_query(q),
      count: room.messages.query(q).count
    )
    # save query history
    if q.present? && data['save']
      query_tag = q.strip.gsub(/\s+/,'+')
      query_message = room.messages.tags('query', query_tag).first || room.messages.build
      query_message.update!(content: <<~CONTENT, user: current_user)
        #{q}
        #query ##{query_tag}
      CONTENT
    end
  end

  # data: { id:, tag: }
  def add_tag(data)
    message = room.messages.find(data['id'])
    message.content += " ##{data['tag']}"
    message.save!
    ActionCable.server.broadcast('messages', refresh: true)
  end

  # data: { content:, parent_id: }
  def create(data)
    ActiveRecord::Base.transaction do
      message = room.messages.create!(content: data['content'], user: current_user)
      if data['parent_id']
        parent = room.messages.find_by(id: data['parent_id'])
        parent.descendant_relationships.create!(child: message, order: 0)
      end
    end
    ActionCable.server.broadcast('messages', refresh: true)
  end

  private

  def room
    current_user.rooms.find_by(id: params['room'])
  end
end
