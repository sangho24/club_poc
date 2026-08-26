// 내 티켓 - 예매한 경기와 거기 딸린 것들
//
// ── 왜 필요한가 ──────────────────────────────────────────────
// 직관 탭은 **예매하기 전**까지를 맡는다(언제 열리나, 어느 좌석이 얼마인가, 어디 대나).
// 그런데 예매를 마치고 나면 앱 안에 그 사실이 아무 데도 남지 않았다. 팬은 그 다음부터
// 문자와 메일함을 뒤진다. **표를 산 순간부터 경기장에 들어갈 때까지가 통째로 비어 있었다.**
//
// 실제 표는 티켓링크가 판다(계약상 대체 불가). 그래서 이 화면이 파는 척하지 않는다 -
// 예매 내역을 **받아 두고**, 그 위에 앱만 할 수 있는 것을 얹는다.
//   · 경기 당일 안내 알림 (출발 시각·주차 혼잡)
//   · 어느 게이트로 들어가는지 - 좌석 등급에서 나온다
//   · 조기 예매 쿠폰 - 아래 참조
//
// ── 조기 예매 쿠폰이 왜 말이 되는가 ─────────────────────────
// 구단은 좌석을 **일찍** 채워야 하고(잔여 예측·운영 인력·식음 발주가 거기 걸린다),
// 후원의 집은 경기 전후로 손님이 필요하다. 둘을 한 번에 푸는 것이 조기 예매 쿠폰이다 -
// 구단은 현금을 쓰지 않고 제휴 상권의 할인을 대신 얹어 주고, 가게는 확정된 손님을 받는다.
//
// ⚠ **선예매권이 아니다.** 한화는 암표 대응으로 등급별 선예매를 폐지했고, 그 결정을
//    되돌리자는 제안이 아니다. 이건 '먼저 살 권리'가 아니라 **이미 열린 표를 일찍 정한
//    사람에게 주는 동네 혜택**이라 판매 순서를 건드리지 않는다. 그 구분이 흐려지면
//    제안 자체가 폐지한 제도를 다시 들이는 것으로 읽힌다.
//
// ⚠ 시연용 샘플이다. 실서비스에서는 예매처 연동(또는 티켓 인증)이 이 배열을 채운다.
import { SCHEDULE, ScheduledGame, dateOf } from './game';
import { GATES, SEAT_GRADES, SeatGradeId } from './gameday';

export interface MyTicket {
  /** 예매한 경기 - `SCHEDULE` 의 date */
  date: string;
  gradeId: SeatGradeId;
  /** 좌석 표기. 등급명은 여기 적지 않는다 - `gradeId` 로 찾는다 */
  seat: string;
  count: number;
  /** 예매를 마친 시각. 조기 예매 쿠폰의 유일한 근거다 */
  bookedAt: string;
  /** 예매처 예약번호 */
  bookingNo: string;
}

export const MY_TICKETS: MyTicket[] = [
  {
    date: '08.12',
    gradeId: 's2',
    seat: '213블록 7열 12~13번',
    count: 2,
    // 오픈은 08.05 였는데 이틀 전에야 잡았다 - 쿠폰 문턱(3일) 아래로 떨어지는 예다
    bookedAt: '2026-08-10T21:40:00+09:00',
    bookingNo: 'TL-2608-104772',
  },
  {
    date: '08.15',
    gradeId: 's1',
    seat: 'F12 테이블',
    count: 2,
    // 오픈(08.08 14:00) 직후에 잡았다 - 경기 7일 전이라 얼리버드
    bookedAt: '2026-08-08T14:03:00+09:00',
    bookingNo: 'TL-2608-098310',
  },
];

/**
 * 조기 예매 쿠폰 등급.
 *
 * 문턱을 둘로만 나눴다. 세 단계 이상이면 팬이 표를 사는 시점에 계산을 해야 하는데,
 * 그건 이 혜택이 요구할 만한 수고가 아니다. **7일·3일**은 구단이 실제로 운영 계획을
 * 확정하는 시점(주간 발주·인력 배치)에 맞춘 값이다.
 *
 * ⚠ 할인율은 제안치다. 실제 값은 제휴 계약에서 정해진다.
 */
export interface EarlyBird {
  /** 경기 며칠 전까지 예매해야 하는가 */
  minDays: number;
  label: string;
  /** 후원의 집 할인율(%) */
  rate: number;
}

export const EARLY_BIRD: EarlyBird[] = [
  { minDays: 7, label: '얼리버드', rate: 15 },
  { minDays: 3, label: '미리예매', rate: 10 },
];

/** 경기까지 남은 일수. 날짜 단위라 시각은 자정으로 맞춘다 */
export function daysUntil(date: string, nowMs: number): number {
  const game = dateOf(date).getTime();
  const now = new Date(nowMs);
  now.setHours(0, 0, 0, 0);
  return Math.round((game - now.getTime()) / 86400000);
}

/** 예매 시점 기준으로 경기 며칠 전이었는가 */
export function bookedDaysAhead(t: MyTicket): number {
  return daysUntil(t.date, Date.parse(t.bookedAt));
}

/** 이 티켓이 받은 쿠폰. 문턱에 못 미치면 null */
export function earlyBirdOf(t: MyTicket): EarlyBird | null {
  const ahead = bookedDaysAhead(t);
  return EARLY_BIRD.find((e) => ahead >= e.minDays) ?? null;
}

/**
 * 쿠폰을 못 받은 티켓에 붙는 한 줄.
 *
 * 아무것도 안 적으면 팬은 이 혜택이 있는 줄도 모른다. 그렇다고 "놓쳤습니다"라고 쓰면
 * 자기 표를 여는 자리에서 지적을 받는 꼴이라, **다음에 어떻게 하면 되는지**만 말한다.
 */
export function earlyBirdHint(t: MyTicket): string | null {
  if (earlyBirdOf(t)) return null;
  const lowest = EARLY_BIRD[EARLY_BIRD.length - 1];
  return `경기 ${lowest.minDays}일 전까지 예매하면 후원의 집 ${lowest.rate}% 쿠폰이 함께 나옵니다`;
}

/** 티켓이 가리키는 경기 */
export function gameOf(t: MyTicket): ScheduledGame | undefined {
  return SCHEDULE.find((g) => g.date === t.date);
}

export const gradeOf = (t: MyTicket) => SEAT_GRADES.find((g) => g.id === t.gradeId);

/**
 * 이 좌석은 어느 문으로 들어가는가.
 *
 * `GATES` 가 "이 게이트는 어디를 맡는가"를 갖고 있지만 그건 **글**이라 좌석 등급에서
 * 자동으로 이어지지 않는다. 표를 든 팬의 질문은 반대 방향이다 - "내 자리는 몇 번 문인가".
 *
 * ⚠ `SeatGradeId` 로 열쇠를 잡았다. 좌석 등급을 하나 더하면 여기서 컴파일이 멈춘다 -
 * 짝을 빠뜨린 등급은 조용히 '문 없음'이 되고, 그건 표를 들고 헤매는 팬이 된다.
 */
export const GATE_FOR: Record<SeatGradeId, string> = {
  s1: '1번 게이트',
  s2: '1번 게이트',
  s3: '5번 게이트',
  s4: '3번 게이트',
  s5: '3번 게이트',
};

export const gateOf = (t: MyTicket) => GATES.find((g) => g.name === GATE_FOR[t.gradeId]);

/** 가까운 경기가 먼저. 지난 경기는 빼고 - 표는 쓰고 나면 기록('나의 직관')으로 넘어간다 */
export function upcomingTickets(nowMs: number): MyTicket[] {
  return MY_TICKETS.filter((t) => daysUntil(t.date, nowMs) >= 0).sort((a, b) =>
    a.date < b.date ? -1 : 1,
  );
}

/** 'D-3' · '내일' · '오늘' */
export function ddayLabel(date: string, nowMs: number): string {
  const d = daysUntil(date, nowMs);
  if (d === 0) return '오늘';
  if (d === 1) return '내일';
  return `D-${d}`;
}
