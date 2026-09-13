// app/lib/storage/upload-limits.ts
//
// Both image and document uploads (see app/api/v1/images/route.ts and
// app/api/v1/documents/route.ts) go through a plain Next.js API route via
// request.formData() and @vercel/blob's server-side put() — NOT
// @vercel/blob/client's direct-to-blob upload helper. That means the file
// has to fit inside the request body of a single serverless function
// invocation before it ever reaches Blob's own (much larger) limits.
// Vercel's Node.js Serverless Functions cap request bodies at 4.5MB
// (https://vercel.com/docs/functions/limitations#request-body-size) — this
// is that ceiling, not a limit this app chose. If uploads ever move to the
// @vercel/blob/client direct-upload flow, this constant (and the
// validation at each upload site) can be raised or dropped accordingly.
//
// Shared between the client (Gallery's upload buttons, for the tooltip and
// pre-flight check) and both API routes (the actual enforcement — the
// client-side check is just a nicer failure message, never the only guard).
export const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024; // 4.5MB
