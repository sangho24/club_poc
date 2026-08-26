// 지면 계열 최종 팔레트 산출 + 회귀 검증.
//
// 결정: **L(명도)은 한 토큰도 건드리지 않고 hue 만 구단 오렌지(h=37.4)로 돌린다.**
// L 을 건드리면 면 위계(카드 > 지면 > 눌림)와 텍스트 대비가 동시에 움직여
// 무엇 때문에 달라졌는지 알 수 없게 된다. 채도는 C=0.008 로 통일한다.
//
// C=0.008 을 고른 이유는 tint-ground.js 의 후보표에 있다. 원래 bg 의 C 가 0.0066
// 이었으므로 **원저자가 이미 쓰던 채도 강도와 거의 같고 방향만 반대**다.
// 0.012 이상은 살구빛이 뚜렷해져 "미세하게"를 넘고, 0.004 이하는 흰 카드 옆에서 사라진다.

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
const fromLCh = ({ L, C, h }) => {
  const r = (h * Math.PI) / 180;
  return rgbToHex(oklabToRgb([L, C * Math.cos(r), C * Math.sin(r)]));
};
const lum = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(srgbToLin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const H = toLCh('#FC4E00').h; // 37.4 - 구단 오렌지의 hue
const C = 0.008;

// 지면 계열 전체. 하나라도 빠뜨리면 그 자리에서만 파란 회색이 튄다.
const GROUND = {
  bg: '#F2F2F7',
  surface: '#F4F5F7',
  raised: '#E9EBF0',
  border: '#E8EAEE',
  borderStrong: '#D6DAE1',
  dim: '#E2E5EA',
  skeletonBase: '#E4E7EC',
  skeletonSheen: '#EEF0F3',
};

console.log('── 최종 팔레트 (hue ' + H.toFixed(1) + ', C ' + C + ', L 불변) ──');
console.log('토큰            전       →  후        L(불변)   ΔL');
const NEXT = {};
for (const [k, v] of Object.entries(GROUND)) {
  const { L } = toLCh(v);
  const next = fromLCh({ L, C, h: H });
  NEXT[k] = next;
  const dL = (toLCh(next).L - L) * 1000;
  console.log(
    `${k.padEnd(15)} ${v}  →  ${next}   ${L.toFixed(4)}   ${dL >= 0 ? '+' : ''}${dL.toFixed(2)}‰`,
  );
}

// ── 회귀 검증 ───────────────────────────────────────────────
const TEXT = { text: '#16181D', subText: '#5B6270', mutedText: '#6E7581' };
let fail = 0;
const check = (label, ok, detail) => {
  if (!ok) fail++;
  console.log(`${ok ? '[ OK ]' : '[FAIL]'} ${label.padEnd(46)} ${detail}`);
};

console.log('\n── 1. 면 위계가 유지되는가 (L 을 안 건드렸으므로 유지되어야 한다) ──');
const order = ['bg', 'surface', 'raised', 'border', 'borderStrong', 'dim'];
for (const k of order) {
  const before = ratio('#FFFFFF', GROUND[k]);
  const after = ratio('#FFFFFF', NEXT[k]);
  check(
    `card↔${k} 대비 유지`,
    Math.abs(before - after) < 0.02,
    `${before.toFixed(3)} → ${after.toFixed(3)}`,
  );
}
check(
  'surface 가 raised 보다 밝다',
  lum(NEXT.surface) > lum(NEXT.raised),
  `${NEXT.surface} > ${NEXT.raised}`,
);
check(
  'skeleton.base 가 지면보다 어둡다 (오는 중 ≠ 비어 있음)',
  lum(NEXT.skeletonBase) < lum(NEXT.bg),
  `${NEXT.skeletonBase} < ${NEXT.bg}`,
);
check(
  'skeleton.sheen 이 base 보다 밝다',
  lum(NEXT.skeletonSheen) > lum(NEXT.skeletonBase),
  `${NEXT.skeletonSheen} > ${NEXT.skeletonBase}`,
);

console.log('\n── 2. 지면 위 텍스트 대비가 나빠지지 않는가 ──');
for (const [k, v] of Object.entries(TEXT)) {
  const before = ratio(GROUND.bg, v),
    after = ratio(NEXT.bg, v);
  check(
    `bg 위 ${k}`,
    after >= before - 0.03,
    `${before.toFixed(2)} → ${after.toFixed(2)}  (AA 4.5)`,
  );
}

console.log('\n── 3. 틴트 배지는 카드 안에만 (theme.ts soft() 주석의 제약) ──');
const soft = (hex, bgHex) => {
  // 10% 알파를 배경 위에 합성
  const f = hexToRgb(hex),
    b = hexToRgb(bgHex);
  return rgbToHex([0, 1, 2].map((i) => f[i] * 0.1 + b[i] * 0.9));
};
// ⚠ 틴트 위에 얹는 글자는 **틴트를 만든 색이 아니다.** brand 는 면 전용이라
// 그 위 글자는 brandText(#C63A00)를 쓴다(buttonTone.soft 가 그렇게 되어 있다).
// 여기에 원색을 넣고 재면 실제로 화면에 없는 조합을 검사하게 된다.
const TINT_PAIRS = {
  brand: { fill: '#FC4E00', fg: '#C63A00' },
  live: { fill: '#D00F31', fg: '#D00F31' },
  win: { fill: '#1F7A4D', fg: '#1F7A4D' },
  warn: { fill: '#8A6416', fg: '#8A6416' },
};
for (const [name, { fill, fg }] of Object.entries(TINT_PAIRS)) {
  const onCard = ratio(soft(fill, '#FFFFFF'), fg);
  const onGround = ratio(soft(fill, NEXT.bg), fg);
  const wasOnCard = ratio(soft(fill, '#FFFFFF'), fg);
  check(
    `${name}Soft 위 글자 - 카드 안`,
    onCard >= 4.5,
    `카드 ${onCard.toFixed(2)} / 지면 ${onGround.toFixed(2)} (지면은 원래부터 미달 - 그래서 카드 안에만 둔다)`,
  );
  void wasOnCard;
}

console.log('\n── 4. 이미 있던 결함 (이번 변경이 만든 것이 아니다) ──');
const mutedBefore = ratio(GROUND.bg, TEXT.mutedText);
const mutedAfter = ratio(NEXT.bg, TEXT.mutedText);
console.log(`섹션 머리글(mutedText #6E7581, 13pt/600)이 지면 위에서 AA 미달`);
console.log(
  `  전 ${mutedBefore.toFixed(2)} / 후 ${mutedAfter.toFixed(2)}  ← 둘 다 4.5 미만. 변경이 악화시키지는 않았다`,
);
console.log(
  `  theme.ts 주석은 "흰 카드 위에서 세 단계 모두 AA 를 넘는다"고만 적혀 있고, 실제로 카드 위는 ${ratio('#FFFFFF', TEXT.mutedText).toFixed(2)} 로 맞다.`,
);
console.log(`  머리글만 지면 위에 있어서 어긋난다.`);
// 지면 위 AA 를 넘기려면 얼마나 어두워야 하는지
for (let L = 0.56; L > 0.48; L -= 0.005) {
  const cand = fromLCh({ L, C: toLCh(TEXT.mutedText).C, h: toLCh(TEXT.mutedText).h });
  if (ratio(NEXT.bg, cand) >= 4.5) {
    console.log(
      `  참고: 지면 위 AA 를 넘기는 가장 가까운 값 = ${cand} (${ratio(NEXT.bg, cand).toFixed(2)})`,
    );
    break;
  }
}

console.log(`\n${fail === 0 ? '전체 통과' : fail + '건 실패'}`);
console.log('\n── theme.ts 에 넣을 값 ──');
for (const [k, v] of Object.entries(NEXT)) console.log(`${k}: '${v}',`);
process.exit(fail === 0 ? 0 : 1);
