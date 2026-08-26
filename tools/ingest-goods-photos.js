// 굿즈 데모 사진 넣기:  node tools/ingest-goods-photos.js [--list] [--only id,id] [--pick id=파일명]
//
// ── 왜 사진인가 ──────────────────────────────────────────────
// 기타 굿즈 격자가 **글자만 있는 타일**이었다. 커머스에서 물건이 안 보이면 그 화면은
// 카탈로그가 아니라 재고표다. 유니폼은 JerseyArt 로 그려 넘겼지만(색과 트림은 구단 CI 가
// 정한 사실이라 그려도 거짓이 아니다) 텀블러·후드·키링은 그릴 수 있는 사실이 없다.
//
// ── 그래서 무엇을 넣나 ───────────────────────────────────────
// **구단 상품이 아니라 같은 종류의 일반 상품 사진**을 데모로 넣는다. 커먼즈의 자유
// 라이선스 사진이고, 자리와 크기와 격자 리듬을 증명하는 것이 목적이다.
//
// ⚠ 이 사진들은 **한화 굿즈가 아니다.** 실서비스에서는 구단 상품 촬영본으로 전부
//   갈아 끼운다. 파일 이름만 맞추면(assets/photo/goods/<굿즈 id>.jpg) 코드는 안 고쳐도
//   된다 - photos.tsx 가 폴더를 통째로 읽는다.
//
// ── 수집 규칙은 SOURCES.md 를 그대로 따른다 ──────────────────
//   받는 것: CC0 · 퍼블릭도메인 · CC BY · CC BY-SA
//   안 받는 것: ND(변경 금지 - 크롭이 필요하다) · NC(비영리 - 제안 자료에 들어간다)
//
// ⚠ **육안 검수는 사람이 한다.** 검색은 "orange baseball cap" 에 오렌지가 아닌 모자를
//   물어 온다. 돌린 뒤 --contact 로 뽑은 대조표를 눈으로 훑는 것까지가 한 덩어리다.
//
// 의존성은 node_modules 에 이미 있는 jimp-compact 만 쓴다 (expo 가 끌고 온 것).

const { Buffer } = require('node:buffer');
const fs = require('fs');
const path = require('path');
const mod = require('jimp-compact');
const Jimp = mod.default || mod;

const ROOT = path.join(__dirname, '..');
const GOODS_DIR = path.join(ROOT, 'assets/photo/goods');
const GOODS_TS = path.join(ROOT, 'src/goods.ts');
const SOURCES_JSON = path.join(GOODS_DIR, '_sources.json');
// 대조표는 **assets 밖**에 쓴다. photos.tsx 가 이 폴더를 require.context 로 통째로 읽어서,
// 여기 두면 1MB 짜리 검수용 이미지가 웹 번들에 그대로 실린다(.tmp 는 .gitignore 에 있다)
const CONTACT_PNG = path.join(ROOT, '.tmp/goods-contact.png');

const UA = 'kbo-club-poc/1.0 (demo asset ingest; munchlax125@users.noreply.github.com)';
const API = 'https://commons.wikimedia.org/w/api.php';

/**
 * 타일 그림 자리의 비율과 크기.
 *
 * 유니폼 타일의 JerseyArt 가 정사각(120x120 격자)이라 **같은 정사각**으로 맞춘다.
 * 두 격자가 나란히 스크롤되는데 비율이 다르면 같은 화면 안에서 리듬이 어긋난다.
 */
const ASPECT = 1;
const WIDTH = 420;
const QUALITY = 82;

/**
 * 사람이 지목한 커먼즈 파일.
 *
 * 검색 1등을 그대로 쓰면 **엉뚱한 것이 들어온다.** 실제로 "towel" 은 두루마리 화장지를,
 * "orange cap" 은 주황색 버섯 갓과 Tommy Orange 라는 사람의 초상을 물어 왔다. 커먼즈의
 * 검색 순위는 글의 관련도이지 상품 컷의 품질이 아니다.
 *
 * 그래서 **검색은 후보를 모으는 데까지만** 쓰고(--list), 고르는 것은 사람이 한다.
 * 여기 적힌 파일은 눈으로 확인한 것이다 - 이 표가 곧 육안 검수의 기록이다.
 * 표에 없는 굿즈는 아래 QUERIES 로 자동 수집한다.
 */
const PICKS = {
  // 일본 야구장의 제트풍선. KBO 의 막대풍선과 같은 물건이고, 관중석 맥락까지 맞다
  'm-balloon': 'File:ジェット風船 待機中 (27456227231).jpg',
  'm-towel': 'File:Good morning towels.jpg',
  // 응원 도구가 상 위에 놓인 컷. 처음에 골랐던 썬더스틱 사진은 농구장 관중석이
  // 화면의 9할이라 **물건이 아니라 장면**으로 읽혔다 - 격자에서는 상품 컷이어야 한다
  'm-clapper': 'File:Noisemakers.jpg',
  'm-cap-home': 'File:Baseball cap.jpg',
  // 오렌지 모자의 자유 라이선스 상품 컷이 커먼즈에 없다. 가장 가까운 따뜻한 붉은 계열로
  // 자리만 채운다 ("orange cap" 검색은 주황 버섯 갓과 동명이인의 초상을 물어 온다)
  'm-cap-orange': 'File:Baseball-Cap-c.jpg',
  'm-bucket': 'File:Bucket Hat.jpg',
  'm-keyring': 'File:Key ring 1.jpg',
  'm-badge': 'File:CCS Pin Badge.jpg',
  'm-pcpack': 'File:HonusWagnerCard.jpg',
  'm-tumbler': 'File:Thermos closed - Thermos fermé.JPG',
  'm-mug': 'File:Ceramic mug antisky ceramic.jpg',
  'm-blanket': 'File:Grey knitted blanket.jpg',
  'm-hoodie': 'File:Bookstore - Hoodies for sale - Tulane University 2008.jpg',
  'm-tee': 'File:White simple T-shirt made by COQ manufacture.jpg',
  'm-sticker': 'File:3D-Aufkleber Gel-Aufkleber.jpg',
};

/**
 * 굿즈별 검색어.
 *
 * 앞에 있는 것부터 시도해 **자유 라이선스 + 가로세로가 지나치게 치우치지 않은** 첫 장을
 * 집는다. 검색어를 여럿 두는 이유는 첫 검색어가 엉뚱한 것을 물어 오는 일이 잦기 때문이다
 * ("clapper" 는 영화 슬레이트를 먼저 준다).
 *
 * ⚠ **상품 컷 위주로 고른다.** 사람이 크게 나온 사진은 굿즈 타일에서 물건이 아니라
 *   인물로 읽힌다 - 검색어에 'isolated' · 'product' 를 섞는 이유다.
 */
const QUERIES = {
  'm-balloon': ['thunder sticks cheering', 'inflatable cheering stick', 'balloon stick sport'],
  'm-towel': ['folded towel white background', 'towel isolated', 'rolled towels'],
  'm-clapper': ['hand clapper noisemaker', 'applause noisemaker toy', 'castanet clapper toy'],
  'm-cap-home': ['baseball cap', 'baseball cap isolated', 'navy baseball cap'],
  'm-cap-orange': ['orange baseball cap', 'orange cap hat', 'cap orange isolated'],
  'm-bucket': ['bucket hat', 'boonie hat isolated', 'fishing hat'],
  'm-keyring': ['keychain acrylic', 'keyring souvenir', 'key ring isolated'],
  'm-badge': ['lapel pin badge', 'enamel pin badge', 'pin badge collection'],
  'm-pcpack': ['baseball trading cards', 'trading card pack', 'photocard collection'],
  'm-tumbler': ['travel mug tumbler', 'thermos tumbler isolated', 'insulated tumbler'],
  'm-mug': ['coffee mug white background', 'mug isolated', 'ceramic mug'],
  'm-blanket': ['folded blanket', 'fleece blanket', 'blanket isolated'],
  'm-hoodie': ['zip hoodie', 'hooded sweatshirt isolated', 'hoodie product'],
  'm-tee': ['t-shirt isolated', 'blank t shirt', 'tshirt product photo'],
  'm-sticker': ['sticker sheet', 'vinyl stickers', 'sticker pack'],
};

// ── 라이선스 판정 ─────────────────────────────────────────────
// 커먼즈의 LicenseShortName 은 표기가 제각각이라("CC0", "CC BY-SA 4.0", "Public domain")
// 금지 표식(ND·NC)을 먼저 걸러 내고 나머지에서 허용 표식을 찾는다. 순서를 뒤집으면
// "CC BY-NC-SA" 가 'BY-SA' 에 걸려 통과한다.
function licenseOk(short) {
  const s = (short || '').toUpperCase();
  if (!s) return false;
  if (/\bND\b|NODERIV|-NC|\bNC\b|NONCOMMERCIAL|FAIR USE/.test(s)) return false;
  return /CC0|PUBLIC DOMAIN|PD-|CC BY/.test(s);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 커먼즈는 연속 호출에 429 를 준다. 쉬었다 세 번까지 다시 묻는다 -
// 열다섯 장 받자고 도구가 중간에 죽으면 사람이 이어 붙이게 된다
async function api(params) {
  const url = `${API}?${new URLSearchParams({ action: 'query', format: 'json', ...params })}`;
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return res.json();
    if (i === 3) throw new Error(`커먼즈 API ${res.status}: ${url}`);
    await sleep(1500 * (i + 1));
  }
}

/** 검색어 한 줄에 대한 후보들 - 라이선스로 거른 뒤 순서 그대로 돌려준다 */
async function search(term, limit) {
  const json = await api({
    generator: 'search',
    gsrsearch: `filetype:bitmap ${term}`,
    gsrnamespace: '6',
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata',
    iiurlwidth: '900',
  });
  const pages = Object.values(json?.query?.pages ?? {});
  // generator=search 는 순서를 보장하지 않는다 - index 로 검색 순위를 되살린다
  pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  const out = [];
  for (const p of pages) {
    const info = p.imageinfo?.[0];
    if (!info) continue;
    const meta = info.extmetadata ?? {};
    const license = meta.LicenseShortName?.value ?? '';
    if (!licenseOk(license)) continue;
    // 극단적인 파노라마·세로 사진은 정사각으로 자르면 물건이 잘려 나간다
    const ratio = info.width / info.height;
    if (ratio < 0.55 || ratio > 2.2) continue;
    out.push({
      title: p.title,
      page: info.descriptionurl,
      thumb: info.thumburl || info.url,
      width: info.width,
      height: info.height,
      license,
      author: stripHtml(meta.Artist?.value ?? ''),
      term,
    });
  }
  return out;
}

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

// ── 자르기 ────────────────────────────────────────────────────
// 상품 사진은 물건이 가운데에 있다 - 선수 사진(위 기준 크롭)과 다른 점이다.
async function writeTile(buf, id) {
  const img = await Jimp.read(buf);
  const { width: w, height: h } = img.bitmap;

  let cw, ch;
  if (w / h > ASPECT) {
    ch = h;
    cw = Math.round(h * ASPECT);
  } else {
    cw = w;
    ch = Math.round(w / ASPECT);
  }
  img
    .crop(Math.round((w - cw) / 2), Math.round((h - ch) / 2), cw, ch)
    .resize(WIDTH, Jimp.AUTO)
    .quality(QUALITY);

  const out = path.join(GOODS_DIR, `${id}.jpg`);
  await img.writeAsync(out);
  return { out, w, h };
}

async function download(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`내려받기 ${res.status}: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

// ── goods.ts 의 굿즈 id ───────────────────────────────────────
// 검색어 표에 id 를 두 벌 적어 두면 한쪽이 반드시 낡는다. 자료에서 읽어 대조한다.
function readMerchIds() {
  const src = fs.readFileSync(GOODS_TS, 'utf8');
  const start = src.indexOf('export const MERCH: Merch[] = [');
  if (start < 0) throw new Error('goods.ts 에서 MERCH 를 찾지 못했다');
  const body = src.slice(start, src.indexOf('\n];', start));
  return [...body.matchAll(/id: '([a-z0-9-]+)'/g)].map((m) => m[1]);
}

// ── 대조표 ────────────────────────────────────────────────────
// 15장을 한 장에 붙여 놓고 눈으로 훑는다. 파일을 하나씩 여는 것보다 **한 벌로 보이는지**가
// 먼저 보인다 - 배경 밝기가 제각각이면 격자에서 그 타일만 튄다.
async function contactSheet(ids) {
  const cell = 200;
  const cols = 5;
  const rows = Math.ceil(ids.length / cols);
  // jimp-compact 는 비트맵 폰트를 들고 오지 않는다(dist 만 있다). 글자를 못 찍으므로
  // 자리 순서를 콘솔에 같이 뿌려 대조한다 - 5칸씩 왼쪽 위에서 오른쪽 아래로 읽는다
  const sheet = new Jimp(cols * cell, rows * cell, 0xffffffff);

  for (let i = 0; i < ids.length; i++) {
    const file = path.join(GOODS_DIR, `${ids[i]}.jpg`);
    if (!fs.existsSync(file)) continue;
    const img = (await Jimp.read(file)).resize(cell - 8, cell - 8);
    sheet.composite(img, (i % cols) * cell + 4, Math.floor(i / cols) * cell + 4);
  }
  fs.mkdirSync(path.dirname(CONTACT_PNG), { recursive: true });
  await sheet.writeAsync(CONTACT_PNG);

  for (let r = 0; r < rows; r++) {
    console.log(`  ${r + 1}행: ${ids.slice(r * cols, r * cols + cols).join(' · ')}`);
  }
  return CONTACT_PNG;
}

// ── 본문 ──────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const listOnly = args.includes('--list');
  const only = (args.find((a) => a.startsWith('--only=')) ?? '')
    .slice(7)
    .split(',')
    .filter(Boolean);
  // --pick m-mug=File:Foo.jpg - 검색 1등이 엉뚱할 때 사람이 지목한다
  const picks = { ...PICKS };
  for (const a of args.filter((x) => x.startsWith('--pick='))) {
    const [id, ...rest] = a.slice(7).split('=');
    picks[id] = rest.join('=');
  }

  fs.mkdirSync(GOODS_DIR, { recursive: true });

  const merchIds = readMerchIds();
  const unknown = [...new Set([...Object.keys(QUERIES), ...Object.keys(PICKS)])].filter(
    (id) => !merchIds.includes(id),
  );
  const uncovered = merchIds.filter((id) => !QUERIES[id] && !PICKS[id]);
  if (unknown.length) console.log(`⚠ goods.ts 에 없는 id 의 검색어: ${unknown.join(', ')}`);
  if (uncovered.length) console.log(`⚠ 검색어가 없는 굿즈: ${uncovered.join(', ')}`);

  if (args.includes('--contact')) {
    console.log(`대조표: ${await contactSheet(merchIds)}`);
    return;
  }

  const sources = fs.existsSync(SOURCES_JSON)
    ? JSON.parse(fs.readFileSync(SOURCES_JSON, 'utf8'))
    : {};

  const targets = merchIds.filter(
    (id) => (QUERIES[id] || picks[id]) && (only.length === 0 || only.includes(id)),
  );

  for (const id of targets) {
    let hit = null;

    if (!listOnly && picks[id]) {
      const json = await api({
        titles: picks[id],
        prop: 'imageinfo',
        iiprop: 'url|size|extmetadata',
        iiurlwidth: '900',
      });
      const p = Object.values(json?.query?.pages ?? {})[0];
      const info = p?.imageinfo?.[0];
      if (info) {
        const meta = info.extmetadata ?? {};
        hit = {
          title: p.title,
          page: info.descriptionurl,
          thumb: info.thumburl || info.url,
          license: meta.LicenseShortName?.value ?? '',
          author: stripHtml(meta.Artist?.value ?? ''),
          term: '(사람이 지목)',
        };
        if (!licenseOk(hit.license)) {
          console.log(`  ✗ ${id}  지목한 파일의 라이선스가 규칙 밖이다: ${hit.license}`);
          continue;
        }
      }
    } else {
      for (const term of QUERIES[id]) {
        const cands = await search(term, listOnly ? 6 : 3);
        if (listOnly) {
          console.log(`\n${id}  ← "${term}"`);
          for (const c of cands) console.log(`   ${c.license.padEnd(14)} ${c.title}`);
          continue;
        }
        if (cands.length) {
          hit = cands[0];
          break;
        }
      }
    }

    if (listOnly) continue;
    if (!hit) {
      console.log(`  ? ${id}  자유 라이선스 후보를 못 찾았다 - 검색어를 손본다`);
      continue;
    }

    const r = await writeTile(await download(hit.thumb), id);
    sources[id] = {
      title: hit.title,
      page: hit.page,
      license: hit.license,
      author: hit.author,
      term: hit.term,
    };
    console.log(`  ✓ ${id}  ${hit.title}  [${hit.license}]  ${r.w}x${r.h} → ${WIDTH}x${WIDTH}`);
    await sleep(700);
  }

  if (!listOnly) {
    fs.writeFileSync(SOURCES_JSON, `${JSON.stringify(sources, null, 2)}\n`);
    console.log(`\n출처 기록: ${SOURCES_JSON}`);
    console.log('다음에 할 것');
    console.log('  1. node tools/ingest-goods-photos.js --contact  → 눈으로 훑는다');
    console.log('  2. assets/photo/SOURCES.md 의 굿즈 표를 _sources.json 으로 갱신한다');
    console.log('  3. npm run verify && npm run export:web');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
