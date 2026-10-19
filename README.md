# DESTAT — Survey 과제와 7주차 코드

- 컨트랙트·테스트: https://github.com/OH1o1o/destat-lecture/tree/main
- 화면·MetaMask 연결: https://github.com/OH1o1o/destat-lecture/tree/week7-ui

두 브랜치는 별도 프로젝트입니다. 각각 다른 폴더에 체크아웃하여 실행합니다.

## 실행 및 검증

Node.js 22.23 이상을 사용합니다.

```powershell
npm ci
npm test
npm run typecheck
```

Survey 테스트만 실행:

```powershell
npm run test:survey
```

## 과제 1 — Survey init

`test/Survey.ts`의 `describe("Survey init")`에 요청된 7개 테스트를 작성했습니다.

| 구분 | 테스트 |
| --- | --- |
| Deployment | 제목·설명·목표 응답 수 저장 |
| Deployment | 예치금 / 목표 응답 수로 보상 계산 (나머지 있는 정수 나눗셈 포함) |
| Questions and Answers | 여러 질문과 선택지 반환 |
| Questions and Answers | 정상 응답 저장 |
| Questions and Answers | 답변 수 부족·초과 시 revert 및 상태 보존 |
| Questions and Answers | 목표 인원 도달 후 추가 응답 revert |
| Rewards | 컨트랙트 잔액 감소 및 응답자 보상 증가 |

배포 유틸은 `value`로 실제 보상 풀을 전달합니다. 보상 테스트는 `changeEtherBalances`로 가스비를 제외한 순수 보상액을 검증합니다. 기존 SurveyFactory 5개 테스트와 storage layout 실습도 보존했습니다.

## 과제 2 — MetaMask 실습

화면 코드는 `week7-ui` 브랜치에 있습니다. 해당 브랜치의 README에 실행·연결 절차를 정리했습니다.

로컬 네트워크 시작:

```powershell
npm run node
```

RPC는 `http://127.0.0.1:8545`, Chain ID는 `31337`입니다. MetaMask 확장 프로그램이 설치된 외부 브라우저에서 화면을 실행합니다. 개발용 Hardhat 계정은 로컬 실습에만 사용합니다.

## 제출 파일 관리

`node_modules`, `artifacts`, `cache`, 생성된 `types`, 환경변수 파일, 로그, 로컬 체인의 `ignition/deployments/chain-31337` 기록을 제외합니다. 소스, 테스트, 설정, `package-lock.json`은 재현 가능한 설치를 위해 포함합니다.
