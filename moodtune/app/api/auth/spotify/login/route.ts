import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { buildAuthorizeUrl } from "@/lib/spotify";
import { absoluteUrl } from "@/lib/session";

const STATE_COOKIE = "moodtune_oauth_state";

export async function GET(request: Request) {
  try {
    const state = randomBytes(16).toString("base64url");
    const res = NextResponse.redirect(buildAuthorizeUrl(state));
    res.cookies.set(STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    return res;
  } catch {
    // 환경변수 누락 등 설정 오류 → Landing의 에러 상태로 보낸다.
    return NextResponse.redirect(absoluteUrl(request, "/?error=config"));
  }
}
