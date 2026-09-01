import { formatPostalAddress } from "./address.ts";

Deno.test("formats a concise Berlin postal address without administrative suffixes", () => {
  const formatted = formatPostalAddress({
    road: "Coloniaallee",
    house_number: "34",
    postcode: "12524",
    city: "Berlin",
    suburb: "Altglienicke",
    state: "Berlin",
    country: "Deutschland",
    country_code: "de",
  });
  if (formatted !== "Coloniaallee 34, 12524 Berlin") throw new Error(formatted);
});

Deno.test("uses sensible OSM fallbacks", () => {
  const formatted = formatPostalAddress({
    pedestrian: "Markt",
    postcode: "14467",
    town: "Potsdam",
  });
  if (formatted !== "Markt, 14467 Potsdam") throw new Error(formatted);
});
