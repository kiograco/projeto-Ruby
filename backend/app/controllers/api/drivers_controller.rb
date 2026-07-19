module Api
  class DriversController < ApplicationController
    before_action :authenticate_user!
    before_action :set_driver, only: [ :show, :update, :destroy, :create_document, :destroy_document ]

    def index
      authorize Driver
      scope = policy_scope(Driver).joins(:user).includes(:user, :vehicle).order("users.name")
      scope = scope.search(params[:q]) if params[:q].present?
      pagy_object, drivers = pagy(:offset, scope, limit: 20, max_limit: 100)

      render json: {
        drivers: drivers.map { |d| DriverSerializer.new(d).as_json },
        meta: pagy_meta(pagy_object)
      }
    end

    def show
      authorize @driver
      render json: DriverSerializer.new(@driver).as_json
    end

    def create
      authorize Driver
      driver = DriverRegistration.call(driver_registration_params)
      render json: DriverSerializer.new(driver).as_json, status: :created
    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
    end

    def update
      authorize @driver

      if @driver.update(driver_update_params)
        render json: DriverSerializer.new(@driver).as_json
      else
        render json: { errors: @driver.errors.full_messages }, status: :unprocessable_content
      end
    end

    def destroy
      authorize @driver
      @driver.destroy!
      head :no_content
    end

    def create_document
      authorize @driver, :update?
      return render json: { errors: [ "file is required" ] }, status: :unprocessable_content if params[:file].blank?

      @driver.documents.attach(params[:file])
      render json: DriverSerializer.new(@driver.reload).as_json, status: :created
    end

    def destroy_document
      authorize @driver, :update?
      document = @driver.documents.find(params[:document_id])
      document.purge
      render json: DriverSerializer.new(@driver.reload).as_json
    end

    private

    def set_driver
      @driver = Driver.find(params[:id])
    end

    def driver_registration_params
      params.permit(:name, :email, :password, :license_number, :vehicle_id, :status)
    end

    def driver_update_params
      params.permit(:license_number, :vehicle_id, :status)
    end
  end
end
