// AI 선수 분석 - 스탯 라인 하나에서 읽을 문장을 짓는다
//
// ── 무엇이 'AI' 인가 (읽는 사람이 오해하지 않게) ─────────────
// **여기에는 모델 호출이 없다.** 아래는 전부 규칙이다 - 값을 리그 기준과 견주고,
// 세 축(장타·선구·컨택) 중 무엇이 이 성적을 만들었는지 고르고, 표본과 BABIP 로
// 무엇을 조심할지 붙인다. 실서비스에서 이 자리에 모델을 넣는다면 교체 지점은
// analyzeBatter() 하나이고, 반환 형태(lines: string[])만 지키면 화면은 그대로 간다.
//
// ── 문장을 셋으로 나눈 이유 ──────────────────────────────────
//   ① 어떤 타자인가   - 종합 수치(wRC+·WAR)와 한 줄 성격
//   ② 무엇이 만들었나 - 세 축 중 강점과 약점. 같은 wRC+ 110 도 경로가 다르다
//   ③ 무엇을 조심하나 - BABIP 회귀와 표본. 이 화면의 차별점을 문장으로도 되풀이한다
import { josa } from './korean';
import { Batter, Pitcher } from './roster';
import {
  LEAGUE,
  avgOf,
  babipAllowedOf,
  babipOf,
  batterWarOf,
  bbRateOf,
  eraOf,
  fipOf,
  ipLabel,
  isoOf,
  kRateOf,
  pitcherWarOf,
  soRateOf,
  walkRateOf,
  wrcPlusOf,
} from './sabermetrics';
import { GLOSSARY } from './statGlossary';

/**
 * 견줄 리그 기준은 **게이지가 쓰는 값을 그대로 가져온다.**
 *
 * 여기에 숫자를 따로 적어 두면 같은 카드 안에서 게이지는 '평균 0.31', 문장은
 * '리그 평균 0.315' 를 말하게 된다. 화면이 같은 자리에서 자기 말을 뒤집는 지점이다.
 */
const mid = (key: string, fallback: number) => GLOSSARY[key]?.scale?.mid ?? fallback;

const REF = {
  iso: mid('iso', 0.14),
  walkRate: mid('walkRate', 0.085),
  soRate: mid('soRate', 0.19),
  babip: mid('babip', 0.31),
  // 투수
  kRate: mid('kRate', 0.2),
  bbRate: mid('bbRate', 0.085),
  babipAllowed: mid('babipAllowed', 0.31),
  // 피홈런율은 게이지가 없는 값이라 여기서만 기준을 둔다. KBO 는 9이닝당 홈런 1개
  // 언저리이고 9이닝에 상대타자가 38명쯤이라 2.6% 로 잡는다
  hrRate: 0.026,
} as const;

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const dec3 = (v: number) => v.toFixed(3);

export interface PlayerAnalysis {
  /** 한 줄씩 문단이 된다. `**강조**` 표기를 쓰므로 화면은 RichText 로 그린다 */
  lines: string[];
}

/**
 * 세 축 중 어느 쪽으로 얼마나 치우쳤나.
 *
 * 절대값을 그냥 견주면 단위가 달라 비교가 안 된다(ISO 는 .06 만 벌어져도 큰 차이,
 * 삼진율은 .06 이면 흔한 편차). 그래서 각 축의 '한 눈금'을 따로 두고 그 배수로 잰다.
 */
function axes(b: Batter['stat']) {
  const iso = isoOf(b);
  const bb = walkRateOf(b);
  const so = soRateOf(b);
  return [
    { label: '장타', text: `ISO ${dec3(iso)}`, z: (iso - REF.iso) / 0.05 },
    { label: '선구', text: `볼넷율 ${pct(bb)}`, z: (bb - REF.walkRate) / 0.03 },
    // 삼진은 적을수록 좋으므로 부호를 뒤집는다
    { label: '컨택', text: `삼진율 ${pct(so)}`, z: (REF.soRate - so) / 0.05 },
  ];
}

/**
 * ⚠ 숫자 뒤에는 은/는·이/가·으로 를 붙이지 않는다.
 *
 * 한국어 조사는 앞 글자의 받침을 따르는데, 숫자는 **읽는 소리**로 받침이 갈린다 -
 * WAR 2.4 는 "이 점 사"라 받침이 없고 3.0 은 "삼 점 영"이라 받침이 있다. korean.ts 의
 * josa() 는 한글 음절만 보므로 숫자에는 쓸 수 없다. 그래서 값 뒤는 `-` 나 `·` 로 끊고,
 * 조사가 필요한 자리에는 한글 낱말(장타·컨택 같은)만 놓아 josa() 로 붙인다.
 */
export function analyzeBatter(batter: Batter, park: string): PlayerAnalysis {
  const b = batter.stat;
  const wrc = wrcPlusOf(b, park);
  const war = batterWarOf(b, park);
  const babip = babipOf(b);

  const lines: string[] = [];

  // ── ① 어떤 타자인가 ────────────────────────────────────────
  // 구단이 적어 둔 한 줄(스탯이 말하지 못하는 맥락)을 먼저 두고, 종합 수치를 붙인다.
  // 순서를 뒤집으면 숫자가 사람보다 앞에 서서 선수 소개가 아니라 성적표가 된다
  const tier =
    wrc >= 150
      ? '리그 최상위 타격'
      : wrc >= 130
        ? '팀 중심타선 몫'
        : wrc >= 110
          ? '평균 이상의 생산력'
          : wrc >= 90
            ? '평균권'
            : '주전으로 쓰기엔 아쉬운 생산력';
  const warWord =
    war >= 5
      ? '올스타급'
      : war >= 3
        ? '확실한 주전급'
        : war >= 2
          ? '주전급'
          : war >= 1
            ? '준주전급'
            : '대체 선수와 큰 차이가 없는 수준';
  const diff = wrc - 100;
  const vsLeague =
    diff === 0
      ? '리그 평균 타자와 꼭 같은 만큼 득점을 만들었습니다'
      : diff > 0
        ? `리그 평균 타자보다 **${diff}% 더** 득점을 만들었습니다`
        : `리그 평균 타자보다 **${-diff}% 적게** 득점을 만들었습니다`;
  lines.push(
    `${batter.note}. wRC+ **${wrc}** - ${vsLeague}. ${tier}입니다. ` +
      `수비·주루까지 더한 WAR **${war.toFixed(1)}** - ${warWord}입니다.`,
  );

  // ── ② 무엇이 이 성적을 만들었나 ────────────────────────────
  const sorted = axes(b)
    .slice()
    .sort((x, y) => y.z - x.z);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const grade = (z: number) =>
    z >= 1.2
      ? '리그 상위'
      : z >= 0.4
        ? '평균 이상'
        : z >= -0.4
          ? '평균권'
          : z >= -1.2
            ? '평균 이하'
            : '리그 하위';
  // 셋이 서로 가까우면 '강점과 약점'이라는 틀 자체가 거짓말이 된다
  const balanced = best.z - worst.z < 0.8;
  // 가장 약한 축조차 평균 위면 '반대로 ~은 약합니다'가 성립하지 않는다.
  // 문장 틀을 그대로 밀어붙이면 "반대로 컨택은 평균 이상입니다" 같은 자가당착이 나온다
  const noWeakness = worst.z >= 0.4;
  // ⚠ 고르다는 것이 언제나 칭찬은 아니다. 셋이 나란히 평균 아래인 선수에게
  //   "한 축이 흔들려도 무너지지 않는 유형"이라고 하면 칭찬으로 읽힌다
  const evenlyLow = balanced && best.z < -0.4;
  lines.push(
    evenlyLow
      ? `장타·선구·컨택 세 축이 고르게 처져 있습니다 - ${sorted.map((a) => a.text).join(' · ')}. ` +
          `한 군데가 특별히 나쁜 것이 아니라 셋이 나란히 리그 평균 아래입니다.`
      : balanced
        ? `장타·선구·컨택 세 축이 고르게 붙어 있습니다 - ${sorted.map((a) => a.text).join(' · ')}. ` +
          `어느 하나에 기대는 성적이 아니라서 한 축이 식어도 크게 무너지지 않는 유형입니다.`
        : noWeakness
          ? `이 성적을 떠받치는 것은 **${best.label}**입니다 - ${best.text}, ${grade(best.z)}. ` +
            `가장 처지는 ${josa(worst.label, '이/가')} ${worst.text}로 ${grade(worst.z)}이니 ` +
            `뚜렷한 약점은 없는 유형입니다.`
          : `이 성적을 떠받치는 것은 **${best.label}**입니다 - ${best.text}, ${grade(best.z)}. ` +
            `반대로 ${josa(worst.label, '은/는')} ${worst.text}, ${grade(worst.z)}입니다. ` +
            `${josa(best.label, '이/가')} 식으면 성적이 같이 내려앉는 구조입니다.`,
  );

  // ── ③ 무엇을 조심하나 ──────────────────────────────────────
  // BABIP 는 이 앱이 가장 공들여 설명하는 지표다. 분석 문장에서도 같은 말을 한다.
  //
  // ⚠ 여기에 '표본 820타석에 못 미친다'는 경고를 달았다가 뺐다. BABIP 안정화 표본
  //   820타석은 **한 시즌에 도달할 수 없는 수**다(규정타석이 500 남짓). 그래서 그 문장은
  //   어느 선수든, 어느 시즌이든 예외 없이 붙었고 - 늘 붙는 줄은 정보가 아니라 서식이다.
  //   BABIP 가 한 시즌 표본으로 안정되지 않는다는 사실 자체는 지표의 성질이라
  //   statGlossary 의 trap(타일을 누르면 열린다)과 신뢰도 카드가 이미 맡고 있다.
  const gap = babip - REF.babip;
  const regress =
    gap >= 0.03
      ? `BABIP **${dec3(babip)}** - 리그 평균 ${REF.babip}보다 한참 높습니다. ` +
        `지금 타율 ${dec3(avgOf(b))}에는 타구가 야수 사이로 떨어져 준 몫이 섞여 있어, ` +
        `남은 경기에서 내려올 여지가 있습니다.`
      : gap <= -0.03
        ? `BABIP **${dec3(babip)}** - 리그 평균 ${REF.babip}보다 낮습니다. ` +
          `타율 ${dec3(avgOf(b))} 자체가 실력보다 눌려 있다는 뜻이라, 타구질이 그대로면 ` +
          `앞으로 오를 여지가 있습니다.`
        : `BABIP **${dec3(babip)}** - 리그 평균 ${REF.babip} 언저리입니다. ` +
          `타율 ${dec3(avgOf(b))}에 운이 크게 섞여 있지는 않다는 뜻입니다.`;
  lines.push(regress);

  // ── ④ 타구 유형이 특이하면 한 줄 더 ────────────────────────
  // 모든 선수에게 붙이지 않는다. 늘 붙는 줄은 정보가 아니라 서식이 된다
  const extra: string[] = [];
  if (b.fbRate >= 0.42 && b.gdp >= 12) {
    extra.push(
      `뜬공 비중 ${pct(b.fbRate)}에 병살 ${b.gdp}개 - 당겨친 타구가 많아 홈런과 병살이 ` +
        `같이 늘어나는 유형입니다`,
    );
  } else if (b.gbRate >= 0.5) {
    extra.push(`땅볼 비중이 ${pct(b.gbRate)}까지 올라가, 장타보다 출루로 값을 만드는 타구질입니다`);
  }
  if (b.sb >= 15) {
    const rate = b.sb + b.cs > 0 ? Math.round((b.sb / (b.sb + b.cs)) * 100) : 0;
    extra.push(`도루 ${b.sb}개(성공률 ${rate}%) - 타석 밖에서도 득점을 만듭니다`);
  }
  if (extra.length > 0) lines.push(`${extra.join('. ')}.`);

  return { lines };
}

// ─────────────────────────────────────────────────────────────
// 투수
// ─────────────────────────────────────────────────────────────

/**
 * 투수의 세 축.
 *
 * 타자의 장타·선구·컨택에 대응한다. **투수가 야수 없이 혼자 끝낼 수 있는 결과**만
 * 골랐다 - 삼진(구위), 볼넷(제구), 피홈런(장타 억제). FIP 가 이 셋으로만 계산되는
 * 이유와 같다. 피안타·잔루 같은 것은 뒤에 선 야수와 뒤섞여 있어 '이 투수의 축'이라고
 * 말할 수 없다.
 */
function pitcherAxes(p: Pitcher['stat']) {
  const k = kRateOf(p);
  const bb = bbRateOf(p);
  const hr = p.bf > 0 ? p.hr / p.bf : 0;
  return [
    { label: '구위', text: `삼진율 ${pct(k)}`, z: (k - REF.kRate) / 0.05 },
    // 볼넷·홈런은 적을수록 좋으므로 부호를 뒤집는다
    { label: '제구', text: `볼넷율 ${pct(bb)}`, z: (REF.bbRate - bb) / 0.03 },
    { label: '장타 억제', text: `피홈런율 ${pct(hr)}`, z: (REF.hrRate - hr) / 0.012 },
  ];
}

/**
 * ⚠ 타자 쪽과 같은 규칙 - 숫자 뒤에는 조사를 두지 않는다.
 *
 * 표본 경고는 **규정선 대비**로만 붙인다. '안정화 표본에 못 미친다'로 쓰면 불펜은
 * 전원이 예외 없이 걸려서, 늘 붙는 줄이 되어 아무도 읽지 않는다(타자 쪽에서 한 번
 * 겪고 걷어낸 문제다 - readableAt 주석 참고).
 */
export function analyzePitcher(pitcher: Pitcher, park: string, qualBF: number): PlayerAnalysis {
  const p = pitcher.stat;
  const era = eraOf(p);
  const fip = fipOf(p);
  const war = pitcherWarOf(p, park);
  const bab = babipAllowedOf(p);

  const lines: string[] = [];

  // ── ① 어떤 투수인가 ────────────────────────────────────────
  const vsLeague =
    era <= LEAGUE.ERA - 1.2
      ? `리그 평균 ${LEAGUE.ERA} 보다 한참 좋습니다`
      : era <= LEAGUE.ERA - 0.3
        ? `리그 평균 ${LEAGUE.ERA} 보다 좋습니다`
        : era <= LEAGUE.ERA + 0.3
          ? `리그 평균 ${LEAGUE.ERA} 언저리입니다`
          : `리그 평균 ${LEAGUE.ERA} 보다 나쁩니다`;
  const warWord =
    war >= 5
      ? '에이스급'
      : war >= 3
        ? '로테이션의 축'
        : war >= 1.5
          ? '1군 전력의 한 축'
          : war >= 0.5
            ? '보직을 맡을 만한'
            : '대체 선수와 큰 차이가 없는';
  // 불펜에게 '로테이션의 축'은 말이 안 된다. 보직에 맞는 낱말로 갈아 끼운다
  const roleWord =
    pitcher.role === '선발'
      ? warWord
      : war >= 2
        ? '필승조 핵심'
        : war >= 1
          ? '믿고 올릴 만한'
          : war >= 0.3
            ? '보직을 맡을 만한'
            : '대체 선수와 큰 차이가 없는';
  lines.push(
    `${pitcher.note}. ERA **${era.toFixed(2)}** - ${vsLeague}. ` +
      `${ipLabel(p.ipOuts)}이닝을 던져 WAR **${war.toFixed(1)}** - ${roleWord} 수준입니다.`,
  );

  // ── ② 무엇이 이 성적을 만들었나 ────────────────────────────
  const sorted = pitcherAxes(p)
    .slice()
    .sort((x, y) => y.z - x.z);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const grade = (z: number) =>
    z >= 1.2
      ? '리그 상위'
      : z >= 0.4
        ? '평균 이상'
        : z >= -0.4
          ? '평균권'
          : z >= -1.2
            ? '평균 이하'
            : '리그 하위';
  const balanced = best.z - worst.z < 0.8;
  const noWeakness = worst.z >= 0.4;
  // ⚠ 고르다는 것이 언제나 칭찬은 아니다. 셋이 나란히 평균 아래인 선수에게
  //   "한 축이 흔들려도 무너지지 않는 유형"이라고 하면 칭찬으로 읽힌다
  const evenlyLow = balanced && best.z < -0.4;
  lines.push(
    evenlyLow
      ? `구위·제구·장타 억제 세 축이 고르게 처져 있습니다 - ${sorted.map((a) => a.text).join(' · ')}. ` +
          `한 군데가 특별히 나쁜 것이 아니라 셋이 나란히 리그 평균 아래입니다.`
      : balanced
        ? `구위·제구·장타 억제 세 축이 고르게 붙어 있습니다 - ${sorted.map((a) => a.text).join(' · ')}. ` +
          `어느 하나로 버티는 투구가 아니라서 한 축이 흔들려도 크게 무너지지 않는 유형입니다.`
        : noWeakness
          ? `이 성적을 떠받치는 것은 **${best.label}**입니다 - ${best.text}, ${grade(best.z)}. ` +
            `가장 처지는 ${josa(worst.label, '이/가')} ${worst.text}로 ${grade(worst.z)}이니 ` +
            `뚜렷한 약점은 없는 유형입니다.`
          : `이 성적을 떠받치는 것은 **${best.label}**입니다 - ${best.text}, ${grade(best.z)}. ` +
            `반대로 ${josa(worst.label, '은/는')} ${worst.text}, ${grade(worst.z)}입니다. ` +
            `${josa(best.label, '이/가')} 무너지는 날 성적이 크게 흔들리는 구조입니다.`,
  );

  // ── ③ 무엇을 조심하나 - ERA 와 FIP 의 거리 ─────────────────
  // 투수 해설에서 가장 많은 것을 말해 주는 한 줄이다. ERA 는 뒤에 선 야수와 운을
  // 그대로 안고 있고 FIP 는 그걸 걷어낸 값이라, 둘의 거리가 곧 '빌린 몫'의 크기다
  const gap = era - fip;
  const gapLine =
    gap >= 0.4
      ? `FIP **${fip.toFixed(2)}** - ERA 보다 ${gap.toFixed(2)} 낮습니다. 삼진·볼넷·피홈런만 ` +
        `보면 실점보다 잘 던졌다는 뜻이라, 수비나 타구 운이 따르지 않은 몫이 섞여 있습니다.`
      : gap <= -0.4
        ? `FIP **${fip.toFixed(2)}** - ERA 보다 ${(-gap).toFixed(2)} 높습니다. 실점이 적었지만 ` +
          `그 이유가 투수 본인의 결과만으로는 설명되지 않아, 지금 성적이 그대로 이어지기는 어렵습니다.`
        : `FIP **${fip.toFixed(2)}** - ERA 와 거의 같습니다. 지금까지의 실점이 야수의 도움이나 ` +
          `운을 크게 빌리지 않은, 본인 투구 그대로였다는 뜻입니다.`;
  const babGap = bab - REF.babipAllowed;
  const babLine =
    babGap >= 0.03
      ? ` 피BABIP **${bab.toFixed(3)}** 도 리그 평균 ${REF.babipAllowed} 보다 높아, 맞은 타구가 ` +
        `안타로 이어진 몫이 앞으로 줄어들 여지가 있습니다.`
      : babGap <= -0.03
        ? ` 다만 피BABIP **${bab.toFixed(3)}** - 리그 평균 ${REF.babipAllowed} 보다 낮습니다. ` +
          `투수가 오래 붙들 수 있는 값이 아니라 평균 쪽으로 돌아올 가능성을 함께 봐야 합니다.`
        : '';
  lines.push(gapLine + babLine);

  // ── ④ 필요할 때만 한 줄 더 ─────────────────────────────────
  // 늘 붙는 줄은 서식이 된다. 표본은 **규정선 대비**로만 말한다
  const extra: string[] = [];
  // 구단 메모가 이미 "표본이 작다"고 말한 선수가 있다(부상·2군행). 같은 말을 두 문단
  // 뒤에서 되풀이하면 분석이 아니라 서식으로 읽힌다
  if (p.bf < qualBF * 0.5 && !pitcher.note.includes('표본')) {
    extra.push(
      `상대한 타자가 ${p.bf}명으로 규정 ${qualBF}타자의 절반에 못 미칩니다 - ` +
        `ERA 와 FIP 를 결론처럼 읽기에는 이른 표본입니다`,
    );
  }
  if (p.gbRate >= 0.5) {
    extra.push(
      `땅볼 비중이 ${pct(p.gbRate)}까지 올라가, 주자를 두고도 병살로 끊을 수 있는 유형입니다`,
    );
  } else if (p.fbRate >= 0.42) {
    extra.push(`뜬공 비중 ${pct(p.fbRate)} - 주자가 쌓이면 한 방에 크게 내주는 쪽에 가깝습니다`);
  }
  if (p.sv >= 10) extra.push(`세이브 ${p.sv}개로 뒷문을 맡고 있습니다`);
  else if (p.hld >= 10) extra.push(`홀드 ${p.hld}개로 중간을 이어 왔습니다`);
  if (extra.length > 0) lines.push(`${extra.join('. ')}.`);

  return { lines };
}
