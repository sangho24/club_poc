// 앱 아이콘 생성:  node tools/make-icons.js
//
// 엠블럼이 바뀌면 이 스크립트를 다시 돌린다. 손으로 만든 아이콘을 저장소에 넣어두면
// 어떤 크기·여백 규칙으로 잘랐는지가 사라져서 다음 사람이 재현할 수 없다.
//
// 원본 emblem-2025.png 은 960x819 로 정사각형이 아니다. 앱 아이콘은 정사각형이라
// 그대로 넣으면 찌그러지거나 잘린다. 그래서 1024 정사각 캔버스에 비율을 지켜 앉힌다.
//
// 두 장을 만든다.
//   icon.png          - iOS·구형 안드로이드용. 네이비 면이 아이콘 안에 포함된다
//   adaptive-icon.png - 안드로이드 adaptive 전경. 배경은 app.json 의 adaptiveIcon.backgroundColor
//                       가 깔아주므로 여기서는 투명하게 두고, 원형·스퀘어클 마스크에 잘리지
//                       않도록 안전 영역 안쪽에만 그린다
//
// 의존성은 node_modules 에 이미 있는 jimp-compact 만 쓴다 (expo 가 끌고 온 것).

const path = require('path');
const mod = require('jimp-compact');
const Jimp = mod.default || mod;

const SIZE = 1024;
const NAVY = 0x07111fff; // 한화 Thunderstorm Navy - theme.ts 의 stormNavy 와 같은 값
const TRANSPARENT = 0x00000000;

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'assets/logo/emblem-2025.png');

// 원본 비율을 지키면서 캔버스의 ratio 비율 안에 앉힌다
async function make(srcImg, ratio, bgColor, outPath) {
  const box = Math.round(SIZE * ratio);
  const scale = Math.min(box / srcImg.bitmap.width, box / srcImg.bitmap.height);
  const w = Math.round(srcImg.bitmap.width * scale);
  const h = Math.round(srcImg.bitmap.height * scale);

  // 원본을 매번 복제한다. resize 는 대상을 직접 바꾸므로 재사용하면 두 번째가 망가진다
  const layer = srcImg.clone().resize(w, h);

  const canvas = new Jimp(SIZE, SIZE, bgColor);
  canvas.composite(layer, Math.round((SIZE - w) / 2), Math.round((SIZE - h) / 2));
  await canvas.writeAsync(outPath);

  return { out: path.basename(outPath), size: `${SIZE}x${SIZE}`, emblem: `${w}x${h}` };
}

(async () => {
  const src = await Jimp.read(SRC);
  console.log(`원본: ${src.bitmap.width}x${src.bitmap.height}`);

  // 전체 아이콘: 네이비 면 위 엠블럼. 여백을 넉넉히 둬야 홈 화면에서 답답하지 않다
  console.log(JSON.stringify(await make(src, 0.72, NAVY, path.join(ROOT, 'assets/icon.png'))));

  // adaptive 전경: 마스크가 가장자리를 깎으므로 안전 영역 안쪽까지만
  console.log(
    JSON.stringify(await make(src, 0.55, TRANSPARENT, path.join(ROOT, 'assets/adaptive-icon.png')))
  );
})().catch((e) => {
  console.error('실패:', e.message);
  process.exit(1);
});
