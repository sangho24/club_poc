// 앱 아이콘 생성:  node tools/make-icons.js
//
// 엠블럼이 바뀌면 이 스크립트를 다시 돌린다. 손으로 만든 아이콘을 저장소에 넣어두면
// 어떤 크기·여백 규칙으로 잘랐는지가 사라져서 다음 사람이 재현할 수 없다.
//
// 원본 emblem-2025.png 은 960x819 로 정사각형이 아니다. 아이콘은 어디서나 정사각형이라
// 그대로 넣으면 찌그러지거나 잘린다. 그래서 정사각 캔버스에 비율을 지켜 앉힌다.
//
// ── 여백 비율이 자리마다 다른 이유 ───────────────────────────
// 아이콘을 어떻게 깎아 보여주는지가 플랫폼마다 다르다.
//   그대로 두는 자리(iOS·favicon)  → 엠블럼을 크게. 여백이 넓으면 작아 보인다
//   마스크로 깎는 자리(안드로이드 adaptive·PWA maskable)
//                                  → 원형·스퀘어클로 잘리므로 안전 영역 안까지만
// 같은 0.72 를 마스크 자리에 쓰면 엠블럼 가장자리가 잘려 나간다.
//
// 의존성은 node_modules 에 이미 있는 jimp-compact 만 쓴다 (expo 가 끌고 온 것).

const fs = require('fs');
const path = require('path');
const mod = require('jimp-compact');
const Jimp = mod.default || mod;

/** 한화 Thunderstorm Navy - theme.ts 의 stormNavy 와 같은 값이어야 한다 */
const NAVY = 0x07111fff;
const TRANSPARENT = 0x00000000;

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'assets/logo/emblem-2025.png');

const TARGETS = [
  // ── 네이티브 (EAS 빌드) ────────────────────────────────────
  { out: 'assets/icon.png', size: 1024, ratio: 0.72, bg: NAVY },
  // adaptive 전경. 배경은 app.json 의 adaptiveIcon.backgroundColor 가 깔아준다
  { out: 'assets/adaptive-icon.png', size: 1024, ratio: 0.55, bg: TRANSPARENT },

  // ── 웹 PWA (홈 화면에 추가) ────────────────────────────────
  { out: 'assets/web/icon-192.png', size: 192, ratio: 0.72, bg: NAVY },
  { out: 'assets/web/icon-512.png', size: 512, ratio: 0.72, bg: NAVY },
  // maskable 은 브라우저가 임의 모양으로 깎는다. 배경까지 포함해 꽉 채우되 엠블럼은 안쪽에
  { out: 'assets/web/icon-maskable-512.png', size: 512, ratio: 0.55, bg: NAVY },
  // iOS 는 마스크 대신 모서리만 둥글린다. 크게 넣어도 안전하다
  { out: 'assets/web/apple-touch-icon-180.png', size: 180, ratio: 0.72, bg: NAVY },
  // 파비콘은 워낙 작아 여백을 두면 무엇인지 안 읽힌다
  { out: 'assets/web/favicon-48.png', size: 48, ratio: 0.82, bg: NAVY },
];

// 원본 비율을 지키면서 캔버스의 ratio 비율 안에 앉힌다
async function make(srcImg, { out, size, ratio, bg }) {
  const box = Math.round(size * ratio);
  const scale = Math.min(box / srcImg.bitmap.width, box / srcImg.bitmap.height);
  const w = Math.max(1, Math.round(srcImg.bitmap.width * scale));
  const h = Math.max(1, Math.round(srcImg.bitmap.height * scale));

  // 원본을 매번 복제한다. resize 는 대상을 직접 바꾸므로 재사용하면 두 번째가 망가진다
  const layer = srcImg.clone().resize(w, h);

  const canvas = new Jimp(size, size, bg);
  canvas.composite(layer, Math.round((size - w) / 2), Math.round((size - h) / 2));

  const abs = path.join(ROOT, out);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  await canvas.writeAsync(abs);

  return `${out.padEnd(38)} ${size}x${size}  엠블럼 ${w}x${h}`;
}

(async () => {
  const src = await Jimp.read(SRC);
  console.log(`원본: ${src.bitmap.width}x${src.bitmap.height}`);
  for (const t of TARGETS) {
    console.log('  ' + (await make(src, t)));
  }
})().catch((e) => {
  console.error('실패:', e.message);
  process.exit(1);
});
