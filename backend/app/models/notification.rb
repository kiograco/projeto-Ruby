class Notification < ApplicationRecord
  ORDER_CREATED = "order_created"
  DRIVER_ASSIGNED = "driver_assigned"
  PICKUP_COMPLETE = "pickup_complete"
  NEAR_DESTINATION = "near_destination"
  DELIVERED = "delivered"
  FAILED = "failed"
  DELIVERY_DELAYED = "delivery_delayed"

  EVENTS = [
    ORDER_CREATED, DRIVER_ASSIGNED, PICKUP_COMPLETE,
    NEAR_DESTINATION, DELIVERED, FAILED, DELIVERY_DELAYED
  ].freeze

  belongs_to :user
  belongs_to :order, optional: true

  validates :event, inclusion: { in: EVENTS }
  validates :title, presence: true
  validates :body, presence: true

  scope :unread, -> { where(read_at: nil) }
  scope :recent_first, -> { order(created_at: :desc) }

  def read?
    read_at.present?
  end

  def mark_as_read!
    update!(read_at: Time.current) unless read?
  end
end
