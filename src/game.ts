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

/** 시연 시즌. 날짜를 'MM.DD' 로만 적기 때문에 연도는 여기 한 곳에 둔다 */
export const SEASON = 2026;

/**
 * 시연 기준 시각.
 *
 * `Date.now()` 를 쓰면 실행할 때마다 카운트다운과 'D-3' 이 달라져 시연이 매번 다른 화면이 된다.
 * 오늘 경기(08.11) 시작 세 시간 반 전 - 예매 오픈·조기 예매 쿠폰·주차 카운트다운이
 * 전부 이 한 값을 기준으로 계산된다.
 *
 * ⚠ `HomeScreen`·`StoreScreen` 에 같은 값이 아직 각자 박혀 있다(굿즈 쪽은 담당이 달라
 *    이번에 건드리지 않았다). 그 파일을 다음에 열 때 이 상수로 접어야 한다 -
 *    시연 시각을 옮길 때 한 곳만 고치면 나머지가 조용히 어긋난다.
 */
export const DEMO_NOW = Date.parse('2026-08-11T15:00:00+09:00');

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 'MM.DD' → 그 날짜.
 *
 * 요일과 달력 격자 위치가 전부 여기서 나온다. 예전에는 일정마다 요일을 손으로 적었고
 * **여덟 줄이 전부 하루씩 밀려 있었다**(월요일에 경기가 서 있었다). 목록으로만 보일
 * 때는 드러나지 않지만 달력에 얹으면 칸이 통째로 어긋난다.
 *
 * ⚠ 로컬 시간대의 자정으로 만든다. 시각이 필요한 계산(예매 오픈)은 여기에 시각을 얹어 쓴다.
 */
export function dateOf(mmdd: string): Date {
  const [m, d] = mmdd.split('.').map(Number);
  return new Date(SEASON, m - 1, d);
}

export const weekdayOf = (mmdd: string) => WEEKDAYS[dateOf(mmdd).getDay()];

/** 'MM.DD' → '8.12' - 목록·카드 제목처럼 앞의 0 이 거슬리는 자리 */
export const shortDate = (mmdd: string) => mmdd.replace(/^0/, '').replace('.0', '.');

export interface TodayGame {
  id: string;
  /** 'MM.DD' - 달력이 오늘 경기를 그리려면 날짜가 있어야 한다 */
  date: string;
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
  date: '08.11', // 화요일 - LG 3연전 첫 경기
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

// ⚠ 라인스코어(이닝별 점수·안타·실책)는 여기 없다.
//
//    전에는 `LINESCORE` 상수가 이 자리에 있었고 **타석을 넘겨도 값이 그대로였다.**
//    9회말까지 갔는데 8회말 칸이 비어 있었고(이미 치른 이닝인데 아직 안 친 것처럼),
//    8회말 첫 타석인데 안타는 벌써 7개였다. 무엇보다 문자중계를 1회까지 펼치고 나면
//    **표와 중계가 서로를 반박할 수 있게 된다** - 3회말에 2점이 찍혀 있는데 그 이닝
//    중계에 득점이 없으면 앱이 자기 말을 뒤집는다.
//
//    세는 값은 중계 한 곳에만 두고 표는 거기서 합산한다 - `src/liveFeed.ts` 의
//    `lineScoreAt(step)`. roster.ts 가 타율을 적어 두지 않는 것과 같은 규칙이다.
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
  /**
   * 안타로 기록되는 타석인가.
   *
   * 라인스코어의 H 를 손으로 적지 않기 위해 필요하다. 예전에는 안타 수가 상수로 박혀 있어
   * **타석을 앞뒤로 넘겨도 값이 그대로**였고(8회말 첫 타석인데 이미 7안타), 시퀀스를 고치면
   * 조용히 어긋났다. 세는 값은 여기 한 곳에만 둔다 - `src/liveFeed.ts` 가 합산한다.
   */
  hit?: boolean;
}

/**
 * 오늘 선발 라인업.
 *
 * ── 왜 roster 가 아니라 여기인가 ────────────────────────────
 * 타순은 **그날 경기의 값**이지 선수의 속성이 아니다. 같은 선수가 어제는 6번, 오늘은 3번을
 * 친다. `roster.ts` 에 타순을 적으면 경기가 바뀔 때마다 선수 명단을 고쳐야 한다.
 *
 * ── 왜 id 만 두는가 ─────────────────────────────────────────
 * 이름·포지션·타율은 전부 `roster.ts` 와 `sabermetrics.ts` 가 이미 갖고 있다. 여기에
 * 다시 적으면 두 값이 어긋나는 순간 화면이 거짓말을 한다 (roster 의 "세는 값만 둔다"와 같은 규칙).
 *
 * ⚠ 이 순서는 `PLATE_SEQUENCE` 의 타순과 반드시 맞아야 한다. 라인업 카드와 문자중계가
 * 한 화면에 같이 있어서, 어긋나면 그 자리에서 들킨다. `tools/verify-stats.ts` 가 검사한다.
 */
export interface Lineup {
  /** 1번부터 9번까지, `BATTERS` 의 id */
  order: string[];
  /** 우리 선발투수 (`PITCHERS` 의 id) */
  starterId: string;
  /** 상대 선발투수 (`OPPONENT_PITCHERS` 의 id) */
  opponentStarterId: string;
}

export const LINEUP: Lineup = {
  order: ['lws', 'per', 'mhb', 'kbh', 'nsh', 'ces', 'his', 'ldy', 'swj'],
  starterId: 'ryu',
  opponentStarterId: 'lcg',
};

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
 * 마지막 타석은 9회말 2사 만루에서 상대 마무리와 우리 중심 타자(노시환)가 붙는 자리인데,
 * 여기서 **시즌 성적은 투수 쪽인데 상황이 타자 쪽으로 뒤집는** 계산이 나온다.
 *
 * ── 왜 타순을 다시 짰나 (2026-08-26) ────────────────────────
 * 예전 시퀀스는 타순이 3번 → 6번 → 5번 → 2번으로 튀었고, 명단에 없는 백업 둘
 * (최재훈·김태연)이 끼어 있었다. 화면에 라인업이 없을 때는 아무도 몰랐지만, **선발 오더를
 * 그리는 순간 그 카드와 문자중계가 서로를 반박한다.** 야구 팬이 가장 먼저 알아채는 종류의
 * 어긋남이라, 상황(레버리지 계산의 입력)은 그대로 두고 타자만 타순대로 다시 얹었다.
 *
 * 12타석은 정확히 타순 한 바퀴 + 3명이다. 8회말 첫 타자를 3번(문현빈)으로 두면
 * 마지막 12번째 타석이 5번(노시환)에 떨어져, 위에 적은 '뒤집히는 승부'가 유지된다.
 *   8회말  3 문현빈 · 4 강백호 · 5 노시환 · 6 채은성 · 7 허인서 · 8 이도윤
 *   9회말  9 심우준 · 1 이원석 · 2 페라자 · 3 문현빈 · 4 강백호 · 5 노시환
 *
 * 9회말도 함께 고쳤다. 예전에는 볼넷 다음 타석이 이미 1아웃 1·2루였고 그 다음이 2사 만루라,
 * **중계에 적히지 않은 일이 두 번 일어나야** 말이 되는 흐름이었다. 문자중계를 화면에 펼치는
 * 순간 그 구멍이 그대로 보이므로, 아웃과 주자가 한 타석씩 이어지도록 채웠다.
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
    hit: true,
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
    batterId: 'kbh',
    pitcherId: 'lcg',
    outcome: '강백호 유격수 앞 땅볼, 1루 주자만 아웃되고 타자는 살았습니다.',
    logLine: '유격수 땅볼 · 1루 주자 포스아웃',
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
    hit: true,
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
    batterId: 'ces',
    pitcherId: 'lcg',
    outcome: '채은성 고의4구. 만루가 됐습니다.',
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
    batterId: 'his',
    pitcherId: 'lcg',
    outcome: '허인서 삼진. 2아웃이 됐습니다.',
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
    batterId: 'ldy',
    pitcherId: 'lcg',
    outcome: '이도윤 풀카운트 승부 끝에 유격수 땅볼. 이닝이 끝났습니다.',
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
    batterId: 'swj',
    pitcherId: 'yyc',
    outcome: '심우준 볼넷으로 걸어 나갔습니다.',
    logLine: '볼넷',
  },
  {
    situation: {
      ...base,
      inning: 9,
      outs: 0,
      bases: bases(true, false, false),
      balls: 1,
      strikes: 2,
    },
    batterId: 'lws',
    pitcherId: 'yyc',
    outcome: '이원석 희생번트 실패, 삼진입니다.',
    logLine: '삼진 (번트 실패)',
  },
  {
    situation: {
      ...base,
      inning: 9,
      outs: 1,
      bases: bases(true, false, false),
      balls: 0,
      strikes: 0,
    },
    batterId: 'per',
    pitcherId: 'yyc',
    outcome: '페라자 우전 안타. 1루 주자가 2루까지 갔습니다.',
    logLine: '우전 안타',
    hit: true,
  },
  {
    situation: {
      ...base,
      inning: 9,
      outs: 1,
      bases: bases(true, true, false),
      balls: 2,
      strikes: 2,
    },
    batterId: 'mhb',
    pitcherId: 'yyc',
    outcome: '문현빈 헛스윙 삼진. 2아웃입니다.',
    logLine: '헛스윙 삼진',
  },
  {
    situation: {
      ...base,
      inning: 9,
      outs: 2,
      bases: bases(true, true, false),
      balls: 3,
      strikes: 1,
    },
    batterId: 'kbh',
    pitcherId: 'yyc',
    outcome: '강백호 볼넷. 만루가 됐습니다.',
    logLine: '볼넷',
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

// ⚠ 날짜는 SCHEDULE 과 같은 편성 규칙을 따른다 - 화~목 · 금~일 3연전에 월요일 휴식.
//    예전 목록은 08.10(월)에 경기가 있고 08.07(금)이 비어 있어, 달력을 그리는 순간
//    같은 화면 안에서 규칙이 둘이 됐다.
//    08.04~08.06 SSG(홈) → 08.07~08.09 KT(원정) → 08.10 휴식 → 08.11 LG 3연전 시작
export const RECENT: RecentGame[] = [
  { date: '08.09', opponent: 'KT', result: 'W', score: '7:3' },
  { date: '08.08', opponent: 'KT', result: 'L', score: '2:5' },
  { date: '08.07', opponent: 'KT', result: 'W', score: '6:4' },
  { date: '08.06', opponent: 'SSG', result: 'W', score: '9:1' },
  { date: '08.05', opponent: 'SSG', result: 'L', score: '3:8' },
];

/**
 * 다가오는 경기.
 *
 * ── 왜 직관 탭인가 ──────────────────────────────────────────
 * 일정만 따로 있는 화면은 달력이지 앱이 아니다. 팬이 일정을 보는 이유는 **"언제 갈까"**
 * 하나이고, 그 답을 정하면 곧바로 예매와 주차가 필요하다. 그래서 일정을 직관 탭 맨 위에
 * 두어 **일정 → 예매 → 주차**가 한 화면에서 이어지게 한다.
 *
 * 라이브 탭에 두지 않은 이유도 같다. 라이브는 '지금 이 경기'만 다루는 자리라
 * 일정을 얹으면 화면의 질문이 둘이 된다.
 *
 * ── 요일을 적지 않는다 (2026-08-26) ─────────────────────────
 * 예전에는 `day: '화'` 를 손으로 적었고 **전부 하루씩 밀려 있었다.** 2026-08-12 는
 * 수요일인데 화요일로 적혀 있었고, 그 결과 월요일(휴식일)에 경기가 서 있었다.
 * 목록으로만 보일 때는 아무도 몰랐지만 **달력 격자에 얹는 순간 칸이 어긋난다.**
 * 요일은 날짜에서 나오는 값이라 `weekdayOf()` 가 계산한다 - 세는 값만 둔다는
 * roster.ts 의 규칙과 같다.
 *
 * 일정 자체도 KBO 편성대로 다시 짰다. 화~목 3연전 · 금~일 3연전 · **월요일 휴식**이고,
 * 주중 18:30 · 주말 17:00 이다. 예전 목록은 이 규칙 어디에도 맞지 않았다.
 *
 * ⚠ 시연용 샘플이다. 실서비스에서는 KBO 일정 API 를 받는다.
 */
export interface ScheduledGame {
  /** 'MM.DD' - 요일은 여기서 계산한다 */
  date: string;
  opponent: string;
  /** 홈경기여야 예매·주차가 의미를 갖는다 */
  home: boolean;
  startTime: string;
}

export const SCHEDULE: ScheduledGame[] = [
  // 화~목 LG 3연전 (오늘 08.11 이 첫 경기라 이 목록에는 남은 둘만 있다)
  { date: '08.12', opponent: 'LG', home: true, startTime: '18:30' },
  { date: '08.13', opponent: 'LG', home: true, startTime: '18:30' },
  // 금~일 KIA 3연전
  { date: '08.14', opponent: 'KIA', home: true, startTime: '18:30' },
  { date: '08.15', opponent: 'KIA', home: true, startTime: '17:00' },
  { date: '08.16', opponent: 'KIA', home: true, startTime: '17:00' },
  // 원정 6연전 - 예매·주차가 걸리지 않는 구간
  { date: '08.18', opponent: '롯데', home: false, startTime: '18:30' },
  { date: '08.19', opponent: '롯데', home: false, startTime: '18:30' },
  { date: '08.20', opponent: '롯데', home: false, startTime: '18:30' },
  { date: '08.21', opponent: '삼성', home: false, startTime: '18:30' },
  { date: '08.22', opponent: '삼성', home: false, startTime: '17:00' },
  { date: '08.23', opponent: '삼성', home: false, startTime: '17:00' },
  // 홈 6연전 - 08.18 부터 순서대로 예매가 열린다(7일 전 오후 2시)
  { date: '08.25', opponent: '두산', home: true, startTime: '18:30' },
  { date: '08.26', opponent: '두산', home: true, startTime: '18:30' },
  { date: '08.27', opponent: '두산', home: true, startTime: '18:30' },
  { date: '08.28', opponent: 'SSG', home: true, startTime: '18:30' },
  { date: '08.29', opponent: 'SSG', home: true, startTime: '17:00' },
  { date: '08.30', opponent: 'SSG', home: true, startTime: '17:00' },
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
