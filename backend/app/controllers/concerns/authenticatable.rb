module Authenticatable
  extend ActiveSupport::Concern

  included do
    attr_reader :current_user
  end

  def authenticate_user!
    token = bearer_token
    return render_unauthorized if token.blank?

    payload = JwtService.decode(token)
    @current_user = User.active.find_by(id: payload["sub"])
    return render_unauthorized if @current_user.nil?

    Current.user = @current_user
    Current.ip_address = request.remote_ip
  rescue JwtService::DecodeError
    render_unauthorized
  end

  private

  def bearer_token
    header = request.headers["Authorization"]
    header.split(" ", 2).last if header&.start_with?("Bearer ")
  end

  def render_unauthorized
    render json: { error: "Unauthorized" }, status: :unauthorized
  end
end
