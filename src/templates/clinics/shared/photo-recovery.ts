// A deliberate null means “no image”. Never replace an explicit removal.
export function clinicPhotoSource(
  requested: string | null,
  fallback: string | null,
  failed: readonly string[],
) {
  if (!requested) return null;
  return (
    [requested, fallback].find(
      (src): src is string => !!src && !failed.includes(src),
    ) ?? null
  );
}
