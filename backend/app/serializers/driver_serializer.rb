class DriverSerializer
  def initialize(driver)
    @driver = driver
  end

  def as_json(*)
    {
      id: driver.id,
      name: driver.user.name,
      email: driver.user.email,
      license_number: driver.license_number,
      status: driver.status,
      current_latitude: driver.current_latitude&.to_f,
      current_longitude: driver.current_longitude&.to_f,
      vehicle: driver.vehicle && VehicleSerializer.new(driver.vehicle).as_json
    }
  end

  private

  attr_reader :driver
end
