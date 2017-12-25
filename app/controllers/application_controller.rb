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
end
