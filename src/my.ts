// MY 탭 - 나의 직관 기록 (kbo_poc S2 정체성 원장의 구단 앱 라이트판)
//
// kbo_poc 에서 그대로 가져온 원칙: **승률·횟수는 저장하지 않고 기록에서 매번 집계한다.**
// 집계값을 따로 저장하면 기록과 어긋날 여지가 생긴다.
//
// 기록 자체는 시연용 샘플이다. 실제 앱에서는 직관 인증(QR·위치)이 이 배열을 채운다.

export interface AttendanceRecord {
  date: string; // 'MM.DD'
  opponent: string;
  /** 우리 팀 기준 결과 */
  result: 'W' | 'L';
  /** 우리 점수:상대 점수 */
  score: string;
  /** 앉은 자리 - 팬의 기억은 좌석 단위로 남는다 */
  seat: string;
}

export const ATTENDANCE: AttendanceRecord[] = [
  { date: '08.09', opponent: 'LG', result: 'L', score: '2:5', seat: '1루 내야지정석 213블록' },
  { date: '07.26', opponent: '삼성', result: 'W', score: '7:4', seat: '외야지정석 101블록' },
  { date: '07.12', opponent: 'KT', result: 'W', score: '5:3', seat: '중앙 테이블석 F12' },
  { date: '06.28', opponent: '롯데', result: 'L', score: '1:6', seat: '1루 내야지정석 214블록' },
  { date: '06.14', opponent: 'NC', result: 'W', score: '8:2', seat: '잔디석' },
];

export function attendanceSummary(records: AttendanceRecord[]) {
  const games = records.length;
  const wins = records.filter((r) => r.result === 'W').length;
  const losses = games - wins;
  const winRate = games === 0 ? 0 : wins / games;
  return { games, wins, losses, winRate };
}

/**
 * 직관 승률이 팀 시즌 승률과 얼마나 다른가.
 *
 * 팬이 가장 하고 싶어 하는 말("내가 가면 이긴다")을 앱이 대신 해 주는 자리다.
 * **다만 단정하지 않는다.** 5경기 승률 .600 은 3승 2패일 뿐이고, 한 경기만 뒤집혀도
 * .400 이 된다. 심화 지표에 표본 신뢰도를 붙인 것과 같은 원칙을 여기에도 건다 -
 * 팬이 재미로 보는 값이어도 앱이 근거 없이 단정하면 다른 수치까지 못 믿게 된다.
 *
 * 기준 30경기: 시즌 144경기의 약 1/5 이고, 이항분포에서 승률 차이 0.1 이 우연과
 * 구분되기 시작하는 대략의 지점이다.
 */
export function attendanceEdge(records: AttendanceRecord[], teamWinRate: number) {
  const { games, winRate } = attendanceSummary(records);
  const diff = winRate - teamWinRate;
  return {
    diff,
    /** 이만큼 더 봐야 '경향'이라고 말할 수 있다 */
    gamesToTrust: Math.max(0, 30 - games),
    settled: games >= 30,
  };
}

/**
 * 가장 자주 앉은 좌석 등급.
 *
 * 좌석 문자열은 '1루 내야지정석 213블록'처럼 등급 + 블록이라, 등급명으로 앞을 맞춰
 * 자른다. **등급 목록을 여기서 새로 만들지 않고 예매 화면과 같은 것을 쓴다** -
 * 따로 두면 예매에 없는 등급이 MY 에만 생기는 날이 온다.
 */
export function seatHabit(records: AttendanceRecord[], gradeNames: readonly string[]) {
  const count = new Map<string, number>();
  for (const r of records) {
    const g = gradeNames.find((n) => r.seat.startsWith(n));
    if (g) count.set(g, (count.get(g) ?? 0) + 1);
  }
  let top: { name: string; times: number } | null = null;
  for (const [name, times] of count) {
    if (!top || times > top.times) top = { name, times };
  }
  return top;
}

// ─────────────────────────────────────────────────────────────
// 멤버십 등급 - 상단바가 들고 있을 '변하는 값'
// ─────────────────────────────────────────────────────────────
//
// 상단바에 홈구장 이름("대전 한화생명 볼파크")이 박혀 있었다. 홈구장은 바뀌지 않으므로
// 매 화면 같은 값을 반복하면서 가장 비싼 자리를 쓰고 있었다. 그 자리는 **변하는 것**이
// 가져가야 한다.
//
// 등급은 저장하지 않고 직관 기록에서 매번 집계한다 - 이 파일 맨 위의 원칙과 같다.
// 집계값을 따로 저장하면 기록과 어긋날 여지가 생긴다.

export interface MemberTier {
  label: string;
  /** 이 등급에 들어가는 최소 직관 횟수 */
  from: number;
}

/** 구단 멤버십은 보통 시즌 단위 누적 직관/구매로 나뉜다 */
export const MEMBER_TIERS: MemberTier[] = [
  { label: 'ROOKIE', from: 0 },
  { label: 'BLUE', from: 3 },
  { label: 'GOLD', from: 5 },
  { label: 'LEGEND', from: 10 },
];

export function membershipOf(games: number) {
  // 뒤에서부터 훑어 조건을 만족하는 첫 등급이 현재 등급이다
  const idx = [...MEMBER_TIERS].reverse().findIndex((t) => games >= t.from);
  const current = MEMBER_TIERS[MEMBER_TIERS.length - 1 - idx];
  const next = MEMBER_TIERS[MEMBER_TIERS.length - idx];
  return {
    tier: current,
    next,
    /** 다음 등급까지 남은 직관 수 - 없으면 최고 등급 */
    toNext: next ? next.from - games : 0,
  };
}
