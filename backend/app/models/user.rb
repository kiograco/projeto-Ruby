class User < ApplicationRecord
  MAX_FAILED_ATTEMPTS = 5
  LOCKOUT_DURATION = 15.minutes

  has_secure_password

  belongs_to :role
  has_many :refresh_tokens, dependent: :destroy
  has_one :driver, dependent: :destroy

  before_validation { self.email = email&.downcase&.strip }

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true,
                     format: { with: URI::MailTo::EMAIL_REGEXP }

  scope :active, -> { where(active: true) }

  def locked?
    locked_at.present? && locked_at > LOCKOUT_DURATION.ago
  end

  def register_failed_attempt!
    increment!(:failed_login_attempts)
    lock_access! if failed_login_attempts >= MAX_FAILED_ATTEMPTS
  end

  def reset_failed_attempts!
    update!(failed_login_attempts: 0, locked_at: nil)
  end

  def lock_access!
    update!(locked_at: Time.current)
  end
end
