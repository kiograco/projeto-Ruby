class Customer < ApplicationRecord
  before_validation { self.email = email&.downcase&.strip }

  validates :name, presence: true
  validates :phone, presence: true
  validates :document, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true,
                     format: { with: URI::MailTo::EMAIL_REGEXP }

  scope :search, lambda { |term|
    pattern = "%#{sanitize_sql_like(term)}%"
    where("name ILIKE :p OR email ILIKE :p OR document ILIKE :p", p: pattern)
  }
end
