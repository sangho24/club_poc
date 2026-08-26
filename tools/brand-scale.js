// 브랜드 색 음영 계단 산출 - Hanwha Eagles 워드마크 3색에서 팔레트를 만든다.
//
// ── 재료 ─────────────────────────────────────────────────────
// 구단 워드마크 가이드가 쓰는 면은 셋뿐이다: 흰색 · 오렌지 · Thunderstorm Navy.
// 그 셋이 이 앱에도 이미 있다(theme.ts). 여기서는 **없던 색을 지어내지 않고**
// 있는 두 색에서 음영 계단만 뽑는다.
//
// ── 규칙 ─────────────────────────────────────────────────────
// ① hue 고정   - 계단 전체가 브랜드 색과 같은 색상각을 쓴다. 밝은 칸에서 hue 가
//               돌면 그 칸만 다른 브랜드처럼 보인다.
// ② L 은 OKLCh - 눈에 고르게 벌어지는 계단이 필요하다. HSL 로 짜면 500 과 600 은
//               붙어 보이고 100 과 200 은 벌어져 보인다.
// ③ 원본 보존  - 브랜드 색 자체가 계단의 한 칸이어야 한다. 근사치로 대체하면
//               엠블럼과 화면의 오렌지가 미세하게 어긋난다.
// ④ 채도 taper - 양 끝은 채도를 줄인다. 밝은 칸에 원본 채도를 그대로 두면 형광 살구색이
//               되고, 어두운 칸은 애초에 sRGB 밖으로 나간다.
// ⑤ 게멋 맞춤  - 계산 결과가 sRGB 밖이면 **C 를 줄여서** 안으로 들인다. 그냥 자르면
//               (rgbToHex 의 clamp) 채널마다 다르게 잘려 hue 가 조용히 틀어진다.
//
// 실행: node tools/brand-scale.js

// ── 색공간 (tools/tint-ground-final.js 와 같은 구현) ─────────
const srgbToLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linToSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
const hexToRgb = (hex) =>
  [0, 2, 4].map((i) => parseInt(hex.replace('#', '').slice(i, i + 2), 16) / 255);
const rgbToHex = (rgb) =>
  '#' +
  rgb
    .map((c) =>
      Math.round(Math.min(1, Math.max(0, c)) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase();

function rgbToOklab([r, g, b]) {
  const R = srgbToLin(r),
    G = srgbToLin(g),
    B = srgbToLin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function oklabToRgb([L, a, bb]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * bb) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * bb) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * bb) ** 3;
  return [
    linToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}
const toLCh = (hex) => {
  const [L, a, b] = rgbToOklab(hexToRgb(hex));
  return { L, C: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 };
};
const rgbOf = ({ L, C, h }) => {
  const r = (h * Math.PI) / 180;
  return oklabToRgb([L, C * Math.cos(r), C * Math.sin(r)]);
};
const inGamut = (rgb) => rgb.every((c) => c >= -0.0001 && c <= 1.0001);

/**
 * sRGB 밖이면 C 를 줄여서 안으로 들인다.
 *
 * 이분법을 쓴다 - L 과 h 는 그대로 두고 C 만 낮추므로 밝기와 색상각은 보존되고
 * 채도만 "이 밝기에서 낼 수 있는 만큼"으로 깎인다.
 */
function fit({ L, C, h }) {
  if (inGamut(rgbOf({ L, C, h }))) return { L, C, h };
  let lo = 0,
    hi = C;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(rgbOf({ L, C: mid, h }))) lo = mid;
    else hi = mid;
  }
  return { L, C: lo, h };
}
const hexOf = (lch) => rgbToHex(rgbOf(fit(lch)));

const lum = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(srgbToLin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// ── 계단 ─────────────────────────────────────────────────────
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

/** 밝은 쪽 L. 500 위쪽 다섯 칸은 이 값으로 고정한다 */
const LIGHT_L = { 50: 0.975, 100: 0.945, 200: 0.892, 300: 0.83, 400: 0.752 };

/**
 * 채도 taper - 500 을 1.0 으로 두고 양쪽으로 줄인다.
 *
 * 밝은 쪽을 더 가파르게 깎는다. 같은 채도라도 밝은 면은 넓게 칠해지는 자리(배경·틴트)라
 * 조금만 진해도 지면이 스스로를 주장한다. 어두운 쪽은 글자·아이콘으로 좁게 쓰인다.
 */
const TAPER = {
  50: 0.1,
  100: 0.2,
  200: 0.38,
  300: 0.58,
  400: 0.8,
  500: 1.0,
  600: 0.98,
  700: 0.9,
  800: 0.78,
  900: 0.62,
};

/**
 * 한 색에서 계단을 만든다.
 *
 * @param anchor 원본 색이 앉을 칸. 그 칸은 원본 hex 를 **그대로** 쓴다.
 * @param darkL  900 칸의 L. 원본이 900 이면 무시된다.
 */
function ramp(hex, anchor, darkL) {
  const base = toLCh(hex);
  const out = {};

  // 앵커 위(밝은 쪽)의 L 은 고정표, 아래(어두운 쪽)는 앵커에서 darkL 까지 고르게 내린다
  const below = STEPS.filter((s) => s > anchor);
  for (const s of STEPS) {
    if (s === anchor) {
      out[s] = hex.toUpperCase();
      continue;
    }
    let L;
    if (s < anchor) {
      // 앵커가 900 처럼 낮으면 고정표만으로 부족하다 - 앵커의 L 까지 이어 붙인다
      L = LIGHT_L[s] ?? LIGHT_L[400] - ((LIGHT_L[400] - base.L) * (s - 400)) / (anchor - 400);
    } else {
      const i = below.indexOf(s) + 1;
      L = base.L + ((darkL - base.L) * i) / below.length;
    }
    // taper 는 앵커를 1.0 으로 다시 맞춘다 - 앵커가 500 이 아니어도 원본이 꼭짓점이다
    const t = TAPER[s] / TAPER[anchor];
    out[s] = hexOf({ L, C: base.C * t, h: base.h });
  }
  return out;
}

// ── 재료: theme.ts 가 이미 쓰는 두 색 ────────────────────────
const ORANGE = '#FC4E00'; // brand
const NAVY = '#07111F'; // navy - 워드마크 가이드의 Thunderstorm Navy
const WHITE = '#FFFFFF';
const GROUND = '#F8F1EF'; // 지면. 틴트를 지면 위에 얹을 때의 대비를 같이 잰다

const orange = ramp(ORANGE, 500, 0.24);
// 네이비는 원본이 이미 가장 어두운 칸이다. 900 에 앉히고 위로만 올린다
const navy = ramp(NAVY, 900, 0.24);

const show = (name, scale) => {
  console.log(`\n═══ ${name} ═══`);
  // 흰 바탕 대비와 '면 위 흰 글자' 대비는 **같은 수**다(대비는 방향이 없다).
  // 그래서 한 번만 잰다 - 이 값 하나가 두 가지를 동시에 말한다:
  //   4.5 이상 → 흰 바탕에 글자로 써도 되고, 면으로 깔고 흰 글자를 얹어도 된다
  //   3.0~4.5  → 큰 글자·테두리·아이콘까지만
  console.log('  step   hex       흰면    지면    네이비면   쓸 수 있는 자리');
  for (const s of STEPS) {
    const hex = scale[s];
    const onWhite = ratio(hex, WHITE);
    const onGround = ratio(hex, GROUND);
    const onNavy = ratio(hex, NAVY);
    const note = [];
    if (onWhite >= 4.5) note.push('흰바탕 글자 ↔ 면+흰글자');
    else if (onWhite >= 3) note.push('큰글자·테두리');
    else note.push('면·틴트 전용');
    if (onNavy >= 4.5) note.push('네이비 위 글자');
    console.log(
      `  ${String(s).padStart(4)}   ${hex}   ${onWhite.toFixed(2).padStart(5)}   ` +
        `${onGround.toFixed(2).padStart(5)}   ${onNavy.toFixed(2).padStart(6)}     ${note.join(' · ')}`,
    );
  }
};

show('Eagles Orange', orange);
show('Thunderstorm Navy', navy);

// ── 지금 쓰는 토큰이 계단의 어디쯤인지 ───────────────────────
const nearest = (hex, scale) => {
  const t = toLCh(hex);
  let best = null;
  for (const s of STEPS) {
    const d = Math.abs(toLCh(scale[s]).L - t.L);
    if (!best || d < best.d) best = { s, d, hex: scale[s] };
  }
  return best;
};
console.log('\n═══ 기존 토큰이 앉는 칸 ═══');
for (const [name, hex, scale, sname] of [
  ['brand', '#FC4E00', orange, 'orange'],
  ['brandText', '#C63A00', orange, 'orange'],
  ['navy', '#07111F', navy, 'navy'],
]) {
  const n = nearest(hex, scale);
  const same = n.hex === hex.toUpperCase();
  console.log(
    `  ${name.padEnd(10)} ${hex}  →  ${sname}-${n.s} (${n.hex}) ${same ? '일치' : `ΔL ${n.d.toFixed(3)}`}`,
  );
}

// ── TS 조각 ──────────────────────────────────────────────────
const emit = (name, scale) =>
  `const ${name} = {\n` +
  STEPS.map((s) => `  ${s}: '${scale[s]}',`).join('\n') +
  '\n} as const;';
console.log('\n═══ theme.ts 에 붙일 것 ═══\n');
console.log(emit('orangeScale', orange));
console.log();
console.log(emit('navyScale', navy));
