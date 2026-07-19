class TrackingPointSerializer
  def initialize(tracking_point)
    @tracking_point = tracking_point
  end

  def as_json(*)
    {
      id: tracking_point.id,
      order_id: tracking_point.order_id,
      driver_id: tracking_point.driver_id,
      latitude: tracking_point.latitude.to_f,
      longitude: tracking_point.longitude.to_f,
      speed: tracking_point.speed&.to_f,
      heading: tracking_point.heading&.to_f,
      recorded_at: tracking_point.recorded_at.iso8601
    }
  end

  private

  attr_reader :tracking_point
end
