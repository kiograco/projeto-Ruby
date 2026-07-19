class DriverRegistration
  def self.call(attrs)
    new(attrs).call
  end

  def initialize(attrs)
    @attrs = attrs
  end

  def call
    ActiveRecord::Base.transaction(requires_new: true) do
      user = User.create!(
        name: attrs[:name],
        email: attrs[:email],
        password: attrs[:password],
        password_confirmation: attrs[:password],
        role: Role.find_or_create_by!(name: Role::DRIVER)
      )

      Driver.create!(
        user: user,
        license_number: attrs[:license_number],
        vehicle_id: attrs[:vehicle_id],
        status: attrs[:status].presence || "offline"
      )
    end
  end

  private

  attr_reader :attrs
end
