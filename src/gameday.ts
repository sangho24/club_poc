// 직관 준비 - 티켓 라우팅 · 주차 · 접근 경로
//
// ── 1차 리뷰 5번 ─────────────────────────────────────────────
// "티켓 리다이렉트야 그렇다 치더라도, 야구장 주변 주차장이나 접근 위치에 대한 소개도
//  있으면 좋을것 같습니다"
//
// ── 설계 판단: 주차는 '목록'이 아니라 '판단'을 줘야 한다 ─────
// 구장 주변 주차장을 나열하는 페이지는 이미 블로그에 많다. 앱이 그걸 그대로 옮기면
// 검색보다 나을 게 없다. 앱만 할 수 있는 것은 **경기 시작 시각과 지금 시각의 차이로
// "지금 출발하면 어디에 댈 수 있는지"를 좁혀 주는 것**이다.
//
// 대전 한화생명 볼파크는 2025년 개장한 신구장이라 팬들이 아직 주차 요령을 모른다.
// 그래서 이 기능의 가치가 다른 구장보다 크다.
import { ScheduledGame, dateOf } from './game';

export interface ParkingLot {
  id: string;
  name: string;
  /** 수용 대수 */
  capacity: number;
  /** 구장까지 도보 시간(분) */
  walkMinutes: number;
  /** 도보 거리(m) */
  walkMeters?: number;
  fee: string;
  /** 정렬용 숫자 요금. 표기(fee)만 두면 '무료'와 '5,000원'을 비교할 수 없다 */
  feeWon: number;
  /** 운영 방식 */
  policy: '선착순' | '사전예약' | '무료' | '조건부';
  /** 경기 시작 몇 분 전에 만차가 되는가 - 시연용 추정치 */
  fullBeforeMinutes: number;
  /** 이 주차장의 진짜 정보 - 나열이 아니라 판단을 주는 자리 */
  tip: string;
  /** 주의 사항 */
  caution?: string;
  /** 길찾기 딥링크용 좌표·검색어 */
  address: string;
  /** 출차 소요(분) - 경기 종료 후. 들어갈 때가 아니라 나올 때가 진짜 고통이다 */
  exitMinutes: number;
  /** 지금 남은 자리(추정) - 실서비스에서는 주차관제 연동 */
  liveOccupancy: number;
}

/**
 * 대전 한화생명 볼파크 주차 옵션.
 *
 * 출처: 구단 안내·대전시 보도자료(임시 공영주차장 82면 무료 개방)·직관 후기.
 * ⚠ 만차 예상 시각(fullBeforeMinutes)은 시연용 추정치다. 실서비스에서는 주차관제
 * 시스템 연동 또는 팬 제보 기반 크라우드소싱이 필요하다.
 */
export const PARKING_LOTS: ParkingLot[] = [
  {
    id: 'b1',
    name: '볼파크 지하주차장',
    capacity: 1220,
    walkMinutes: 2,
    fee: '경기당 5,000원',
    feeWon: 5000,
    policy: '선착순',
    fullBeforeMinutes: 90,
    address: '대전 한화생명 볼파크 지하주차장',
    exitMinutes: 35,
    liveOccupancy: 0.78,
    tip: '가장 크고 가장 가깝지만 그만큼 먼저 찹니다. 경기 시작 90분 전에는 들어와야 합니다.',
    caution: '경기 종료 후 한 번에 빠져나가느라 출차에 30분 이상 걸립니다.',
  },
  {
    id: 'g1',
    name: '볼파크 지상주차장',
    capacity: 459,
    walkMinutes: 3,
    fee: '경기당 5,000원',
    feeWon: 5000,
    policy: '선착순',
    fullBeforeMinutes: 100,
    address: '한밭종합운동장 주차장',
    exitMinutes: 15,
    liveOccupancy: 0.91,
    tip: '지하보다 먼저 찹니다. 출차는 지하보다 훨씬 빠릅니다.',
  },
  {
    id: 'p1',
    name: '대사문화공원 임시 공영주차장',
    capacity: 82,
    walkMinutes: 8,
    walkMeters: 580,
    fee: '무료',
    feeWon: 0,
    policy: '무료',
    fullBeforeMinutes: 120,
    address: '대전 중구 대사동 179-1',
    exitMinutes: 8,
    liveOccupancy: 0.96,
    tip:
      '대전시가 2026년 홈 개막에 맞춰 조성한 무료 주차장입니다. ' +
      '자리가 82면뿐이라 일찍 오는 사람만 씁니다.',
  },
  {
    id: 'm1',
    name: '문창초등학교 운동장',
    capacity: 120,
    walkMinutes: 6,
    fee: '무료',
    feeWon: 0,
    policy: '조건부',
    fullBeforeMinutes: 60,
    address: '대전 중구 문창초등학교',
    exitMinutes: 6,
    liveOccupancy: 0.44,
    tip:
      '구장 건너편이라 가깝고, 무엇보다 경기 후 빠져나가는 차량 동선과 엉키지 않습니다. ' +
      '출차 시간을 아끼려는 사람들이 먼저 찾는 자리입니다.',
    caution: '주말에만 개방합니다. 평일 경기에는 이용할 수 없습니다.',
  },
];

// ─────────────────────────────────────────────────────────────
// 좌석·예매 - 앱이 예매 '앞단'에서 할 수 있는 일
// ─────────────────────────────────────────────────────────────

/**
 * 좌석 등급.
 *
 * 예매 자체는 티켓링크로 넘기지만, **어느 등급이 얼마이고 지금 얼마나 남았는지**는
 * 앱이 보여줄 수 있다. 예매처로 넘어가기 전에 이걸 알면 팬은 이미 결정을 마치고
 * 넘어가게 되고, 그게 "앱이 예매 앞단을 소유한다"는 말의 실질이다.
 */
export interface SeatGrade {
  id: string;
  name: string;
  price: number;
  /** 남은 좌석 비율 (0~1) - 실서비스에서는 예매처 API */
  remainRatio: number;
  note: string;
}

/**
 * ⚠ `as const satisfies` 인 이유: 아래 id 들이 그대로 타입(`SeatGradeId`)이 되어,
 * 등급을 하나 더하면 좌석 시야 매핑(`src/seatView.ts`)에서 컴파일이 멈춘다.
 * 그냥 `SeatGrade[]` 로 두면 id 가 string 이라 짝을 빠뜨려도 아무도 모른다.
 */
export const SEAT_GRADES = [
  {
    id: 's1',
    name: '중앙 테이블석',
    price: 45000,
    remainRatio: 0.04,
    note: '2인 테이블 · 백네트 뒤',
  },
  {
    id: 's2',
    name: '1루 내야지정석',
    price: 18000,
    remainRatio: 0.22,
    note: '홈 응원석 · 육성 응원 구역',
  },
  { id: 's3', name: '3루 내야지정석', price: 18000, remainRatio: 0.61, note: '원정 응원석' },
  {
    id: 's4',
    name: '외야지정석',
    price: 12000,
    remainRatio: 0.48,
    note: '가족 단위 · 응원 소음 적음',
  },
  { id: 's5', name: '잔디석', price: 9000, remainRatio: 0.73, note: '돗자리 지참 · 지정석 아님' },
] as const satisfies readonly SeatGrade[];

/** 등급 id - 등급마다 하나씩 짝이 있어야 하는 표(좌석 시야 등)의 열쇠 */
export type SeatGradeId = (typeof SEAT_GRADES)[number]['id'];

/**
 * 예매 오픈 시각 - 규칙을 계산으로 옮긴 것.
 *
 * 전에는 `TICKET_OPEN_AT = '2026-08-14T14:00'` 하나가 박혀 있었다. 일정이 목록으로만
 * 있고 아무것도 누를 수 없을 때는 그걸로 충분했지만, **경기를 골라 예매로 넘어가게
 * 되자 상수 하나로는 답할 수 없다** - 어느 경기를 눌러도 같은 날짜를 말하면 그건
 * 규칙이 아니라 장식이다.
 *
 * 규칙 자체는 이미 `TICKET_CHANNEL.openRule` 에 글로 적혀 있었다(홈경기 7일 전 오후 2시).
 * 글과 값이 따로 놀면 둘 중 무엇이 맞는지 알 수 없으므로 **값을 규칙에서 뽑는다.**
 *
 * ⚠ 원정 경기는 `null` 이다. 상대 구단이 파는 표라 우리 앱이 오픈 시각을 알지 못한다.
 * '아직 안 열림'과 '우리가 팔지 않음'은 화면에서 다른 말을 해야 한다.
 */
export const TICKET_OPEN_LEAD_DAYS = 7;
export const TICKET_OPEN_HOUR = 14;

export function ticketOpenAt(g: ScheduledGame): number | null {
  if (!g.home) return null;
  const d = dateOf(g.date);
  d.setDate(d.getDate() - TICKET_OPEN_LEAD_DAYS);
  d.setHours(TICKET_OPEN_HOUR, 0, 0, 0);
  return d.getTime();
}

export function isTicketOpen(g: ScheduledGame, nowMs: number): boolean {
  const at = ticketOpenAt(g);
  return at !== null && at <= nowMs;
}

/** '8월 18일 오후 2시' - 아직 열리지 않은 경기의 오픈 시각 */
export function ticketOpenLabel(g: ScheduledGame): string | null {
  const at = ticketOpenAt(g);
  if (at === null) return null;
  const d = new Date(at);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 오후 ${TICKET_OPEN_HOUR - 12}시`;
}

// ─────────────────────────────────────────────────────────────
// 입장 - 구장에 도착한 뒤
// ─────────────────────────────────────────────────────────────

export interface GateInfo {
  name: string;
  serves: string;
  crowd: 'low' | 'mid' | 'high';
  note: string;
}

export const GATES: GateInfo[] = [
  {
    name: '1번 게이트',
    serves: '1루 내야 · 중앙',
    crowd: 'high',
    note: '주차장에서 가장 가까워 줄이 깁니다',
  },
  {
    name: '3번 게이트',
    serves: '외야 · 잔디석',
    crowd: 'low',
    note: '돌아가지만 대기가 거의 없습니다',
  },
  { name: '5번 게이트', serves: '3루 내야', crowd: 'mid', note: '원정 팬 동선' },
];

/** 반입 규정 - 구장에서 되돌아가는 일을 막는다 */
export const BRING_RULES = {
  allowed: ['페트병 음료(1L 이하)', '외부 음식', '돗자리(잔디석)', '응원 도구'],
  denied: ['캔·유리병', '주류 반입', '우산(장우산)', '삼각대·셀카봉'],
};

export interface TransitRoute {
  mode: '지하철' | '버스' | '기차' | '도보';
  label: string;
  detail: string;
  minutes?: number;
}

export const TRANSIT: TransitRoute[] = [
  {
    mode: '기차',
    label: '대전역 하차',
    detail: '대전역에서 택시 15분. 원정 팬은 KTX로 와서 택시를 타는 동선이 가장 단순합니다.',
    minutes: 15,
  },
  {
    mode: '버스',
    label: '한밭종합운동장 정류장',
    detail: '구장 바로 앞에 정차합니다. 경기 종료 후에는 정류장에 줄이 길어집니다.',
  },
  {
    mode: '도보',
    label: '서대전역 방면',
    detail: '서대전역에서 도보 약 25분. 걸어올 만한 거리는 아니지만 택시 잡기는 쉽습니다.',
    minutes: 25,
  },
];

/**
 * 지금 출발하면 어디에 댈 수 있는가.
 *
 * 이 함수가 이 화면의 존재 이유다. 목록을 그대로 보여주는 대신 **남은 시간으로 걸러서**
 * "여기는 이미 늦었다 / 여기는 아직 자리가 있다"를 말한다.
 */
export interface ParkingAdvice {
  lot: ParkingLot;
  status: 'open' | 'tight' | 'late';
  /** 목록 행에 붙는 한 줄 상태. 문장이 아니라 값이다 - 같은 문장이 행마다 반복되면 기계 느낌이 난다 */
  summary: string;
}

/**
 * 팬이 고르는 축.
 *
 * ── 왜 시간 칩을 없앴는가 ───────────────────────────────────
 * 전에는 `180 / 120 / 90 / 60분` 칩으로 남은 시간을 **사용자가 골랐다.** 세 가지가 틀렸다.
 *   ① 간격에 기준이 없다 (180→120 은 60분, 120→90 과 90→60 은 30분)
 *   ② 앱은 경기 시각도 현재 시각도 안다. 남은 시간은 **고르는 값이 아니라 이미 아는 값**이다
 *   ③ 팬의 질문이 다르다. "180분 전에는 어떤가"가 아니라 "지금 출발하면 어디에 댈 수 있나"다
 *
 * 주차는 결국 셋 중 하나를 포기하는 선택이다 - 거리 · 요금 · 빠져나오는 시간.
 * 그래서 축을 시간이 아니라 **무엇을 아쉬워할 것인가**로 바꾼다.
 */
export type ParkingSort = 'near' | 'cheap' | 'exit';

export const PARKING_SORTS: { key: ParkingSort; label: string }[] = [
  { key: 'near', label: '가까운 순' },
  { key: 'cheap', label: '저렴한 순' },
  { key: 'exit', label: '빨리 나오는 순' },
];

/**
 * 만차 예측의 출처.
 *
 * ⚠ **추정치를 실시간인 척 보여주면 안 된다.** "20분 뒤 만차"가 빗나가면 팬은 그 뒤로
 * 이 화면을 통째로 안 믿는다. 근거를 같이 적어야 틀렸을 때도 신뢰가 남는다 -
 * 이 앱이 심화 지표에 표본 신뢰도를 붙인 것과 같은 원칙이다.
 *
 * 실서비스의 출처 후보는 셋이다.
 *   · 주차관제 연동 - 정확하지만 주차장마다 사업자가 달라 볼파크 자체 주차장만 현실적
 *   · 과거 입차 패턴 + 요일·상대팀·날씨 - 구단이 자체 데이터를 가지면 바로 가능. 가장 현실적
 *   · 팬 도착 체크인 - 직관 인증에 이미 붙어 있어 쉽지만, 표본이 희박해 보정용으로만
 */
export const PARKING_BASIS = '지난 시즌 같은 요일 입차 패턴 기준 추정';

export function parkingAdvice(
  minutesToGameStart: number,
  sort: ParkingSort = 'near',
): ParkingAdvice[] {
  const rows = PARKING_LOTS.map((lot) => {
    const margin = minutesToGameStart - lot.fullBeforeMinutes;
    let status: ParkingAdvice['status'];
    let summary: string;

    if (margin > 20) {
      status = 'open';
      summary = '여유';
    } else if (margin > -15) {
      status = 'tight';
      // 남은 시간을 그대로 말한다. "경기 90분 전이면 만차"는 팬이 다시 빼야 하는 값이다
      summary = margin > 0 ? `${margin}분 뒤 만차` : '곧 만차';
    } else {
      status = 'late';
      summary = '만차 예상';
    }
    return { lot, status, summary };
  });

  // 정렬 기준이 곧 팬이 포기하기로 한 것이다. 만차 예상은 어느 기준에서도 아래로 민다 -
  // 못 가는 곳이 1등으로 올라오면 정렬이 거짓말이 된다
  const byRank = (a: ParkingAdvice, b: ParkingAdvice) => {
    const rank = { open: 0, tight: 1, late: 2 };
    return rank[a.status] - rank[b.status];
  };
  const key = {
    near: (a: ParkingAdvice) => a.lot.walkMinutes,
    cheap: (a: ParkingAdvice) => a.lot.feeWon,
    exit: (a: ParkingAdvice) => a.lot.exitMinutes,
  }[sort];

  return rows.sort((a, b) => byRank(a, b) || key(a) - key(b));
}

/**
 * 경기 시작까지 남은 분.
 *
 * 시연은 아무 때나 열린다. 실제 시각으로 계산하면 새벽에는 음수가, 아침에는 열 시간이
 * 나와서 화면이 말이 안 된다. 그래서 범위를 벗어나면 기준값으로 잡고 **그 사실을 표시한다** -
 * 조용히 바꿔치기하면 시연에서 "지금 몇 시인데 저 숫자가 왜 저래요?"가 나온다.
 */
export function minutesToStart(
  startTime: string,
  now: Date,
): { minutes: number; assumed: boolean } {
  const [h, m] = startTime.split(':').map(Number);
  const diff = (h * 60 + m - (now.getHours() * 60 + now.getMinutes()) + 1440) % 1440;
  if (diff < 15 || diff > 240) return { minutes: 107, assumed: true };
  return { minutes: diff, assumed: false };
}

// ─────────────────────────────────────────────────────────────
// 티켓 - 예매는 위임하고 길목만 잡는다
// ─────────────────────────────────────────────────────────────

/**
 * 예매는 앱 안에서 처리하지 않는다.
 *
 * KBO 티켓 판매는 NOL(LG·두산·키움) / 티켓링크(6개 구단) / 롯데 자체로 3원화되어 있어
 * 예매 자체를 대체하는 것은 계약상 비현실적이다. 49ers 앱도 인증·구매를 Ticketmaster
 * 웹뷰로 넘긴다. 앱의 자리는 **예매 앞(언제 열리는지 알려주기)과 뒤(입장 후 경험)**다.
 */
export interface TicketChannel {
  team: string;
  channel: string;
  url: string;
  openRule: string;
}

export const TICKET_CHANNEL: TicketChannel = {
  team: '한화 이글스',
  channel: '티켓링크',
  url: 'https://www.ticketlink.co.kr/sports/137',
  openRule: '홈경기 기준 7일 전 오후 2시 오픈',
};

// ─────────────────────────────────────────────────────────────
// 외부 앱 연결 - 앱이 직접 못 하는 일은 잘 넘긴다
// ─────────────────────────────────────────────────────────────

/**
 * 지도 길찾기 링크.
 *
 * 지도를 앱 안에 그리지 않는다. 국내 팬은 이미 네이버·카카오 지도를 쓰고 있고,
 * 실시간 교통까지 얹은 길찾기를 우리가 다시 만들 이유가 없다. **넘기되 잘 넘긴다** -
 * 목적지가 이미 채워진 상태로 열리면 그건 이탈이 아니라 연결이다.
 */
export function naverMapUrl(query: string): string {
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}

export function kakaoMapUrl(query: string): string {
  return `https://map.kakao.com/?q=${encodeURIComponent(query)}`;
}

export function telUrl(phone: string): string {
  return `tel:${phone.replace(/-/g, '')}`;
}
