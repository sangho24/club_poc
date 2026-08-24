// 세이버메트릭스 계산 엔진 - wOBA · wRC+ · WAR · FIP · BABIP
//
// ── 이 파일이 존재하는 이유 ──────────────────────────────────
// 1차 리뷰: "WRC, WAR, wOBA 등 좀더 심화된 수치가 필요합니다."
//
// 심화 지표를 흉내내는 가장 쉬운 방법은 `wrcPlus: 142` 처럼 **결과값을 그냥 적어 두는 것**
// 이다. 그렇게 하면 화면은 똑같이 나오지만 "이 값이 왜 142인가"에 답할 수 없고, 그 순간
// 리뷰가 지적한 "설명과 인사이트의 깊이" 문제가 그대로 재발한다.
//
// 그래서 여기서는 **선수 원자료(안타·2루타·볼넷 같은 세는 값)만 데이터로 두고, 파생 지표는
// 전부 실제 공식으로 계산한다.** 목업 데이터여도 계산 구조가 진짜면 다음 두 가지가 따라온다.
//   - 화면이 "wRC+ 142" 옆에 **계산 과정과 입력값**을 같이 보여줄 수 있다
//   - 실데이터를 꽂는 순간 그대로 동작한다 (PoC 를 버리지 않아도 된다)
//
// ── 리그 상수에 대한 경고 ────────────────────────────────────
// ⚠ 아래 상수는 **시연용 샘플값**이다. 실서비스에서는 KBO 시즌 기록을 집계해 매 시즌
// 새로 도출해야 한다. MLB(FanGraphs) 값을 그대로 가져다 쓰면 안 된다 - KBO 는 득점환경이
// 달라(리그 타율·장타 수준이 높다) 같은 wOBA 라도 wRC+ 가 다르게 나온다.

// ─────────────────────────────────────────────────────────────
// 1. 리그 상수
// ─────────────────────────────────────────────────────────────

/**
 * wOBA 선형 가중치 (linear weights).
 *
 * 각 이벤트가 **평균적으로 몇 점을 만들어내는가**를 득점가치로 환산한 계수다.
 * 볼넷보다 홈런의 계수가 3배 가까이 큰 이유가 곧 "출루율은 볼넷과 홈런을 같이 세는데,
 * 그 둘의 가치가 같을 리 없다"는 wOBA 의 존재 이유다.
 *
 * 주의: 삼진과 범타는 계수가 0 이 아니라 **분모에서 처리**된다. 아웃의 음의 가치는
 * 리그 평균 wOBA 를 기준점으로 잡는 과정에서 이미 반영되어 있다.
 */
export const WOBA_WEIGHTS = {
  uBB: 0.69, // 고의4구를 제외한 볼넷
  HBP: 0.722, // 사구
  single: 0.878, // 1루타
  double: 1.242, // 2루타
  triple: 1.569, // 3루타
  HR: 2.015, // 홈런
} as const;

/**
 * 리그 환경 상수 (2026 시즌 샘플).
 *
 * wOBAScale 은 wOBA 를 출루율과 같은 눈금에 맞추기 위한 배율이다. 이 값으로 나눠야
 * "리그 평균보다 wOBA 가 0.030 높다"가 "몇 점을 더 만들었나"로 환산된다.
 */
export const LEAGUE = {
  wOBA: 0.34, // 리그 평균 wOBA
  wOBAScale: 1.157, // wOBA → 득점 환산 배율
  runsPerPA: 0.128, // 리그 타석당 득점 (lgR/PA)
  runsPerWin: 10.2, // 1승의 값어치(득점). KBO 득점환경 기준
  ERA: 4.35, // 리그 평균 평균자책점
  FIPConstant: 3.15, // cFIP - FIP 를 ERA 눈금에 맞추는 보정 상수
  babipBatter: 0.315, // 리그 평균 타자 BABIP
  babipPitcher: 0.31, // 리그 평균 피BABIP
  /** 대체선수 수준: 600타석당 몇 점 아래인가 */
  replacementRunsPer600PA: 20,
  /** 대체선수 수준: 180이닝당 몇 점 위인가(투수는 실점이므로 부호가 반대) */
  replacementRunsPer180IP: 21,
} as const;

/**
 * 구장 파크팩터 - 100이 중립. 값이 크면 타자에게 유리한 구장이다.
 *
 * ⚠ 대전 한화생명 볼파크는 2025 개장 신구장이라 **표본이 짧아 파크팩터가 아직 불안정하다.**
 * 이 사실은 숨기지 말고 화면에 같이 띄운다(→ statGlossary 의 신뢰도 등급).
 */
export const PARK_FACTORS: Record<string, number> = {
  대전: 101, // 한화생명 볼파크 (신구장, 표본 부족)
  잠실: 94,
  고척: 97,
  문학: 106,
  수원: 103,
  창원: 102,
  사직: 100,
  광주: 103,
  대구: 104,
};

// ─────────────────────────────────────────────────────────────
// 2. 원자료 타입 - 여기에만 '세는 값'이 들어간다
// ─────────────────────────────────────────────────────────────

/** 타자 원자료. 파생 지표는 하나도 들어 있지 않다 */
export interface BatterStatLine {
  pa: number; // 타석
  ab: number; // 타수
  h: number; // 안타
  double: number; // 2루타
  triple: number; // 3루타
  hr: number; // 홈런
  bb: number; // 볼넷
  ibb: number; // 고의4구
  hbp: number; // 사구
  so: number; // 삼진
  sf: number; // 희생플라이
  sh: number; // 희생번트
  sb: number; // 도루
  cs: number; // 도루자
  r: number; // 득점
  rbi: number; // 타점
  gdp: number; // 병살타
  /** 타구 유형 - BABIP 해석에 쓴다 */
  gbRate: number; // 땅볼 비율
  fbRate: number; // 뜬공 비율
  ldRate: number; // 라인드라이브 비율
  /** 수비 기여 (런). 목업 - 실서비스에서는 수비지표 파이프라인 필요 */
  fieldingRuns: number;
  /** 포지션 조정 (런/600타석) */
  positionAdj: number;
}

/** 투수 원자료 */
export interface PitcherStatLine {
  g: number;
  gs: number; // 선발 등판
  ipOuts: number; // 아웃카운트 - 이닝을 소수로 적으면 110.1 이 110.1이닝이 아니라 오해를 부른다
  h: number;
  hr: number;
  bb: number;
  ibb: number;
  hbp: number;
  so: number;
  r: number;
  er: number;
  w: number;
  l: number;
  sv: number;
  hld: number;
  bf: number; // 상대한 타자 수
  gbRate: number;
  fbRate: number;
  ldRate: number;
}

// ─────────────────────────────────────────────────────────────
// 3. 계산 - 전부 순수 함수
// ─────────────────────────────────────────────────────────────

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const r1 = (v: number) => Math.round(v * 10) / 10;
const safe = (n: number, d: number) => (d === 0 ? 0 : n / d);

/** 아웃카운트를 이닝 수로 (325 아웃 = 108.1이닝) */
export const ipOf = (ipOuts: number) => ipOuts / 3;

/** 이닝 표기 - 108.1 은 108과 3분의 1이닝 */
export function ipLabel(ipOuts: number): string {
  const full = Math.floor(ipOuts / 3);
  const rest = ipOuts % 3;
  return rest === 0 ? `${full}.0` : `${full}.${rest}`;
}

/** 1루타 = 안타 - 2루타 - 3루타 - 홈런 */
export const singlesOf = (b: BatterStatLine) => b.h - b.double - b.triple - b.hr;

export const avgOf = (b: BatterStatLine) => r3(safe(b.h, b.ab));

export const obpOf = (b: BatterStatLine) =>
  r3(safe(b.h + b.bb + b.hbp, b.ab + b.bb + b.hbp + b.sf));

export const slgOf = (b: BatterStatLine) =>
  r3(safe(singlesOf(b) + b.double * 2 + b.triple * 3 + b.hr * 4, b.ab));

export const opsOf = (b: BatterStatLine) => r3(obpOf(b) + slgOf(b));

/**
 * BABIP - 인플레이 타구 타율.
 *
 * 분모에서 **삼진과 홈런을 뺀다**는 것이 이 지표의 전부다. 삼진은 타구가 없고,
 * 홈런은 야수가 손댈 수 없으므로 둘 다 "수비가 개입할 여지"가 없다.
 * 남은 것이 인플레이 타구이고, 그중 몇 개가 안타가 됐는지를 세는 값이다.
 */
export const babipOf = (b: BatterStatLine) =>
  r3(safe(b.h - b.hr, b.ab - b.so - b.hr + b.sf));

/** 피BABIP - 투수판. 계산 구조는 같다 */
export function babipAllowedOf(p: PitcherStatLine): number {
  const ballsInPlay = p.bf - p.so - p.bb - p.ibb - p.hbp - p.hr;
  return r3(safe(p.h - p.hr, ballsInPlay));
}

/**
 * wOBA - 가중 출루율.
 *
 * 출루율은 볼넷과 홈런을 똑같이 한 번의 출루로 세지만, 실제 득점 기여는 전혀 다르다.
 * wOBA 는 각 이벤트에 득점가치 가중치를 곱해 그 왜곡을 없앤다.
 * 눈금은 출루율과 같아서 .400 이면 아주 좋은 값이라는 감각이 그대로 통한다.
 */
export function wobaOf(b: BatterStatLine): number {
  const w = WOBA_WEIGHTS;
  const uBB = b.bb - b.ibb;
  const num =
    w.uBB * uBB +
    w.HBP * b.hbp +
    w.single * singlesOf(b) +
    w.double * b.double +
    w.triple * b.triple +
    w.HR * b.hr;
  const den = b.ab + b.bb - b.ibb + b.sf + b.hbp;
  return r3(safe(num, den));
}

/** wRAA - 리그 평균 타자 대비 몇 점을 더 만들었나 */
export function wraaOf(b: BatterStatLine): number {
  return r1(((wobaOf(b) - LEAGUE.wOBA) / LEAGUE.wOBAScale) * b.pa);
}

/**
 * wRC+ - 구장과 리그 환경을 보정한 득점 창출력. 100이 리그 평균이다.
 *
 * wRC+ 가 wOBA 보다 한 겹 위에 있는 이유는 **구장 보정** 때문이다. 같은 wOBA .400 이라도
 * 투수 친화 구장(잠실)에서 만든 값이 타자 친화 구장에서 만든 값보다 낫다.
 */
export function wrcPlusOf(b: BatterStatLine, park: string): number {
  const pf = (PARK_FACTORS[park] ?? 100) / 100;
  const wRAAperPA = (wobaOf(b) - LEAGUE.wOBA) / LEAGUE.wOBAScale;
  // 타석당 득점 창출 = 자기 기여 + 리그 평균, 여기에 구장 보정을 나눈다
  const parkAdjusted = (wRAAperPA + LEAGUE.runsPerPA) / pf;
  return Math.round((parkAdjusted / LEAGUE.runsPerPA) * 100);
}

/**
 * 주루 득점(BsR) 근사 - 도루 성공/실패의 득점가치만 센다.
 *
 * ⚠ 실제 BsR 은 도루 외에 진루 능력(1루→3루 등)을 포함한다. 그 데이터가 없으므로
 * 여기서는 도루만 센다는 사실을 화면에서도 밝힌다.
 */
export const bsrOf = (b: BatterStatLine) => r1(b.sb * 0.2 - b.cs * 0.42);

/**
 * 타자 WAR - 대체 선수 대비 승리 기여.
 *
 * 구성: 타격 + 주루 + 수비 + 포지션 조정 + 대체수준 보정, 전부 '런' 단위로 더한 뒤
 * 1승의 값어치(runsPerWin)로 나눈다. **WAR 이 하나의 지표가 아니라 합계라는 점**이
 * 이 지표를 설명할 때 가장 먼저 말해야 하는 사실이다.
 */
export function batterWarOf(b: BatterStatLine, park: string): number {
  const pf = (PARK_FACTORS[park] ?? 100) / 100;
  // 구장 보정을 타격 런에 반영한다 (타자 친화 구장이면 기여를 깎는다)
  const battingRuns = wraaOf(b) / pf;
  const positionRuns = (b.positionAdj * b.pa) / 600;
  const replacementRuns = (LEAGUE.replacementRunsPer600PA * b.pa) / 600;
  const total = battingRuns + bsrOf(b) + b.fieldingRuns + positionRuns + replacementRuns;
  return Math.round((total / LEAGUE.runsPerWin) * 10) / 10;
}

/** WAR 구성 분해 - 화면이 "합계"라는 사실을 보여줄 때 쓴다 */
export function batterWarBreakdown(b: BatterStatLine, park: string) {
  const pf = (PARK_FACTORS[park] ?? 100) / 100;
  return {
    batting: r1(wraaOf(b) / pf),
    baserunning: bsrOf(b),
    fielding: r1(b.fieldingRuns),
    position: r1((b.positionAdj * b.pa) / 600),
    replacement: r1((LEAGUE.replacementRunsPer600PA * b.pa) / 600),
  };
}

export const eraOf = (p: PitcherStatLine) => r3(safe(p.er * 9, ipOf(p.ipOuts))) || 0;

export const whipOf = (p: PitcherStatLine) => r3(safe(p.h + p.bb, ipOf(p.ipOuts)));

/** 9이닝당 탈삼진 */
export const k9Of = (p: PitcherStatLine) => r1(safe(p.so * 9, ipOf(p.ipOuts)));

/** 삼진 비율 - 상대한 타자 대비. K/9보다 이닝 길이에 덜 흔들린다 */
export const kRateOf = (p: PitcherStatLine) => r3(safe(p.so, p.bf));
export const bbRateOf = (p: PitcherStatLine) => r3(safe(p.bb, p.bf));

/**
 * FIP - 수비 무관 평균자책점.
 *
 * 투수가 **혼자 통제할 수 있는 결과**(삼진·볼넷·사구·홈런)만으로 계산한 ERA 다.
 * 인플레이 타구의 결과는 수비와 운에 크게 좌우되므로 아예 계산에서 뺀다.
 * ERA 와 FIP 가 크게 벌어져 있으면 그 차이가 곧 "수비 도움 또는 불운"의 크기다.
 */
export function fipOf(p: PitcherStatLine): number {
  const ip = ipOf(p.ipOuts);
  const raw = safe(13 * p.hr + 3 * (p.bb + p.hbp) - 2 * p.so, ip);
  return r3(raw + LEAGUE.FIPConstant);
}

/**
 * 투수 WAR - FIP 기반.
 *
 * 대체선수 수준의 투수보다 몇 점을 덜 주었는지를 승수로 환산한다.
 * 선발과 불펜의 이닝 길이 차이는 IP 로 자연히 반영된다.
 */
export function pitcherWarOf(p: PitcherStatLine, park: string): number {
  const ip = ipOf(p.ipOuts);
  if (ip === 0) return 0;
  const pf = (PARK_FACTORS[park] ?? 100) / 100;
  // 구장 보정: 타자 친화 구장에서 던졌다면 FIP 를 낮춰(=잘한 것으로) 본다
  const adjFip = fipOf(p) / pf;
  const runsSaved = ((LEAGUE.ERA - adjFip) / 9) * ip;
  const replacement = (LEAGUE.replacementRunsPer180IP * ip) / 180;
  return Math.round(((runsSaved + replacement) / LEAGUE.runsPerWin) * 10) / 10;
}

// ─────────────────────────────────────────────────────────────
// 4. 신뢰도 - 심화 지표에서 가장 자주 생략되고 가장 중요한 것
// ─────────────────────────────────────────────────────────────

export type TrustLevel = 'high' | 'mid' | 'low';

/**
 * 지표별 안정화 표본.
 *
 * 지표마다 "믿을 만해지는 데 필요한 표본"이 다르다. 삼진율은 60타석이면 형태가 잡히지만
 * BABIP 는 한 시즌(600타석)으로도 부족하다. **이 차이를 표시하지 않고 값만 띄우면
 * 사용자는 BABIP .380 을 삼진율 25% 와 같은 무게로 읽는다** - 리뷰가 지적한
 * "BABIP 설명 수준 보완"의 실질이 여기에 있다.
 *
 * 출처: 세이버메트릭스 통설(신뢰도 0.5 도달 표본). KBO 재추정 필요.
 */
export const STABILIZATION_PA: Record<string, number> = {
  kRate: 60,
  bbRate: 120,
  hr: 170,
  woba: 300,
  wrcPlus: 300,
  babip: 820, // 한 시즌으로도 모자란다
  gbRate: 80,
  fbRate: 80,
};

export function trustOf(metric: string, sample: number): TrustLevel {
  const need = STABILIZATION_PA[metric] ?? 300;
  if (sample >= need) return 'high';
  if (sample >= need * 0.5) return 'mid';
  return 'low';
}

/** 신뢰도를 문장으로 - 화면이 값 옆에 그대로 붙인다 */
export function trustSentence(metric: string, sample: number): string {
  const need = STABILIZATION_PA[metric] ?? 300;
  const t = trustOf(metric, sample);
  if (t === 'high') return `표본 ${sample}타석 - 이 지표가 안정되는 ${need}타석을 넘겼습니다.`;
  if (t === 'mid')
    return `표본 ${sample}타석 - 안정 기준 ${need}타석의 절반은 넘겼지만 아직 흔들립니다.`;
  return `표본 ${sample}타석 - 안정 기준 ${need}타석에 한참 못 미칩니다. 이 값으로 선수를 판단하면 안 됩니다.`;
}
