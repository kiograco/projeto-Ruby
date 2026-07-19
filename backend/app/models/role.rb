class Role < ApplicationRecord
  ADMIN = "admin"
  DISPATCHER = "dispatcher"
  DRIVER = "driver"
  CUSTOMER = "customer"

  NAMES = [ ADMIN, DISPATCHER, DRIVER, CUSTOMER ].freeze

  has_many :users, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: true, inclusion: { in: NAMES }
end
