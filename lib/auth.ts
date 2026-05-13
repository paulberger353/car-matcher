import { SignJWT, jwtVerify } from "jose";

// JWT_SECRET must be set as a Cloudflare Worker secret:
//   wrangler secret put JWT_SECRET
// In Workers (nodejs_compat), process.env is populated from Worker secrets.
if (!process.env.JWT_SECRET) {
  console.error(
    "[auth] JWT_SECRET is not configured. Tokens are signed with an insecure fallback key. " +
    "Run: wrangler secret put JWT_SECRET"
  );
}

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "INSECURE_FALLBACK_JWT_SECRET_SET_VIA_WRANGLER"
);

export async function signToken(payload: { id: number; username: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { id: number; username: string };
  } catch {
    return null;
  }
}