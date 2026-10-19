import { supabase } from "~/postgres/supaclient";
import type { Route } from "./+types/dashboard";

// Supabase is optional for the local MetaMask connection exercise.
export async function loader() {
  const client = supabase();
  if (!client) return { databaseStatus: "Supabase 미설정 — 지갑 연결 실습은 사용할 수 있습니다." };

  try {
    const { error } = await client.from("destat-test").select("*").abortSignal(AbortSignal.timeout(5000));
    return { databaseStatus: error ? "Supabase 연결을 확인해 주세요. 지갑 연결 실습은 사용할 수 있습니다." : "Supabase 연결 완료" };
  } catch {
    return { databaseStatus: "Supabase에 연결할 수 없습니다. 지갑 연결 실습은 사용할 수 있습니다." };
  }
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Hello destat world</h1>
      <p>오른쪽 위 Connect 버튼에서 MetaMask를 선택해 지갑을 연결하세요.</p>
      <p className="text-sm text-muted-foreground">{loaderData.databaseStatus}</p>
    </div>
  );
}
