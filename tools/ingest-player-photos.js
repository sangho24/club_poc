// 선수 프로필 사진 넣기:  node tools/ingest-player-photos.js [받은폴더] [--write]
//
// ── 왜 도구인가 ──────────────────────────────────────────────
// 사진 한 장을 넣는 일은 파일을 복사하는 일이 아니다. 크롭 기준(얼굴은 위)·목표 비율·
// 가로폭·JPEG 품질이 매번 같아야 서른다섯 개가 한 벌로 보인다. 손으로 하면 다섯 장쯤에서
// 규칙이 흔들리고, 흔들린 자리는 목록에서 그 줄만 튀어 보인다.
// 그리고 다음 사람이 "이 사진 왜 이렇게 잘렸나"를 물었을 때 답이 코드에 남아 있어야 한다.
//
// ── 무엇을 하나 ──────────────────────────────────────────────
//   1. 받은 폴더의 이미지를 로스터(src/roster.ts)의 선수와 짝짓는다
//      - 파일 이름에 선수 id(`nsh.jpg`) 또는 한글 이름(`노시환 프로필.png`)이 있으면 된다
//   2. 목표 비율로 자르고 가로 500 으로 줄여 assets/photo/player/<id>.jpg 로 쓴다
//   3. PLAYER_PHOTOS 지도를 다시 만들어 준다 (--write 면 photos.tsx 에 직접 쓴다)
//   4. 아직 사진이 없는 선수를 보고한다
//
// ⚠ **육안 검수는 사람이 한다.** 자동 매칭은 동명이인을 구별하지 못하고, 얼굴 위치도
//   보지 못한다. 돌린 뒤 assets/photo/player/ 를 눈으로 훑는 것까지가 한 덩어리다.
//   (커먼즈 수집 때 `Ju Hyun-sang` 이 가수 서현 사진에 걸린 적이 있다 - SOURCES.md)
//
// 의존성은 node_modules 에 이미 있는 jimp-compact 만 쓴다 (expo 가 끌고 온 것).

const fs = require('fs');
const path = require('path');
const mod = require('jimp-compact');
const Jimp = mod.default || mod;

const ROOT = path.join(__dirname, '..');
const PLAYER_DIR = path.join(ROOT, 'assets/photo/player');
const ROSTER_TS = path.join(ROOT, 'src/roster.ts');
const PHOTOS_TSX = path.join(ROOT, 'src/components/photos.tsx');

/**
 * 목표 비율(가로/세로)과 가로폭.
 *
 * 이미 들어 있는 류현진(500x556)·최재훈(500x560)이 이 근처다. 세로가 조금 긴 이유는
 * **머리 + 가슴의 구단 마크**까지가 한 컷이기 때문이다 - 정사각으로 자르면 유니폼이
 * 사라져 누구 팀 선수인지가 아바타에서 없어진다.
 */
const ASPECT = 500 / 560;
const WIDTH = 500;
const QUALITY = 84;

/**
 * 세로로 긴 원본을 자를 때 위에서 얼마나 버리나 (남는 세로분의 비율).
 *
 * 0 이면 맨 위부터 그대로 쓴다. 구단 프로필 촬영본은 머리 위 여백이 넉넉한 편이라
 * 조금 덜어내야 얼굴이 아바타 원 안에 찬다. 0.5 로 두면 한가운데가 남아 머리가 잘린다 -
 * 앱의 아바타가 **위 기준 크롭**이라는 것과 같은 이유다(PlayerAvatar 주석).
 */
const TOP_TRIM = 0.08;

// ── 로스터 읽기 ───────────────────────────────────────────────
// 이름과 등번호를 여기에 다시 적지 않는다. 두 벌이 되는 순간 한쪽이 반드시 낡는다.
function readRoster() {
  const src = fs.readFileSync(ROSTER_TS, 'utf8');
  const out = [];
  for (const name of ['BATTERS', 'PITCHERS', 'OPPONENT_PITCHERS']) {
    const start = src.indexOf(`export const ${name}: `);
    if (start < 0) throw new Error(`roster.ts 에서 ${name} 을 찾지 못했다`);
    const body = src.slice(start, src.indexOf('\n];', start));
    const re = /id: '([a-z]+)',\s*\n\s*name: '([^']+)',\s*\n\s*back: (\d+),/g;
    let m;
    while ((m = re.exec(body))) out.push({ id: m[1], name: m[2], back: Number(m[3]), group: name });
  }
  return out;
}

// ── 짝짓기 ────────────────────────────────────────────────────
// 파일 이름에 id 나 한글 이름이 들어 있으면 그 선수다. 등번호로는 맞추지 않는다 -
// 타자 1번과 투수 1번이 다른 사람이라 조용히 틀릴 수 있다.
function matchPlayer(fileName, roster) {
  const stem = path.basename(fileName, path.extname(fileName));
  const byName = roster.filter((p) => stem.includes(p.name));
  if (byName.length === 1) return byName[0];
  if (byName.length > 1) return { ambiguous: byName };

  const norm = stem.toLowerCase().replace(/[^a-z]/g, '');
  const byId = roster.filter((p) => norm === p.id || norm.startsWith(p.id) || norm.endsWith(p.id));
  if (byId.length === 1) return byId[0];
  if (byId.length > 1) return { ambiguous: byId };
  return null;
}

// ── 자르기 ────────────────────────────────────────────────────
async function ingest(srcPath, id) {
  const img = await Jimp.read(srcPath);
  const { width: w, height: h } = img.bitmap;

  let cw, ch, cx, cy;
  if (w / h > ASPECT) {
    // 원본이 목표보다 넓다 - 세로를 다 쓰고 가로를 가운데에서 딴다
    ch = h;
    cw = Math.round(h * ASPECT);
    cx = Math.round((w - cw) / 2);
    cy = 0;
  } else {
    // 원본이 목표보다 길다 - 가로를 다 쓰고 세로를 **위에서** 딴다
    cw = w;
    ch = Math.round(w / ASPECT);
    cx = 0;
    cy = Math.round((h - ch) * TOP_TRIM);
  }

  img.crop(cx, cy, cw, ch).resize(WIDTH, Jimp.AUTO).quality(QUALITY);
  const out = path.join(PLAYER_DIR, `${id}.jpg`);
  await img.writeAsync(out);
  return { out, w, h, outH: img.bitmap.height };
}

// ── PLAYER_PHOTOS 지도 ────────────────────────────────────────
// 폴더에 실제로 있는 파일에서 만든다. 로스터에 없는 id(지난 시즌 선수)는 자동으로 빠지고,
// aspect 는 지어내지 않고 파일에서 잰다.
async function buildMap(roster) {
  const lines = [];
  for (const p of roster) {
    const file = path.join(PLAYER_DIR, `${p.id}.jpg`);
    if (!fs.existsSync(file)) continue;
    const { width, height } = (await Jimp.read(file)).bitmap;
    lines.push(
      `  ${p.id}: { source: require('../../assets/photo/player/${p.id}.jpg'), ` +
        `aspect: ${width} / ${height} }, // ${p.name}`,
    );
  }
  return `const PLAYER_PHOTOS: Partial<Record<string, PlayerPhoto>> = {\n${lines.join('\n')}\n};`;
}

function writeMap(block) {
  const src = fs.readFileSync(PHOTOS_TSX, 'utf8');
  const re = /const PLAYER_PHOTOS: Partial<Record<string, PlayerPhoto>> = \{[\s\S]*?\n\};/;
  if (!re.test(src)) throw new Error('photos.tsx 에서 PLAYER_PHOTOS 블록을 찾지 못했다');
  fs.writeFileSync(PHOTOS_TSX, src.replace(re, block));
}

// ── 본문 ──────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const inDir = path.resolve(args.find((a) => !a.startsWith('--')) ?? path.join(PLAYER_DIR, '_incoming'));

  const roster = readRoster();
  const done = [];

  if (!fs.existsSync(inDir)) {
    console.log(`받은 폴더가 없다: ${inDir}`);
    console.log('구단 공식 사진을 그 폴더에 넣고 다시 돌린다 (파일 이름에 선수 이름이나 id).');
  } else {
    const files = fs
      .readdirSync(inDir)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort();
    console.log(`받은 폴더: ${inDir}  (이미지 ${files.length}장)\n`);

    for (const f of files) {
      const hit = matchPlayer(f, roster);
      if (!hit) {
        console.log(`  ?  ${f}  → 짝지을 선수를 못 찾았다. 파일 이름에 선수 이름이나 id 를 넣는다`);
        continue;
      }
      if (hit.ambiguous) {
        console.log(`  !  ${f}  → 후보가 여럿이다 (${hit.ambiguous.map((p) => p.name).join(', ')}). id 로 이름 짓는다`);
        continue;
      }
      const r = await ingest(path.join(inDir, f), hit.id);
      console.log(`  ✓  ${f}  → ${hit.id}.jpg  ${hit.name} #${hit.back}  (${r.w}x${r.h} → ${WIDTH}x${r.outH})`);
      done.push(hit);
    }
  }

  const block = await buildMap(roster);
  if (write) {
    writeMap(block);
    console.log(`\nphotos.tsx 의 PLAYER_PHOTOS 를 갱신했다.`);
  } else {
    console.log(`\n── photos.tsx 에 넣을 블록 (--write 를 주면 직접 쓴다) ──\n\n${block}\n`);
  }

  // 아직 없는 선수. 한화만 센다 - 상대팀은 엠블럼 폴백이 정답이다
  const missing = roster.filter(
    (p) => p.group !== 'OPPONENT_PITCHERS' && !fs.existsSync(path.join(PLAYER_DIR, `${p.id}.jpg`)),
  );
  const total = roster.filter((p) => p.group !== 'OPPONENT_PITCHERS').length;
  console.log(`\n한화 ${total}명 중 사진 ${total - missing.length}명 · 유니폼 아바타 ${missing.length}명`);
  if (missing.length) {
    console.log(`  아직 없는 선수: ${missing.map((p) => `${p.name}(${p.id})`).join(' · ')}`);
  }

  if (done.length) {
    console.log('\n다음에 할 것');
    console.log('  1. assets/photo/player/ 를 눈으로 훑는다 - 얼굴이 잘렸거나 다른 사람이 아닌지');
    console.log('  2. assets/photo/SOURCES.md 의 표에 출처·저작자·라이선스 줄을 채운다');
    console.log('  3. npm run verify && npm run export:web');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
