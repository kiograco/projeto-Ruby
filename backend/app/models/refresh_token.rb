class RefreshToken < ApplicationRecord
  TTL = 30.days

  belongs_to :user

  validates :token_digest, presence: true, uniqueness: true
  validates :expires_at, presence: true

  scope :active, -> { where(revoked_at: nil).where("expires_at > ?", Time.current) }

  def self.issue_for(user, ip_address: nil, user_agent: nil)
    raw_token = SecureRandom.hex(32)

    token = create!(
      user: user,
      token_digest: digest(raw_token),
      expires_at: TTL.from_now,
      ip_address: ip_address,
      user_agent: user_agent
    )

    [ raw_token, token ]
  end

  def self.find_by_raw_token(raw_token)
    return nil if raw_token.blank?

    find_by(token_digest: digest(raw_token))
  end

  def self.digest(raw_token)
    Digest::SHA256.hexdigest(raw_token)
  end

  def revoke!
    update!(revoked_at: Time.current)
  end

  def revoked?
    revoked_at.present?
  end

  def expired?
    expires_at <= Time.current
  end

  def active?
    !revoked? && !expired?
  end
end
