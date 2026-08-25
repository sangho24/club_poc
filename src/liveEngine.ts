// 실시간 상황별 승부 예측 엔진
//
// ── 1차 리뷰 3번(최우선) ─────────────────────────────────────
// "만루상황에서 가장 강한 A란 투수와 더 강한 B란 타자가 맞붙는다면, 과거의 통계 데이터를
//  어떤식으로 가공해서 '지금 이 승부는 B란 타자가 더 유리한 확률이 xx%이며 그 이유는
//  ~~~ 와 같다' 는 식의 insight 제공"
//
// ── 설계 판단 세 가지 ────────────────────────────────────────
//
// **① 확률을 언어모델이 만들지 않는다.** 이 파일의 계산은 전부 결정적이다. 같은 상황이면
// 언제나 같은 숫자가 나온다. 언어모델은 그 숫자를 **문장으로 옮기는 자리**에만 쓴다
// (지금은 규칙 기반 문장 생성으로 대체, 실서비스에서는 이 출력을 프롬프트에 넣는다).
// 야구 중계 옆에서 확률이 매번 달라지면 그건 인사이트가 아니라 노이즈다.
//
// **② 근거를 반드시 같이 낸다.** reasons 배열이 비면 화면에 확률을 띄우지 않는다는 것이
// 이 엔진의 계약이다. "타자가 62% 유리"만 있는 화면은 점집이고, "62% - 이 투수의 슬라이더
// 구사율이 28%인데 이 타자의 슬라이더 대응이 리그 하위권이라 원래는 투수 쪽인데,
// 만루라 투수가 변화구를 던지기 어렵다"까지 있어야 제품이다.
//
// **③ 중계와 경쟁하지 않는다.** KBO 공식 앱 PRD 의 P6 원칙은 "경기 중에는 중계에 시청이
// 넘어가므로 앱은 경기 전(예습)을 잡는다"였다. 구단 앱에서는 이 원칙을 뒤집는다.
// 중계를 **끄게** 만드는 것이 아니라 중계를 **보면서 같이 켜는 세컨드 스크린**이 되면
// 시간대가 겹쳐도 충돌하지 않는다. 중계 화면은 지금 무슨 일이 일어났는지를 보여주고,
// 이 앱은 지금 무슨 일이 일어날 확률이 얼마인지를 보여준다.
import { josa } from './korean';
import { Batter, Pitcher } from './roster';
import {
  LEAGUE,
  PARK_FACTORS,
  babipAllowedOf,
  babipOf,
  bbRateOf,
  fipOf,
  ipOf,
  kRateOf,
  obpOf,
  wobaOf,
} from './sabermetrics';

// ─────────────────────────────────────────────────────────────
// 1. 경기 상황
// ─────────────────────────────────────────────────────────────

/** 주자 상황 - 1루·2루·3루 점유 여부 */
export interface Bases {
  first: boolean;
  second: boolean;
  third: boolean;
}

export interface GameSituation {
  inning: number; // 1~12
  half: 'top' | 'bottom'; // 초 / 말
  outs: 0 | 1 | 2;
  bases: Bases;
  /** 우리 팀(한화) 기준 점수차. 양수면 이기고 있다 */
  scoreDiff: number;
  balls: 0 | 1 | 2 | 3;
  strikes: 0 | 1 | 2;
  park: string;
}

/** 주자 상황을 24가지 base-out 상태 키로 */
export function basesKey(b: Bases): string {
  return `${b.first ? 1 : 0}${b.second ? 1 : 0}${b.third ? 1 : 0}`;
}

export function basesLabel(b: Bases): string {
  const { first, second, third } = b;
  if (first && second && third) return '만루';
  if (first && second) return '1·2루';
  if (first && third) return '1·3루';
  if (second && third) return '2·3루';
  if (first) return '1루';
  if (second) return '2루';
  if (third) return '3루';
  return '주자 없음';
}

// ─────────────────────────────────────────────────────────────
// 2. 기대득점표 (RE24)
// ─────────────────────────────────────────────────────────────

/**
 * base-out 상태별 기대득점 - 그 이닝에 앞으로 몇 점이 날 것으로 기대되는가.
 *
 * 이 표가 "만루가 왜 특별한가"에 대한 수치적 답이다. 무사 만루(2.42점)와 2사 만루(0.81점)는
 * 같은 만루지만 기대득점이 3배 차이가 난다. **상황을 말로 하지 않고 숫자로 잡는 출발점**이다.
 *
 * ⚠ 시연용 샘플값이다. KBO 는 MLB 보다 득점환경이 높아 전 구간이 조금씩 위에 있다.
 * 실서비스에서는 최근 3시즌 KBO 전 경기의 base-out 전이로 직접 집계해야 한다.
 */
export const RUN_EXPECTANCY: Record<string, [number, number, number]> = {
  // 키: 1루2루3루 점유 / 값: [무사, 1사, 2사]
  '000': [0.54, 0.29, 0.11],
  '100': [0.95, 0.57, 0.25],
  '010': [1.19, 0.73, 0.35],
  '001': [1.45, 1.0, 0.39],
  '110': [1.56, 0.98, 0.47],
  '101': [1.85, 1.23, 0.53],
  '011': [2.08, 1.47, 0.6],
  '111': [2.42, 1.65, 0.81],
};

export function runExpectancy(s: GameSituation): number {
  const row = RUN_EXPECTANCY[basesKey(s.bases)] ?? RUN_EXPECTANCY['000'];
  return row[s.outs];
}

/**
 * 레버리지 인덱스(LI) - 지금 이 타석이 승부에 얼마나 결정적인가. 1.0이 평균이다.
 *
 * 기대득점이 클수록, 경기 후반일수록, 점수차가 작을수록 커진다.
 * LI 가 2.0을 넘으면 "이 타석 하나가 평균 타석 두 개만큼 승패를 흔든다"는 뜻이다.
 */
export function leverageIndex(s: GameSituation): number {
  const re = runExpectancy(s);
  // 이닝 가중: 9회는 1회의 두 배 이상으로 무겁다
  const inningWeight = 0.45 + Math.min(s.inning, 9) * 0.12;
  // 점수차 가중: 동점(1.0)에서 최대, 5점 이상 벌어지면 급격히 떨어진다
  const gapWeight = 1 / (1 + Math.pow(Math.abs(s.scoreDiff) / 2.2, 2));

  // ── 마지막 공격 가중 ──────────────────────────────────────
  // 기대득점만 쓰면 9회말 2사 만루가 7회 1사 1·2루보다 낮게 나온다(2사라 기대득점이
  // 작으니까). 하지만 실제로는 정반대다 - **9회말에는 다음 이닝이 없다.** 이 아웃 하나로
  // 경기가 끝나는 상황에서 기대득점이 낮다는 사실은 위기의 크기를 재는 척도가 아니라
  // 오히려 절박함 그 자체다. 남은 공격 기회의 유무를 따로 얹는다.
  const lastChance =
    s.half === 'bottom' && s.inning >= 9 && s.scoreDiff <= 0
      ? 1 + 0.28 * (s.outs + 1) // 아웃이 늘수록 더 절박하다
      : 1;

  const li = (re / 0.54) * inningWeight * gapWeight * lastChance * 1.35;
  return Math.round(Math.min(6, Math.max(0.1, li)) * 100) / 100;
}

// ─────────────────────────────────────────────────────────────
// 3. 매치업 확률 - 로그5(Log5)
// ─────────────────────────────────────────────────────────────

/**
 * 로그5 - 두 상대의 능력치와 리그 평균으로 대결 결과 확률을 낸다.
 *
 *   P = (A·B/L) / (A·B/L + (1−A)(1−B)/(1−L))
 *
 * A = 타자의 출루 능력, B = 투수의 피출루 능력, L = 리그 평균.
 * 이 식이 필요한 이유: 출루율 .400 타자와 피출루율 .280 투수가 만나면 결과는
 * 두 값의 평균(.340)이 아니다. **양쪽 다 리그 평균에서 얼마나 떨어져 있는지**를
 * 승산비(odds)로 곱해야 맞는다. 세이버메트릭스에서 가장 오래되고 가장 잘 버틴 도구다.
 */
export function log5(a: number, b: number, league: number): number {
  const num = (a * b) / league;
  const den = num + ((1 - a) * (1 - b)) / (1 - league);
  if (den === 0) return league;
  return num / den;
}

/** 투수의 피출루율 - 상대한 타자 대비 출루 허용 */
export function opsAllowedOf(p: Pitcher): number {
  const s = p.stat;
  const onBase = s.h + s.bb + s.hbp;
  return s.bf === 0 ? LEAGUE.wOBA : onBase / s.bf;
}

/**
 * 플래툰 보정 - 좌우 상성.
 *
 * 같은 손끼리(우투 vs 우타)는 투수가 유리하고, 엇갈리면 타자가 유리하다. 변화구가
 * 타자에게서 멀어지느냐 다가오느냐의 차이라서, 야구에서 가장 안정적으로 재현되는
 * 상성 중 하나다. 스위치타자는 이 이점을 스스로 없애는 선택을 한 것이므로 보정이 없다.
 */
export function platoonAdj(batter: Batter, pitcher: Pitcher): number {
  if (batter.bats === 'S') return 0;
  const same = batter.bats === pitcher.throws;
  return same ? -0.016 : 0.02; // 출루율 눈금
}

// ─────────────────────────────────────────────────────────────
// 4. 상황 보정 - '만루라서 달라지는 것'
// ─────────────────────────────────────────────────────────────

/**
 * 만루에서 투수가 불리해지는 이유는 상대가 강해서가 아니라 **투수의 선택지가 줄기 때문**이다.
 *
 *   - 볼넷이 곧 실점이므로 유인구를 던질 수 없다 → 스트라이크존 안으로 들어와야 한다
 *   - 1루가 비어 있지 않아 거를 수도 없다
 *   - 폭투·포일이 즉시 실점이라 원바운드 변화구(스플리터·포크)를 쓰기 어렵다
 *
 * 세 번째가 특히 중요하다. 결정구가 떨어지는 공인 투수는 만루에서 **자기 최고 무기를
 * 봉인당한다.** 이 엔진은 그 사실을 구종 구사율에서 직접 읽어 낸다.
 */
export interface SituationAdjustment {
  /** 출루 확률에 더할 보정치 */
  delta: number;
  /** 왜 이 보정이 붙었는지 - 화면에 그대로 나간다 */
  reason: string;
  kind: 'bases' | 'count' | 'pitch' | 'fatigue' | 'park';
}

/** 원바운드로 떨어뜨려 헛스윙을 유도하는 구종 - 만루에서 봉인된다 */
const DROP_PITCHES = ['스플리터', '포크', '커브', '체인지업'];

export function situationAdjustments(
  s: GameSituation,
  batter: Batter,
  pitcher: Pitcher,
): SituationAdjustment[] {
  const adjs: SituationAdjustment[] = [];
  const loaded = s.bases.first && s.bases.second && s.bases.third;
  const runnerOn = s.bases.first || s.bases.second || s.bases.third;

  // ① 만루 - 볼넷이 실점이라 투수가 존 안으로 들어와야 한다
  if (loaded) {
    adjs.push({
      delta: 0.028,
      reason: '만루라 볼넷이 곧 실점입니다. 투수는 유인구를 못 던지고 존 안으로 들어와야 합니다.',
      kind: 'bases',
    });

    // ② 만루 + 떨어지는 결정구 의존 투수 - 최고 무기가 봉인된다
    const dropUsage = pitcher.pitches
      .filter((p) => DROP_PITCHES.includes(p.name))
      .reduce((a, p) => a + p.usage, 0);
    if (dropUsage >= 0.25) {
      const top = pitcher.pitches
        .filter((p) => DROP_PITCHES.includes(p.name))
        .sort((a, b) => b.usage - a.usage)[0];
      adjs.push({
        delta: 0.019,
        reason:
          `${pitcher.name}의 결정구는 떨어지는 ${top.name}(구사율 ${Math.round(top.usage * 100)}%)인데, ` +
          '만루에서는 원바운드가 곧 폭투 실점이라 이 공을 마음껏 쓰기 어렵습니다.',
        kind: 'pitch',
      });
    }
  } else if (s.bases.first && !s.bases.second && !s.bases.third) {
    // 1루만 - 병살 가능성이 투수 쪽 이점
    adjs.push({
      delta: -0.008,
      reason: '1루 주자가 있어 땅볼 하나로 두 개의 아웃을 잡을 수 있습니다.',
      kind: 'bases',
    });
  }

  // ③ 볼카운트 - 야구에서 단일 요인으로 가장 큰 변수다
  const count = `${s.balls}-${s.strikes}`;
  const COUNT_DELTA: Record<string, number> = {
    '3-0': 0.155,
    '3-1': 0.105,
    '2-0': 0.085,
    '3-2': 0.045,
    '1-0': 0.028,
    '2-1': 0.026,
    '0-0': 0,
    '1-1': -0.012,
    '2-2': -0.03,
    '0-1': -0.032,
    '1-2': -0.075,
    '0-2': -0.095,
  };
  const cd = COUNT_DELTA[count] ?? 0;
  if (cd !== 0) {
    adjs.push({
      delta: cd,
      reason:
        cd > 0
          ? `${count} - 타자가 유리한 카운트입니다. 투수가 스트라이크를 넣어야 하므로 칠 공이 옵니다.`
          : `${count} - 투수가 유리한 카운트입니다. 타자는 존을 넓게 지켜야 합니다.`,
      kind: 'count',
    });
  }

  // ④ 투구수 피로 - 선발이 타순을 세 번째로 돌면 타자 쪽 성적이 올라간다
  //    (여기서는 이닝으로 근사한다. 실서비스에서는 실시간 투구수를 받는다)
  //    ⚠ 상한을 둔다. 이닝에 비례해 무한정 키우면 9회 등판만으로 보정이 0.05를 넘어
  //    실력 차이를 덮어버린다 - 실제로 검증에서 그렇게 나왔다
  if (pitcher.role === '선발' && s.inning >= 6) {
    const fatigue = Math.min(0.03, 0.011 * (s.inning - 5));
    adjs.push({
      delta: fatigue,
      reason: `${s.inning}회입니다. 선발이 세 번째로 상대하는 타순부터는 타자 쪽 성적이 올라갑니다.`,
      kind: 'fatigue',
    });
  }

  // ⑤ 구장 - 대전은 신구장이라 표본이 짧다는 사실을 같이 말한다
  const pf = PARK_FACTORS[s.park] ?? 100;
  if (Math.abs(pf - 100) >= 3) {
    adjs.push({
      delta: (pf - 100) * 0.0012,
      reason:
        pf > 100
          ? `${s.park}은 타자 친화 구장입니다(파크팩터 ${pf}).`
          : `${s.park}은 투수 친화 구장입니다(파크팩터 ${pf}).`,
      kind: 'park',
    });
  }

  // ⑥ 주자 있을 때의 투구 - 세트 포지션은 구위가 조금 떨어진다
  if (runnerOn && !loaded) {
    adjs.push({
      delta: 0.006,
      reason: '주자가 있어 투수가 세트 포지션으로 던집니다. 와인드업보다 구위가 조금 떨어집니다.',
      kind: 'bases',
    });
  }

  return adjs;
}

// ─────────────────────────────────────────────────────────────
// 5. 최종 예측
// ─────────────────────────────────────────────────────────────

export interface MatchupPrediction {
  /** 타자가 출루할 확률 (0~1) */
  onBaseProb: number;
  /** 리그 평균 대비 - 양수면 타자 쪽으로 기운 승부 */
  edge: number;
  /** 어느 쪽이 유리한가 */
  favors: 'batter' | 'pitcher' | 'even';
  /**
   * 실력만 보면 A가 유리한데 상황이 B 쪽으로 뒤집은 승부인가.
   *
   * **이 앱이 팔려는 인사이트가 바로 이 값이다.** 누가 잘하는 선수인지는 중계 자막도
   * 말해 준다. 중계가 말하지 못하는 것은 "지금 이 상황이 그 실력 차이를 뒤집었다"는
   * 사실이고, 그건 상황 보정을 따로 계산해야만 나온다.
   */
  flipped: boolean;
  /** 한 줄 결론 - 화면 최상단 */
  headline: string;
  /** 근거 - 이게 비면 확률을 띄우지 않는다 */
  reasons: string[];
  /** 계산 과정 - '왜 이 숫자인지'를 펼쳐 볼 수 있게 */
  breakdown: {
    batterOBP: number;
    pitcherOBPAllowed: number;
    log5Base: number;
    platoon: number;
    situational: number;
    final: number;
  };
  /** 상황 지표 */
  context: {
    runExpectancy: number;
    leverageIndex: number;
    leverageLabel: string;
    basesLabel: string;
  };
}

/**
 * '결정적'이라고 부를 수 있는 레버리지 하한.
 *
 * 아래 leverageLabel 이 '중요'를 붙이는 경계와 같은 값이다. 두 곳에 따로 적어 두면
 * 한쪽만 바뀌었을 때 화면은 '중요'라고 하는데 알림은 안 오는 식으로 어긋난다.
 */
export const CLUTCH_LI = 1.5;

function leverageLabel(li: number): string {
  if (li >= 3) return '경기를 가르는 순간';
  if (li >= 2) return '매우 중요';
  if (li >= CLUTCH_LI) return '중요';
  if (li >= 0.85) return '평범';
  return '여유 있는 국면';
}

/**
 * 이 승부를 예측한다.
 *
 * 순서: 로그5로 바탕을 깔고 → 좌우 상성을 얹고 → 상황 보정을 더한다.
 * 각 단계의 값을 breakdown 에 남기는 이유는 화면에서 **계산을 되짚을 수 있어야** 하기 때문이다.
 */
export function predictMatchup(
  s: GameSituation,
  batter: Batter,
  pitcher: Pitcher,
): MatchupPrediction {
  const bOBP = obpOf(batter.stat);
  const pOBPA = opsAllowedOf(pitcher);
  const leagueOBP = 0.352; // 리그 평균 출루율 (샘플)

  // ① 로그5 - 두 능력치를 승산비로 결합
  const base = log5(bOBP, pOBPA, leagueOBP);

  // ② 좌우 상성
  const platoon = platoonAdj(batter, pitcher);

  // ③ 상황 보정
  const adjs = situationAdjustments(s, batter, pitcher);
  const situational = adjs.reduce((a, x) => a + x.delta, 0);

  const final = Math.min(0.85, Math.max(0.05, base + platoon + situational));
  const edge = final - leagueOBP;

  // ── 근거 문장 조립 ──────────────────────────────────────────
  const reasons: string[] = [];

  // 근거 1: 두 선수의 실력 차이 (로그5의 입력값을 말로)
  const bWoba = wobaOf(batter.stat);
  const pFip = fipOf(pitcher.stat);
  if (base > leagueOBP + 0.02) {
    reasons.push(
      `${batter.name}의 출루율 ${bOBP.toFixed(3)}(wOBA ${bWoba.toFixed(3)})이 ` +
        `${pitcher.name}의 피출루율 ${pOBPA.toFixed(3)}보다 앞섭니다. 두 값을 승산비로 결합하면 ` +
        `이 대결의 기본 출루 확률은 ${(base * 100).toFixed(1)}%입니다.`,
    );
  } else if (base < leagueOBP - 0.02) {
    reasons.push(
      `${pitcher.name}의 피출루율 ${pOBPA.toFixed(3)}(FIP ${pFip.toFixed(2)})이 ` +
        `${batter.name}의 출루율 ${bOBP.toFixed(3)}을 눌러, 기본 출루 확률은 ` +
        `${(base * 100).toFixed(1)}%로 리그 평균보다 낮습니다.`,
    );
  } else {
    reasons.push(
      `${batter.name}(출루율 ${bOBP.toFixed(3)})${josa(batter.name, '와/과')} ` +
        `${pitcher.name}(피출루율 ${pOBPA.toFixed(3)})${josa(pitcher.name, '은/는')} ` +
        '실력만 놓고 보면 리그 평균에 가까운 대등한 승부입니다.',
    );
  }

  // 근거 2: 좌우 상성
  if (platoon !== 0) {
    const bl = batter.bats === 'L' ? '좌타' : '우타';
    const pl = pitcher.throws === 'L' ? '좌투' : '우투';
    reasons.push(
      platoon > 0
        ? `${pl} 대 ${bl}로 손이 엇갈립니다. 변화구가 타자 쪽으로 다가오는 궤적이라 타자에게 유리합니다.`
        : `${pl} 대 ${bl}로 손이 같습니다. 변화구가 타자에게서 멀어져 투수가 유리한 구도입니다.`,
    );
  } else {
    reasons.push(
      `${josa(batter.name, '은/는')} 스위치 타자라 좌우 상성의 이점도 불리함도 없습니다.`,
    );
  }

  // 근거 3~: 상황 보정 (영향이 큰 것부터)
  const sortedAdjs = adjs.slice().sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  sortedAdjs.forEach((a) => reasons.push(a.reason));

  // ── 결론 한 줄 ──────────────────────────────────────────────
  const favors: MatchupPrediction['favors'] =
    edge > 0.02 ? 'batter' : edge < -0.02 ? 'pitcher' : 'even';
  const pct = (final * 100).toFixed(0);
  const li = leverageIndex(s);
  const re = runExpectancy(s);

  // 실력(로그5)과 최종 결론이 서로 반대편이면 '상황이 뒤집은 승부'다
  const skillSide =
    base > leagueOBP + 0.015 ? 'batter' : base < leagueOBP - 0.015 ? 'pitcher' : 'even';
  const flipped = skillSide !== 'even' && favors !== 'even' && skillSide !== favors;

  // 뒤집은 요인 - 상황 보정 중 가장 크게 기여한 것
  const topAdj = sortedAdjs[0];

  let headline: string;
  if (flipped) {
    const skillWinner = skillSide === 'batter' ? batter.name : pitcher.name;
    const nowWinner = favors === 'batter' ? batter.name : pitcher.name;
    headline =
      `시즌 성적만 보면 ${skillWinner}의 승부인데, ${basesLabel(s.bases)} ${s.outs}아웃 ${s.balls}-${s.strikes}라는 ` +
      `지금 상황이 ${nowWinner} 쪽으로 뒤집었습니다. 타자 출루 확률 ${pct}%`;
  } else if (favors === 'batter') {
    headline = `${basesLabel(s.bases)} ${s.outs}아웃. 이 승부는 ${josa(batter.name, '이/가')} 유리합니다. 출루 확률 ${pct}%`;
  } else if (favors === 'pitcher') {
    headline = `${basesLabel(s.bases)} ${s.outs}아웃. 이 승부는 ${josa(pitcher.name, '이/가')} 유리합니다. 타자 출루 확률 ${pct}%`;
  } else {
    headline = `${basesLabel(s.bases)} ${s.outs}아웃. 어느 쪽으로도 기울지 않은 승부입니다. 출루 확률 ${pct}%`;
  }

  // 뒤집힌 승부는 그 사실을 근거의 맨 앞에 세운다 - 실력 비교보다 이게 먼저 읽혀야 한다.
  // 맨 앞으로 올린 요인은 아래 목록에서 빼야 같은 문장이 두 번 나오지 않는다
  if (flipped && topAdj) {
    const dup = reasons.indexOf(topAdj.reason);
    if (dup >= 0) reasons.splice(dup, 1);
    reasons.unshift(
      `실력 차이를 뒤집은 것은 이겁니다. ${topAdj.reason} 이 요인 하나가 출루 확률을 ` +
        `${(Math.abs(topAdj.delta) * 100).toFixed(1)}%p 움직였습니다.`,
    );
  }

  return {
    onBaseProb: Math.round(final * 1000) / 1000,
    edge: Math.round(edge * 1000) / 1000,
    favors,
    flipped,
    headline,
    reasons,
    breakdown: {
      batterOBP: Math.round(bOBP * 1000) / 1000,
      pitcherOBPAllowed: Math.round(pOBPA * 1000) / 1000,
      log5Base: Math.round(base * 1000) / 1000,
      platoon: Math.round(platoon * 1000) / 1000,
      situational: Math.round(situational * 1000) / 1000,
      final: Math.round(final * 1000) / 1000,
    },
    context: {
      runExpectancy: Math.round(re * 100) / 100,
      leverageIndex: li,
      leverageLabel: leverageLabel(li),
      basesLabel: basesLabel(s.bases),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// 6. 투수 교체 판단 - 팬이 가장 많이 싸우는 주제
// ─────────────────────────────────────────────────────────────

export interface BullpenAdvice {
  /** 지금 바꾸는 게 나은가 */
  shouldChange: boolean;
  /** 추천 투수 */
  candidate?: Pitcher;
  /** 바꿨을 때의 출루 확률 */
  candidateProb?: number;
  currentProb: number;
  sentence: string;
}

/**
 * "지금 바꿔야 하나"에 숫자로 답한다.
 *
 * 중계를 보는 팬이 실시간으로 가장 많이 던지는 질문이고, 그동안 답은 전부 감이었다.
 * 같은 상황을 불펜 후보로 다시 계산해서 **확률 차이**로 답하면 논쟁이 데이터가 된다.
 */
export function bullpenAdvice(
  s: GameSituation,
  batter: Batter,
  current: Pitcher,
  bullpen: Pitcher[],
): BullpenAdvice {
  const currentPred = predictMatchup(s, batter, current);
  const options = bullpen
    .filter((p) => p.id !== current.id && p.role !== '선발')
    .map((p) => ({ p, pred: predictMatchup(s, batter, p) }))
    .sort((a, b) => a.pred.onBaseProb - b.pred.onBaseProb);

  const best = options[0];
  if (!best) {
    return {
      shouldChange: false,
      currentProb: currentPred.onBaseProb,
      sentence: '지금 올릴 수 있는 불펜 자원이 없습니다.',
    };
  }

  const gain = currentPred.onBaseProb - best.pred.onBaseProb;
  const li = leverageIndex(s);
  // 레버리지가 낮으면 웬만한 이득으로는 안 바꾼다 - 불펜은 유한한 자원이다
  const threshold = li >= 2 ? 0.02 : li >= 1.2 ? 0.035 : 0.06;
  const shouldChange = gain >= threshold;

  const nameWith = josa(best.p.name, '으로/로');
  const cur = (currentPred.onBaseProb * 100).toFixed(0);
  const next = (best.pred.onBaseProb * 100).toFixed(0);

  // gain 이 음수면 **바꿀수록 나빠진다**. 이걸 "덜 줄어든다"로 쓰면 문장이 사실과 어긋난다
  // (검증 스크립트가 실제로 "-5.1%p밖에 안 줄어듭니다"를 잡아냈다)
  let sentence: string;
  if (shouldChange) {
    sentence =
      `${nameWith} 바꾸면 이 타자의 출루 확률이 ${cur}% → ${next}%로 ` +
      `${(gain * 100).toFixed(1)}%p 내려갑니다. 레버리지 ${li.toFixed(2)}인 국면이라 ` +
      '이 정도 차이면 바꿀 만합니다.';
  } else if (gain <= 0) {
    sentence =
      `지금 올릴 수 있는 불펜 중 가장 나은 카드가 ${best.p.name}인데, ${nameWith} 바꾸면 ` +
      `출루 확률이 오히려 ${cur}% → ${next}%로 ${(-gain * 100).toFixed(1)}%p 올라갑니다. ` +
      '이 상황에서는 지금 투수가 최선입니다.';
  } else {
    sentence =
      `${nameWith} 바꿔도 출루 확률은 ${(gain * 100).toFixed(1)}%p밖에 안 줄어듭니다. ` +
      `레버리지 ${li.toFixed(2)} 국면에서 불펜을 소모할 만한 차이가 아닙니다.`;
  }

  return {
    shouldChange,
    candidate: best.p,
    candidateProb: best.pred.onBaseProb,
    currentProb: currentPred.onBaseProb,
    sentence,
  };
}

// ─────────────────────────────────────────────────────────────
// 7. 경기 중 자동 감지 - 무엇을 언제 띄울 것인가
// ─────────────────────────────────────────────────────────────

export type AlertKind = 'clutch' | 'record' | 'matchup' | 'bullpen';

export interface LiveAlert {
  kind: AlertKind;
  title: string;
  body: string;
  /** 우선순위 - 높을수록 위 */
  priority: number;
}

/**
 * 상황을 보고 **띄울 만한 것이 있을 때만** 알림을 만든다.
 *
 * 실시간 앱이 실패하는 가장 흔한 방식은 매 타석 무언가를 띄우는 것이다. 3회 무사 주자 없는
 * 상황까지 인사이트를 밀어 넣으면 사용자는 알림을 끄고, 그 순간 9회 만루도 못 보게 된다.
 * **레버리지가 기준선을 넘을 때만** 말한다.
 */
export function liveAlerts(s: GameSituation, batter: Batter, pitcher: Pitcher): LiveAlert[] {
  const alerts: LiveAlert[] = [];
  const li = leverageIndex(s);
  const pred = predictMatchup(s, batter, pitcher);

  if (li >= 1.8) {
    alerts.push({
      kind: 'clutch',
      title: leverageLabel(li),
      body:
        `이 타석 하나가 평균 타석의 ${li.toFixed(1)}배만큼 승패를 흔듭니다. ` +
        `현재 기대득점은 ${runExpectancy(s).toFixed(2)}점입니다.`,
      priority: Math.round(li * 10),
    });
  }

  // 매치업은 두 경우에 띄운다.
  //   ① 한쪽으로 확실히 기운 승부
  //   ② **뒤집힌 승부** - 기운 폭은 작아도 이게 이 앱이 파는 인사이트다.
  //      실력 우위와 상황 우위가 엇갈렸다는 사실 자체가 중계가 못 하는 말이라,
  //      edge 크기만으로 걸러내면 정작 가장 할 말이 많은 타석에서 침묵하게 된다
  if (Math.abs(pred.edge) >= 0.05 || pred.flipped) {
    alerts.push({
      kind: 'matchup',
      title: pred.headline,
      body: pred.reasons[0],
      priority: pred.flipped ? 60 : Math.round(Math.abs(pred.edge) * 100),
    });
  }

  // 피BABIP 이탈 - 투수가 운이 좋았는지 나빴는지
  const pBabip = babipAllowedOf(pitcher.stat);
  const gap = pBabip - LEAGUE.babipPitcher;
  if (Math.abs(gap) >= 0.025 && ipOf(pitcher.stat.ipOuts) >= 40) {
    alerts.push({
      kind: 'record',
      title: `${pitcher.name} 피BABIP ${pBabip.toFixed(3)}`,
      body:
        gap > 0
          ? `리그 평균(${LEAGUE.babipPitcher.toFixed(3)})보다 ${(gap * 1000).toFixed(0)} 높습니다. ` +
            '인플레이 타구가 유독 안타로 많이 연결됐다는 뜻이라, 앞으로 성적이 좋아질 여지가 있습니다.'
          : `리그 평균(${LEAGUE.babipPitcher.toFixed(3)})보다 ${(-gap * 1000).toFixed(0)} 낮습니다. ` +
            '수비 도움이나 운이 따랐을 가능성이 있어, 지금 성적이 그대로 유지되기는 어렵습니다.',
      priority: Math.round(Math.abs(gap) * 200),
    });
  }

  return alerts.sort((a, b) => b.priority - a.priority);
}

/** 타자 쪽 참고 지표 묶음 - 화면이 근거 타일로 편다 */
export function batterContext(b: Batter) {
  return {
    obp: obpOf(b.stat),
    woba: wobaOf(b.stat),
    babip: babipOf(b.stat),
    kRate: b.stat.so / b.stat.pa,
    gbRate: b.stat.gbRate,
    fbRate: b.stat.fbRate,
  };
}

/** 투수 쪽 참고 지표 묶음 */
export function pitcherContext(p: Pitcher) {
  return {
    fip: fipOf(p.stat),
    babipAllowed: babipAllowedOf(p.stat),
    kRate: kRateOf(p.stat),
    bbRate: bbRateOf(p.stat),
    gbRate: p.stat.gbRate,
  };
}
