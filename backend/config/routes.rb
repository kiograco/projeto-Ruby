Rails.application.routes.draw do
  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    get "health", to: "health#show"
    get "me", to: "me#show"
    patch "me", to: "me#update"

    post "auth/login", to: "auth#login"
    post "auth/refresh", to: "auth#refresh"
    post "auth/logout", to: "auth#logout"

    resources :users
    post "notifications/mark_all_read", to: "notifications#mark_all_read"
    resources :notifications, only: [ :index, :update ]
    resources :customers
    resources :vehicles
    resources :drivers
    resources :orders

    post "tracking/location", to: "tracking#create"
    get "tracking/history/:order_id", to: "tracking#history"
    get "tracking/:order_id", to: "tracking#show"

    get "dashboard/overview", to: "dashboard#overview"
    get "dashboard/realtime", to: "dashboard#realtime"

    get "reports/deliveries", to: "reports#deliveries"
    get "reports/drivers", to: "reports#drivers"
    get "reports/performance", to: "reports#performance"
  end

  mount ActionCable.server => "/cable"
end
