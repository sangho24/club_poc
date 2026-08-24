// 사용자 프로필 - 앱이 같은 데이터로 다른 문장을 내기 위한 최소 입력값
//
// KBO 공식 앱 PRD 의 A-1(온보딩 지식수준 축)을 구단 앱에도 그대로 가져온다.
// 심화 스탯을 얹을수록 이 축이 더 중요해진다 - wRC+ 를 처음 보는 팬과 매일 보는 팬에게
// 같은 문장을 쓰면 한쪽은 못 알아듣고 다른 쪽은 유치하다고 느낀다.

/** 야구 지식 수준 - 해설의 깊이를 결정한다 */
export type KnowledgeLevel = 'rookie' | 'fan' | 'nerd';

export const KNOWLEDGE_OPTIONS: {
  key: KnowledgeLevel;
  /** 세그먼트 컨트롤용 짧은 이름 */
  short: string;
  label: string;
  desc: string;
}[] = [
  // desc 는 화면에 그대로 붙는다. "~해 드립니다" 서비스 말투가 아니라 내용만
  { key: 'rookie', short: '입문', label: '야구 처음이에요', desc: '용어를 풀어서' },
  { key: 'fan', short: '일반', label: '규칙은 알아요', desc: '지표의 의미까지' },
  {
    key: 'nerd',
    short: '심화',
    label: '기록 파는 편이에요',
    desc: '계산 과정과 한계까지',
  },
];

export interface UserProfile {
  level: KnowledgeLevel;
  /** 최애 선수 id (roster 의 id) */
  favoritePlayerId?: string;
  /** 알림 받을 항목 */
  alerts: {
    clutch: boolean; // 결정적 국면
    goodsDrop: boolean; // 굿즈 발매
    ticketOpen: boolean; // 예매 오픈
  };
}

export const DEFAULT_PROFILE: UserProfile = {
  level: 'fan',
  favoritePlayerId: 'nsh',
  alerts: { clutch: true, goodsDrop: true, ticketOpen: true },
};

/**
 * 저장소에서 읽은 값을 프로필로 복원한다.
 *
 * 저장 스키마가 바뀌어도 키를 새로 파지 않고 여기서 채워 넣는다 - 예전 저장값
 * 호환의 유일한 지점 (kbo_poc context.tsx 의 normalizeProfile 패턴 이식).
 */
export function normalizeProfile(value: unknown): UserProfile {
  if (typeof value !== 'object' || value === null) return DEFAULT_PROFILE;
  const v = value as Record<string, unknown>;
  const level: KnowledgeLevel =
    v.level === 'rookie' || v.level === 'fan' || v.level === 'nerd' ? v.level : DEFAULT_PROFILE.level;
  const favoritePlayerId = typeof v.favoritePlayerId === 'string' ? v.favoritePlayerId : undefined;
  const a = (typeof v.alerts === 'object' && v.alerts !== null ? v.alerts : {}) as Record<string, unknown>;
  const flag = (x: unknown, d: boolean) => (typeof x === 'boolean' ? x : d);
  return {
    level,
    favoritePlayerId,
    alerts: {
      clutch: flag(a.clutch, DEFAULT_PROFILE.alerts.clutch),
      goodsDrop: flag(a.goodsDrop, DEFAULT_PROFILE.alerts.goodsDrop),
      ticketOpen: flag(a.ticketOpen, DEFAULT_PROFILE.alerts.ticketOpen),
    },
  };
}
