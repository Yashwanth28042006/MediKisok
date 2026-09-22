// Shared between server components (lib/auth/session.ts) and middleware.ts,
// which runs on the Edge runtime and cannot import next/headers-dependent code.
export const SESSION_COOKIE = "medikiosk_session";
