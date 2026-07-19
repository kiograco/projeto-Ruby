class Rack::Attack
  throttle("requests by ip", limit: 300, period: 5.minutes) do |req|
    req.ip
  end

  throttle("logins by ip", limit: 10, period: 20.seconds) do |req|
    req.ip if req.path == "/api/auth/login" && req.post?
  end
end
