// 팬 상권 제휴 - '이글스 후원의 집'
//
// ── 1차 리뷰 6번 ─────────────────────────────────────────────
// "핵심은 예컨데 '팀의 팬이 운영하는 술집'과 제휴를 맺고 협찬금을 받으면
//  '해당 술집에 대한 광고 홍보기능 제공'하는 페이지 입니다"
//
// ── 국내 선례가 이미 있다 ────────────────────────────────────
// 전북 현대의 **'후원의 집'**이 정확히 이 구조다. 연 1회 접수를 받고 구단이 직접 방문해
// 적합성을 심사한 뒤 제휴를 맺는다. 서포터즈가 제휴 식당에 일일 서빙을 나가 홍보 효과를
// 키우기도 한다. 축구에서 검증된 모델이라 KBO 구단에 이식할 때 리스크가 낮다.
//
// ── 49ers 원본을 그대로 옮기면 안 되는 이유 ──────────────────
// 49ers 앱에도 지역 팬 바를 찾는 기능이 있고, NFL 에는 Bills Backers 같은 팬 바 네트워크가
// 약 500챕터 규모로 존재한다. 그러나 그건 **직관이 불가능하기 때문에 생긴 문화**다
// (홈 8~9경기, 2차시장 최저가가 20만원대). 한국은 정반대다. 홈 72경기에 중계가 무료이고
// "함께 응원하려면 경기장에 간다"는 인식이 강해서, "직관을 못 하니 바에 모인다"는 전제
// 자체가 성립하지 않는다.
//
// **그래서 목적을 뒤집는다.** 미국은 '경기를 대신 볼 곳'이고, 한국은 **'직관 전에 모이고
// 직관 후에 뒤풀이할 곳'**이다. 같은 지도, 같은 제휴 구조, 반대 동선이다.

export type PartnerTier = 'flagship' | 'official' | 'listed';

/** 협찬 등급별로 앱에서 받을 수 있는 노출이 다르다 - 이게 곧 상품 구조다 */
export const TIER_SPEC: Record<
  PartnerTier,
  { label: string; benefit: string[]; slotLimit: string }
> = {
  flagship: {
    label: '플래그십',
    benefit: [
      '경기 종료 직후 푸시에 상호 노출',
      '구장 지도 상단 고정',
      '선수 방문·사인회 등 구단 행사 우선 배정',
      '홈경기 승리 시 할인 이벤트 연동',
    ],
    slotLimit: '구장당 2곳',
  },
  official: {
    label: '공식 제휴',
    benefit: ['상권 지도 상단 노출', '티켓 인증 할인 연동', '구단 SNS 연 2회 소개'],
    slotLimit: '구장당 12곳',
  },
  listed: {
    label: '등록',
    benefit: ['상권 지도 등재', '기본 정보·영업시간 노출'],
    slotLimit: '제한 없음',
  },
};

export interface Partner {
  id: string;
  name: string;
  category: '호프' | '고깃집' | '분식' | '카페' | '치킨';
  tier: PartnerTier;
  /** 구장에서 도보 시간(분) */
  walkMinutes: number;
  address: string;
  /** 사장이 팬인가 - 이 기능의 출발점 */
  fanStory: string;
  /**
   * 티켓 인증 시 받는 혜택.
   *
   * ⚠ 조건("티켓 인증 시")은 여기 적지 않는다. 화면이 이미 조건을 라벨로 붙이므로
   * 문구에 또 넣으면 "티켓 인증 · 티켓 인증 시 된장찌개 무료"가 된다.
   * **혜택의 내용만** 적는다.
   */
  ticketPerk?: string;
  /** 승리한 날 열리는 혜택 - 구단 성적과 상권을 묶는 장치. 조건은 적지 않는다 */
  winPerk?: string;
  openHours: string;
  /** 제휴 시작 연도 */
  since: number;
  /** 전화 - 상세에서 바로 걸 수 있게 */
  phone: string;
  /** 대표 메뉴 - 가격까지 있어야 '가 볼까'가 결정된다 */
  menu: { name: string; price: number }[];
  /** 이 가게를 다녀간 팬 수 (누적 인증) */
  visits: number;
  /** 경기 후 붐비는 시간대 */
  peak: string;
  /** 예약 가능 여부 */
  reservable: boolean;
}

export const PARTNERS: Partner[] = [
  {
    id: 'pt1',
    name: '대전부르스 호프',
    category: '호프',
    tier: 'flagship',
    walkMinutes: 7,
    address: '대전 중구 대사동',
    fanStory:
      '사장님이 1999년 우승을 구장에서 본 팬입니다. 가게 벽 한 면이 전부 이글스 유니폼입니다.',
    ticketPerk: '기본 안주 무료',
    winPerk: '생맥주 1잔 무료',
    openHours: '17:00 - 02:00',
    since: 2024,
    phone: '042-253-1999',
    menu: [
      { name: '수제 소시지 플래터', price: 23000 },
      { name: '이글스 치킨', price: 19000 },
      { name: '생맥주 500cc', price: 5000 },
    ],
    visits: 1842,
    peak: '경기 종료 후 30분',
    reservable: true,
  },
  {
    id: 'pt2',
    name: '한밭갈비',
    category: '고깃집',
    tier: 'flagship',
    walkMinutes: 5,
    address: '대전 중구 부사동',
    fanStory: '선수단 회식 장소로 알려진 집. 사장님이 시즌권 20년째 보유자입니다.',
    ticketPerk: '된장찌개 무료',
    winPerk: '전 메뉴 10% 할인 (끝내기 승리 시)',
    openHours: '11:00 - 23:00',
    since: 2023,
    phone: '042-226-8282',
    menu: [
      { name: '한우 갈비살 (150g)', price: 39000 },
      { name: '삼겹살 (200g)', price: 17000 },
      { name: '냉면', price: 9000 },
    ],
    visits: 2317,
    peak: '경기 시작 2시간 전',
    reservable: true,
  },
  {
    id: 'pt3',
    name: '이글스분식',
    category: '분식',
    tier: 'official',
    walkMinutes: 4,
    address: '대전 중구 대흥동',
    fanStory: '경기 전 요기하러 들르는 팬이 많아 아예 상호를 바꿨습니다.',
    ticketPerk: '음료 무료',
    openHours: '10:00 - 21:00',
    since: 2025,
    phone: '042-585-7788',
    menu: [
      { name: '떡볶이 (2인)', price: 8000 },
      { name: '김밥', price: 4500 },
      { name: '순대', price: 7000 },
    ],
    visits: 3104,
    peak: '경기 시작 1시간 전',
    reservable: false,
  },
  {
    id: 'pt4',
    name: '77번 치킨',
    category: '치킨',
    tier: 'official',
    walkMinutes: 9,
    address: '대전 서구 탄방동',
    fanStory: '사장님 최애 선수의 등번호를 상호에 넣었습니다.',
    winPerk: '순살 사이즈업 (홈런 나온 날)',
    openHours: '16:00 - 01:00',
    since: 2025,
    phone: '042-471-7777',
    menu: [
      { name: '후라이드 한 마리', price: 19000 },
      { name: '양념 반 후라이드 반', price: 21000 },
      { name: '순살 파닭', price: 23000 },
    ],
    visits: 967,
    peak: '경기 종료 후 1시간',
    reservable: false,
  },
  {
    id: 'pt5',
    name: '볼파크 커피',
    category: '카페',
    tier: 'listed',
    walkMinutes: 3,
    address: '대전 중구 대사동',
    fanStory: '경기 전 대기 줄에서 커피를 마시는 팬들을 보고 새벽 영업을 시작했습니다.',
    openHours: '07:00 - 22:00',
    since: 2026,
    phone: '042-222-0426',
    menu: [
      { name: '아메리카노', price: 3500 },
      { name: '이글스 라떼', price: 5500 },
      { name: '수제 쿠키', price: 3000 },
    ],
    visits: 421,
    peak: '경기 시작 2시간 전',
    reservable: false,
  },
];

// ─────────────────────────────────────────────────────────────
// 쿠폰 - 혜택을 '받는' 자리
// ─────────────────────────────────────────────────────────────

/**
 * 제휴 혜택 쿠폰.
 *
 * 목록에 "티켓 인증 시 된장찌개 무료"라고 적어 두는 것과, 가게에서 점원에게 보여줄
 * 화면이 있는 것은 다른 제품이다. **혜택은 알리는 것이 아니라 쓰는 것**이고, 쓰는 순간이
 * 앱 안에서 일어나야 제휴가 앱 사용을 늘린다.
 *
 * 실서비스에서는 1회용 코드 발급·소진 처리·중복 사용 방지가 필요하다. 여기서는 화면과
 * 상태 전이만 만든다.
 */
export interface Coupon {
  partnerId: string;
  perk: string;
  /** 발급 코드 - 실서비스에서는 서버 발급 */
  code: string;
  /** 유효 시각 */
  validUntil: string;
}

/** 코드는 결정적으로 만든다 - 시연할 때마다 값이 달라지면 화면이 흔들린다 */
export function couponCode(partnerId: string, gameId: string): string {
  const base = `${partnerId}-${gameId}`;
  let h = 0;
  for (let i = 0; i < base.length; i += 1) h = (h * 31 + base.charCodeAt(i)) % 1000000;
  return `HH${String(h).padStart(6, '0')}`;
}

// ─────────────────────────────────────────────────────────────
// 수익 구조 - 호석쌤 커머스 파트와 맞물리는 지점
// ─────────────────────────────────────────────────────────────

/**
 * 제휴 상권의 수익 모델.
 *
 * ⚠ **금액과 배분 비율은 호석쌤이 담당하는 1번(커머스·수익 분배 구조)에 종속된다.**
 * 여기서는 화면이 필요로 하는 **구조**만 정의하고, 실제 요율은 그쪽 산출물을 따른다.
 * 이 파일이 먼저 확정해 버리면 나중에 두 파트가 어긋난다.
 */
export interface PartnerRevenue {
  tier: PartnerTier;
  /** 연간 협찬금 (만원) - 시연용 가정치 */
  annualFee: number;
  /** 구단이 제공하는 것 */
  provides: string[];
}

export const REVENUE_MODEL: PartnerRevenue[] = [
  {
    tier: 'flagship',
    annualFee: 1200,
    provides: ['앱 최상단 노출', '푸시 연동', '구단 행사 연계', '공식 인증 현판'],
  },
  {
    tier: 'official',
    annualFee: 360,
    provides: ['앱 상단 노출', '티켓 인증 혜택 연동', 'SNS 소개'],
  },
  {
    tier: 'listed',
    annualFee: 60,
    provides: ['앱 등재', '기본 정보 노출'],
  },
];

/**
 * 이 모델이 광고가 아니라 파트너십으로 읽히기 위한 규칙 세 가지.
 *
 * 49ers 앱의 실측 패턴(`STATS presented by SAP`)에서 가져온 원칙이다. 배너를 끼워 넣는
 * 대신 섹션 자체를 파트너에게 준다. 그러면 화면을 침범하지 않으면서 지면이 생긴다.
 */
export const PARTNER_RULES = [
  '팬이 운영하거나 팬이 모이는 곳만 받는다. 상권 아무 가게나 돈만 내면 실리는 순간 이 지면은 광고판이 되고, 그때부터 팬은 이 페이지를 신뢰하지 않는다.',
  '구단이 직접 방문해 심사한다. 전북 현대 후원의 집이 연 1회 실사를 도는 이유가 이것이다.',
  '혜택은 반드시 티켓 인증이나 경기 결과에 연동한다. 그래야 제휴가 앱 사용을 늘리고, 앱이 다시 제휴 가치를 올리는 순환이 생긴다.',
];

/** 등급 순으로 정렬 - 협찬 등급이 곧 노출 순서다 */
export function sortedPartners(): Partner[] {
  const rank: Record<PartnerTier, number> = { flagship: 0, official: 1, listed: 2 };
  return PARTNERS.slice().sort((a, b) => {
    if (rank[a.tier] !== rank[b.tier]) return rank[a.tier] - rank[b.tier];
    return a.walkMinutes - b.walkMinutes;
  });
}

/** 경기 결과에 따라 오늘 열리는 혜택만 추린다 */
export function todayPerks(won: boolean): { partner: Partner; perk: string }[] {
  const out: { partner: Partner; perk: string }[] = [];
  for (const p of sortedPartners()) {
    if (won && p.winPerk) out.push({ partner: p, perk: p.winPerk });
    else if (p.ticketPerk) out.push({ partner: p, perk: p.ticketPerk });
  }
  return out;
}
