class UserPolicy < ApplicationPolicy
  def index?
    admin_or_dispatcher?
  end

  def show?
    admin_or_dispatcher?
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
      admin_or_dispatcher? ? scope.all : scope.none
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
end
