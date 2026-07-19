module Api
  class UsersController < ApplicationController
    before_action :authenticate_user!
    before_action :set_user, only: [ :show, :update, :destroy ]

    def index
      authorize User
      scope = policy_scope(User).order(:name)
      scope = scope.search(params[:q]) if params[:q].present?
      pagy_object, users = pagy(:offset, scope, limit: 20, max_limit: 100)

      render json: {
        users: users.map { |user| UserSerializer.new(user).as_json },
        meta: pagy_meta(pagy_object)
      }
    end

    def show
      authorize @user
      render json: UserSerializer.new(@user).as_json
    end

    def create
      authorize User
      role = find_role(params[:role])
      return unless role

      user = User.new(user_params.merge(role: role))

      if user.save
        AuditLogger.log(action: "user_created", resource: user, after: audit_state(user))
        render json: UserSerializer.new(user).as_json, status: :created
      else
        render json: { errors: user.errors.full_messages }, status: :unprocessable_content
      end
    end

    def update
      authorize @user
      attrs = user_params

      if params[:role].present?
        role = find_role(params[:role])
        return unless role

        attrs = attrs.merge(role: role)
      end

      before_state = audit_state(@user)

      if @user.update(attrs)
        AuditLogger.log(action: "user_updated", resource: @user, before: before_state, after: audit_state(@user))
        render json: UserSerializer.new(@user).as_json
      else
        render json: { errors: @user.errors.full_messages }, status: :unprocessable_content
      end
    end

    # Users are deactivated rather than hard-deleted: they may be referenced by
    # historical orders (created_by), audit entries, etc.
    def destroy
      authorize @user
      before_state = audit_state(@user)
      @user.update!(active: false)
      AuditLogger.log(action: "user_deactivated", resource: @user, before: before_state, after: audit_state(@user))
      head :no_content
    end

    private

    def set_user
      @user = User.find(params[:id])
    end

    def find_role(name)
      Role.find_or_create_by!(name: name)
    rescue ActiveRecord::RecordInvalid
      render json: { errors: [ "Role #{name.inspect} is invalid" ] }, status: :unprocessable_content
      nil
    end

    def user_params
      permitted = params.permit(:name, :email, :password, :password_confirmation, :active)
      permitted.delete(:password) if permitted[:password].blank?
      permitted
    end

    def audit_state(user)
      { name: user.name, email: user.email, role: user.role&.name, active: user.active }
    end
  end
end
