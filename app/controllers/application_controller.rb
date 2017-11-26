class ApplicationController < ActionController::API
  def health
    render plain: 'hello'
  end
end
