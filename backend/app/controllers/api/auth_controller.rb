module Api
  class AuthController < ApplicationController
    def login
      user = User.active.find_by(email: params[:email]&.downcase)

      if user.nil? || user.locked?
        return render json: { error: "Invalid credentials" }, status: :unauthorized
      end

      if user.authenticate(params[:password])
        user.reset_failed_attempts!
        render json: issue_tokens(user), status: :ok
      else
        user.register_failed_attempt!
        render json: { error: "Invalid credentials" }, status: :unauthorized
      end
    end

    def refresh
      token_record = RefreshToken.find_by_raw_token(params[:refresh_token])

      if token_record.nil? || !token_record.active?
        return render json: { error: "Invalid refresh token" }, status: :unauthorized
      end

      token_record.revoke!
      render json: issue_tokens(token_record.user), status: :ok
    end

    def logout
      token_record = RefreshToken.find_by_raw_token(params[:refresh_token])
      token_record&.revoke!
      head :no_content
    end

    private

    def issue_tokens(user)
      raw_refresh_token, = RefreshToken.issue_for(
        user, ip_address: request.remote_ip, user_agent: request.user_agent
      )

      {
        access_token: JwtService.encode(user),
        refresh_token: raw_refresh_token,
        user: UserSerializer.new(user).as_json
      }
    end
  end
end
