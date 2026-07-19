class JwtService
  ALGORITHM = "HS256"
  ACCESS_TOKEN_TTL = 15.minutes

  class DecodeError < StandardError; end

  def self.encode(user)
    payload = {
      sub: user.id,
      role: user.role.name,
      exp: ACCESS_TOKEN_TTL.from_now.to_i,
      iat: Time.current.to_i
    }

    JWT.encode(payload, secret, ALGORITHM)
  end

  def self.decode(token)
    payload, = JWT.decode(token, secret, true, algorithm: ALGORITHM)
    payload
  rescue JWT::DecodeError, JWT::ExpiredSignature
    raise DecodeError
  end

  def self.secret
    Rails.application.secret_key_base
  end
end
