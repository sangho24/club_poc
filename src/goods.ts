// 기념 굿즈·유니폼 발매 소식
//
// ── 1차 리뷰 7번 ─────────────────────────────────────────────
// "개별 구단에서 발매하는 각종 기념 굿즈에 대한 알림을 띄우는 화면, 그리고 클릭하면
//  리다이렉트 되는 기능도 추가해봅시다"
//   · 예시로 공유받은 것: [키움 히어로즈] 박병호 은퇴 응원타올 - NOL MD shop
//
// ── 사례에서 읽어야 할 것 ────────────────────────────────────
// 박병호 은퇴 MD 는 타월 하나가 아니라 **티셔츠 + 키링 + 응원타월 세트**로 나왔다.
// 즉 기념 굿즈의 단위는 상품이 아니라 **사건(은퇴·기록 달성·헤리티지 데이)**이다.
// 그래서 이 화면의 기본 단위도 상품이 아니라 '드롭'이다 - 하나의 사건에 여러 상품이 딸린다.
//
// ── 알림이 이 기능의 전부인 이유 ─────────────────────────────
// 한정 굿즈는 **몰랐다는 이유로 못 사는 것**이 팬에게 가장 큰 불만이다. 공식몰은 팬이
// 매일 들어가는 곳이 아니고, 인스타 공지는 알고리즘에 묻힌다. 구단 앱은 팬이 경기 때문에
// 어차피 켜는 앱이라 이 알림을 놓지 않을 수 있는 유일한 자리다.
//
// ⚠ 결제는 앱에서 하지 않는다. 공식몰로 리다이렉트한다 - 5번 티켓과 같은 원칙이다.
// (커머스 자체의 설계·수익 분배는 호석쌤 담당 1번 산출물을 따른다)

export type DropStatus = 'teaser' | 'upcoming' | 'onsale' | 'soldout' | 'ended';

/** 굿즈 드롭을 만든 '사건' - 상품이 아니라 이게 단위다 */
export type DropOccasion =
  | '은퇴'
  | '기록달성'
  | '헤리티지'
  | '시즌권'
  | '포스트시즌'
  | '콜라보'
  | '어린이날';

export interface GoodsItem {
  name: string;
  price: number;
  /** 한정 수량 - 없으면 상시 */
  limit?: number;
  /** 남은 수량 (시연용) */
  remain?: number;
  /** 사이즈 옵션 - 유니폼·의류에만 */
  sizes?: string[];
}

export interface GoodsDrop {
  id: string;
  title: string;
  occasion: DropOccasion;
  status: DropStatus;
  /** 발매 시각 - ISO */
  openAt: string;
  /** 마감 시각 */
  closeAt?: string;
  /** 왜 이 굿즈가 나오는지 - 사건의 맥락. 이게 없으면 그냥 쇼핑몰이다 */
  story: string;
  items: GoodsItem[];
  /** 공식몰 리다이렉트 */
  shopUrl: string;
  shopName: string;
  /** 현장 수령·현장 한정 여부 */
  venueOnly?: boolean;
  /** 관련 선수 id - 최애 선수 알림에 쓴다 */
  playerId?: string;
  /** 수령 방법 - 배송인지 현장 교환인지가 구매 판단을 가른다 */
  delivery: string;
  /** 1인 구매 제한 */
  buyLimit?: string;
}

/**
 * ※ 시연용 샘플 데이터입니다.
 * 구성 방식은 실제 사례(키움 박병호 은퇴 MD 세트 = 티셔츠·키링·응원타월)를 따랐습니다.
 */
export const DROPS: GoodsDrop[] = [
  {
    id: 'd1',
    title: '1999 우승 헤리티지 유니폼',
    occasion: '헤리티지',
    status: 'upcoming',
    openAt: '2026-08-14T14:00:00+09:00',
    story:
      '1999년 한국시리즈 우승 당시 유니폼을 원단과 자수까지 복각했습니다. ' +
      '8월 15일 홈경기에서 선수단이 이 유니폼을 입고 뜁니다.',
    items: [
      { name: '레플리카 유니폼 (마킹 없음)', price: 89000, limit: 1999, remain: 1999, sizes: ['S', 'M', 'L', 'XL', '2XL'] },
      { name: '레플리카 유니폼 (선수 마킹)', price: 119000, limit: 500, remain: 500, sizes: ['S', 'M', 'L', 'XL', '2XL'] },
      { name: '기념 모자', price: 39000 },
    ],
    shopUrl: 'https://www.hanwhaeagles.co.kr',
    shopName: '이글스 공식몰',
    delivery: '택배 배송 (발매일 기준 3~5일)',
  },
  {
    id: 'd2',
    title: '노시환 100홈런 기념 MD',
    occasion: '기록달성',
    status: 'onsale',
    openAt: '2026-08-08T14:00:00+09:00',
    closeAt: '2026-08-31T23:59:00+09:00',
    story:
      '통산 100홈런까지 5개 남았습니다. 달성 시점에 바로 발매할 수 있도록 미리 제작했습니다. ' +
      '달성 경기 관중에게는 현장 교환권이 배부됩니다.',
    items: [
      { name: '기념 응원타월', price: 18000, limit: 3000, remain: 812 },
      { name: '기념 티셔츠', price: 42000, limit: 1000, remain: 233, sizes: ['M', 'L', 'XL'] },
      { name: '아크릴 키링', price: 12000, limit: 2000, remain: 1104 },
    ],
    shopUrl: 'https://www.hanwhaeagles.co.kr',
    shopName: '이글스 공식몰',
    playerId: 'nsh',
    delivery: '택배 배송 · 달성 경기 현장 교환 가능',
    buyLimit: '1인 2개',
  },
  {
    id: 'd3',
    title: '류현진 데뷔 20주년 기념 세트',
    occasion: '기록달성',
    status: 'teaser',
    openAt: '2026-08-22T14:00:00+09:00',
    story: '데뷔 20주년을 기념하는 한정 세트를 준비하고 있습니다. 구성은 공개 전입니다.',
    items: [],
    shopUrl: 'https://www.hanwhaeagles.co.kr',
    shopName: '이글스 공식몰',
    playerId: 'ryu',
    delivery: '공개 전',
  },
  {
    id: 'd4',
    title: '볼파크 개장 1주년 기념 뱃지',
    occasion: '헤리티지',
    status: 'onsale',
    openAt: '2026-07-20T14:00:00+09:00',
    story: '대전 한화생명 볼파크 개장 1주년. 구장 좌석 도면을 그대로 새긴 핀 뱃지입니다.',
    items: [{ name: '핀 뱃지 (3종 세트)', price: 25000, limit: 800, remain: 47 }],
    shopUrl: 'https://www.hanwhaeagles.co.kr',
    shopName: '이글스 공식몰',
    venueOnly: true,
    delivery: '구장 MD샵 현장 수령만 (배송 없음)',
    buyLimit: '1인 1개',
  },
  {
    id: 'd5',
    title: '2026 어린이날 키즈 유니폼',
    occasion: '어린이날',
    status: 'ended',
    openAt: '2026-04-25T14:00:00+09:00',
    closeAt: '2026-05-05T23:59:00+09:00',
    story: '어린이날 홈경기 입장 어린이 전원에게 배부된 유니폼의 일반 판매분입니다.',
    items: [{ name: '키즈 유니폼', price: 45000, limit: 2000, remain: 0 }],
    shopUrl: 'https://www.hanwhaeagles.co.kr',
    shopName: '이글스 공식몰',
    delivery: '택배 배송 (발매일 기준 3~5일)',
  },
];

// ─────────────────────────────────────────────────────────────
// 알림 판단 - 무엇을 언제 밀어 줄 것인가
// ─────────────────────────────────────────────────────────────

export interface DropAlert {
  drop: GoodsDrop;
  /** 알림 제목 = 드롭 이름. 문장을 만들지 않는다 */
  message: string;
  /** 부기 한 줄 - 남은 시간·남은 수량. 사람이 읽는 단위로만 쓴다 */
  note: string;
  /** 긴급도 - 높을수록 먼저 */
  urgency: number;
}

/** 남은 수량 합 (한정 수량이 있는 구성품만) */
export function stockLeft(d: GoodsDrop): number | null {
  const limited = d.items.filter((i) => i.limit && i.remain !== undefined);
  if (limited.length === 0) return null;
  return limited.reduce((a, i) => a + (i.remain ?? 0), 0);
}

/** 가장 빨리 떨어지는 구성품 - 품절 임박을 개수로 말할 때의 주어 */
export function scarcestItem(d: GoodsDrop): { name: string; remain: number } | null {
  const limited = d.items.filter((i) => i.limit && i.remain !== undefined);
  if (limited.length === 0) return null;
  const worst = limited.reduce((a, i) =>
    (i.remain ?? 0) / (i.limit ?? 1) < (a.remain ?? 0) / (a.limit ?? 1) ? i : a,
  );
  return { name: worst.name, remain: worst.remain ?? 0 };
}

/** 남은 수량 비율 - 품절 임박 판단 */
export function stockRatio(d: GoodsDrop): number | null {
  const limited = d.items.filter((i) => i.limit && i.remain !== undefined);
  if (limited.length === 0) return null;
  const total = limited.reduce((a, i) => a + (i.limit ?? 0), 0);
  const left = limited.reduce((a, i) => a + (i.remain ?? 0), 0);
  return total === 0 ? null : left / total;
}

/**
 * 지금 띄울 만한 굿즈 알림을 고른다.
 *
 * 판매 중인 모든 굿즈를 매일 알리면 팬은 알림을 끈다. **알릴 이유가 생겼을 때만** 말한다.
 *   · 발매가 임박했다 (내일·오늘)
 *   · 품절이 임박했다 (재고 20% 미만)
 *   · 내 최애 선수의 굿즈다
 */
export function dropAlerts(nowMs: number, favoritePlayerId?: string): DropAlert[] {
  const out: DropAlert[] = [];

  for (const d of DROPS) {
    const openMs = Date.parse(d.openAt);
    const hoursToOpen = (openMs - nowMs) / 3600000;
    const isFav = !!favoritePlayerId && d.playerId === favoritePlayerId;

    if (d.status === 'upcoming' && hoursToOpen > 0 && hoursToOpen <= 48) {
      out.push({
        drop: d,
        message: d.title,
        note:
          hoursToOpen <= 3
            ? `발매까지 ${Math.max(1, Math.round(hoursToOpen))}시간`
            : `발매까지 ${Math.round(hoursToOpen / 24) || 1}일`,
        urgency: isFav ? 95 : 80,
      });
      continue;
    }

    if (d.status === 'onsale') {
      const ratio = stockRatio(d);
      if (ratio !== null && ratio <= 0.2) {
        const worst = scarcestItem(d);
        out.push({
          drop: d,
          message: d.title,
          note: worst ? `${worst.name} ${worst.remain}개 남음` : '곧 품절',
          urgency: isFav ? 99 : 90,
        });
        continue;
      }
      if (isFav) {
        out.push({
          drop: d,
          message: d.title,
          note: '판매 중',
          urgency: 70,
        });
      }
    }
  }

  return out.sort((a, b) => b.urgency - a.urgency);
}

export function statusLabel(s: DropStatus): string {
  return { teaser: '공개 예정', upcoming: '발매 예정', onsale: '판매 중', soldout: '품절', ended: '종료' }[s];
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
