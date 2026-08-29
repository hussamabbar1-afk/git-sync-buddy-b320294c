import { useEffect, useState } from "react";

const SOURCE_PATTERN = /^[a-z0-9][a-z0-9:-]{0,79}$/i;

export function normalizeCampaignSource(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return SOURCE_PATTERN.test(normalized) ? normalized : fallback;
}

export function useCampaignSource(fallback: string) {
  const [source, setSource] = useState(fallback);

  useEffect(() => {
    const incoming = new URLSearchParams(window.location.search).get("source");
    setSource(normalizeCampaignSource(incoming, fallback));
  }, [fallback]);

  return source;
}
