class Driver < ApplicationRecord
  enum :status, { offline: "offline", available: "available", on_delivery: "on_delivery" },
       default: "offline", validate: true

  belongs_to :user
  belongs_to :vehicle, optional: true
  has_many :orders, dependent: :nullify
  has_many :tracking_points, dependent: :destroy
  has_many_attached :documents

  validates :license_number, presence: true, uniqueness: true
  validate :user_has_driver_role

  scope :online, -> { where.not(status: :offline) }
  scope :search, lambda { |term|
    pattern = "%#{sanitize_sql_like(term)}%"
    joins(:user).where("users.name ILIKE :p OR users.email ILIKE :p OR license_number ILIKE :p", p: pattern)
  }

  def update_location!(latitude:, longitude:)
    update!(current_latitude: latitude, current_longitude: longitude)
  end

  private

  def user_has_driver_role
    return if user.nil? || user.role.nil?

    errors.add(:user, "must have the driver role") unless user.role.name == Role::DRIVER
  end
end
