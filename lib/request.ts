import "server-only";

function getFirstForwardedIp(value: string | null) {
  if (!value) {
    return null;
  }

  const [firstIp] = value.split(",");
  const normalizedIp = firstIp?.trim();

  return normalizedIp && normalizedIp.length > 0 ? normalizedIp : null;
}

export function getClientIp(request: Request) {
  return (
    getFirstForwardedIp(request.headers.get("x-forwarded-for")) ??
    request.headers.get("cf-connecting-ip")?.trim() ??
    request.headers.get("x-real-ip")?.trim() ??
    "unknown"
  );
}

export function normalizeIdentifierPart(value: string | null | undefined) {
  const normalizedValue = value?.trim().toLowerCase();

  return normalizedValue && normalizedValue.length > 0
    ? normalizedValue
    : "unknown";
}
