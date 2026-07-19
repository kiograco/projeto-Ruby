class OrderPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    admin_or_dispatcher? || own_driver_record? || own_created_record?
  end

  def create?
    user && [ Role::ADMIN, Role::DISPATCHER, Role::CUSTOMER ].include?(user.role.name)
  end

  def update?
    admin_or_dispatcher? || own_driver_record?
  end

  def destroy?
    admin?
  end

  class Scope < Scope
    def resolve
      return scope.all if admin_or_dispatcher?
      return scope.where(driver_id: driver_id) if driver?
      return scope.where(created_by_id: user.id) if customer?

      scope.none
    end

    private

    def admin_or_dispatcher?
      user && [ Role::ADMIN, Role::DISPATCHER ].include?(user.role.name)
    end

    def driver?
      user && user.role.name == Role::DRIVER
    end

    def customer?
      user && user.role.name == Role::CUSTOMER
    end

    def driver_id
      user.driver&.id
    end
  end

  private

  def admin?
    user && user.role.name == Role::ADMIN
  end

  def admin_or_dispatcher?
    user && [ Role::ADMIN, Role::DISPATCHER ].include?(user.role.name)
  end

  def own_driver_record?
    user && user.role.name == Role::DRIVER && user.driver && record.driver_id == user.driver.id
  end

  def own_created_record?
    user && user.role.name == Role::CUSTOMER && record.created_by_id == user.id
  end
end
