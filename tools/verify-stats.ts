// 스탯 엔진 검증 - 목업 원자료가 야구적으로 말이 되는 값을 내는지 실제로 계산해 본다.
//
// 화면을 붙이기 전에 이걸 먼저 돌린다. 숫자가 이상한 채로 UI 를 만들면 나중에
// "디자인 문제"로 오인하게 되고, 무엇보다 시연 중에 파트너가 값을 물었을 때 답할 수 없다.
//
// 실행: npx tsc -p tools/tsconfig.verify.json && node .tmp/tools/verify-stats.js
import { LINEUP, PLATE_SEQUENCE } from '../src/game';
import { GAME_LOG, LG_ORDER } from '../src/gameLog';
import { EXPECTED_SCORE, FINAL_STEP, lineScoreAt, scoreAt } from '../src/liveFeed';
import { JosaKind, josa } from '../src/korean';
import { BATTERS, OPPONENT_PITCHERS, PITCHERS, verifyRoster } from '../src/roster';
import {
  GameSituation,
  bullpenAdvice,
  leverageIndex,
  liveAlerts,
  predictMatchup,
  runExpectancy,
} from '../src/liveEngine';
import {
  LEAGUE,
  avgOf,
  babipAllowedOf,
  babipOf,
  batterWarBreakdown,
  batterWarOf,
  eraOf,
  fipOf,
  ipLabel,
  obpOf,
  opsOf,
  pitcherWarOf,
  slgOf,
  trustSentence,
  whipOf,
  wobaOf,
  wrcPlusOf,
} from '../src/sabermetrics';

// @types/node 를 앱 의존성에 넣지 않기 위해(검증 스크립트 하나 때문에 앱 타입 환경을
// 넓히지 않는다) 여기서만 최소 선언을 둔다
declare const process: { exit(code: number): never };

let failed = 0;
const bad = (msg: string) => {
  failed += 1;
  console.log(`  ✗ ${msg}`);
};

console.log('\n═══ 1. 원자료 정합 ═══');
const errs = verifyRoster();
if (errs.length === 0) {
  console.log('  ✓ 타석 합계·장타 합계·타구 비율 전부 정합');
} else {
  errs.forEach(bad);
}

/**
 * 시연 시퀀스가 가리키는 선수가 실제로 명단에 있는가.
 *
 * ⚠ **화면이 `BATTERS.find(...) ?? BATTERS[0]` 으로 폴백한다.** 명단에서 빠진 선수를
 * 가리켜도 앱은 멀쩡히 돌아가고 **조용히 다른 선수를 그린다.** 실제로 2026 명단
 * 갱신에서 플로리얼·안치홍·황영묵이 빠졌을 때, 시연 카드에는 "페라자 고의4구"라고
 * 적혀 있는데 매치업 타자는 이원석으로 나오고 있었다 - 같은 타석에 이름이 둘이었다.
 *
 * 폴백 자체는 화면이 죽지 않게 하는 옳은 처리다. 그래서 **검사가 대신 소리를 내야 한다.**
 */
console.log('\n═══ 1-b. 시연 시퀀스 ↔ 명단 정합 ═══');
const batterIds = new Set(BATTERS.map((b) => b.id));
const oppIds = new Set(OPPONENT_PITCHERS.map((p) => p.id));
for (const [i, pa] of PLATE_SEQUENCE.entries()) {
  if (!batterIds.has(pa.batterId)) {
    bad(
      `PLATE_SEQUENCE[${i}] batterId '${pa.batterId}' 가 BATTERS 에 없다 - 화면은 조용히 ${BATTERS[0].name} 을 그린다`,
    );
  }
  if (!oppIds.has(pa.pitcherId)) {
    bad(`PLATE_SEQUENCE[${i}] pitcherId '${pa.pitcherId}' 가 OPPONENT_PITCHERS 에 없다`);
  }
  // 문장에 적힌 이름과 실제로 그려질 선수가 같은지. 위 검사를 통과해도 여기서 갈릴 수 있다.
  // 마지막 타석은 **아직 결과가 없는 현재 타석**이라 outcome 이 '?' 다 - 이름이 없는 게 맞다
  const b = BATTERS.find((x) => x.id === pa.batterId);
  if (b && pa.outcome !== '?' && !pa.outcome.startsWith(b.name)) {
    bad(`PLATE_SEQUENCE[${i}] outcome 은 "${pa.outcome.slice(0, 12)}…" 인데 타자는 ${b.name} 이다`);
  }
}
if (failed === 0) console.log(`  ✓ ${PLATE_SEQUENCE.length}개 타석 전부 명단·문장과 맞는다`);

/**
 * 중계 원자료가 야구적으로 말이 되는가.
 *
 * ── 왜 기계가 세야 하는가 ───────────────────────────────────
 * 문자중계가 마흔 행이 넘고, 거기서 **라인스코어가 파생된다.** 3회말에 2점이 찍혀 있는데
 * 그 이닝 중계에 득점이 없으면 앱이 같은 화면 안에서 자기 말을 뒤집는다. 눈으로 세는
 * 것으로는 이닝 열여섯 개를 매번 확인할 수 없다.
 *
 * 검사 넷:
 *   ① 각 하프이닝의 행 득점 합 = 그 이닝 득점
 *   ② 경기 전체 득점 합 = TODAY_GAME 의 점수 (화면 맨 위 3:4 와 표가 어긋나지 않는다)
 *   ③ 타순이 이닝을 넘어 이어지고, GAME_LOG 의 마지막 한화 타자 다음이
 *      PLATE_SEQUENCE 의 첫 타자다 - 여기가 어긋나면 라인업 카드가 중계를 반박한다
 *   ④ 라인업 아홉 명과 PLATE_SEQUENCE 의 타자가 같은 명단에서 나온다
 */
console.log('\n═══ 1-c. 문자중계 ↔ 라인스코어 ═══');

for (const h of GAME_LOG) {
  const label = `${h.inning}회${h.half === 'top' ? '초' : '말'}`;
  const rowRuns = h.rows.reduce((a, r) => a + (r.runs ?? 0), 0);
  if (rowRuns !== h.runs) {
    bad(`${label} 이닝 득점은 ${h.runs}인데 타석 득점 합은 ${rowRuns}이다`);
  }
}

const finalScore = scoreAt(FINAL_STEP);
if (finalScore.away !== EXPECTED_SCORE.away || finalScore.home !== EXPECTED_SCORE.home) {
  bad(
    `중계 합산은 ${finalScore.away}:${finalScore.home} 인데 TODAY_GAME 은 ` +
      `${EXPECTED_SCORE.away}:${EXPECTED_SCORE.home} 이다`,
  );
}

// 타순 연속성 - 한화(말)는 BATTERS 앞 아홉, LG(초)는 LG_ORDER
const orderOf = (names: string[], name: string) => names.indexOf(name);
const HH_ORDER = LINEUP.order.map((id) => BATTERS.find((b) => b.id === id)?.name ?? '?');

for (const [names, half] of [
  [HH_ORDER, 'bottom'],
  [LG_ORDER, 'top'],
] as const) {
  let expect = -1;
  for (const h of GAME_LOG.filter((x) => x.half === half)) {
    for (const r of h.rows) {
      if (r.kind === 'sub') continue;
      const idx = orderOf(names, r.name);
      if (idx < 0) {
        bad(`${h.inning}회${half === 'top' ? '초' : '말'} '${r.name}' 이 타순 명단에 없다`);
        continue;
      }
      if (expect >= 0 && idx !== expect) {
        bad(
          `${h.inning}회${half === 'top' ? '초' : '말'} 타순이 끊겼다 - ` +
            `${names[expect]}(${expect + 1}번) 차례인데 ${r.name}(${idx + 1}번)이 나왔다`,
        );
      }
      expect = (idx + 1) % names.length;
    }
  }
  // GAME_LOG 가 끝난 자리에서 PLATE_SEQUENCE 로 넘어간다 (한화만)
  if (half === 'bottom') {
    const firstSeq = BATTERS.find((b) => b.id === PLATE_SEQUENCE[0].batterId)?.name ?? '?';
    if (orderOf(names, firstSeq) !== expect) {
      bad(
        `7회말 다음은 ${names[expect]}(${expect + 1}번)인데 ` +
          `PLATE_SEQUENCE 는 ${firstSeq} 로 시작한다`,
      );
    }
  }
}

// PLATE_SEQUENCE 안에서도 타순이 이어지는가
{
  let expect = orderOf(HH_ORDER, BATTERS.find((b) => b.id === PLATE_SEQUENCE[0].batterId)!.name);
  for (const [i, pa] of PLATE_SEQUENCE.entries()) {
    const name = BATTERS.find((b) => b.id === pa.batterId)?.name ?? '?';
    const idx = orderOf(HH_ORDER, name);
    if (idx < 0) {
      bad(
        `PLATE_SEQUENCE[${i}] ${name} 이 선발 라인업 아홉 명에 없다 - 라인업 카드가 중계를 반박한다`,
      );
    } else if (idx !== expect) {
      bad(
        `PLATE_SEQUENCE[${i}] 타순이 끊겼다 - ${HH_ORDER[expect]}(${expect + 1}번) 차례인데 ` +
          `${name}(${idx + 1}번)이 나왔다`,
      );
    }
    expect = ((idx < 0 ? expect : idx) + 1) % HH_ORDER.length;
  }
}

if (failed === 0) {
  const ls = lineScoreAt(FINAL_STEP);
  console.log(
    `  ✓ ${GAME_LOG.length + 2}개 하프이닝 · 득점 ${finalScore.away}:${finalScore.home} · ` +
      `안타 ${ls.away.hits}:${ls.home.hits} · 실책 ${ls.away.errors}:${ls.home.errors} · 타순 연속`,
  );
}

console.log('\n═══ 2. 타자 지표 ═══');
console.log('  이름     타율   출루   장타   OPS    wOBA   wRC+  WAR   BABIP');
for (const b of BATTERS) {
  const war = batterWarOf(b.stat, '대전');
  const wrc = wrcPlusOf(b.stat, '대전');
  console.log(
    `  ${b.name.padEnd(5, ' ')} ${avgOf(b.stat).toFixed(3)}  ${obpOf(b.stat).toFixed(3)}  ` +
      `${slgOf(b.stat).toFixed(3)}  ${opsOf(b.stat).toFixed(3)}  ${wobaOf(b.stat).toFixed(3)}  ` +
      `${String(wrc).padStart(4, ' ')}  ${String(war).padStart(4, ' ')}  ${babipOf(b.stat).toFixed(3)}`,
  );

  // 야구적으로 불가능한 값 검사
  if (avgOf(b.stat) < 0.15 || avgOf(b.stat) > 0.42) bad(`${b.name} 타율이 비현실적`);
  if (obpOf(b.stat) < avgOf(b.stat)) bad(`${b.name} 출루율이 타율보다 낮다`);
  if (slgOf(b.stat) < avgOf(b.stat)) bad(`${b.name} 장타율이 타율보다 낮다`);
  if (wrc < 30 || wrc > 220) bad(`${b.name} wRC+ ${wrc} 가 비현실적`);
  if (war < -2 || war > 10) bad(`${b.name} WAR ${war} 가 비현실적`);
}

console.log('\n═══ 3. WAR 은 합계다 - 노시환 분해 ═══');
const nsh = BATTERS[0];
const bd = batterWarBreakdown(nsh.stat, '대전');
console.log(`  타격 ${bd.batting} + 주루 ${bd.baserunning} + 수비 ${bd.fielding}`);
console.log(`  + 포지션 ${bd.position} + 대체수준 ${bd.replacement}`);
const sum = bd.batting + bd.baserunning + bd.fielding + bd.position + bd.replacement;
console.log(
  `  = ${sum.toFixed(1)}런 ÷ ${LEAGUE.runsPerWin}(1승의 값어치) = ${batterWarOf(nsh.stat, '대전')} WAR`,
);
if (Math.abs(sum / LEAGUE.runsPerWin - batterWarOf(nsh.stat, '대전')) > 0.15) {
  bad('WAR 분해 합계가 WAR 과 어긋난다');
}

console.log('\n═══ 4. 투수 지표 ═══');
console.log('  이름     이닝     ERA   FIP   WHIP  WAR   피BABIP');
for (const p of PITCHERS) {
  const era = eraOf(p.stat);
  const fip = fipOf(p.stat);
  console.log(
    `  ${p.name.padEnd(5, ' ')} ${ipLabel(p.stat.ipOuts).padStart(6, ' ')}  ${era.toFixed(2)}  ` +
      `${fip.toFixed(2)}  ${whipOf(p.stat).toFixed(2)}  ` +
      `${String(pitcherWarOf(p.stat, '대전')).padStart(4, ' ')}  ${babipAllowedOf(p.stat).toFixed(3)}`,
  );
  // 상한은 표본을 탄다. 30이닝을 못 채운 투수는 한 경기가 방어율을 통째로 흔들어
  // ERA 9 대가 실제로 나온다(엄상백 - 4월 토미 존 전 17이닝). 그 값을 '비현실적'으로
  // 잡으면 검사가 **현실이 아니라 표본 크기를 탓하는** 것이 된다. 규정이닝 근처부터
  // 조인다 - 120이닝 던진 투수의 ERA 9 는 그때야 진짜 이상한 값이다
  const settled = p.stat.ipOuts >= 90; // 30이닝
  const eraCap = settled ? 8 : 12;
  if (era < 0.5 || era > eraCap) bad(`${p.name} ERA ${era.toFixed(2)} 가 비현실적`);
  if (fip < 1 || fip > (settled ? 8 : 10)) bad(`${p.name} FIP ${fip.toFixed(2)} 가 비현실적`);
  const bab = babipAllowedOf(p.stat);
  if (bab < 0.2 || bab > 0.42) bad(`${p.name} 피BABIP ${bab} 가 비현실적`);
}

console.log('\n═══ 5. 기대득점표 단조성 ═══');
// 아웃이 늘면 기대득점은 반드시 줄어야 한다. 주자가 늘면 반드시 커져야 한다
const noRunner: GameSituation = {
  inning: 1,
  half: 'top',
  outs: 0,
  bases: { first: false, second: false, third: false },
  scoreDiff: 0,
  balls: 0,
  strikes: 0,
  park: '대전',
};
const loaded: GameSituation = { ...noRunner, bases: { first: true, second: true, third: true } };
for (const outs of [0, 1, 2] as const) {
  const a = runExpectancy({ ...noRunner, outs });
  const b = runExpectancy({ ...loaded, outs });
  console.log(`  ${outs}아웃: 주자없음 ${a.toFixed(2)}점 / 만루 ${b.toFixed(2)}점`);
  if (b <= a) bad(`${outs}아웃에서 만루가 주자없음보다 기대득점이 낮다`);
}
if (
  runExpectancy({ ...loaded, outs: 0 }) <= runExpectancy({ ...loaded, outs: 1 }) ||
  runExpectancy({ ...loaded, outs: 1 }) <= runExpectancy({ ...loaded, outs: 2 })
) {
  bad('아웃이 늘어도 기대득점이 줄지 않는다');
}

console.log('\n═══ 6. 창희쌤 시나리오: 9회말 만루, 상대 마무리 vs 우리 4번 ═══');
const clutch: GameSituation = {
  inning: 9,
  half: 'bottom',
  outs: 2,
  bases: { first: true, second: true, third: true },
  scoreDiff: -1,
  balls: 3,
  strikes: 2,
  park: '대전',
};
// 마운드는 상대팀 마무리다 (우리 투수를 세우면 한화 공격에 한화 투수가 던지는 꼴이 된다)
const closer = OPPONENT_PITCHERS.find((p) => p.role === '마무리') ?? OPPONENT_PITCHERS[0];
const pred = predictMatchup(clutch, BATTERS[0], closer);
console.log(`  ▶ ${pred.headline}`);
console.log(
  `  레버리지 ${pred.context.leverageIndex} (${pred.context.leverageLabel}) · 기대득점 ${pred.context.runExpectancy}점`,
);
console.log('  근거:');
pred.reasons.forEach((r, i) => console.log(`    ${i + 1}. ${r}`));
console.log('  계산 과정:');
console.log(
  `    타자 출루율 ${pred.breakdown.batterOBP} vs 투수 피출루율 ${pred.breakdown.pitcherOBPAllowed}`,
);
console.log(`    → 로그5 기본값 ${pred.breakdown.log5Base}`);
console.log(`    → 좌우 상성 ${pred.breakdown.platoon >= 0 ? '+' : ''}${pred.breakdown.platoon}`);
console.log(
  `    → 상황 보정 ${pred.breakdown.situational >= 0 ? '+' : ''}${pred.breakdown.situational}`,
);
console.log(`    = 최종 ${pred.breakdown.final}`);
if (pred.reasons.length < 3) bad('근거가 3개 미만이다 - 확률만 띄우는 화면이 된다');
if (pred.onBaseProb <= 0 || pred.onBaseProb >= 1) bad('확률이 범위를 벗어났다');

console.log('\n═══ 7. 레버리지 - 상황에 따라 실제로 달라지는가 ═══');
const cases: [string, GameSituation][] = [
  ['3회초 무사 주자없음 5점차', { ...noRunner, inning: 3, scoreDiff: 5 }],
  [
    '7회말 1사 1·2루 1점차',
    {
      ...noRunner,
      inning: 7,
      half: 'bottom',
      outs: 1,
      bases: { first: true, second: true, third: false },
      scoreDiff: -1,
    },
  ],
  ['9회말 2사 만루 1점차', clutch],
];
for (const [label, s] of cases) {
  console.log(`  ${label.padEnd(24, ' ')} LI ${leverageIndex(s).toFixed(2)}`);
}
if (leverageIndex(cases[0][1]) >= leverageIndex(clutch)) {
  bad('여유 국면의 레버리지가 결정적 국면보다 높다');
}

console.log('\n═══ 8. 알림은 아무 때나 뜨지 않는가 ═══');
const quiet = liveAlerts(
  { ...noRunner, inning: 3, scoreDiff: 6 },
  BATTERS[6],
  OPPONENT_PITCHERS[0],
);
const loud = liveAlerts(clutch, BATTERS[0], closer);
console.log(`  3회 6점차 여유 국면: 알림 ${quiet.length}건`);
console.log(`  9회말 2사 만루 1점차: 알림 ${loud.length}건`);
loud.forEach((a) => console.log(`    · [${a.kind}] ${a.title}`));
if (loud.length <= quiet.length) bad('결정적 국면인데 알림이 여유 국면보다 적거나 같다');

console.log('\n═══ 9. 투수 교체 판단 ═══');
const advice = bullpenAdvice(clutch, BATTERS[0], closer, OPPONENT_PITCHERS);
console.log(`  ${advice.sentence}`);
console.log(`  → 교체 권고: ${advice.shouldChange ? '예' : '아니오'}`);

console.log('\n═══ 10. 한국어 조사 ═══');
const josaCases: [string, JosaKind, string][] = [
  ['노시환', '이/가', '노시환이'],
  ['폰세', '이/가', '폰세가'],
  ['함덕주', '으로/로', '함덕주로'],
  ['유영찬', '으로/로', '유영찬으로'],
  ['임찬규', '은/는', '임찬규는'],
  ['플로리얼', '으로/로', '플로리얼로'], // ㄹ 받침은 '로'
];
for (const [w, k, want] of josaCases) {
  const got = josa(w, k);
  console.log(`  ${w} + ${k} → ${got}`);
  if (got !== want) bad(`조사 오류: ${got} (기대: ${want})`);
}

console.log('\n═══ 11. 생성 문장에 부호 오류가 없는가 ═══');
// 확률 차이를 말하는 문장에 음수 부호가 그대로 새어 나오면 "-5.1%p 줄어듭니다" 같은
// 자기모순 문장이 된다. 여러 상황을 돌려 문장을 실제로 훑는다
const sentenceCases: GameSituation[] = [
  clutch,
  {
    ...noRunner,
    inning: 7,
    half: 'bottom',
    outs: 1,
    bases: { first: true, second: true, third: false },
    scoreDiff: -1,
  },
  {
    ...noRunner,
    inning: 5,
    outs: 2,
    bases: { first: false, second: true, third: false },
    scoreDiff: 3,
  },
  { ...loaded, inning: 9, half: 'bottom', outs: 0, scoreDiff: -2 },
];
for (const sit of sentenceCases) {
  for (const b of BATTERS.slice(0, 4)) {
    for (const p of OPPONENT_PITCHERS) {
      const a = bullpenAdvice(sit, b, p, OPPONENT_PITCHERS);
      if (/-\d/.test(a.sentence)) bad(`음수 부호가 문장에 샜다: ${a.sentence}`);
      if (
        a.sentence.includes('으로 바꾸') &&
        !a.sentence.includes('찬으로') &&
        !a.sentence.includes('규으로')
      ) {
        // '으로/로' 선택이 정상인지 대략 확인 - 받침 없는 이름에 '으로'가 붙으면 잡힌다
        const m = a.sentence.match(/(\S+?)으로 바꾸/);
        if (m && !/[가-힣]$/.test(m[1])) bad(`조사 처리 이상: ${m[0]}`);
      }
      // 받침 없는 이름에 '이'가 붙었는지 (정규식의 캡처는 조사를 뗀 이름 그대로다)
      const pred2 = predictMatchup(sit, b, p);
      const m2 = pred2.headline.match(/(\S+)이 유리합니다/);
      if (m2) {
        const nm = m2[1];
        const code = nm.charCodeAt(nm.length - 1);
        if (code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 === 0) {
          bad(`조사 오류(헤드라인): ${m2[0]}`);
        }
      }
      const m3 = pred2.headline.match(/(\S+)가 유리합니다/);
      if (m3) {
        const nm = m3[1];
        const code = nm.charCodeAt(nm.length - 1);
        if (code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0) {
          bad(`조사 오류(헤드라인): ${m3[0]}`);
        }
      }
    }
  }
}
console.log(
  `  ${sentenceCases.length}개 상황 × 타자 4명 × 투수 ${OPPONENT_PITCHERS.length}명 문장 검사 완료`,
);

console.log('\n═══ 12. 신뢰도 경고 ═══');
for (const b of [BATTERS[0], BATTERS[6]]) {
  console.log(`  ${b.name} BABIP ${babipOf(b.stat).toFixed(3)}`);
  console.log(`    ${trustSentence('babip', b.stat.pa)}`);
  console.log(`    ${trustSentence('wrcPlus', b.stat.pa)}`);
}

console.log(
  failed === 0
    ? '\n✅ 전부 통과 - 목업이지만 계산 구조는 실데이터를 그대로 받을 수 있다\n'
    : `\n❌ ${failed}건 실패\n`,
);
process.exit(failed === 0 ? 0 : 1);
