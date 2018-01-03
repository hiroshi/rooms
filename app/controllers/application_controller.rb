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
    redirect_to "/?room=#{user.rooms.first.id}"
  end

  def feed_callback
    json =  JSON.parse(request.body.read())
    if json['items'].present?
      json['items'].each do |item|
        Message.create!(room_id: 1, user_id: 2, content: <<~CONTENT)
        #{item['title']} / #{json['title']}
        #{item['standardLinks'].values.flatten.map{|l|l['href']}.join("\n")}
        #feed #HackerNews
        CONTENT
      end
      ActionCable.server.broadcast('messages', refresh: true)
    end
    head :ok
  end
end
