// app/lib/errors/parseApiError.ts
// Shared client-side helper for turning a failed API response's JSON body
// into a message that actually says what went wrong, instead of every form
// collapsing every failure into a generic "Failed to save."
//
// Our API routes return one of two shapes on error:
//  - a known string code the caller already special-cases itself
//    (e.g. 'featuredCapReached') — this helper ignores those, the caller
//    handles them before falling back to this function.
//  - Zod's `.flatten()` shape from a failed safeParse: { formErrors: string[],
//    fieldErrors: Record<string, string[]> } — this is where "Name is
//    required" actually lives, but until now nothing read it.
export function parseApiError(json: any, fallback: string): string {
  const error = json?.error;
  if (!error || typeof error === 'string') return fallback;

  const fieldErrors = error.fieldErrors as Record<string, string[]> | undefined;
  if (fieldErrors) {
    const firstMessage = Object.values(fieldErrors).flat()[0];
    if (firstMessage) return firstMessage;
  }

  const formErrors = error.formErrors as string[] | undefined;
  if (formErrors?.[0]) return formErrors[0];

  return fallback;
}
