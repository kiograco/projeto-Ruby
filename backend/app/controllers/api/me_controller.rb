module Api
  class MeController < ApplicationController
    before_action :authenticate_user!

    def show
      render json: UserSerializer.new(current_user).as_json
    end

    def update
      attrs = params.permit(:name, :password, :password_confirmation)
      attrs.delete(:password) if attrs[:password].blank?

      if current_user.update(attrs)
        render json: UserSerializer.new(current_user).as_json
      else
        render json: { errors: current_user.errors.full_messages }, status: :unprocessable_content
      end
    end
  end
end
