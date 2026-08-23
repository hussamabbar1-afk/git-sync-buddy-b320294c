const PREVIEW_ORIGIN = "https://id-preview--1ee894d2-aadc-4147-bae3-7e9d84bc1e41.lovable.app";

export function getExternalOrigin(): string {
  if (typeof window === "undefined") {
    return PREVIEW_ORIGIN;
  }

  const { hostname, origin } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return PREVIEW_ORIGIN;
  }

  return origin;
}
