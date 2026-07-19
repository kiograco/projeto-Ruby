module Api
  class HealthController < ApplicationController
    def show
      render json: { status: "ok", environment: Rails.env, timestamp: Time.current.iso8601 }
    end
  end
end
