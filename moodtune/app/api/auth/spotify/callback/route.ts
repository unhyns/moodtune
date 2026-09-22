import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode } from "@/lib/spotify";
import { absoluteUrl, seal, SESSION_COOKIE } from "@/lib/session";

const STATE_COOKIE = "moodtune_oauth_state";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const fail = (reason: string) => {
    const res = NextResponse.redirect(absoluteUrl(request, `/?error=${reason}`));
    res.cookies.delete(STATE_COOKIE);
    return res;
  };

  if (searchParams.get("error")) return fail("denied");

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expected = request.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !expected || state !== expected) return fail("failed");

  try {
    const session = await exchangeCode(code);
    const res = NextResponse.redirect(absoluteUrl(request, "/input"));
    res.cookies.set(SESSION_COOKIE, seal(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    res.cookies.delete(STATE_COOKIE);
    return res;
  } catch {
    return fail("failed");
  }
}
