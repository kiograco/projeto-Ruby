class DriverPolicy < ApplicationPolicy
  def index?
    admin_or_dispatcher? || user&.role&.name == Role::DRIVER
  end

  def show?
    admin_or_dispatcher? || own_record?
  end

  def create?
    admin?
  end

  def update?
    admin?
  end

  def destroy?
    admin?
  end

  class Scope < Scope
    def resolve
      return scope.all if admin_or_dispatcher?
      return scope.where(user_id: user.id) if user

      scope.none
    end

    private

    def admin_or_dispatcher?
      user && [ Role::ADMIN, Role::DISPATCHER ].include?(user.role.name)
    end
  end

  private

  def admin?
    user && user.role.name == Role::ADMIN
  end

  def admin_or_dispatcher?
    user && [ Role::ADMIN, Role::DISPATCHER ].include?(user.role.name)
  end

  def own_record?
    user && record.user_id == user.id
  end
end
