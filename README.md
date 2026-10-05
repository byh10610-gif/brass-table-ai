# Brass Birmingham · Table AI v1.0.33 PWA 배포판

이 패키지는 게임 로직과 저장을 사용자 기기에서 처리합니다. 별도 게임 서버나 OpenAI/API 호출이 없으며, 게임 데이터는 기존과 동일하게 브라우저 `localStorage`에 저장됩니다.

## 가장 쉬운 무료 배포: GitHub Pages
1. GitHub에서 새 저장소(repository)를 만듭니다. 예: `brass-table-ai`.
2. 이 ZIP의 압축을 풀고 **안의 파일 전체**를 저장소 최상위(root)에 업로드합니다.
3. GitHub 저장소에서 `Settings` → `Pages`로 이동합니다.
4. `Build and deployment`에서 `Deploy from a branch`를 선택합니다.
5. Branch는 `main`, 폴더는 `/(root)`를 선택하고 저장합니다.
6. 잠시 후 GitHub가 제공하는 `https://사용자명.github.io/brass-table-ai/` 주소로 접속합니다.

## iPhone / iPad 홈 화면 설치
Safari에서 배포 주소를 연 뒤 `공유` → `홈 화면에 추가`를 선택합니다. 설치 후에는 일반 앱처럼 독립 창으로 실행됩니다. 첫 접속 이후 핵심 파일은 캐시되어 오프라인에서도 실행됩니다.

## Android / PC 설치
Chrome/Edge에서 배포 주소를 열면 주소창 또는 메뉴의 `앱 설치` / `홈 화면에 추가`를 사용할 수 있습니다.

## 버전 업데이트 방법
새 버전을 배포할 때 다음 3곳의 버전을 같은 값으로 올리는 것을 권장합니다.
- `index.html`의 `PWA_APP_VERSION`
- `version.json`의 `version`
- `service-worker.js`의 `APP_VERSION`

그 뒤 변경된 파일을 GitHub 저장소에 덮어쓰면 됩니다. 사용자의 게임 진행 데이터는 `localStorage`에 있으므로 앱 파일 업데이트로 삭제되지 않습니다. 앱은 온라인 상태에서 `version.json`을 확인하고 새 버전이 있으면 화면 오른쪽 아래에 업데이트 버튼을 표시합니다.

## 백업 권장
대규모 업데이트 전에는 앱의 기존 `백업` 기능으로 JSON 파일을 받아두면 가장 안전합니다.

## 비용 구조
- 게임 서버: 없음
- 별도 백엔드: 없음
- OpenAI/API 호출: 없음
- GitHub Pages: 공개 저장소 기준 무료 정적 호스팅 가능

## 로컬 테스트
PWA(Service Worker)는 `file://`에서 동작하지 않습니다. PC에서 테스트하려면 이 폴더에서 간단한 로컬 웹 서버를 실행한 뒤 `http://localhost`로 접속하세요. 단일 `index.html` 자체는 기존처럼 직접 열어도 게임 로직을 사용할 수 있지만, 설치/자동 업데이트 기능은 HTTPS 또는 localhost에서만 활성화됩니다.
