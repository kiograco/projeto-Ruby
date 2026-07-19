class Address < ApplicationRecord
  validates :street, presence: true
  validates :number, presence: true
  validates :neighborhood, presence: true
  validates :city, presence: true
  validates :state, presence: true
  validates :zip_code, presence: true

  def to_s
    "#{street}, #{number}#{" - #{complement}" if complement.present?}, #{neighborhood}, #{city}/#{state}"
  end
end
