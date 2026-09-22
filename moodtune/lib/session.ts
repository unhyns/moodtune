import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { SpotifySession } from "@/types";
import { requireEnv } from "@/lib/env";

// design.md Decision 1: 암호화·서명된 http-only 쿠키(stateless). AES-256-GCM은 암호화와 무결성 검증을 함께 제공한다.
export const SESSION_COOKIE = "moodtune_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function key(): Buffer {
  return createHash("sha256").update(requireEnv("SESSION_SECRET")).digest();
}

export function seal(session: SpotifySession): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
}

export function unseal(value: string): SpotifySession | null {
  try {
    const buf = Buffer.from(value, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    const json = Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
    return JSON.parse(json) as SpotifySession;
  } catch {
    return null;
  }
}

export async function readSession(): Promise<SpotifySession | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  return value ? unseal(value) : null;
}

export async function writeSession(session: SpotifySession): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, seal(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

// next dev(Turbopack)는 request.url/request.nextUrl의 host를 실제 접속 호스트와 무관하게
// 서버의 기본 host(localhost)로 정규화한다. 이를 new URL(path, request.url)에 그대로 쓰면
// 127.0.0.1로 접속한 사용자가 리다이렉트 시점에 localhost로 넘어가 버려, host-only 쿠키(세션·state)가
// 끊긴다. 리다이렉트 대상은 항상 실제 요청의 Host 헤더로 만든다.
export function absoluteUrl(request: Request, path: string): URL {
  const host = request.headers.get("host") ?? new URL(request.url).host;
  const proto = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  return new URL(path, `${proto}://${host}`);
}
