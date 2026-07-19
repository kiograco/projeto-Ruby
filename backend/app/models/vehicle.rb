class Vehicle < ApplicationRecord
  CAR = "car"
  MOTORCYCLE = "motorcycle"
  VAN = "van"
  TRUCK = "truck"

  TYPES = [ CAR, MOTORCYCLE, VAN, TRUCK ].freeze

  has_many :drivers, dependent: :nullify

  before_validation { self.plate = plate&.upcase&.strip }

  validates :plate, presence: true, uniqueness: true
  validates :model, presence: true
  validates :year, presence: true, numericality: { only_integer: true, greater_than: 1980 }
  validates :vehicle_type, presence: true, inclusion: { in: TYPES }
  validates :capacity, presence: true, numericality: { greater_than: 0 }

  scope :search, lambda { |term|
    pattern = "%#{sanitize_sql_like(term)}%"
    where("plate ILIKE :p OR model ILIKE :p", p: pattern)
  }
end
