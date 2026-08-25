// 경기 - 오늘 일정과 라이브 상태
//
// 라이브 화면의 시연을 위해 **한 경기의 타석 흐름을 미리 정의해 둔다.** 실서비스에서는
// 이 자리에 문자중계 피드가 들어온다. 지금은 정해진 시퀀스를 앞뒤로 넘기며 상황이 바뀔 때
// 확률과 해설이 어떻게 따라 움직이는지를 보여 주는 것이 목적이다.
//
// 시퀀스를 고를 때 기준: **하나의 흐름 안에 여러 국면이 다 들어가야 한다.**
// 여유 국면 → 주자 쌓임 → 만루 → 투수 교체 판단 → 결정적 타석. 시연 중에 화면을 바꾸지
// 않고도 엔진이 상황마다 다른 말을 한다는 것을 보여줄 수 있다.
import { Bases, GameSituation } from './liveEngine';

export interface TeamRef {
  id: string;
  name: string;
  short: string;
}

export const HANWHA: TeamRef = { id: 'HH', name: '한화 이글스', short: '한화' };

export interface TodayGame {
  id: string;
  opponent: TeamRef;
  isHome: boolean;
  stadium: string;
  startTime: string;
  status: 'scheduled' | 'live' | 'final';
  ourScore: number;
  theirScore: number;
  inning?: number;
  half?: 'top' | 'bottom';
}

export const TODAY_GAME: TodayGame = {
  id: 'g1',
  opponent: { id: 'LG', name: 'LG 트윈스', short: 'LG' },
  isHome: true,
  stadium: '대전',
  startTime: '18:30',
  status: 'live',
  ourScore: 3,
  theirScore: 4,
  inning: 8,
  half: 'bottom',
};

const bases = (f: boolean, s: boolean, t: boolean): Bases => ({
  first: f,
  second: s,
  third: t,
});

export interface PlateAppearance {
  /** 상황 */
  situation: GameSituation;
  /** 타석에 선 우리 타자 id (roster 의 BATTERS) */
  batterId: string;
  /** 마운드에 선 상대 투수 id (roster 의 OPPONENT_PITCHERS) */
  pitcherId: string;
  /** 이 타석에서 실제로 일어난 일 - 다음으로 넘길 때 보여 준다 */
  outcome: string;
  /** 문자중계 행 - 이름 없이 결과만. 이름은 행의 왼쪽 칸이 갖는다 */
  logLine: string;
}

const base = {
  half: 'bottom' as const,
  scoreDiff: -1,
  park: '대전',
};

/**
 * 8회말부터 9회말까지의 흐름.
 *
 * 한화가 1점 뒤진 상황에서 시작해 주자가 쌓이고 만루까지 간다.
 * 국면이 올라갈수록 레버리지가 어떻게 뛰는지가 이 시퀀스의 핵심이다.
 *
 * 마운드는 8회 상대 선발(임찬규) → 9회 상대 마무리(유영찬)로 넘어간다.
 * 마지막 타석은 9회말 2사 만루에서 상대 마무리와 우리 4번 타자가 붙는 자리인데,
 * 여기서 **시즌 성적은 투수 쪽인데 상황이 타자 쪽으로 뒤집는** 계산이 나온다.
 */
export const PLATE_SEQUENCE: PlateAppearance[] = [
  {
    situation: {
      ...base,
      inning: 8,
      outs: 0,
      bases: bases(false, false, false),
      balls: 0,
      strikes: 0,
    },
    batterId: 'mhb',
    pitcherId: 'lcg',
    outcome: '문현빈 중전 안타로 출루했습니다.',
    logLine: '중전 안타',
  },
  {
    situation: {
      ...base,
      inning: 8,
      outs: 0,
      bases: bases(true, false, false),
      balls: 1,
      strikes: 1,
    },
    batterId: 'ces',
    pitcherId: 'lcg',
    outcome: '채은성 유격수 앞 땅볼, 1루 주자만 아웃되고 타자는 살았습니다.',
    logLine: '유격수 땅볼 · 1루 주자 아웃',
  },
  {
    situation: {
      ...base,
      inning: 8,
      outs: 1,
      bases: bases(true, false, false),
      balls: 2,
      strikes: 1,
    },
    batterId: 'nsh',
    pitcherId: 'lcg',
    outcome: '노시환 좌중간 2루타. 1루 주자가 3루까지 갔습니다.',
    logLine: '좌중간 2루타',
  },
  {
    situation: {
      ...base,
      inning: 8,
      outs: 1,
      bases: bases(false, true, true),
      balls: 0,
      strikes: 0,
    },
    batterId: 'flo',
    pitcherId: 'lcg',
    outcome: '플로리얼 고의4구. 만루가 됐습니다.',
    logLine: '고의4구',
  },
  {
    situation: {
      ...base,
      inning: 8,
      outs: 1,
      bases: bases(true, true, true),
      balls: 0,
      strikes: 0,
    },
    batterId: 'cjh',
    pitcherId: 'lcg',
    outcome: '최재훈 삼진. 2아웃이 됐습니다.',
    logLine: '헛스윙 삼진',
  },
  {
    situation: {
      ...base,
      inning: 8,
      outs: 2,
      bases: bases(true, true, true),
      balls: 3,
      strikes: 2,
    },
    batterId: 'kty',
    pitcherId: 'lcg',
    outcome: '김태연 풀카운트 승부 끝에 유격수 땅볼. 이닝이 끝났습니다.',
    logLine: '유격수 땅볼 · 이닝 종료',
  },
  {
    situation: {
      ...base,
      inning: 9,
      outs: 0,
      bases: bases(false, false, false),
      balls: 0,
      strikes: 0,
    },
    batterId: 'ach',
    pitcherId: 'yyc',
    outcome: '안치홍 볼넷으로 걸어 나갔습니다.',
    logLine: '볼넷',
  },
  {
    situation: {
      ...base,
      inning: 9,
      outs: 1,
      bases: bases(true, true, false),
      balls: 1,
      strikes: 2,
    },
    batterId: 'hym',
    pitcherId: 'yyc',
    outcome: '황영묵 희생번트 실패, 삼진입니다.',
    logLine: '삼진 (번트 실패)',
  },
  {
    situation: {
      ...base,
      inning: 9,
      outs: 2,
      bases: bases(true, true, true),
      balls: 3,
      strikes: 2,
    },
    batterId: 'nsh',
    pitcherId: 'yyc',
    outcome: '?',
    logLine: '타석 진행 중',
  },
];

/** 최근 5경기 - 홈 화면 요약용 */
export interface RecentGame {
  date: string;
  opponent: string;
  result: 'W' | 'L' | 'D';
  score: string;
}

export const RECENT: RecentGame[] = [
  { date: '08.10', opponent: 'LG', result: 'W', score: '7:3' },
  { date: '08.09', opponent: 'LG', result: 'L', score: '2:5' },
  { date: '08.08', opponent: 'KT', result: 'W', score: '6:4' },
  { date: '08.06', opponent: 'KT', result: 'W', score: '9:1' },
  { date: '08.05', opponent: 'SSG', result: 'L', score: '3:8' },
];

export const STANDING = {
  // KBO 앱 목업(7/25 기준 7위 44-48)에서 상승세로 이어진 값. 두 앱을 나란히
  // 시연해도 궤적이 맞도록 여기만 따로 바꾸지 않는다
  rank: 5,
  w: 54,
  l: 53,
  d: 2,
  winRate: 0.505,
  /** 바로 위 순위(4위)와의 경기차 - 선두보다 와일드카드 싸움이 이 팀의 이야기다 */
  gapUp: 1.5,
};
