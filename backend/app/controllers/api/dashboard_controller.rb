module Api
  class DashboardController < ApplicationController
    OPEN_STATUSES = (Order::ALLOWED_TRANSITIONS.keys - %w[delivered cancelled failed]).freeze

    before_action :authenticate_user!
    before_action :require_admin_or_dispatcher!

    def overview
      delivered_today = Order.where(status: Order::DELIVERED, delivered_at: today_range)

      render json: {
        active_drivers: Driver.joins(:user).where(users: { active: true }).count,
        online_drivers: Driver.online.count,
        deliveries_today: Order.where(created_at: today_range).count,
        average_delivery_time_minutes: average_delivery_minutes(delivered_today),
        revenue_today: delivered_today.sum(:total_price).to_f,
        pending_deliveries: Order.where(status: OPEN_STATUSES).count,
        completed_deliveries: delivered_today.count
      }
    end

    def realtime
      drivers = Driver.online.includes(:user, :orders)

      render json: {
        drivers: drivers.map do |driver|
          current_order = driver.orders.find { |order| OPEN_STATUSES.include?(order.status) }

          {
            id: driver.id,
            name: driver.user.name,
            status: driver.status,
            latitude: driver.current_latitude&.to_f,
            longitude: driver.current_longitude&.to_f,
            current_order_id: current_order&.id
          }
        end
      }
    end

    private

    def today_range
      Time.zone.today.all_day
    end

    def average_delivery_minutes(scope)
      durations = scope.pluck(:created_at, :delivered_at).map { |created, delivered| (delivered - created) / 60.0 }
      return nil if durations.empty?

      (durations.sum / durations.size).round(1)
    end

    def require_admin_or_dispatcher!
      return if [ Role::ADMIN, Role::DISPATCHER ].include?(current_user.role.name)

      render_forbidden
    end
  end
end
