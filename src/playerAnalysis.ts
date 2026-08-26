// AI 선수 분석 - 스탯 라인 하나에서 읽을 문장을 짓는다
//
// ── 무엇이 'AI' 인가 (읽는 사람이 오해하지 않게) ─────────────
// **여기에는 모델 호출이 없다.** 아래는 전부 규칙이다 - 값을 리그 기준과 견주고,
// 세 축(장타·선구·컨택) 중 무엇이 이 성적을 만들었는지 고르고, 표본과 BABIP 로
// 무엇을 조심할지 붙인다. 실서비스에서 이 자리에 모델을 넣는다면 교체 지점은
// analyzeBatter() 하나이고, 반환 형태(lines: string[])만 지키면 화면은 그대로 간다.
//
// 화면에는 'AI 선수 분석'으로 뜨되 그 옆에 생성 방식을 한 줄로 밝힌다. 자동 생성된
// 문장을 사람이 쓴 스카우팅 리포트처럼 내놓으면, 틀렸을 때 사용자가 그것을 틀렸다고
// 판단할 근거를 못 받는다 - 이 화면이 신뢰도 점을 찍는 이유와 같다.
//
// ── 문장을 셋으로 나눈 이유 ──────────────────────────────────
//   ① 어떤 타자인가   - 종합 수치(wRC+·WAR)와 한 줄 성격
//   ② 무엇이 만들었나 - 세 축 중 강점과 약점. 같은 wRC+ 110 도 경로가 다르다
//   ③ 무엇을 조심하나 - BABIP 회귀와 표본. 이 화면의 차별점을 문장으로도 되풀이한다
import { josa } from './korean';
import { Batter } from './roster';
import {
  avgOf,
  babipOf,
  batterWarOf,
  isoOf,
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
} as const;

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const dec3 = (v: number) => v.toFixed(3);

export interface PlayerAnalysis {
  /** 한 줄씩 문단이 된다. `**강조**` 표기를 쓰므로 화면은 RichText 로 그린다 */
  lines: string[];
  /** 이 분석이 어떻게 나왔는지 - 문장 옆에 그대로 붙는다 */
  source: string;
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
  lines.push(
    balanced
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
    extra.push(
      `땅볼 비중이 ${pct(b.gbRate)}까지 올라가, 장타보다 출루로 값을 만드는 타구질입니다`,
    );
  }
  if (b.sb >= 15) {
    const rate = b.sb + b.cs > 0 ? Math.round((b.sb / (b.sb + b.cs)) * 100) : 0;
    extra.push(`도루 ${b.sb}개(성공률 ${rate}%) - 타석 밖에서도 득점을 만듭니다`);
  }
  if (extra.length > 0) lines.push(`${extra.join('. ')}.`);

  return { lines, source: `${b.pa}타석 기록에서 자동 생성 · 시연용` };
}
