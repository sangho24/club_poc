// 알림함 - 온보딩에서 켠 알림이 도착하는 자리.
//
// ── 왜 필요한가 ──────────────────────────────────────────────
// 온보딩이 "결정적 순간 · 굿즈 발매 · 예매 오픈 알림을 받으시겠어요?" 하고 물어 놓고,
// 정작 **받은 알림을 볼 자리가 앱에 없었다.** 켠 스위치가 아무 데도 닿지 않으면
// 그 온보딩은 묻기만 하고 지키지 않은 약속이 된다.
//
// 그래서 상단 벨이 이 목록의 종착지다. 프로필에서 끈 종류는 애초에 도착하지 않는다 -
// 목록을 걸러 보여주는 게 아니라 **오지 않는 것**이라, 설정이 실제로 작동한다는 것이
// 화면으로 증명된다.
//
// ※ 시연용 샘플 데이터입니다. 실서비스에서는 푸시 발송 이력이 이 배열을 채운다.

import { UserProfile } from './profile';

/** 알림 종류 - UserProfile.alerts 의 키와 1:1 로 맞물린다 */
export type NoticeKind = keyof UserProfile['alerts'];

export interface Notice {
  id: string;
  kind: NoticeKind;
  title: string;
  body: string;
  /** 상대 시각 표기 - 실서비스에서는 타임스탬프에서 계산한다 */
  at: string;
  unread: boolean;
}

const ALL: Notice[] = [
  {
    id: 'n1',
    kind: 'clutch',
    title: '8회말 2·3루, 승패가 갈리는 타석',
    body: '평균 타석의 4.3배만큼 승패를 흔드는 국면입니다.',
    at: '방금',
    unread: true,
  },
  {
    id: 'n2',
    kind: 'goodsDrop',
    title: '노시환 어센틱 유니폼 재입고',
    body: '95·100 사이즈만 남았습니다.',
    at: '1시간 전',
    unread: true,
  },
  {
    id: 'n3',
    kind: 'ticketOpen',
    title: '8/29 KIA전 예매가 열렸습니다',
    body: '티켓링크에서 판매 중입니다.',
    at: '어제',
    unread: false,
  },
  {
    id: 'n4',
    kind: 'goodsDrop',
    title: '2026 시즌 모자 발매',
    body: '홈 경기 한정 수량으로 먼저 풀립니다.',
    at: '2일 전',
    unread: false,
  },
];

/**
 * 프로필에서 켠 종류만 돌려준다.
 *
 * 걸러서 숨기는 게 아니라 **오지 않는 것**으로 취급한다. 끈 알림이 목록에 회색으로
 * 남아 있으면 "껐는데 왜 오지?"가 되어 설정을 못 믿게 된다.
 */
export function noticesFor(profile: UserProfile): Notice[] {
  return ALL.filter((n) => profile.alerts[n.kind]);
}

export function unreadCount(profile: UserProfile): number {
  return noticesFor(profile).filter((n) => n.unread).length;
}

/** 알림 종류별 이름 - 목록에서 어떤 스위치가 보낸 것인지 드러낸다 */
export const NOTICE_LABEL: Record<NoticeKind, string> = {
  clutch: '결정적 순간',
  goodsDrop: '굿즈 발매',
  ticketOpen: '예매 오픈',
};
