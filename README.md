# Brass: Birmingham · Table AI v1.0.38

A browser companion for a **physical Brass: Birmingham game**. Use the real board, cards, tiles and resources while the app tracks turns, suggests AI actions and records the game. Supports 2–4 players and Korean/English.

All game logic runs on your device. No backend, account, paid AI API or network calls are needed for gameplay. Games and completed records are stored in browser `localStorage`. Export a JSON backup before clearing browser data or moving to another device.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Use a local browser for testing. Service workers require localhost or HTTPS; they cannot run from `file://`. The game and language packs remain self-contained in `index.html`. Direct `file://` opening was blocked by the cloud browser policy, so direct-file gameplay was not validated here; use the local server for verified testing.

## Languages

Choose Korean or English on the home screen. The first launch follows the browser language, falling back to English. The selection persists independently of the game. Switching languages preserves saves, history, player names and card/industry identifiers.

v1.0.36 translates setup, actions, AI instructions, resources, scoring, completed-game logs, help, release notes, alerts and update controls. User-entered names are preserved in their original language.

See [localization guidance](docs/LOCALIZATION.md) for adding another reviewed language pack.

## Live board map

Open Map to see recorded industry tiles and canal/rail links in player colors. Select a tile to inspect its level, resources and flipped state. The map follows actions, undo and era changes; it also offers zoom and example boards that preserve your saved game. See [map and standalone HTML review guidance](docs/LIVE_MAP.md).

## Rule Master

The Rule Master button offers Korean/English lessons with original Before/After tabletop illustrations. What to Do Now appears only inside that dialog; normal play has no extra next-step guide. Official rules are linked through the publisher's external page. See [Rule Master guidance](docs/RULE_MASTER.md).

## GitHub Pages / PWA

Deploy the application files at the root of a GitHub Pages branch: `index.html`, `service-worker.js`, `manifest.json`, `version.json`, `icon.svg`, `icons/`, and `.nojekyll`. All paths are relative and support a repository subdirectory. No build step is required.

Set Pages to deploy the selected branch's root folder. On iOS, use Safari → Share → Add to Home Screen. Chrome/Edge support Install App. After the first successful load, the app can run offline.

When releasing an update, keep the application `APP_VERSION`, `service-worker.js` version, `version.json` and initial update-button label in agreement. `PWA_APP_VERSION` reads the app's version directly. Export a backup, apply the update, and confirm the displayed version; a service worker may otherwise serve an earlier release. Publishing updates does not delete the existing game-save keys.

## Checks

The catalog/syntax/version checks require Node.js:

```sh
node --test tests/localization.test.cjs
```

Browser checks require Playwright and a Chromium executable. Install Playwright into an external tools directory to keep the app dependency-free, then run against your local server:

```sh
npm install --prefix /tmp/brass-test-tools playwright --no-audit --no-fund
NODE_PATH=/tmp/brass-test-tools/node_modules node tests/i18n.spec.cjs
NODE_PATH=/tmp/brass-test-tools/node_modules node tests/live-map.spec.cjs
NODE_PATH=/tmp/brass-test-tools/node_modules node tests/rule-master.spec.cjs
```

Set `CHROMIUM_PATH` if Chromium is not at `/usr/bin/chromium`; set `BRASS_TEST_URL` if using another server address. These checks use temporary browser contexts and do not alter your personal saves. Chromium's sandbox is disabled in the test launcher for compatibility with isolated cloud containers.

For compatibility checks, serve an unchanged v1.0.33 package separately, then run:

```sh
BRASS_TEST_URL=http://127.0.0.1:8010/brass-table-ai/ \
BRASS_LEGACY_URL=http://127.0.0.1:8010/onboarding/legacy-v33/ \
NODE_PATH=/tmp/brass-test-tools/node_modules node tests/compatibility.spec.cjs
```

The compatibility runner creates a real legacy save, restores it in the new app, checks AI instruction branches, phone/tablet layouts and offline subdirectory operation. `BRASS_SCREENSHOT_PATH` optionally saves a tablet screenshot.

## 한국어

실물 보드와 함께 사용하는 브라스 버밍엄 AI 보조 앱입니다. 메인 화면에서 한국어/영어를 선택할 수 있고, 언어를 바꿔도 게임·행동 기록·사용자 이름은 유지됩니다. 게임 서버나 API 키는 필요 없습니다. 게임과 완료 기록은 현재 기기의 브라우저에 저장되므로 기기 이동·브라우저 데이터 삭제·앱 업데이트 전에는 JSON 백업을 권장합니다.
