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
 * 가장 자주 앉은 좌석 등급.
 *
 * 좌석 문자열은 '1루 내야지정석 213블록'처럼 등급 + 블록이라, 등급명으로 앞을 맞춰
 * 자른다. **등급 목록을 여기서 새로 만들지 않고 예매 화면과 같은 것을 쓴다** -
 * 따로 두면 예매에 없는 등급이 MY 에만 생기는 날이 온다.
 */
export function seatHabit<G extends { id: string; name: string }>(
  records: AttendanceRecord[],
  grades: readonly G[],
) {
  const count = new Map<string, number>();
  for (const r of records) {
    const g = grades.find((x) => r.seat.startsWith(x.name));
    if (g) count.set(g.id, (count.get(g.id) ?? 0) + 1);
  }
  let top: { grade: G; times: number } | null = null;
  for (const [id, times] of count) {
    const grade = grades.find((x) => x.id === id);
    if (grade && (!top || times > top.times)) top = { grade, times };
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
  /**
   * 경기 시작 몇 분 전부터 입장할 수 있는가.
   *
   * ⚠ **선예매 차등을 쓰지 않은 이유.** 한화는 선예매를 폐지했다 - 암표·매크로 대응이
   * 명분이다. 등급으로 예매를 먼저 열어 주는 설계는 그 정책과 정면으로 부딪히므로,
   * 차등을 **구장 안 동선**으로 옮겼다. 한화가 이미 주말 30분 선입장을 운영하고 있어
   * 제도 위에 얹는 것이지 새로 만드는 것이 아니다.
   */
  earlyEntryMinutes: number;
  /** 굿즈 할인율 (0.05 = 5%) */
  goodsDiscount: number;
  /**
   * 이 등급에서 **지금 누리는 것 전부.**
   *
   * ⚠ 누적으로 쌓지 않는다. 입장 시간과 할인율은 상위 등급이 하위를 **대체**하는
   * 혜택이라, 아래 등급 것을 그대로 물려받게 두면 화면에 "30분 먼저 입장"과
   * "1시간 먼저 입장"이 나란히 서서 어느 쪽이 내 것인지 알 수 없게 된다.
   * 등급마다 전부 적는 대신 목록이 언제나 그 등급의 진실이다.
   */
  perks: string[];
  /** 이 등급에 올라오면서 **새로 생긴** 것. 다음 등급을 왜 올리는지 말할 때 쓴다 */
  unlocks: string[];
}

/**
 * 멤버십 등급.
 *
 * ── 왜 직관 횟수인가 ────────────────────────────────────────
 * 연회비를 받는 구조로 두면 앱은 결제 창구가 되고 끝난다. **직관 횟수를 기준으로 두면
 * 등급을 올리는 행동이 곧 티켓 구매**라, 앱이 "한 번 더 가면 LEGEND"라고 말할 때마다
 * 구단 매출로 이어진다. 굿즈 판매와 다른 축의 수익 구조다.
 *
 * ⚠ **콘텐츠는 잠그지 않는다.** 심화 지표·승부 예측은 등급과 무관하게 전부 열려 있다.
 * 그건 이 앱을 여는 이유이고, 잠그는 순간 팬이 앱을 안 쓴다. 등급이 가르는 것은
 * "무엇을 볼 수 있나"가 아니라 **"무엇을 먼저·싸게 할 수 있나"**다.
 *
 * ── 조사로 걸러낸 것 ────────────────────────────────────────
 * **KBO 어느 구단도 누적 직관으로 승급하는 등급제를 운영하지 않는다.** 대부분 연회비를
 * 내고 시즌마다 새로 가입하는 구조다(삼성의 등급포인트 승급제는 현행 여부가 확인되지
 * 않아 근거로 쓰지 않았다). 그래서 이건 벤치마크가 아니라 **아직 아무도 하지 않은 자리**다.
 *
 * ⚠ 원정 버스 우선권·사인회 등급 차등은 어느 구단 공식 소스에서도 확인되지 않아 뺐다.
 * 확인되지 않은 혜택을 넣으면 파트너가 "이건 어디 근거냐"고 물었을 때 답할 수 없다.
 *
 * ⚠ 등급명과 수치는 시연용이다. 실서비스에서는 구단 회원 제도를 그대로 받아야 한다.
 */
export const MEMBER_TIERS: MemberTier[] = [
  {
    label: 'ROOKIE',
    from: 0,
    earlyEntryMinutes: 0,
    goodsDiscount: 0,
    perks: ['경기 알림', '직관 기록'],
    unlocks: ['경기 알림', '직관 기록'],
  },
  {
    label: 'BLUE',
    from: 3,
    earlyEntryMinutes: 30,
    goodsDiscount: 0.03,
    perks: ['경기 알림', '직관 기록', '30분 먼저 입장', '굿즈 3% 할인'],
    unlocks: ['30분 먼저 입장', '굿즈 3% 할인'],
  },
  {
    label: 'GOLD',
    from: 5,
    earlyEntryMinutes: 60,
    goodsDiscount: 0.05,
    perks: ['경기 알림', '직관 기록', '1시간 먼저 입장', '굿즈 5% 할인', '제휴 가게 쿠폰'],
    unlocks: ['입장이 1시간 먼저로', '굿즈 할인 5% 로', '제휴 가게 쿠폰'],
  },
  {
    label: 'LEGEND',
    from: 10,
    earlyEntryMinutes: 60,
    goodsDiscount: 0.1,
    perks: [
      '경기 알림',
      '직관 기록',
      '1시간 먼저 입장',
      '전용 게이트 입장',
      '굿즈 10% 할인',
      '제휴 가게 쿠폰',
      '시즌 기념품',
    ],
    unlocks: ['전용 게이트 입장', '굿즈 할인 10% 로', '시즌 기념품'],
  },
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
