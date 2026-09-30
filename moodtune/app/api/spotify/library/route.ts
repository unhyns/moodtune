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
    // 곡별 출처(sourcesByTrackId)는 서버 내부 전용이라 응답에 넣지 않는다.
    const { library } = await fetchLibrary(session.accessToken);
    return NextResponse.json(library);
  } catch (e) {
    if (e instanceof SpotifyAuthError) {
      await clearSession();
      return unauthorized();
    }
    return NextResponse.json({ error: "library_failed" }, { status: 502 });
  }
}
