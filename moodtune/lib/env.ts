// 시작 시점이 아니라 사용 시점에 읽어서, 키가 없어도 앱 부팅은 실패하지 않는다.
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}
