module Api
  class VehiclesController < ApplicationController
    before_action :authenticate_user!
    before_action :set_vehicle, only: [ :show, :update, :destroy ]

    def index
      authorize Vehicle
      scope = policy_scope(Vehicle).order(:plate)
      scope = scope.search(params[:q]) if params[:q].present?
      pagy_object, vehicles = pagy(:offset, scope, limit: 20, max_limit: 100)

      render json: {
        vehicles: vehicles.map { |v| VehicleSerializer.new(v).as_json },
        meta: pagy_meta(pagy_object)
      }
    end

    def show
      authorize @vehicle
      render json: VehicleSerializer.new(@vehicle).as_json
    end

    def create
      authorize Vehicle
      vehicle = Vehicle.new(vehicle_params)

      if vehicle.save
        render json: VehicleSerializer.new(vehicle).as_json, status: :created
      else
        render json: { errors: vehicle.errors.full_messages }, status: :unprocessable_content
      end
    end

    def update
      authorize @vehicle

      if @vehicle.update(vehicle_params)
        render json: VehicleSerializer.new(@vehicle).as_json
      else
        render json: { errors: @vehicle.errors.full_messages }, status: :unprocessable_content
      end
    end

    def destroy
      authorize @vehicle
      @vehicle.destroy!
      head :no_content
    end

    private

    def set_vehicle
      @vehicle = Vehicle.find(params[:id])
    end

    def vehicle_params
      params.permit(:plate, :model, :year, :vehicle_type, :capacity)
    end
  end
end
