class DeliveryTrackingChannel < ApplicationCable::Channel
  def subscribed
    order = Order.find_by(id: params[:order_id])

    if order.nil? || !authorized_for?(order)
      reject
      return
    end

    stream_for order
  end

  private

  def authorized_for?(order)
    role = current_user.role.name

    return true if [ Role::ADMIN, Role::DISPATCHER ].include?(role)
    return true if role == Role::DRIVER && current_user.driver && order.driver_id == current_user.driver.id
    return true if role == Role::CUSTOMER && order.created_by_id == current_user.id

    false
  end
end
