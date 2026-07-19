module Api
  class TrackingController < ApplicationController
    before_action :authenticate_user!

    def create
      driver = current_user.driver
      return render_forbidden unless driver

      order = Order.find(params[:order_id])
      return render_forbidden unless order.driver_id == driver.id

      point = order.tracking_points.new(tracking_params.merge(driver: driver))

      if point.save
        driver.update_location!(latitude: point.latitude, longitude: point.longitude)
        DeliveryTrackingChannel.broadcast_to(order, TrackingPointSerializer.new(point).as_json)
        render json: TrackingPointSerializer.new(point).as_json, status: :created
      else
        render json: { errors: point.errors.full_messages }, status: :unprocessable_content
      end
    end

    def show
      order = Order.find(params[:order_id])
      return render_forbidden unless tracking_authorized?(order)

      point = order.tracking_points.order(recorded_at: :desc).first

      render json: {
        order_status: order.status,
        point: point && TrackingPointSerializer.new(point).as_json
      }
    end

    def history
      order = Order.find(params[:order_id])
      return render_forbidden unless tracking_authorized?(order)

      points = order.tracking_points.order(:recorded_at)

      render json: { points: points.map { |point| TrackingPointSerializer.new(point).as_json } }
    end

    private

    def tracking_params
      params.permit(:latitude, :longitude, :speed, :heading)
    end

    def tracking_authorized?(order)
      return true if admin_or_dispatcher?
      return true if current_user.driver && order.driver_id == current_user.driver.id
      return true if order.created_by_id == current_user.id

      false
    end

    def admin_or_dispatcher?
      [ Role::ADMIN, Role::DISPATCHER ].include?(current_user.role.name)
    end
  end
end
