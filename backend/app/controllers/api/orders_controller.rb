module Api
  class OrdersController < ApplicationController
    before_action :authenticate_user!
    before_action :set_order, only: [ :show, :update, :destroy ]

    def index
      authorize Order
      scope = policy_scope(Order)
        .includes(:customer, :driver, :pickup_address, :delivery_address, :order_items)
        .order(created_at: :desc)
      scope = scope.with_status(params[:status])
      pagy_object, orders = pagy(:offset, scope, limit: 20, max_limit: 100)

      render json: {
        orders: orders.map { |o| OrderSerializer.new(o).as_json },
        meta: pagy_meta(pagy_object)
      }
    end

    def show
      authorize @order
      render json: OrderSerializer.new(@order).as_json
    end

    def create
      authorize Order
      order = Order.new(order_params)
      order.created_by = current_user

      if order.save
        render json: OrderSerializer.new(order).as_json, status: :created
      else
        render json: { errors: order.errors.full_messages }, status: :unprocessable_content
      end
    end

    def update
      authorize @order

      if params[:status].present? && !@order.transition_to!(params[:status])
        return render json: { errors: @order.errors.full_messages }, status: :unprocessable_content
      end

      if admin_or_dispatcher?
        attrs = params.permit(:driver_id, :estimated_delivery_at)
        if attrs.present? && !@order.update(attrs)
          return render json: { errors: @order.errors.full_messages }, status: :unprocessable_content
        end
      end

      render json: OrderSerializer.new(@order.reload).as_json
    end

    def destroy
      authorize @order
      @order.destroy!
      head :no_content
    end

    private

    def set_order
      @order = Order.find(params[:id])
    end

    def admin_or_dispatcher?
      [ Role::ADMIN, Role::DISPATCHER ].include?(current_user.role.name)
    end

    def order_params
      params.permit(
        :customer_id, :driver_id, :total_price, :estimated_delivery_at,
        pickup_address_attributes: address_attribute_keys,
        delivery_address_attributes: address_attribute_keys,
        order_items_attributes: [ :description, :quantity, :unit_price ]
      )
    end

    def address_attribute_keys
      [ :street, :number, :complement, :neighborhood, :city, :state, :zip_code, :latitude, :longitude ]
    end
  end
end
