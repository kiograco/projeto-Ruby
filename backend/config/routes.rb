Rails.application.routes.draw do
  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    get "health", to: "health#show"
    get "me", to: "me#show"

    post "auth/login", to: "auth#login"
    post "auth/refresh", to: "auth#refresh"
    post "auth/logout", to: "auth#logout"

    resources :customers
    resources :vehicles
    resources :drivers
  end

  mount ActionCable.server => "/cable"
end
