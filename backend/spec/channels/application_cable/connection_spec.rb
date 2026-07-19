require "rails_helper"

RSpec.describe ApplicationCable::Connection, type: :channel do
  let(:user) { create(:user, :admin) }

  def build_connection(query_string)
    env = Rack::MockRequest.env_for("/cable?#{query_string}")
    described_class.new(ActionCable.server, env)
  end

  it "identifies the user for a valid token" do
    token = JwtService.encode(user)

    connection = build_connection("token=#{token}")
    connection.connect

    expect(connection.current_user).to eq(user)
  end

  it "rejects a missing token" do
    connection = build_connection("")

    expect { connection.connect }.to raise_error(ActionCable::Connection::Authorization::UnauthorizedError)
  end

  it "rejects an invalid token" do
    connection = build_connection("token=not-a-real-token")

    expect { connection.connect }.to raise_error(ActionCable::Connection::Authorization::UnauthorizedError)
  end

  it "rejects a token for an inactive user" do
    inactive_user = create(:user, :admin, active: false)
    token = JwtService.encode(inactive_user)

    connection = build_connection("token=#{token}")

    expect { connection.connect }.to raise_error(ActionCable::Connection::Authorization::UnauthorizedError)
  end
end
