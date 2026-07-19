module Api
  class CustomersController < ApplicationController
    before_action :authenticate_user!
    before_action :set_customer, only: [ :show, :update, :destroy ]

    def index
      authorize Customer
      scope = policy_scope(Customer).order(:name)
      scope = scope.search(params[:q]) if params[:q].present?
      pagy_object, customers = pagy(:offset, scope, limit: 20, max_limit: 100)

      render json: {
        customers: customers.map { |c| CustomerSerializer.new(c).as_json },
        meta: pagy_meta(pagy_object)
      }
    end

    def show
      authorize @customer
      render json: CustomerSerializer.new(@customer).as_json
    end

    def create
      authorize Customer
      customer = Customer.new(customer_params)

      if customer.save
        render json: CustomerSerializer.new(customer).as_json, status: :created
      else
        render json: { errors: customer.errors.full_messages }, status: :unprocessable_content
      end
    end

    def update
      authorize @customer

      if @customer.update(customer_params)
        render json: CustomerSerializer.new(@customer).as_json
      else
        render json: { errors: @customer.errors.full_messages }, status: :unprocessable_content
      end
    end

    def destroy
      authorize @customer
      @customer.destroy!
      head :no_content
    end

    private

    def set_customer
      @customer = Customer.find(params[:id])
    end

    def customer_params
      params.permit(:name, :phone, :email, :document)
    end
  end
end
