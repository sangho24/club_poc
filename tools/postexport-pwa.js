// 웹 export 후처리 - 홈 화면에 추가하면 앱처럼 뜨게 만든다.
//   실행:  node tools/postexport-pwa.js          (BASE_URL 없으면 루트 기준)
//          BASE_URL=/club_poc node tools/postexport-pwa.js
//
// ── 왜 필요한가 ──────────────────────────────────────────────
// 이 PoC 를 폰에서 보여줄 경로가 웹밖에 없다. Expo Go 는 SDK 54 에서 멈춰 있어 SDK 57 인
// 이 프로젝트를 못 열고, EAS 로 뽑은 APK 는 사내 Intune 정책에 막혀 다운로드조차 안 된다.
// 보고 대상자의 폰도 같은 정책이라 사이드로드는 앞으로도 답이 아니다.
//
// 그런데 `expo export --platform web` 이 뱉는 index.html 에는 manifest 도 아이콘도
// theme-color 도 없다. 그대로 두면 주소창이 그대로 보이는 웹페이지다.
// 아래를 얹으면 홈 화면에 이글스 아이콘이 생기고, 눌렀을 때 주소창 없는 전체화면으로 뜬다.
//
// ── 왜 expo 설정이 아니라 후처리인가 ─────────────────────────
// 이 프로젝트는 Expo Router 를 쓰지 않아 head 를 다룰 +html.tsx 진입점이 없다.
// export 결과를 직접 고치는 편이 확실하고, CI 가 이미 같은 자리에서 baseUrl 을
// 주입하고 있어 손대는 지점이 늘지도 않는다.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SRC_ICONS = path.join(ROOT, 'assets/web');

// GitHub Pages 프로젝트 사이트는 /<저장소명>/ 하위에서 서빙된다.
// manifest 의 start_url·scope 와 아이콘 경로가 이 접두사를 타지 않으면
// 홈 화면에서 눌렀을 때 404 가 뜨거나 설치 자체가 거부된다.
const BASE = (process.env.BASE_URL || '').replace(/\/$/, '');
const url = (p) => `${BASE}/${p}`.replace(/\/{2,}/g, '/');

// 앱 배경과 같은 값을 쓴다. App.tsx 가 StatusBar 를 dark-content + colors.bg 로 두므로
// 여기만 다른 색이면 상태바와 화면 사이에 색 띠가 생긴다
// ⚠ src/theme.ts 의 colors.bg 와 app.json 의 backgroundColor 를 손으로 맞춘 세 번째 복제본이다
const THEME = '#F8F1EF';

const MARKER = '<!-- pwa:injected -->';

function fail(msg) {
  console.error('실패:', msg);
  process.exit(1);
}

if (!fs.existsSync(DIST)) fail('dist 가 없다. 먼저 npx expo export --platform web 을 돌린다');
const indexPath = path.join(DIST, 'index.html');
if (!fs.existsSync(indexPath)) fail('dist/index.html 이 없다');

// ── 1. 아이콘 복사 ───────────────────────────────────────────
const outIcons = path.join(DIST, 'icons');
fs.mkdirSync(outIcons, { recursive: true });
const icons = fs.readdirSync(SRC_ICONS).filter((f) => f.endsWith('.png'));
if (!icons.length) fail('assets/web 에 아이콘이 없다. node tools/make-icons.js 를 먼저 돌린다');
icons.forEach((f) => fs.copyFileSync(path.join(SRC_ICONS, f), path.join(outIcons, f)));

// ── 2. manifest ──────────────────────────────────────────────
const manifest = {
  name: '이글스 (구단앱 PoC)',
  // 홈 화면 아이콘 밑에 붙는 이름. 길면 잘리므로 짧게
  short_name: '이글스',
  description: '한화 이글스 구단 앱 PoC',
  lang: 'ko',
  start_url: url(''),
  scope: url(''),
  // standalone 이라야 주소창이 사라진다. fullscreen 은 상태바까지 없애서
  // 시계·배터리가 안 보이는데, 그러면 오히려 앱이 아니라 키오스크처럼 읽힌다
  display: 'standalone',
  orientation: 'portrait',
  background_color: THEME,
  theme_color: THEME,
  icons: [
    { src: url('icons/icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: url('icons/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
    // maskable 이 없으면 안드로이드가 아이콘에 흰 배경을 덧대고 축소해 넣는다
    {
      src: url('icons/icon-maskable-512.png'),
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};
fs.writeFileSync(path.join(DIST, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));

// ── 3. index.html head 주입 ──────────────────────────────────
let html = fs.readFileSync(indexPath, 'utf8');

if (html.includes(MARKER)) {
  console.log('이미 주입됨 - 건너뜀');
} else {
  // 한국어 문서인데 lang 이 en 이면 스크린리더가 영어로 읽고, 브라우저가 엉뚱한
  // 폰트 대체를 고른다
  html = html.replace('<html lang="en">', '<html lang="ko">');

  const head = `    ${MARKER}
    <link rel="manifest" href="${url('manifest.webmanifest')}" />
    <meta name="theme-color" content="${THEME}" />
    <link rel="icon" href="${url('icons/favicon-48.png')}" sizes="48x48" type="image/png" />

    <!-- iOS 는 manifest 를 거의 보지 않는다. 아래 3개가 있어야 사파리에서
         '홈 화면에 추가' 했을 때 아이콘이 붙고 전체화면으로 뜬다 -->
    <link rel="apple-touch-icon" sizes="180x180" href="${url('icons/apple-touch-icon-180.png')}" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="이글스" />
    <!-- black-translucent 는 콘텐츠를 상태바 아래로 밀어 넣는다. RN Web 의 SafeAreaView 는
         웹에서 아무 일도 하지 않으므로 그러면 제목이 시계에 겹친다. default 로 둔다 -->
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />

    <meta name="mobile-web-app-capable" content="yes" />

    <!-- 번들이 마운트되기 전까지 브라우저는 자기 기본 흰색을 칠한다. 지면이 흰색에서
         멀어질수록 그 한 프레임이 흰 섬광으로 보이므로 지면색을 먼저 깔아 둔다.
         overscroll-behavior 는 아래로 당겼을 때 문서 밖 흰 띠가 드러나는 것도 막는다 -->
    <style>
      html, body { background-color: ${THEME}; overscroll-behavior: none; }
    </style>
  </head>`;
  html = html.replace('  </head>', head);

  fs.writeFileSync(indexPath, html);
}

console.log('PWA 후처리 완료');
console.log('  BASE_URL   :', BASE || '(루트)');
console.log('  start_url  :', manifest.start_url);
console.log('  아이콘      :', icons.length + '개 → dist/icons/');
