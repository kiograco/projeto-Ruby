class AddressSerializer
  def initialize(address)
    @address = address
  end

  def as_json(*)
    {
      id: address.id,
      street: address.street,
      number: address.number,
      complement: address.complement,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zip_code: address.zip_code,
      latitude: address.latitude&.to_f,
      longitude: address.longitude&.to_f
    }
  end

  private

  attr_reader :address
end
