import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // next dev(Turbopack)는 기본적으로 localhost 외 호스트에서 온 dev 리소스 요청을 막는다.
  // 127.0.0.1로 접속해 쓰는 클라이언트 fetch()가 서버에 아예 도달하지 못하는 원인이라
  // 명시적으로 허용한다.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
