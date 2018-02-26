Rails.application.routes.draw do
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  scope format: false do
    match '/health' => 'application#health', via: [:get, :post]
    get '/auth/:provider/callback' => 'application#auth_callback'
    post '/feed/:provider/callback' => 'application#feed_callback'
    post '/messages' => 'application#post_message'
  end
end
