export interface GeocodeResult {
  latitude: number;
  longitude: number;
}

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  if (!query.trim()) return null;

  const params = new URLSearchParams({ format: "json", q: query, limit: "1" });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
  if (!response.ok) return null;

  const results = (await response.json()) as { lat: string; lon: string }[];
  if (results.length === 0) return null;

  const latitude = Number.parseFloat(results[0].lat);
  const longitude = Number.parseFloat(results[0].lon);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

  return { latitude, longitude };
}
