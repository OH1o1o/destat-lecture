# DESTAT UI

React Router 기반 설문조사 화면과 MetaMask 지갑 연결 코드입니다.

## 실행

Node.js 22.23 이상에서 실행합니다.

```powershell
npm ci
npm run dev
```

MetaMask 확장 프로그램이 설치된 Chrome 또는 Edge에서 http://localhost:5173 을 엽니다. 상단 Connect 버튼에서 MetaMask를 선택합니다.

로컬 Hardhat 네트워크는 RPC `http://127.0.0.1:8545`, Chain ID `31337`을 사용합니다.

Supabase를 사용하려면 `.env.example`을 `.env.local`로 복사하고 본인 프로젝트의 공개 설정을 입력합니다.
