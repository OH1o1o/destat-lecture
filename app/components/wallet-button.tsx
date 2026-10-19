import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";

type WalletClient = typeof import("~/lib/wallet.client");
type WalletAccount = ReturnType<WalletClient["getWalletAccount"]>;

export default function WalletButton() {
  const [client, setClient] = useState<WalletClient>();
  const [account, setAccount] = useState<WalletAccount>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    // Import only after hydration, so SSR never evaluates the wallet UI.
    import("~/lib/wallet.client")
      .then(async (wallet) => {
        if (!active) return;
        unsubscribe = wallet.watchWalletAccount((nextAccount) => {
          if (!active) return;
          setAccount(nextAccount);
          if (nextAccount.isConnected) {
            wallet.rabbykit.close();
            setError("");
          }
        });
        setClient(wallet);
        setAccount(wallet.getWalletAccount());
        await wallet.reconnectWallet();
      })
      .catch(() => {
        if (active) setError("지갑을 준비하지 못했습니다. 페이지를 새로고침해 주세요.");
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  async function runAction(action: () => unknown | Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch {
      setError("지갑 요청을 완료하지 못했습니다. 메타마스크의 요청 창과 로컬 노드 실행 상태를 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  const connected = account?.isConnected;
  const address = account?.address;
  const connecting = account?.status === "connecting" || account?.status === "reconnecting";

  return (
    <div className="relative flex items-center gap-2">
      {connected && (
        account.chainId === 31337 ? (
          <span className="text-xs text-muted-foreground">Hardhat Local</span>
        ) : (
          <Button
            variant="outline"
            disabled={!client || busy}
            onClick={() => client && runAction(client.switchToHardhat)}
          >
            Hardhat으로 전환
          </Button>
        )
      )}
      <Button
        disabled={!client || busy || connecting}
        title={address}
        onClick={() => client && runAction(() => client.rabbykit.open({
          forceOpen: connected,
          onConnect: () => setError(""),
          onConnectError: () => setError("지갑 연결을 완료하지 못했습니다. 메타마스크에서 요청을 확인한 뒤 다시 시도해 주세요."),
        }))}
      >
        {connecting ? "연결 중…" : connected && address
          ? `${address.slice(0, 6)}…${address.slice(-4)}`
          : "Connect"}
      </Button>
      {connected && (
        <Button
          variant="outline"
          disabled={!client || busy}
          onClick={() => client && runAction(client.disconnectWallet)}
        >
          연결 해제
        </Button>
      )}
      {error && (
        <p role="alert" className="absolute right-0 top-full mt-2 w-80 rounded border bg-background p-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
