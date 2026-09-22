import { NextResponse } from "next/server";
import { fetchLibrary, refreshSession, SpotifyAuthError } from "@/lib/spotify";
import { clearSession, readSession, writeSession } from "@/lib/session";

// 만료·무효 토큰은 401로 응답하고, 클라이언트가 Landing으로 보낸다 (spotify-auth: Session Expiry Handling).
function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function GET() {
  let session = await readSession();
  if (!session) return unauthorized();

  try {
    if (session.expiresAt - Date.now() < 60_000) {
      session = await refreshSession(session);
      await writeSession(session);
    }
    return NextResponse.json(await fetchLibrary(session.accessToken));
  } catch (e) {
    if (e instanceof SpotifyAuthError) {
      await clearSession();
      return unauthorized();
    }
    return NextResponse.json({ error: "library_failed" }, { status: 502 });
  }
}
