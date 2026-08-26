// 굿즈 - 네 갈래로 나뉜다
//
// ── 1차 리뷰 7번 ─────────────────────────────────────────────
// "개별 구단에서 발매하는 각종 기념 굿즈에 대한 알림을 띄우는 화면, 그리고 클릭하면
//  리다이렉트 되는 기능도 추가해봅시다"
//
// 처음에는 이 화면이 **발매 소식 한 줄기**였다. 사건(은퇴·기록 달성·헤리티지 데이)마다
// 드롭 카드를 하나씩 세워 시간순으로 늘어놓았는데, 그러면 성격이 전혀 다른 네 가지가
// 같은 카드 모양으로 섞인다. 팬이 굿즈를 찾는 질문은 하나가 아니다.
//
//   ① 오늘 경기장에 왔는데 여기서만 살 수 있는 게 뭐지  → 오프라인 한정
//   ② 노시환 200홈런 언제 치지, 기념 MD 예약 못 놓치나  → 특별 MD
//   ③ 올해 유니폼 뭐 나왔지                             → 유니폼
//   ④ 응원 타월이랑 키링 하나 사자                      → 기타 굿즈
//
// 네 질문은 **필요한 정보가 서로 다르다.** ①은 내가 그날 그 자리에 있었는지가 전부이고,
// ②는 아직 일어나지 않은 기록의 진행률이며, ③④는 사실상 카탈로그다. 그래서 자료 구조도
// 하나로 합치지 않고 넷으로 나눈다 - 억지로 한 타입에 밀어 넣으면 필드의 절반이 늘 빈다.
//
// ⚠ **결제는 앱에서 하지 않는다.** 공식몰로 리다이렉트한다 - 5번 티켓과 같은 원칙이다.
// 앱은 백링크 직전까지, 즉 **고를 수 있게 하는 데까지만** 한다.
// (커머스 자체의 설계·수익 분배는 호석쌤 담당 1번 산출물을 따른다)

import { ATTENDANCE, AttendanceRecord } from './my';

/** 공식몰 - 리다이렉트는 전부 여기로 모인다 */
export const OFFICIAL_SHOP = 'https://www.hanwhaeagles.co.kr/SH/PCSH01.do';
export const OFFICIAL_SHOP_NAME = '이글스 공식몰';

export type GoodsCategory = 'venue' | 'milestone' | 'uniform' | 'merch';

/**
 * 격자 순서는 **희소성 순**이다 - 왼쪽 위에서 오른쪽 아래로 읽는 순서.
 *
 * 오프라인 한정은 오늘 못 사면 영영 못 산다. 특별 MD 는 예약 창이 닫히면 끝난다.
 * 유니폼·기타는 내일도 있다. 급한 것이 먼저 읽혀야 순서가 우선순위를 대신 말한다.
 */
export const CATEGORIES: {
  key: GoodsCategory;
  label: string;
  /** 격자 타일의 이름 아래 한 줄. 들어가기 전에 무엇이 있는 곳인지 말한다 */
  blurb: string;
}[] = [
  {
    key: 'venue',
    label: '오프라인 한정',
    blurb: '그날 경기장에 있었던 사람만 살 수 있는 카드입니다.',
  },
  {
    key: 'milestone',
    label: '특별 MD',
    blurb: '기록 달성을 기다리는 굿즈입니다. 가까워지면 예약이 열립니다.',
  },
  {
    key: 'uniform',
    label: '유니폼',
    blurb: '지금 공식몰에 올라와 있는 유니폼입니다.',
  },
  {
    key: 'merch',
    label: '기타 굿즈',
    blurb: '공식몰에서 판매 중인 상품입니다.',
  },
];

/** 판매 상태 - 유니폼·기타 굿즈가 공유한다 */
export type StockStatus = 'onsale' | 'lowstock' | 'soldout' | 'upcoming';

export type BadgeTone = 'brand' | 'live' | 'muted' | 'win' | 'warn';

export function stockLabel(s: StockStatus): string {
  return { onsale: '판매 중', lowstock: '품절 임박', soldout: '품절', upcoming: '발매 예정' }[s];
}

export function stockTone(s: StockStatus): BadgeTone {
  const map: Record<StockStatus, BadgeTone> = {
    onsale: 'win',
    lowstock: 'warn',
    soldout: 'muted',
    upcoming: 'brand',
  };
  return map[s];
}

// ═════════════════════════════════════════════════════════════
// ① 오프라인 한정 - 그날의 포토카드
// ═════════════════════════════════════════════════════════════
//
// 구단 MD 중 온라인으로 옮길 수 없는 것이 하나 있다. **그날 그 자리에 있었다는 증거**다.
// 포토카드 자체는 인쇄물이지만, 살 자격이 직관에 묶이는 순간 이건 상품이 아니라 기념품이
// 된다. 그래서 이 갈래만 앱이 결제 직전까지가 아니라 **자격 판정까지** 맡는다.
//
// 자격은 이미 앱 안에 있다 - MY 탭의 직관 기록이다. 별도의 인증 절차를 새로 만들지 않고
// 그 기록을 그대로 열쇠로 쓴다. **앱이 이미 아는 것을 다시 묻지 않는다.**
//
// ── 왜 경기가 끝나야 카드가 정해지는가 ───────────────────────
// 카드에 박히는 것은 선수가 아니라 **그날의 장면**이다. 8월 9일 카드는 진 경기지만
// 노시환의 8회 솔로가 남는다. 경기 전에 장면을 정할 수 없으므로 오늘 경기의 카드는
// 수량만 선점하고 도안은 종료 후에 확정된다.

/** 경기일로부터 이만큼 지나면 판매를 닫는다 - 기념품은 기억이 뜨거울 때만 팔린다 */
export const PHOTOCARD_WINDOW_DAYS = 30;

export interface PhotoCard {
  id: string;
  /** 경기 시각 (ISO · KST). 직관 기록과 맞대는 열쇠이자 판매 기한의 기준점 */
  gameAt: string;
  opponent: string;
  /** 원정 경기 카드는 만들지 않는다 - 홈 MD샵이 발행처다 */
  stadium: string;
  /** 경기 결과 - 아직 끝나지 않았으면 없다 */
  result?: { ours: number; theirs: number; win: boolean };
  /**
   * 카드에 박히는 장면. 경기가 끝나야 정해지므로 result 와 함께 온다.
   * 진 경기에도 장면은 남는다 - 이긴 날만 카드를 내면 그건 기념품이 아니라 전리품이다.
   */
  moment?: { playerId: string; playerName: string; line: string };
  price: number;
  /** 그날 발행 수량. 그날 관중 수를 넘지 않는다 */
  issued?: number;
  remain?: number;
}

/**
 * ※ 시연용 샘플 데이터입니다.
 * 경기 결과는 src/game.ts 의 RECENT · src/my.ts 의 ATTENDANCE 와 맞춰 두었습니다 -
 * 같은 경기가 화면마다 다른 점수로 나오면 앱이 자기 말을 뒤집습니다.
 */
export const PHOTOCARDS: PhotoCard[] = [
  {
    // 오늘 경기 - 8회말 진행 중이라 장면이 아직 없다
    id: 'pc0811',
    gameAt: '2026-08-11T18:30:00+09:00',
    opponent: 'LG',
    stadium: '대전 한화생명 볼파크',
    price: 9000,
  },
  {
    id: 'pc0809',
    gameAt: '2026-08-09T17:00:00+09:00',
    opponent: 'LG',
    stadium: '대전 한화생명 볼파크',
    result: { ours: 2, theirs: 5, win: false },
    moment: { playerId: 'nsh', playerName: '노시환', line: '8회말 좌월 솔로 - 시즌 25호' },
    price: 9000,
    issued: 4200,
    remain: 318,
  },
  {
    // 직관 기록에 없는 날 - 이 카드가 잠겨 있는 것이 이 갈래의 규칙을 증명한다
    id: 'pc0808',
    gameAt: '2026-08-08T18:30:00+09:00',
    opponent: 'KT',
    stadium: '대전 한화생명 볼파크',
    result: { ours: 6, theirs: 4, win: true },
    moment: { playerId: 'ksh', playerName: '김서현', line: '9회 세 타자 연속 삼진 - 15세이브' },
    price: 9000,
    issued: 3800,
    remain: 902,
  },
  {
    id: 'pc0726',
    gameAt: '2026-07-26T17:00:00+09:00',
    opponent: '삼성',
    stadium: '대전 한화생명 볼파크',
    result: { ours: 7, theirs: 4, win: true },
    moment: { playerId: 'kbh', playerName: '강백호', line: '6회말 만루홈런 - 한 이닝 4타점' },
    price: 9000,
    issued: 4400,
    remain: 61,
  },
  {
    // 판매 기한이 하루도 남지 않았다 - 마감 임박 알림이 여기서 나온다
    id: 'pc0712',
    gameAt: '2026-07-12T18:30:00+09:00',
    opponent: 'KT',
    stadium: '대전 한화생명 볼파크',
    result: { ours: 5, theirs: 3, win: true },
    moment: { playerId: 'ryu', playerName: '류현진', line: '7이닝 무실점 - 통산 97승' },
    price: 9000,
    issued: 4100,
    remain: 143,
  },
  {
    // 기한이 지났다 - 직관 기록이 있어도 살 수 없다
    id: 'pc0628',
    gameAt: '2026-06-28T17:00:00+09:00',
    opponent: '롯데',
    stadium: '대전 한화생명 볼파크',
    result: { ours: 1, theirs: 6, win: false },
    moment: { playerId: 'mhb', playerName: '문현빈', line: '3안타 - 팀 안타의 절반' },
    price: 9000,
    issued: 4000,
    remain: 0,
  },
];

/**
 * 살 수 있는지, 없다면 왜 없는지.
 *
 * 상태를 불리언 몇 개로 흩어 두면 화면이 조건을 다시 조합하게 되고, 그러면 같은 판정이
 * 목록과 상세에서 어긋난다. **판정은 여기서 한 번만 한다.**
 */
export type CardGate =
  | 'pending' // 경기가 아직 안 끝났다 - 도안 미확정, 수량만 선점
  | 'open' // 그날 갔고 · 기한 안이고 · 남아 있다
  | 'soldout'
  | 'locked' // 그날 가지 않았다
  | 'closed'; // 판매 기한이 지났다

/** 'MM.DD' - 직관 기록과 맞대는 열쇠. Date 를 거치면 실행 환경의 시간대를 탄다 */
export function gameKey(card: PhotoCard): string {
  return `${card.gameAt.slice(5, 7)}.${card.gameAt.slice(8, 10)}`;
}

export function photocardCloseAt(card: PhotoCard): number {
  return Date.parse(card.gameAt) + PHOTOCARD_WINDOW_DAYS * 86400000;
}

export function attended(card: PhotoCard, records: AttendanceRecord[] = ATTENDANCE): boolean {
  return records.some((r) => r.date === gameKey(card));
}

export function photocardGate(
  card: PhotoCard,
  nowMs: number,
  records: AttendanceRecord[] = ATTENDANCE,
): CardGate {
  if (!card.result) return 'pending';
  if (nowMs > photocardCloseAt(card)) return 'closed';
  if (!attended(card, records)) return 'locked';
  if ((card.remain ?? 0) <= 0) return 'soldout';
  return 'open';
}

/** 왜 못 사는지를 한 문장으로. 잠긴 카드에 이유가 없으면 앱이 고장 난 것처럼 보인다 */
export function gateReason(gate: CardGate, card: PhotoCard): string {
  switch (gate) {
    case 'pending':
      return '경기가 끝나면 그날의 장면으로 도안이 확정됩니다.';
    case 'open':
      return '직관 기록이 확인되었습니다.';
    case 'soldout':
      return '그날 발행분이 모두 나갔습니다.';
    case 'locked':
      return `${gameKey(card)} ${card.opponent}전 직관 기록이 없습니다. 그날 경기장에 있었던 분만 구매할 수 있습니다.`;
    case 'closed':
      return `경기 후 ${PHOTOCARD_WINDOW_DAYS}일이 지나 판매가 끝났습니다.`;
  }
}

export function gateBadge(gate: CardGate): { text: string; tone: BadgeTone } {
  const map: Record<CardGate, { text: string; tone: BadgeTone }> = {
    pending: { text: '경기 중', tone: 'live' },
    open: { text: '구매 가능', tone: 'win' },
    soldout: { text: '품절', tone: 'muted' },
    locked: { text: '직관 기록 없음', tone: 'muted' },
    closed: { text: '판매 종료', tone: 'muted' },
  };
  return map[gate];
}

/** 마감까지 남은 날. 마감 임박 알림의 재료 */
export function daysToClose(card: PhotoCard, nowMs: number): number {
  return (photocardCloseAt(card) - nowMs) / 86400000;
}

// ═════════════════════════════════════════════════════════════
// ② 특별 MD - 기록 달성 기념
// ═════════════════════════════════════════════════════════════
//
// 이 갈래의 상품은 **아직 존재하지 않는다.** 노시환이 200호를 치기 전에는 팔 것이 없다.
// 그런데 기념 MD 가 가장 크게 팔리는 순간은 달성 직후 며칠이고, 그때는 이미 제작이
// 끝나 있어야 한다. 그래서 구단은 미리 만들어 두고 예약을 받는다.
//
// 팬 쪽에서 보면 이 화면이 답해야 할 질문은 둘이다.
//   · **얼마나 남았나** - 6홈런이면 이번 달, 58안타면 내년이다. 숫자 하나가 전부를 가른다
//   · **언제 예약할 수 있나** - 너무 이르면 구단이 재고를 떠안고, 너무 늦으면 팬이 놓친다
//
// 그래서 예약 창을 날짜가 아니라 **남은 개수**로 연다. 기록은 날짜로 오지 않는다.
// 임계값(reserveFrom)은 지표마다 다르다 - 홈런 10개와 안타 10개는 전혀 다른 거리다.

/** 정규시즌 종료 - 남은 경기를 날짜로 환산하는 기준 */
export const SEASON_END = '2026-10-01T00:00:00+09:00';

export interface GoodsItem {
  name: string;
  price: number;
  /** 한정 수량 - 없으면 상시 */
  limit?: number;
  sizes?: string[];
}

export interface Milestone {
  id: string;
  playerId: string;
  playerName: string;
  /** '통산 200홈런' */
  title: string;
  /** 세는 것의 이름 - '홈런' · '승' · '안타' */
  unit: string;
  target: number;
  current: number;
  /** 올 시즌 기록 - 페이스의 분자 */
  seasonCount: number;
  /** 올 시즌 본인 출장 - 페이스의 분모. 선발 투수는 팀 경기 수가 아니다 */
  seasonApps: number;
  /**
   * 남은 시즌 동안 이 선수가 더 나설 것으로 보는 경기.
   * 타자는 팀 잔여 경기와 거의 같고, 선발은 로테이션이라 1/5 수준이다.
   */
  appsLeft: number;
  /** 출장을 세는 단위 이름 - 문장에 그대로 들어간다 */
  appUnit: '경기' | '등판';
  /** 최근 시즌 기록. 통산 합계가 아니라 **페이스를 읽는 재료**다 */
  recentSeasons: { year: number; count: number }[];
  /** 이만큼 남으면 예약을 연다 */
  reserveFrom: number;
  /** 예약 한정 수량 */
  reserveLimit: number;
  /** 지금까지 접수된 예약 */
  reserved: number;
  items: GoodsItem[];
  story: string;
}

/**
 * ※ 시연용 샘플 데이터입니다.
 * 올 시즌 수치(노시환 25홈런 등)는 src/roster.ts 와 맞췄고 통산 기록은 지어낸 값입니다.
 *
 * 통산 기록을 roster.ts 가 아니라 여기에 두는 이유: roster 는 **한 시즌의 세는 값**만
 * 갖는 파일이고 통산은 그 스탯라인에서 나오지 않는다. 선수 탭이 통산을 쓰게 되면
 * 그때 roster 쪽으로 옮긴다 - 지금은 특별 MD 가 유일한 사용처다.
 *
 * 네 항목이 예약 임계선의 네 단계를 각각 보여준다.
 *   노시환 6개 남음  → 열림              류현진 2승 남음  → 열림 · 예약 마감 임박
 *   채은성 13개 남음 → 3개만 더 하면 열림  문현빈 58개 남음 → 한참 남음
 */
export const MILESTONES: Milestone[] = [
  {
    id: 'ms-nsh-hr200',
    playerId: 'nsh',
    playerName: '노시환',
    title: '통산 200홈런',
    unit: '홈런',
    target: 200,
    current: 194,
    seasonCount: 25,
    seasonApps: 109,
    appsLeft: 33,
    appUnit: '경기',
    recentSeasons: [
      { year: 2022, count: 24 },
      { year: 2023, count: 31 },
      { year: 2024, count: 33 },
      { year: 2025, count: 29 },
      { year: 2026, count: 25 },
    ],
    reserveFrom: 10,
    reserveLimit: 2000,
    reserved: 1342,
    story:
      '구단으로는 네 번째 200홈런입니다. 달성 경기 당일 구장 MD샵과 공식몰에서 동시에 ' +
      '발매하며, 예약분은 달성 다음 날부터 순차 발송됩니다.',
    items: [
      {
        name: '기념 저지 (등번호 8 · 200 마킹)',
        price: 129000,
        limit: 800,
        sizes: ['S', 'M', 'L', 'XL', '2XL'],
      },
      { name: '기념구 레플리카 (아크릴 케이스)', price: 59000, limit: 500 },
      { name: '기념 응원타월', price: 19000, limit: 2000 },
      { name: '아크릴 스탠드', price: 15000, limit: 1500 },
    ],
  },
  {
    id: 'ms-ryu-w100',
    playerId: 'ryu',
    playerName: '류현진',
    title: 'KBO 통산 100승',
    unit: '승',
    target: 100,
    current: 98,
    seasonCount: 10,
    seasonApps: 20,
    appsLeft: 7,
    appUnit: '등판',
    recentSeasons: [
      { year: 2022, count: 0 },
      { year: 2023, count: 3 },
      { year: 2024, count: 10 },
      { year: 2025, count: 8 },
      { year: 2026, count: 10 },
    ],
    reserveFrom: 3,
    reserveLimit: 1000,
    reserved: 947,
    story: 'KBO 복귀 후 세 시즌 만에 통산 100승 앞에 섰습니다. 예약 수량이 얼마 남지 않았습니다.',
    items: [
      {
        name: '기념 저지 (등번호 99 · 100W 마킹)',
        price: 139000,
        limit: 500,
        sizes: ['S', 'M', 'L', 'XL', '2XL'],
      },
      { name: '친필 사인구 (추첨 100명)', price: 89000, limit: 100 },
      { name: '기념 액자', price: 45000, limit: 400 },
    ],
  },
  {
    id: 'ms-ces-h1500',
    playerId: 'ces',
    playerName: '채은성',
    title: '통산 1500안타',
    unit: '안타',
    target: 1500,
    current: 1487,
    seasonCount: 84,
    seasonApps: 76,
    appsLeft: 30,
    appUnit: '경기',
    recentSeasons: [
      { year: 2022, count: 138 },
      { year: 2023, count: 129 },
      { year: 2024, count: 121 },
      { year: 2025, count: 96 },
      { year: 2026, count: 84 },
    ],
    reserveFrom: 10,
    reserveLimit: 1200,
    reserved: 0,
    story: '부상 복귀 후 다시 안타를 쌓고 있습니다. 10안타 앞까지 오면 예약이 열립니다.',
    items: [
      { name: '기념 티셔츠', price: 45000, limit: 1000, sizes: ['M', 'L', 'XL', '2XL'] },
      { name: '미니 배트 (1500 각인)', price: 38000, limit: 600 },
    ],
  },
  {
    id: 'ms-mhb-h500',
    playerId: 'mhb',
    playerName: '문현빈',
    title: '통산 500안타',
    unit: '안타',
    target: 500,
    current: 442,
    seasonCount: 125,
    seasonApps: 108,
    appsLeft: 34,
    appUnit: '경기',
    recentSeasons: [
      { year: 2023, count: 89 },
      { year: 2024, count: 112 },
      { year: 2025, count: 116 },
      { year: 2026, count: 125 },
    ],
    reserveFrom: 15,
    reserveLimit: 800,
    reserved: 0,
    story: '데뷔 4년 차 500안타. 구성은 달성이 가까워지면 공개합니다.',
    items: [],
  },
];

export interface MilestoneProgress {
  /** 목표까지 남은 개수 */
  remain: number;
  /** 전체 진행률 0~1 - 목록 카드가 쓴다 */
  ratio: number;
  /** 출장당 페이스 */
  perApp: number;
  /** 남은 개수를 채우는 데 필요한 출장 */
  appsNeeded: number;
  /** 올 시즌 안에 되는가 */
  withinSeason: boolean;
  /** '9월 하순 예상' · '다음 시즌 예상' */
  eta: string;
  /** 예약이 열렸는가 */
  reserveOpen: boolean;
  /** 예약이 열리기까지 더 필요한 개수 - 이미 열렸으면 0 */
  toReserve: number;
  /** 예약 소진율 0~1 */
  reserveRatio: number;
  /**
   * 목표 부근만 확대한 구간의 폭.
   *
   * 통산 기록은 진행률이 늘 95% 를 넘어 막대 끝에 뭉친다. 1487/1500 과 1490/1500 이
   * 화면에서 같은 그림이 되면 **막대가 아무 말도 하지 않는다.** 그래서 상세에서는
   * 목표 직전 구간만 잘라 그린다.
   */
  zoom: number;
  /** 확대 구간 안에서의 현재 위치 0~1 */
  zoomPos: number;
  /** 확대 구간 안에서의 예약 임계선 위치 0~1 */
  zoomThreshold: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * 달성 시점을 순(旬) 단위로.
 *
 * "9월 22일 달성"은 거짓 정밀이다 - 홈런은 예약하고 오지 않는다. 페이스로 말할 수 있는
 * 가장 좁은 단위가 열흘이고, 예약을 걸지 말지 판단하는 데는 그걸로 충분하다.
 */
function tenDayLabel(ms: number): string {
  // +9 를 더해 UTC 로 읽는다 - getDate() 를 그대로 쓰면 서울 밖에서 순이 하나 밀린다
  const d = new Date(ms + 9 * 3600000);
  const day = d.getUTCDate();
  const part = day <= 10 ? '상순' : day <= 20 ? '중순' : '하순';
  return `${d.getUTCMonth() + 1}월 ${part} 예상`;
}

export function milestoneProgress(m: Milestone, nowMs: number): MilestoneProgress {
  const remain = Math.max(0, m.target - m.current);
  const perApp = m.seasonApps === 0 ? 0 : m.seasonCount / m.seasonApps;
  const appsNeeded = perApp === 0 ? Infinity : Math.ceil(remain / perApp);
  const withinSeason = appsNeeded <= m.appsLeft;

  // 남은 출장을 남은 날짜에 고르게 편다. 등판 간격을 따로 적지 않아도
  // '선발은 닷새에 한 번'이 appsLeft 에서 저절로 나온다
  const daysLeft = Math.max(0, (Date.parse(SEASON_END) - nowMs) / 86400000);
  const daysPerApp = m.appsLeft === 0 ? 0 : daysLeft / m.appsLeft;
  const eta = withinSeason
    ? tenDayLabel(nowMs + appsNeeded * daysPerApp * 86400000)
    : '다음 시즌 예상';

  const zoom = Math.max(m.reserveFrom * 3, remain * 1.3, 20);
  const zoomStart = m.target - zoom;

  return {
    remain,
    ratio: clamp01(m.current / m.target),
    perApp,
    appsNeeded,
    withinSeason,
    eta,
    reserveOpen: remain <= m.reserveFrom,
    toReserve: Math.max(0, remain - m.reserveFrom),
    reserveRatio: m.reserveLimit === 0 ? 0 : clamp01(m.reserved / m.reserveLimit),
    zoom,
    zoomPos: clamp01((m.current - zoomStart) / zoom),
    zoomThreshold: clamp01((m.target - m.reserveFrom - zoomStart) / zoom),
  };
}

// ═════════════════════════════════════════════════════════════
// ③ 유니폼
// ═════════════════════════════════════════════════════════════
//
// 여기부터는 카탈로그다. 앱이 더할 판단이 없는 영역이라 **공식몰로 넘기기 전까지만** 한다.
// 다만 유니폼에는 앱이 미리 말해 줄 것이 하나 있다 - **내 사이즈가 남아 있는지**다.
// 공식몰에 가서야 품절을 알게 되면 그건 앱이 팬을 헛걸음시킨 것이다.

/**
 * 유니폼 색 계열.
 *
 * 그림(JerseyArt)이 아니라 **자료**가 이 값을 갖는다. 색은 상품의 사실이지 화면의
 * 사정이 아니고, 실서비스에서 촬영본으로 바뀌어도 "어느 색 옷인가"는 그대로 남는다.
 */
export type Colorway = 'home' | 'away' | 'alt' | 'heritage' | 'youth';

/**
 * 굿즈 그림의 형태와 색.
 *
 * 유니폼의 `colorway` 와 같은 자리다 - **그림이 아니라 자료가 갖는다.** 물건의
 * 생김새는 상품의 사실이고, 실서비스에서 촬영본으로 바뀌어도 "무엇처럼 생겼나"는
 * 그대로 남는다.
 *
 * 사진을 받아 쓰지 않는 이유는 유니폼과 같다 - 주워 온 사진은 전부 **남의 물건**이라
 * 격자에서 우리 굿즈로 읽히지 않는다. 형태는 지어내는 것이 아니고(타월은 타월이다)
 * 색은 구단 CI 라, 그리면 거짓이 되지 않으면서 열다섯 칸이 한 벌로 묶인다.
 */
export type MerchShape =
  | 'balloon'
  | 'towel'
  | 'clapper'
  | 'cap'
  | 'bucket'
  | 'keyring'
  | 'badge'
  | 'pack'
  | 'sticker'
  | 'tumbler'
  | 'mug'
  | 'blanket'
  | 'hoodie'
  | 'tee';

/** 굿즈 그림의 바탕색. 열다섯 칸이 전부 오렌지면 격자가 한 덩어리로 뭉친다 */
export type MerchTone = 'brand' | 'navy' | 'white';

export interface Uniform {
  id: string;
  name: string;
  kind: '어센틱' | '레플리카' | '헤리티지' | '유스';
  /**
   * 어느 색 옷인가.
   *
   * 옷을 고르는 화면에서 팬이 **가장 먼저 보는 것은 색**이다. kind(어센틱/레플리카)는
   * 사양이지 생김새가 아니라서 홈과 원정을 가르지 못한다 - 색은 따로 들고 있어야 한다.
   */
  colorway: Colorway;
  /** 언제 입는 옷인가 - 유니폼을 고르는 진짜 기준이다 */
  wear: string;
  price: number;
  sizes: string[];
  /** 품절된 사이즈 - 공식몰에 가기 전에 알아야 한다 */
  soldOutSizes?: string[];
  status: StockStatus;
  /** 마킹 옵션 */
  marking?: string;
  note: string;
  /** 발매 예정이면 발매 시각 */
  openAt?: string;
}

/** ※ 시연용 샘플 데이터입니다. */
export const UNIFORMS: Uniform[] = [
  {
    id: 'u-home-auth',
    name: '2026 홈 어센틱',
    kind: '어센틱',
    colorway: 'home',
    wear: '홈 경기 · 선수단 착용 사양',
    price: 189000,
    sizes: ['95', '100', '105', '110', '115'],
    status: 'onsale',
    marking: '선수 마킹 +25,000원 (제작 7일)',
    note: '선수단이 실제로 입는 원단과 재봉 그대로입니다. 품이 크게 나옵니다.',
  },
  {
    id: 'u-home-rep',
    name: '2026 홈 레플리카',
    kind: '레플리카',
    colorway: 'home',
    wear: '홈 경기 · 응원용',
    price: 99000,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    status: 'onsale',
    marking: '선수 마킹 +18,000원',
    note: '어센틱보다 가볍고 세탁이 쉽습니다. 처음 사는 유니폼으로 적당합니다.',
  },
  {
    id: 'u-away-auth',
    name: '2026 원정 어센틱',
    kind: '어센틱',
    colorway: 'away',
    wear: '원정 경기',
    price: 189000,
    sizes: ['95', '100', '105', '110', '115'],
    soldOutSizes: ['100', '105'],
    status: 'lowstock',
    marking: '선수 마킹 +25,000원 (제작 7일)',
    note: '가장 많이 나가는 100·105 가 품절입니다. 재입고 일정은 미정입니다.',
  },
  {
    id: 'u-alt',
    name: '2026 얼트 레플리카 (오렌지)',
    kind: '레플리카',
    colorway: 'alt',
    wear: '금요일 홈 경기',
    price: 105000,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    soldOutSizes: ['2XL'],
    status: 'onsale',
    marking: '선수 마킹 +18,000원',
    note: '금요일 홈 경기에만 입는 유니폼입니다. 관중석이 오렌지로 덮이는 날입니다.',
  },
  {
    id: 'u-heritage-1999',
    name: '1999 우승 헤리티지 레플리카',
    kind: '헤리티지',
    colorway: 'heritage',
    wear: '8월 15일 홈 경기 선수단 착용',
    price: 89000,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    status: 'upcoming',
    openAt: '2026-08-14T14:00:00+09:00',
    note: '1999년 한국시리즈 우승 당시 유니폼을 원단과 자수까지 복각했습니다. 1,999장 한정입니다.',
  },
  {
    id: 'u-youth',
    name: '2026 유스 레플리카',
    kind: '유스',
    colorway: 'youth',
    wear: '홈 경기 · 어린이용',
    price: 59000,
    sizes: ['130', '140', '150', '160'],
    soldOutSizes: ['130'],
    status: 'onsale',
    note: '어린이날 배부분과 같은 사양입니다. 실측보다 한 치수 크게 고르는 편이 낫습니다.',
  },
];

export function sizeSoldOut(u: Uniform, size: string): boolean {
  return (u.soldOutSizes ?? []).includes(size);
}

/** 고를 수 있는 첫 사이즈 - 상세를 열 때 미리 잡아 둘 값 */
export function firstAvailableSize(u: Uniform): string | null {
  return u.sizes.find((s) => !sizeSoldOut(u, s)) ?? null;
}

// ═════════════════════════════════════════════════════════════
// ④ 기타 굿즈
// ═════════════════════════════════════════════════════════════
//
// 카탈로그다. 앱이 예측하거나 자격을 따질 것이 없고 **고를 수 있게 하는 데까지**가
// 이 갈래의 몫이다 - 그 다음은 공식몰로 넘긴다.
//
// 다만 '고를 수 있게'는 이름과 값을 적어 두는 것이 아니다. 물건이 보이고 내 사이즈가
// 남아 있는지 알 수 있어야 고른 것이다. 유니폼 갈래가 이미 그 모양이라 여기도 같게 뒀다.

export type MerchGroup = '응원용품' | '모자' | '수집' | '리빙' | '패션';

export const MERCH_GROUPS: MerchGroup[] = ['응원용품', '모자', '수집', '리빙', '패션'];

/**
 * 기타 굿즈.
 *
 * ── 왜 유니폼과 같은 모양이 되었나 (2026-08-26) ──────────────
 * 처음에는 이름과 가격만 든 **작은 타일**이었다. "앱이 얹을 판단이 없으니 고르는 즉시
 * 공식몰로 넘긴다"가 그 근거였는데, 화면에 세워 놓고 보니 두 가지가 어긋났다.
 *
 *   ① 물건이 안 보인다. 유니폼 격자를 지나 기타 굿즈로 들어오면 **그림이 사라진다** -
 *      같은 굿즈 탭 안에서 한 갈래만 카탈로그가 아니라 재고표로 읽힌다
 *   ② 판단이 없다는 것이 사실이 아니었다. 사이즈·색상이 있는 물건은 유니폼과 똑같이
 *      **공식몰에 가기 전에 품절을 알아야** 한다. 후드 2XL 이 없는 것을 몰에 넘어가서
 *      알게 되면 앱이 헛걸음시킨 것이다
 *
 * 그래서 자료를 유니폼과 같은 모양으로 맞췄다 - 사양(kind) · 쓰임(use) · 고를 것
 * (options) · 설명(note). 화면도 같은 격자와 같은 상세 시트를 쓴다.
 *
 * 유니폼에 있고 여기 없는 것은 **마킹**뿐이다 - 선수 이름을 새기는 것은 옷의 일이다.
 * 여기에만 있는 것은 **venueOnly**, 공식몰에 가도 없는 물건이다.
 */
export interface Merch {
  id: string;
  name: string;
  group: MerchGroup;
  /** 어떤 사양의 물건인가 - 유니폼의 kind 자리 */
  kind: string;
  /** 언제 쓰는 물건인가 - 유니폼의 wear 자리. 고르는 진짜 기준이다 */
  use: string;
  /** 격자·상세에 그릴 형태와 색 */
  shape: MerchShape;
  tone: MerchTone;
  price: number;
  /**
   * 고를 것의 이름 - '사이즈' · '색상' · '구성' · '선수' 중 하나.
   *
   * 유니폼은 고를 것이 늘 사이즈뿐이라 이름을 적을 필요가 없었다. 여기서는 물건마다
   * 다르다 - 머그는 색이고 키링은 선수다. **무엇을 고르는지 말하지 않으면** 칩 여섯 개가
   * 무슨 뜻인지 팬이 추측하게 된다.
   */
  optionLabel?: string;
  options?: string[];
  /** 품절된 선택지 - 공식몰에 가기 전에 알아야 한다 */
  soldOutOptions?: string[];
  status: StockStatus;
  note: string;
  /** 발매 예정이면 발매 시각 */
  openAt?: string;
  /** 구장 MD샵에서만 파는 것 - 공식몰에 가도 없다 */
  venueOnly?: boolean;
}

/** ※ 시연용 샘플 데이터입니다. */
export const MERCH: Merch[] = [
  {
    id: 'm-balloon',
    name: '응원 막대풍선 (2입)',
    group: '응원용품',
    kind: '응원도구',
    use: '홈 경기 · 공격 이닝',
    shape: 'balloon',
    tone: 'brand',
    price: 5000,
    status: 'onsale',
    note: '구장 매점에서도 같은 값에 팝니다. 공기 주입기는 응원석 입구에 있습니다.',
  },
  {
    id: 'm-towel',
    name: '응원 타월',
    group: '응원용품',
    kind: '응원도구',
    use: '홈·원정 공통',
    shape: 'towel',
    tone: 'white',
    price: 18000,
    optionLabel: '색상',
    options: ['오렌지', '네이비'],
    status: 'onsale',
    note: '한 면에 구단 워드마크, 반대 면에 응원 구호가 들어갑니다. 40×110cm 입니다.',
  },
  {
    id: 'm-clapper',
    name: '클래퍼',
    group: '응원용품',
    kind: '응원도구',
    use: '홈 경기 · 응원단상 구역',
    shape: 'clapper',
    tone: 'brand',
    price: 8000,
    status: 'lowstock',
    note: '막대풍선보다 소리가 크고 자리를 덜 차지합니다. 내야 상단석에서 많이 씁니다.',
  },

  {
    id: 'm-cap-home',
    name: '2026 정모 (홈)',
    group: '모자',
    kind: '정모',
    use: '홈 경기 · 선수단 착용 사양',
    shape: 'cap',
    tone: 'white',
    price: 45000,
    optionLabel: '사이즈',
    options: ['55', '57', '59', '61'],
    soldOutOptions: ['57'],
    status: 'onsale',
    note: '선수단이 쓰는 것과 같은 사양입니다. 챙이 곧고 뒤가 막혀 있어 실측대로 고릅니다.',
  },
  {
    id: 'm-cap-orange',
    name: '볼캡 (오렌지)',
    group: '모자',
    kind: '볼캡',
    use: '일상 · 경기장 공통',
    shape: 'cap',
    tone: 'brand',
    price: 39000,
    optionLabel: '사이즈',
    options: ['프리'],
    status: 'onsale',
    note: '뒤 조절끈이 있어 하나로 맞춥니다. 정모보다 부드러워 접어 넣어도 됩니다.',
  },
  {
    id: 'm-bucket',
    name: '버킷햇',
    group: '모자',
    kind: '버킷햇',
    use: '한여름 낮 경기',
    shape: 'bucket',
    tone: 'navy',
    price: 42000,
    optionLabel: '사이즈',
    options: ['M', 'L'],
    soldOutOptions: ['M', 'L'],
    status: 'soldout',
    note: '8월 낮 경기에서 가장 빨리 나가는 물건입니다. 재입고 일정은 미정입니다.',
  },

  {
    id: 'm-keyring',
    name: '아크릴 키링 (선수 11종)',
    group: '수집',
    kind: '수집품',
    use: '가방 · 열쇠고리',
    shape: 'keyring',
    tone: 'brand',
    price: 12000,
    optionLabel: '선수',
    options: ['노시환', '문동주', '최재훈', '류현진', '채은성', '김서현'],
    soldOutOptions: ['문동주'],
    status: 'onsale',
    note: '11종 중 6종이 공식몰에 올라와 있습니다. 나머지 5종은 구장 MD샵에 있습니다.',
  },
  {
    id: 'm-badge',
    name: '볼파크 1주년 핀 뱃지 (3종)',
    group: '수집',
    kind: '한정 수집품',
    use: '모자 · 가방에 다는 것',
    shape: 'badge',
    tone: 'navy',
    price: 25000,
    optionLabel: '구성',
    options: ['3종 세트'],
    status: 'lowstock',
    venueOnly: true,
    note: '대전 한화생명 볼파크 개장 1주년 기념입니다. 3종을 낱개로 팔지 않습니다.',
  },
  {
    id: 'm-pcpack',
    name: '포토카드 랜덤팩',
    group: '수집',
    kind: '수집품',
    use: '개봉 전까지 누가 나올지 모릅니다',
    shape: 'pack',
    tone: 'navy',
    price: 6000,
    optionLabel: '구성',
    options: ['3장 1팩'],
    status: 'onsale',
    note: '한 팩에 세 장, 선수 35명 중에서 무작위입니다. 오프라인 한정 카드와는 다른 상품입니다.',
  },

  {
    id: 'm-tumbler',
    name: '보온 텀블러',
    group: '리빙',
    kind: '리빙',
    use: '사계절 · 구장 반입 가능',
    shape: 'tumbler',
    tone: 'navy',
    price: 32000,
    optionLabel: '색상',
    options: ['네이비', '오렌지', '실버'],
    soldOutOptions: ['오렌지'],
    status: 'onsale',
    note: '473ml. 밀폐 뚜껑이라 가방에 눕혀도 됩니다. 구장에 들고 들어갈 수 있는 용기입니다.',
  },
  {
    id: 'm-mug',
    name: '머그컵',
    group: '리빙',
    kind: '리빙',
    use: '사무실 · 집',
    shape: 'mug',
    tone: 'white',
    price: 19000,
    optionLabel: '색상',
    options: ['화이트', '네이비'],
    status: 'onsale',
    note: '350ml. 전자레인지와 식기세척기를 씁니다.',
  },
  {
    id: 'm-blanket',
    name: '무릎담요',
    group: '리빙',
    kind: '리빙',
    use: '9월 이후 야간 경기',
    shape: 'blanket',
    tone: 'brand',
    price: 29000,
    status: 'upcoming',
    openAt: '2026-09-01T14:00:00+09:00',
    note: '가을 야간 경기를 앞두고 나옵니다. 70×100cm 로 무릎에 덮는 크기입니다.',
  },

  {
    id: 'm-hoodie',
    name: '후드 집업',
    group: '패션',
    kind: '아우터',
    use: '봄·가을 경기 · 일상',
    shape: 'hoodie',
    tone: 'navy',
    price: 89000,
    optionLabel: '사이즈',
    options: ['S', 'M', 'L', 'XL', '2XL'],
    soldOutOptions: ['L', '2XL'],
    status: 'lowstock',
    note: '기모가 없는 봄가을용입니다. 유니폼 위에 덧입을 수 있게 품이 넉넉합니다.',
  },
  {
    id: 'm-tee',
    name: '반팔 티셔츠',
    group: '패션',
    kind: '상의',
    use: '여름 경기 · 일상',
    shape: 'tee',
    tone: 'white',
    price: 39000,
    optionLabel: '사이즈',
    options: ['S', 'M', 'L', 'XL', '2XL'],
    status: 'onsale',
    note: '가슴에 모자 마크만 작게 들어갑니다. 경기장 밖에서도 입을 수 있는 쪽으로 뺐습니다.',
  },
  {
    id: 'm-sticker',
    name: '스티커 팩',
    group: '패션',
    kind: '수집품',
    use: '노트북 · 텀블러에 붙이는 것',
    shape: 'sticker',
    tone: 'brand',
    price: 7000,
    optionLabel: '구성',
    options: ['12장 1팩'],
    status: 'onsale',
    note: '방수 재질이라 텀블러에 붙여도 됩니다. 열두 장 한 팩.',
  },
];

/** 유니폼의 sizeSoldOut 과 같은 일을 한다 - 이름만 사이즈에서 선택지로 바뀐다 */
export function merchOptionSoldOut(m: Merch, option: string): boolean {
  return (m.soldOutOptions ?? []).includes(option);
}

/** 고를 수 있는 첫 선택지 - 상세를 열 때 미리 잡아 둘 값 */
export function firstMerchOption(m: Merch): string | null {
  return (m.options ?? []).find((o) => !merchOptionSoldOut(m, o)) ?? null;
}

// ═════════════════════════════════════════════════════════════
// 알림 - 무엇을 언제 밀어 줄 것인가
// ═════════════════════════════════════════════════════════════
//
// 한정 굿즈는 **몰랐다는 이유로 못 사는 것**이 팬에게 가장 큰 불만이다. 공식몰은 팬이
// 매일 들어가는 곳이 아니고, 인스타 공지는 알고리즘에 묻힌다. 구단 앱은 팬이 경기 때문에
// 어차피 켜는 앱이라 이 알림을 놓지 않을 수 있는 유일한 자리다.
//
// 그렇다고 판매 중인 것을 전부 매일 알리면 팬은 알림을 끈다. **알릴 이유가 생겼을 때만**
// 말한다 - 오늘만 살 수 있다 · 곧 닫힌다 · 예약이 열렸다 · 내 최애 선수다.

export interface GoodsAlert {
  id: string;
  /** 눌렀을 때 갈 탭 */
  category: GoodsCategory;
  /** 그 탭에서 열 항목 */
  targetId: string;
  badge: string;
  tone: 'brand' | 'live' | 'warn';
  /** 알림 제목 = 대상 이름. 문장을 만들지 않는다 */
  message: string;
  /** 부기 한 줄 - 사람이 읽는 단위로만 */
  note: string;
  urgency: number;
}

/** 한 화면에 넷을 넘기면 알림 구역이 본문보다 길어진다 */
const ALERT_CAP = 4;

export function goodsAlerts(nowMs: number, favoritePlayerId?: string): GoodsAlert[] {
  const out: GoodsAlert[] = [];

  // ── 오프라인 한정 ──────────────────────────────────────────
  for (const c of PHOTOCARDS) {
    const gate = photocardGate(c, nowMs);

    if (gate === 'pending') {
      out.push({
        id: `a-${c.id}`,
        category: 'venue',
        targetId: c.id,
        badge: '오늘만',
        tone: 'live',
        message: `${gameKey(c)} ${c.opponent}전 포토카드`,
        note: '구장에서 인증하면 오늘 수량을 선점할 수 있습니다',
        urgency: 96,
      });
      continue;
    }

    if (gate !== 'open') continue;

    const days = daysToClose(c, nowMs);
    if (days > 3) continue;
    const fav = !!favoritePlayerId && c.moment?.playerId === favoritePlayerId;
    out.push({
      id: `a-${c.id}`,
      category: 'venue',
      targetId: c.id,
      badge: '마감 임박',
      tone: 'warn',
      message: `${gameKey(c)} ${c.opponent}전 포토카드`,
      note:
        days < 1
          ? `판매 마감 ${Math.max(1, Math.round(days * 24))}시간 전`
          : `판매 마감 ${Math.ceil(days)}일 전`,
      urgency: fav ? 94 : 91,
    });
  }

  // ── 특별 MD ────────────────────────────────────────────────
  for (const m of MILESTONES) {
    const p = milestoneProgress(m, nowMs);
    if (!p.reserveOpen) continue;
    const fav = !!favoritePlayerId && m.playerId === favoritePlayerId;
    const nearlyFull = p.reserveRatio >= 0.9;

    out.push({
      id: `a-${m.id}`,
      category: 'milestone',
      targetId: m.id,
      badge: nearlyFull ? '예약 마감 임박' : '예약 중',
      tone: nearlyFull ? 'warn' : 'brand',
      message: `${m.playerName} ${m.title} 기념 MD`,
      note: nearlyFull
        ? `예약 ${(m.reserveLimit - m.reserved).toLocaleString()}개 남음`
        : `${p.remain}${m.unit} 남음 · ${p.eta}`,
      urgency: fav ? 98 : nearlyFull ? 93 : 88,
    });
  }

  // ── 유니폼 ─────────────────────────────────────────────────
  for (const u of UNIFORMS) {
    if (u.status === 'upcoming' && u.openAt) {
      const hours = (Date.parse(u.openAt) - nowMs) / 3600000;
      if (hours > 0 && hours <= 72) {
        out.push({
          id: `a-${u.id}`,
          category: 'uniform',
          targetId: u.id,
          badge: '발매 임박',
          tone: 'brand',
          message: u.name,
          note: countdown(u.openAt, nowMs) ?? '곧 발매',
          urgency: 82,
        });
      }
      continue;
    }
    if (u.status === 'lowstock') {
      out.push({
        id: `a-${u.id}`,
        category: 'uniform',
        targetId: u.id,
        badge: '품절 임박',
        tone: 'warn',
        message: u.name,
        note: `${(u.soldOutSizes ?? []).join('·')} 사이즈 품절`,
        urgency: 84,
      });
    }
  }

  return out.sort((a, b) => b.urgency - a.urgency).slice(0, ALERT_CAP);
}

/**
 * 발매까지 남은 시간을 사람이 읽는 단위로.
 *
 * 한정 굿즈에서 시간은 곧 재고다. "8월 14일 발매"보다 "2일 22시간 남음"이 행동을 만든다.
 */
export function countdown(openAtIso: string, nowMs: number): string | null {
  const diff = Date.parse(openAtIso) - nowMs;
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}일 ${h}시간 남음`;
  if (h > 0) return `${h}시간 ${m}분 남음`;
  return `${m}분 남음`;
}

/** 'M월 D일' - ISO 문자열에서 직접 읽는다. Date 를 거치면 실행 환경의 시간대를 탄다 */
export function formatDate(iso: string): string {
  return `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8, 10))}일`;
}

/** 'M월 D일 H시' - 발매·마감 시각 */
export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} ${Number(iso.slice(11, 13))}시`;
}

/**
 * 계산으로 나온 시각(판매 마감 등)을 KST 날짜로.
 *
 * 위 둘은 문자열에서 바로 읽지만 마감 시각은 더해서 만든 값이라 문자열이 없다.
 * `new Date(ms)` 의 getMonth 는 **실행 기기의 시간대**를 타므로, 서울 밖에서 열면
 * 마감일이 하루 어긋난다. +9 를 더해 UTC 로 읽으면 어디서 열어도 같은 날이 나온다.
 */
export function formatKstDate(ms: number): string {
  const d = new Date(ms + 9 * 3600000);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
}
