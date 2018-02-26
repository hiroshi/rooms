class ApplicationController < ActionController::Base
  def health
    render plain: 'ok'
  end

  def auth_callback
    auth = request.env['omniauth.auth']
    cred = Credential.find_or_create_by(provider: auth.provider, uid: auth.uid)
    unless cred.user
      cred.create_user!
    end
    cred.info = auth.info
    cred.save!
    user = cred.user
    if user.rooms.blank?
      user.rooms.create!(name: 'New Room')
    end
    cookies.encrypted[:user_id] = user.id
    redirect_to request.env['omniauth.origin'] || "/?room=#{user.rooms.first.id}"
  end

  def feed_callback
    json =  JSON.parse(request.body.read())
    if json['items'].present?
      json['items'].each do |item|
        if Message.where("meta->'src'->>'summary' = ?", item['summary']).exists?
          next
        end
        Message.create!(room_id: 1, user_id: 2, meta: {src: item}, content: <<~CONTENT)
          #{item['title']} / #{json['title']}
          #{item['standardLinks'].values.flatten.map{|l|l['href']}.join("\n")}
          #feed #HackerNews
        CONTENT
      end
      ActionCable.server.broadcast('messages', refresh: true)
    end
    head :created
  end

  def post_message
    Message.create!(room_id: 1, user_id: 2, content: params[:content])
    head :created
  end
end
