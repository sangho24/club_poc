// 지면 회색을 구단 색 쪽으로 기울인 후보를 만들고 검증한다.
//
// 문제: 지면 #F2F2F7 · surface #F4F5F7 · raised #E9EBF0 · border #E8EAEE 가
// 전부 iOS 기본값 계열이라 hue 가 파란 쪽(약 250~265)이다. 구단 색은 오렌지인데
// 지면이 파랗게 식어 있으면 브랜드가 화면 어디에도 묻지 않는다.
//
// 방법: OKLCh 로 옮겨 **L(명도)은 그대로 두고 h(색상)만 오렌지로 돌린 뒤 C(채도)를 준다.**
// L 을 건드리면 면끼리의 위계(카드 > 지면 > 눌림)가 무너지므로 절대 건드리지 않는다.

// ── sRGB ↔ OKLab ─────────────────────────────────────────────
const srgbToLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linToSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};

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

const fromLCh = ({ L, C, h }) => {
  const r = (h * Math.PI) / 180;
  return rgbToHex(oklabToRgb([L, C * Math.cos(r), C * Math.sin(r)]));
};

// ── WCAG 대비 ────────────────────────────────────────────────
const lum = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(srgbToLin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// ── 현재 값 ──────────────────────────────────────────────────
const CURRENT = {
  bg: '#F2F2F7',
  surface: '#F4F5F7',
  raised: '#E9EBF0',
  border: '#E8EAEE',
  borderStrong: '#D6DAE1',
  dim: '#E2E5EA',
  card: '#FFFFFF',
};
const BRAND = '#FC4E00';
const TEXT = { text: '#16181D', subText: '#5B6270', mutedText: '#6E7581' };

const brandLCh = toLCh(BRAND);

console.log('── 현재 회색 계열의 OKLCh ──');
console.log('토큰          hex        L      C       h');
for (const [k, v] of Object.entries(CURRENT)) {
  const { L, C, h } = toLCh(v);
  console.log(
    `${k.padEnd(13)} ${v}  ${L.toFixed(4)}  ${C.toFixed(4)}  ${C < 0.0005 ? '  -  ' : h.toFixed(1)}`,
  );
}
console.log(
  `\n구단 오렌지 ${BRAND}  L=${brandLCh.L.toFixed(4)} C=${brandLCh.C.toFixed(4)} h=${brandLCh.h.toFixed(1)}`,
);

// ── 후보 생성 ────────────────────────────────────────────────
// h 는 구단 오렌지의 hue 에 고정한다(= 같은 색을 묽게 탄 것). C 만 바꿔 가며 강도를 고른다.
const H = brandLCh.h;
const STEPS = [0.002, 0.004, 0.006, 0.008, 0.01, 0.012, 0.016];

console.log('\n── 후보: hue 를 구단 오렌지(h=' + H.toFixed(1) + ')로 고정하고 C 만 변화 ──');
console.log('C       bg       surface  raised   border   borderStr dim      | bg↔card 대비');
for (const C of STEPS) {
  const mk = (k) => fromLCh({ L: toLCh(CURRENT[k]).L, C, h: H });
  const bg = mk('bg');
  console.log(
    `${C.toFixed(3)}   ${bg}  ${mk('surface')}  ${mk('raised')}  ${mk('border')}  ${mk('borderStrong')}   ${mk('dim')}  | ${ratio(bg, '#FFFFFF').toFixed(3)}`,
  );
}

// ── 검증 ─────────────────────────────────────────────────────
// 지면색이 바뀌면 그 위에 얹히는 글자 대비가 같이 움직인다. 섹션 머리글은 지면 위에 있다.
console.log('\n── 지면 위 텍스트 대비 (AA 4.5 기준) ──');
console.log('C       bg        text     subText  mutedText  ← 머리글이 mutedText');
const rowFor = (bg) =>
  `${bg}  ${ratio(bg, TEXT.text).toFixed(2).padStart(6)}  ${ratio(bg, TEXT.subText).toFixed(2).padStart(6)}  ${ratio(bg, TEXT.mutedText).toFixed(2).padStart(7)}`;
console.log(`현재    ${rowFor(CURRENT.bg)}`);
for (const C of STEPS) {
  const bg = fromLCh({ L: toLCh(CURRENT.bg).L, C, h: H });
  console.log(`${C.toFixed(3)}   ${rowFor(bg)}`);
}

// 면끼리의 구분: 지면과 카드가 너무 가까우면 카드가 안 보이고, 지면과 surface 가
// 뒤집히면(= surface 가 더 어두워지면) 위계가 깨진다.
console.log('\n── 면 위계 (L 값은 안 건드렸으므로 유지되어야 한다) ──');
for (const C of [0.006, 0.008]) {
  const g = (k) => fromLCh({ L: toLCh(CURRENT[k]).L, C, h: H });
  const bg = g('bg'),
    sf = g('surface'),
    rs = g('raised');
  console.log(
    `C=${C}: card ${ratio('#FFFFFF', bg).toFixed(3)} bg | bg↔surface ${ratio(bg, sf).toFixed(3)} | bg↔raised ${ratio(bg, rs).toFixed(3)} | surface(${sf}) > raised(${rs}) ? ${lum(sf) > lum(rs)}`,
  );
}
