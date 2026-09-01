type OsmAddress = Record<string, unknown>;

function text(value: unknown, max = 120): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function formatPostalAddress(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const address = value as OsmAddress;
  const road =
    text(address.road) ||
    text(address.pedestrian) ||
    text(address.residential) ||
    text(address.path) ||
    text(address.footway);
  const houseNumber = text(address.house_number, 30);
  const postcode = text(address.postcode, 20);
  const city =
    text(address.city) ||
    text(address.town) ||
    text(address.village) ||
    text(address.municipality) ||
    text(address.city_district);

  const streetLine = [road, houseNumber].filter(Boolean).join(" ");
  const cityLine = [postcode, city].filter(Boolean).join(" ");
  return [streetLine, cityLine].filter(Boolean).join(", ").slice(0, 240);
}
