Rails.application.routes.draw do
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  match '/health' => 'application#health', format: false, via: [:get, :post]
  get '/auth/:provider/callback' => 'application#auth_callback', format: false
  post '/feed/:provider/callback' => 'application#feed_callback' , format: false
end
