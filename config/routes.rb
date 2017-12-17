Rails.application.routes.draw do
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  get '/health' => 'application#health', format: false
  get '/auth/:provider/callback' => 'application#auth_callback', format: false
end
