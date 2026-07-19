class ApplicationController < ActionController::API
  include Authenticatable
  include Pundit::Authorization
  include Pagy::Method

  rescue_from Pundit::NotAuthorizedError, with: :render_forbidden
  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found

  private

  def render_forbidden
    render json: { error: "Forbidden" }, status: :forbidden
  end

  def render_not_found
    render json: { error: "Not found" }, status: :not_found
  end

  def pagy_meta(pagy_object)
    { page: pagy_object.page, pages: pagy_object.pages, count: pagy_object.count, limit: pagy_object.limit }
  end
end
