// dist 를 정적 서빙한다:  node tools/serve-dist.js [포트]
//
// 시각 확인용이다. 브라우저 자동화 도구가 file:// 를 막기 때문에, 배포하지 않고
// 화면을 눈으로 보려면 HTTP 로 띄워야 한다. 토큰이나 컴포넌트를 바꾼 뒤
// `expo export --platform web` → 이 서버 → 캡처 순으로 회귀를 본다.
//
// 의존성 없이 node 기본 모듈만 쓴다.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2]) || 8099;
const DIST = path.join(__dirname, '..', 'dist');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

if (!fs.existsSync(DIST)) {
  console.error('dist 가 없다. 먼저 npx expo export --platform web 을 돌린다');
  process.exit(1);
}

http
  .createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    // 경로 이탈 차단 - dist 밖의 파일이 나가지 않게 한다
    const rel = path.normalize(url).replace(/^([/\\])+/, '');
    let file = path.join(DIST, rel);
    if (!file.startsWith(DIST)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(DIST, 'index.html'); // SPA 폴백
    }
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => console.log(`http://localhost:${PORT}  (dist 서빙 중, Ctrl+C 로 종료)`));
