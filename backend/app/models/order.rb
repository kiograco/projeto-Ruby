class Order < ApplicationRecord
  PENDING = "pending"
  ASSIGNED = "assigned"
  PICKED_UP = "picked_up"
  IN_TRANSIT = "in_transit"
  NEAR_DESTINATION = "near_destination"
  DELIVERED = "delivered"
  CANCELLED = "cancelled"
  FAILED = "failed"

  ALLOWED_TRANSITIONS = {
    PENDING => [ ASSIGNED, CANCELLED ],
    ASSIGNED => [ PICKED_UP, CANCELLED ],
    PICKED_UP => [ IN_TRANSIT, FAILED ],
    IN_TRANSIT => [ NEAR_DESTINATION, FAILED ],
    NEAR_DESTINATION => [ DELIVERED, FAILED ],
    DELIVERED => [],
    CANCELLED => [],
    FAILED => []
  }.freeze

  belongs_to :customer
  belongs_to :driver, optional: true
  belongs_to :created_by, class_name: "User", inverse_of: :created_orders
  belongs_to :pickup_address, class_name: "Address"
  belongs_to :delivery_address, class_name: "Address"
  has_many :order_items, dependent: :destroy
  has_many :tracking_points, dependent: :destroy

  accepts_nested_attributes_for :pickup_address, :delivery_address
  accepts_nested_attributes_for :order_items, allow_destroy: true

  validates :status, inclusion: { in: ALLOWED_TRANSITIONS.keys }
  validates :total_price, numericality: { greater_than_or_equal_to: 0 }

  scope :with_status, ->(status) { where(status: status) if status.present? }

  before_validation :compute_total_price_from_items, on: :create

  def transition_to!(new_status)
    new_status = new_status.to_s

    unless ALLOWED_TRANSITIONS.fetch(status, []).include?(new_status)
      errors.add(:status, "cannot transition from #{status} to #{new_status}")
      return false
    end

    attrs = { status: new_status }
    attrs[:delivered_at] = Time.current if new_status == DELIVERED
    update(attrs)
  end

  private

  def compute_total_price_from_items
    return if total_price.present? && total_price.positive?
    return if order_items.empty?

    self.total_price = order_items.sum { |item| (item.quantity || 0) * (item.unit_price || 0) }
  end
end
