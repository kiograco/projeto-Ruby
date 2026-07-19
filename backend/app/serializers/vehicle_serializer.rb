class VehicleSerializer
  def initialize(vehicle)
    @vehicle = vehicle
  end

  def as_json(*)
    {
      id: vehicle.id,
      plate: vehicle.plate,
      model: vehicle.model,
      year: vehicle.year,
      vehicle_type: vehicle.vehicle_type,
      capacity: vehicle.capacity.to_f
    }
  end

  private

  attr_reader :vehicle
end
