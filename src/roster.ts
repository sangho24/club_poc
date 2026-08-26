// 한화 이글스 선수단 원자료
//
// ※ 모든 수치는 시연용 샘플 데이터입니다 (실제 기록과 무관).
//
// ── 설계 원칙: 여기에는 '세는 값'만 둔다 ──────────────────────
// 타율·wOBA·wRC+·WAR 은 이 파일에 없다. 전부 sabermetrics.ts 가 아래 원자료에서
// 계산한다. 파생값을 같이 적어 두면 원자료와 어긋나는 순간 화면이 거짓말을 하게 되고,
// 무엇보다 "이 값이 어디서 나왔나"를 화면에서 되짚을 수 없다.
//
// 원자료의 내부 정합은 verifyRoster() 가 검사한다 (타석 = 타수+볼넷+사구+희생타 등).
import { BatterStatLine, PitcherStatLine } from './sabermetrics';

/** 포지션별 수비 난이도 조정 (600타석 기준 런). 어려운 자리를 지킬수록 가산 */
export const POSITION_ADJ: Record<string, number> = {
  C: 12.5, // 포수
  SS: 7.5, // 유격수
  '2B': 2.5,
  '3B': 2.5,
  CF: 2.5,
  LF: -7.5,
  RF: -7.5,
  '1B': -12.5,
  DH: -17.5, // 수비를 하지 않으므로 가장 크게 깎는다
};

export interface Batter {
  id: string;
  name: string;
  back: number; // 등번호
  pos: string;
  bats: 'L' | 'R' | 'S';
  age: number;
  stat: BatterStatLine;
  /**
   * 선수 소개 한 줄 - 스탯이 말하지 못하는 맥락.
   *
   * ⚠ **습니다체로 적는다.** 이 줄은 화면에 홀로 서지 않고 AI 분석 문단의 첫머리에
   * 붙는다(playerAnalysis.ts). 여기만 다체로 두면 한 문단 안에서 화자가 한 번 바뀐다.
   * '1번 타자.' 같은 머리 조각은 체를 갖지 않으므로 그대로 두어도 된다.
   */
  note: string;
}

export interface Pitcher {
  id: string;
  name: string;
  back: number;
  role: '선발' | '불펜' | '마무리';
  throws: 'L' | 'R';
  age: number;
  stat: PitcherStatLine;
  /** 주무기 구종 - 상황별 매치업 해설에 쓴다 */
  pitches: { name: string; usage: number; velo?: number }[];
  /** 타자 쪽 note 와 같은 규칙 - 습니다체로 적는다 */
  note: string;
}

/**
 * 한화 이글스 타자진 (2026 시즌 기준으로 갱신, 2026-08-24).
 *
 * 앞의 아홉은 2026-08-11 선발 오더 그대로다 - 이·페·문·강·노·채·허·이·심.
 * 뒤의 둘(최재훈·김태연)은 같은 시즌 로스터의 백업이다.
 *
 * ── 무엇이 실제이고 무엇이 샘플인가 ─────────────────────────
 * **이름·등번호·포지션·타순은 실제**다(나무위키 선수단 + 8/11 선발 오더 기사).
 * **성적은 시연용 샘플**이되, 아래 셋은 검색으로 확인한 2026 시즌 수치에 맞췄다.
 *   · 노시환  타율 .272 · 25홈런 · 79타점
 *   · 문현빈  타율 .288 · 12홈런 · 58타점
 *   · 강백호  26홈런 · 90타점 · OPS .93 언저리
 * 나머지 선수와, 위 셋의 나머지 항목(2루타·볼넷·삼진·타구 유형 등)은 지어낸 값이다.
 * 투구팔·나이도 확인되지 않은 것은 그럴듯한 값으로 채웠다.
 *
 * ── 2025년 판에서 바뀐 것 ───────────────────────────────────
 * 강백호(FA)·페라자(외국인 교체)·심우준·이도윤·허인서·이원석이 들어오고
 * 플로리얼·안치홍·황영묵이 빠졌다. 채은성의 등번호가 9 → 22 로 바뀌었다.
 * 최재훈과 안치홍이 **둘 다 13번**이던 예전 오류도 여기서 사라진다.
 */
// 타구 유형 비율은 땅볼+뜬공+라인드라이브 = 1.0 이 되게 맞춘다
export const BATTERS: Batter[] = [
  {
    id: 'lws',
    name: '이원석',
    back: 37,
    pos: 'CF',
    bats: 'R',
    age: 24,
    note: '1번 타자. 출루와 주루로 밥값을 하는 유형이라 타율보다 출루율을 봐야 합니다',
    stat: {
      g: 102,
      pa: 454,
      ab: 398,
      h: 108,
      double: 17,
      triple: 4,
      hr: 6,
      bb: 44,
      ibb: 0,
      hbp: 4,
      so: 76,
      sf: 2,
      sh: 6,
      sb: 21,
      cs: 7,
      r: 66,
      rbi: 38,
      gdp: 5,
      gbRate: 0.48,
      fbRate: 0.32,
      ldRate: 0.2,
      fieldingRuns: 5.0,
      positionAdj: POSITION_ADJ.CF,
    },
  },
  {
    id: 'per',
    name: '페라자',
    back: 30,
    pos: 'RF',
    bats: 'L',
    age: 28,
    note: '외국인 타자. 장타는 확실한데 삼진이 많아 타율 기복이 큽니다',
    stat: {
      g: 104,
      pa: 475,
      ab: 425,
      h: 118,
      double: 24,
      triple: 2,
      hr: 21,
      bb: 41,
      ibb: 2,
      hbp: 6,
      so: 108,
      sf: 3,
      sh: 0,
      sb: 9,
      cs: 4,
      r: 68,
      rbi: 74,
      gdp: 6,
      gbRate: 0.4,
      fbRate: 0.41,
      ldRate: 0.19,
      fieldingRuns: 1.0,
      positionAdj: POSITION_ADJ.RF,
    },
  },
  {
    id: 'mhb',
    name: '문현빈',
    back: 51,
    pos: 'LF',
    bats: 'L',
    age: 22,
    note: '컨택 위주 좌타자. 삼진이 적어 표본이 빨리 안정되는 편입니다',
    stat: {
      g: 108,
      pa: 484,
      ab: 434,
      h: 125,
      double: 21,
      triple: 3,
      hr: 12,
      bb: 40,
      ibb: 1,
      hbp: 5,
      so: 62,
      sf: 4,
      sh: 1,
      sb: 14,
      cs: 5,
      r: 64,
      rbi: 58,
      gdp: 7,
      gbRate: 0.45,
      fbRate: 0.34,
      ldRate: 0.21,
      fieldingRuns: 1.5,
      positionAdj: POSITION_ADJ.LF,
    },
  },
  {
    id: 'kbh',
    name: '강백호',
    back: 50,
    pos: 'DH',
    bats: 'L',
    age: 27,
    note: '4번 타자. 타점 1위 다툼을 하는 해라 주자 있는 상황의 지표가 유난히 좋습니다',
    stat: {
      g: 105,
      pa: 486,
      ab: 420,
      h: 128,
      double: 24,
      triple: 1,
      hr: 26,
      bb: 55,
      ibb: 5,
      hbp: 6,
      so: 78,
      sf: 5,
      sh: 0,
      sb: 2,
      cs: 1,
      r: 78,
      rbi: 90,
      gdp: 8,
      gbRate: 0.38,
      fbRate: 0.43,
      ldRate: 0.19,
      // 지명타자라 수비 가치가 없다. WAR 에서 포지션 조정이 가장 크게 깎이는 자리
      fieldingRuns: 0,
      positionAdj: POSITION_ADJ.DH,
    },
  },
  {
    id: 'nsh',
    name: '노시환',
    back: 8,
    pos: '3B',
    bats: 'R',
    age: 26,
    note: '팀 중심 타선. 당겨친 뜬공 비중이 높아 홈런과 병살이 같이 늘어납니다',
    stat: {
      g: 109,
      pa: 509,
      ab: 445,
      h: 121,
      double: 22,
      triple: 1,
      hr: 25,
      bb: 52,
      ibb: 3,
      hbp: 7,
      so: 128,
      sf: 5,
      sh: 0,
      sb: 3,
      cs: 2,
      r: 72,
      rbi: 79,
      gdp: 10,
      gbRate: 0.4,
      fbRate: 0.42,
      ldRate: 0.18,
      fieldingRuns: 2.5,
      positionAdj: POSITION_ADJ['3B'],
    },
  },
  {
    id: 'ces',
    name: '채은성',
    back: 22,
    pos: '1B',
    bats: 'R',
    age: 36,
    note: '부상에서 돌아온 베테랑. 결장이 있어 표본이 다른 주전보다 작습니다',
    stat: {
      g: 76,
      pa: 340,
      ab: 300,
      h: 84,
      double: 18,
      triple: 0,
      hr: 13,
      bb: 32,
      ibb: 3,
      hbp: 4,
      so: 58,
      sf: 4,
      sh: 0,
      sb: 1,
      cs: 0,
      r: 41,
      rbi: 62,
      gdp: 10,
      gbRate: 0.43,
      fbRate: 0.38,
      ldRate: 0.19,
      fieldingRuns: -1.0,
      positionAdj: POSITION_ADJ['1B'],
    },
  },
  {
    id: 'his',
    name: '허인서',
    back: 59,
    pos: 'C',
    bats: 'R',
    age: 23,
    note: '올해 데뷔 첫 홈런을 친 어린 주전 포수. 타격보다 수비와 포지션 조정에서 WAR 이 나옵니다',
    stat: {
      g: 79,
      pa: 268,
      ab: 236,
      h: 58,
      double: 9,
      triple: 0,
      hr: 3,
      bb: 21,
      ibb: 1,
      hbp: 4,
      so: 52,
      sf: 2,
      sh: 5,
      sb: 1,
      cs: 1,
      r: 24,
      rbi: 26,
      gdp: 6,
      gbRate: 0.47,
      fbRate: 0.34,
      ldRate: 0.19,
      fieldingRuns: 6.0,
      positionAdj: POSITION_ADJ.C,
    },
  },
  {
    id: 'ldy',
    name: '이도윤',
    back: 5,
    pos: '2B',
    bats: 'R',
    age: 30,
    note: '하위 타순 2루수. 번트와 진루타가 많아 타석 대비 타수가 적습니다',
    stat: {
      g: 94,
      pa: 352,
      ab: 312,
      h: 82,
      double: 13,
      triple: 2,
      hr: 4,
      bb: 26,
      ibb: 0,
      hbp: 3,
      so: 55,
      sf: 3,
      sh: 8,
      sb: 8,
      cs: 3,
      r: 42,
      rbi: 33,
      gdp: 7,
      gbRate: 0.49,
      fbRate: 0.31,
      ldRate: 0.2,
      fieldingRuns: 2.0,
      positionAdj: POSITION_ADJ['2B'],
    },
  },
  {
    id: 'swj',
    name: '심우준',
    back: 7,
    pos: 'SS',
    bats: 'R',
    age: 31,
    note: '수비로 자리를 지키는 유격수. 타격 지표는 평범해도 포지션 조정이 크게 붙습니다',
    stat: {
      g: 98,
      pa: 399,
      ab: 356,
      h: 92,
      double: 14,
      triple: 3,
      hr: 7,
      bb: 27,
      ibb: 1,
      hbp: 4,
      so: 68,
      sf: 3,
      sh: 9,
      sb: 18,
      cs: 5,
      r: 48,
      rbi: 41,
      gdp: 6,
      gbRate: 0.47,
      fbRate: 0.33,
      ldRate: 0.2,
      fieldingRuns: 5.0,
      positionAdj: POSITION_ADJ.SS,
    },
  },
  {
    id: 'cjh',
    name: '최재훈',
    back: 13,
    pos: 'C',
    bats: 'R',
    age: 37,
    note: '허인서에게 주전을 넘긴 베테랑 포수. 표본이 줄어 지표가 크게 흔들립니다',
    stat: {
      g: 66,
      pa: 210,
      ab: 178,
      h: 44,
      double: 8,
      triple: 0,
      hr: 2,
      bb: 24,
      ibb: 1,
      hbp: 3,
      so: 34,
      sf: 2,
      sh: 3,
      sb: 0,
      cs: 0,
      r: 19,
      rbi: 20,
      gdp: 5,
      gbRate: 0.48,
      fbRate: 0.33,
      ldRate: 0.19,
      fieldingRuns: 7.0,
      positionAdj: POSITION_ADJ.C,
    },
  },
  {
    id: 'kty',
    name: '김태연',
    back: 25,
    pos: 'RF',
    bats: 'R',
    age: 29,
    note: '좌투수 상대로 먼저 나오는 대타 자원. 플래툰 스플릿이 뚜렷합니다',
    stat: {
      g: 72,
      pa: 238,
      ab: 214,
      h: 57,
      double: 11,
      triple: 0,
      hr: 6,
      bb: 19,
      ibb: 0,
      hbp: 3,
      so: 41,
      sf: 2,
      sh: 0,
      sb: 2,
      cs: 1,
      r: 27,
      rbi: 31,
      gdp: 5,
      gbRate: 0.43,
      fbRate: 0.38,
      ldRate: 0.19,
      fieldingRuns: -1.5,
      positionAdj: POSITION_ADJ.RF,
    },
  },
];

/**
 * 한화 이글스 투수진 24명 (구단 공식 선수단 페이지 기준으로 갱신, 2026-08-24).
 *
 * **이름·등번호·보직은 실제**다. **성적은 시연용 샘플**이되, 2026-08-24 검색으로
 * 확인한 아래 사실에는 맞췄다.
 *   · 로테이션은 왕옌청 - 화이트 - 류현진 - 짐머맨 순 (왕옌청은 아시아쿼터 **좌완**)
 *   · 문동주  5/3 어깨 관절와순 파열 → 5/19 수술. 이후 등판 기록 없음 (7경기)
 *   · 엄상백  4/23 토미 존 수술. 이후 등판 기록 없음 (4경기). 78억 FA 첫 해다
 *   · 짐머맨  7/20 대체 외국인으로 합류 → 표본이 동료의 3분의 1
 *   · 류현진  전반기 15경기 8승 2패 87⅔이닝 ERA 2.67 · 70탈삼진 · 11볼넷
 *   · 김서현  마무리로 시작했으나 시즌 중 2군행 → 세이브가 끊긴 구간이 있다
 * 위 사실에 걸리지 않는 값(구종·나이·불펜 18명의 성적)은 지어낸 값이다.
 *
 * ⚠ 로테이션의 5선발 박준영은 구단 공식 선수단 페이지(사용자 제공 이미지)에 없어
 * 넣지 않았다. 명단의 출처를 하나로 유지하는 편이 낫다고 봤다.
 *
 * 나열 순서는 구단 페이지와 같게 등번호 순으로 둔다(류현진 99 만 앞). 화면은
 * WAR 순으로 다시 정렬하므로 이 순서가 표시 순서를 정하지는 않는다.
 *
 * 24명 중 사진이 있는 것은 류현진·문동주 둘뿐이다 - 나머지는 자유 라이선스
 * 사진이 없어 모자 마크로 폴백된다(components/photos.tsx 참조).
 */
export const PITCHERS: Pitcher[] = [
  // ── 선발 ────────────────────────────────────────────────────
  {
    id: 'ryu',
    name: '류현진',
    back: 99,
    role: '선발',
    throws: 'L',
    age: 39,
    note: '구속이 아니라 제구와 완급으로 던집니다. 볼넷이 극단적으로 적습니다',
    pitches: [
      { name: '체인지업', usage: 0.31, velo: 132 },
      { name: '포심', usage: 0.29, velo: 145 },
      { name: '커터', usage: 0.22, velo: 139 },
      { name: '커브', usage: 0.18, velo: 118 },
    ],
    stat: {
      g: 20,
      gs: 20,
      ipOuts: 353,
      h: 112,
      hr: 7,
      bb: 17,
      ibb: 1,
      hbp: 4,
      so: 94,
      r: 42,
      er: 38,
      w: 10,
      l: 3,
      sv: 0,
      hld: 0,
      bf: 492,
      gbRate: 0.47,
      fbRate: 0.35,
      ldRate: 0.18,
    },
  },
  {
    id: 'mdj',
    name: '문동주',
    back: 1,
    role: '선발',
    throws: 'R',
    age: 23,
    note: '5월 어깨 수술 이후 등판 기록이 없습니다. 7경기 표본이라 어떤 지표도 판단 근거가 되지 못합니다',
    pitches: [
      { name: '포심', usage: 0.51, velo: 155 },
      { name: '커브', usage: 0.22, velo: 128 },
      { name: '체인지업', usage: 0.18, velo: 140 },
      { name: '슬라이더', usage: 0.09, velo: 143 },
    ],
    stat: {
      g: 7,
      gs: 7,
      ipOuts: 114,
      h: 38,
      hr: 4,
      bb: 18,
      ibb: 0,
      hbp: 3,
      so: 36,
      r: 20,
      er: 18,
      w: 2,
      l: 3,
      sv: 0,
      hld: 0,
      bf: 176,
      gbRate: 0.44,
      fbRate: 0.37,
      ldRate: 0.19,
    },
  },
  {
    id: 'usb',
    name: '엄상백',
    back: 11,
    role: '선발',
    throws: 'R',
    age: 30,
    note: 'FA 첫 해에 4월 토미 존 수술을 받았습니다. 4경기뿐이라 지표를 읽는 것 자체가 무의미합니다',
    pitches: [
      { name: '포심', usage: 0.43, velo: 147 },
      { name: '체인지업', usage: 0.24, velo: 133 },
      { name: '커브', usage: 0.18, velo: 120 },
      { name: '슬라이더', usage: 0.15, velo: 136 },
    ],
    stat: {
      g: 4,
      gs: 4,
      ipOuts: 51,
      h: 26,
      hr: 4,
      bb: 12,
      ibb: 0,
      hbp: 2,
      so: 11,
      r: 19,
      er: 18,
      w: 0,
      l: 3,
      sv: 0,
      hld: 0,
      bf: 93,
      gbRate: 0.41,
      fbRate: 0.4,
      ldRate: 0.19,
    },
  },
  {
    id: 'zim',
    name: '짐머맨',
    back: 12,
    role: '선발',
    throws: 'L',
    age: 31,
    note: '7월에 합류한 대체 외국인. 표본이 짧아 로테이션 동료와 같은 잣대로 보면 안 됩니다',
    pitches: [
      { name: '포심', usage: 0.38, velo: 145 },
      { name: '슬라이더', usage: 0.26, velo: 134 },
      { name: '체인지업', usage: 0.22, velo: 131 },
      { name: '커브', usage: 0.14, velo: 119 },
    ],
    stat: {
      g: 7,
      gs: 7,
      ipOuts: 117,
      h: 40,
      hr: 4,
      bb: 12,
      ibb: 0,
      hbp: 2,
      so: 33,
      r: 19,
      er: 17,
      w: 2,
      l: 3,
      sv: 0,
      hld: 0,
      bf: 172,
      gbRate: 0.45,
      fbRate: 0.37,
      ldRate: 0.18,
    },
  },
  {
    id: 'wht',
    name: '화이트',
    back: 24,
    role: '선발',
    throws: 'R',
    age: 31,
    note: '이닝을 길게 끌고 가는 우완. 삼진과 이닝을 같이 가져가 WAR 이 가장 높게 잡힙니다',
    pitches: [
      { name: '포심', usage: 0.45, velo: 150 },
      { name: '슬라이더', usage: 0.27, velo: 137 },
      { name: '커브', usage: 0.16, velo: 126 },
      { name: '체인지업', usage: 0.12, velo: 139 },
    ],
    stat: {
      g: 20,
      gs: 20,
      ipOuts: 372,
      h: 110,
      hr: 10,
      bb: 35,
      ibb: 1,
      hbp: 5,
      so: 132,
      r: 49,
      er: 45,
      w: 10,
      l: 5,
      sv: 0,
      hld: 0,
      bf: 525,
      gbRate: 0.43,
      fbRate: 0.38,
      ldRate: 0.19,
    },
  },

  // ── 마무리 ──────────────────────────────────────────────────
  {
    id: 'ksh',
    name: '김서현',
    back: 44,
    role: '마무리',
    throws: 'R',
    age: 22,
    note: '시즌 중 2군에 다녀와 9회 자리가 오래 비었습니다. 표본이 작아 어떤 지표든 크게 흔들립니다',
    pitches: [
      { name: '포심', usage: 0.58, velo: 157 },
      { name: '슬라이더', usage: 0.34, velo: 142 },
      { name: '커브', usage: 0.08, velo: 130 },
    ],
    stat: {
      g: 38,
      gs: 0,
      ipOuts: 108,
      h: 32,
      hr: 3,
      bb: 22,
      ibb: 1,
      hbp: 3,
      so: 45,
      r: 18,
      er: 16,
      w: 2,
      l: 3,
      sv: 15,
      hld: 2,
      bf: 168,
      gbRate: 0.4,
      fbRate: 0.41,
      ldRate: 0.19,
    },
  },

  // ── 불펜 ────────────────────────────────────────────────────
  {
    id: 'ksi',
    name: '김승일',
    back: 14,
    role: '불펜',
    throws: 'R',
    age: 25,
    note: '중간 계투. 포심 구사율이 절반을 넘어 변화구 의존도가 낮습니다',
    pitches: [
      { name: '포심', usage: 0.52, velo: 146 },
      { name: '슬라이더', usage: 0.31, velo: 134 },
      { name: '체인지업', usage: 0.17, velo: 132 },
    ],
    stat: {
      g: 38,
      gs: 0,
      ipOuts: 114,
      h: 36,
      hr: 3,
      bb: 14,
      ibb: 0,
      hbp: 2,
      so: 34,
      r: 18,
      er: 16,
      w: 2,
      l: 2,
      sv: 0,
      hld: 8,
      bf: 168,
      gbRate: 0.46,
      fbRate: 0.35,
      ldRate: 0.19,
    },
  },
  {
    id: 'lhb',
    name: '이형범',
    back: 16,
    role: '불펜',
    throws: 'R',
    age: 32,
    note: '싱커로 땅볼을 받아내는 베테랑. 주자 있고 병살이 필요한 자리에 올라옵니다',
    pitches: [
      { name: '싱커', usage: 0.41, velo: 141 },
      { name: '슬라이더', usage: 0.33, velo: 128 },
      { name: '포심', usage: 0.18, velo: 143 },
      { name: '체인지업', usage: 0.08, velo: 130 },
    ],
    stat: {
      g: 45,
      gs: 0,
      ipOuts: 135,
      h: 44,
      hr: 3,
      bb: 15,
      ibb: 2,
      hbp: 3,
      so: 36,
      r: 20,
      er: 18,
      w: 3,
      l: 2,
      sv: 1,
      hld: 12,
      bf: 201,
      gbRate: 0.53,
      fbRate: 0.29,
      ldRate: 0.18,
    },
  },
  {
    id: 'lsk',
    name: '이상규',
    back: 18,
    role: '불펜',
    throws: 'R',
    age: 30,
    note: '커브 비중이 높은 우완. 피홈런이 이닝 대비 많아 실점이 한 번에 몰립니다',
    pitches: [
      { name: '포심', usage: 0.49, velo: 145 },
      { name: '슬라이더', usage: 0.29, velo: 133 },
      { name: '커브', usage: 0.22, velo: 119 },
    ],
    stat: {
      g: 32,
      gs: 0,
      ipOuts: 93,
      h: 32,
      hr: 4,
      bb: 13,
      ibb: 0,
      hbp: 2,
      so: 26,
      r: 18,
      er: 17,
      w: 1,
      l: 2,
      sv: 0,
      hld: 5,
      bf: 143,
      gbRate: 0.42,
      fbRate: 0.39,
      ldRate: 0.19,
    },
  },
  {
    id: 'wyc',
    name: '왕옌청',
    back: 19,
    role: '선발',
    throws: 'L',
    age: 24,
    note: '아시아쿼터로 온 좌완 선발. 로테이션을 한 바퀴 도는 동안 기복이 컸습니다',
    pitches: [
      { name: '포심', usage: 0.47, velo: 146 },
      { name: '슬라이더', usage: 0.24, velo: 135 },
      { name: '체인지업', usage: 0.19, velo: 131 },
      { name: '커브', usage: 0.1, velo: 120 },
    ],
    stat: {
      g: 22,
      gs: 20,
      ipOuts: 336,
      h: 108,
      hr: 9,
      bb: 40,
      ibb: 1,
      hbp: 5,
      so: 88,
      r: 52,
      er: 47,
      w: 7,
      l: 7,
      sv: 0,
      hld: 0,
      bf: 495,
      gbRate: 0.46,
      fbRate: 0.36,
      ldRate: 0.18,
    },
  },
  {
    id: 'lmw',
    name: '이민우',
    back: 27,
    role: '불펜',
    throws: 'R',
    age: 33,
    note: '롱릴리프. 선발이 일찍 내려간 날 이닝을 먹는 자리라 실점이 쌓이기 쉽습니다',
    pitches: [
      { name: '포심', usage: 0.44, velo: 143 },
      { name: '슬라이더', usage: 0.27, velo: 131 },
      { name: '커브', usage: 0.16, velo: 117 },
      { name: '체인지업', usage: 0.13, velo: 130 },
    ],
    stat: {
      g: 29,
      gs: 2,
      ipOuts: 138,
      h: 50,
      hr: 6,
      bb: 19,
      ibb: 1,
      hbp: 3,
      so: 33,
      r: 27,
      er: 25,
      w: 2,
      l: 3,
      sv: 0,
      hld: 4,
      bf: 214,
      gbRate: 0.44,
      fbRate: 0.38,
      ldRate: 0.18,
    },
  },
  {
    id: 'jyh',
    name: '장유호',
    back: 28,
    role: '불펜',
    throws: 'R',
    age: 23,
    note: '10이닝 표본. 볼넷 비율이 높아 먼저 제구가 잡혀야 보직이 올라갑니다',
    pitches: [
      { name: '포심', usage: 0.56, velo: 145 },
      { name: '커브', usage: 0.26, velo: 121 },
      { name: '슬라이더', usage: 0.18, velo: 133 },
    ],
    stat: {
      g: 11,
      gs: 0,
      ipOuts: 30,
      h: 12,
      hr: 1,
      bb: 7,
      ibb: 0,
      hbp: 1,
      so: 9,
      r: 8,
      er: 7,
      w: 0,
      l: 1,
      sv: 0,
      hld: 0,
      bf: 51,
      gbRate: 0.47,
      fbRate: 0.34,
      ldRate: 0.19,
    },
  },
  {
    id: 'hjs',
    name: '황준서',
    back: 29,
    role: '불펜',
    throws: 'L',
    age: 21,
    note: '선발과 불펜을 오가는 어린 좌완. 등판 간격이 일정하지 않아 지표가 튑니다',
    pitches: [
      { name: '포심', usage: 0.47, velo: 144 },
      { name: '커브', usage: 0.22, velo: 118 },
      { name: '체인지업', usage: 0.19, velo: 130 },
      { name: '슬라이더', usage: 0.12, velo: 132 },
    ],
    stat: {
      g: 24,
      gs: 6,
      ipOuts: 150,
      h: 52,
      hr: 5,
      bb: 26,
      ibb: 1,
      hbp: 3,
      so: 44,
      r: 29,
      er: 26,
      w: 3,
      l: 3,
      sv: 0,
      hld: 3,
      bf: 235,
      gbRate: 0.43,
      fbRate: 0.38,
      ldRate: 0.19,
    },
  },
  {
    id: 'lkh',
    name: '이교훈',
    back: 31,
    role: '불펜',
    throws: 'L',
    age: 26,
    note: '좌타자를 잡으러 나오는 원포인트. 한 타자만 상대하고 내려가는 등판이 많습니다',
    pitches: [
      { name: '포심', usage: 0.43, velo: 142 },
      { name: '슬라이더', usage: 0.35, velo: 129 },
      { name: '체인지업', usage: 0.22, velo: 127 },
    ],
    stat: {
      g: 35,
      gs: 0,
      ipOuts: 87,
      h: 28,
      hr: 2,
      bb: 12,
      ibb: 2,
      hbp: 1,
      so: 27,
      r: 14,
      er: 12,
      w: 1,
      l: 1,
      sv: 0,
      hld: 9,
      bf: 131,
      gbRate: 0.45,
      fbRate: 0.36,
      ldRate: 0.19,
    },
  },
  {
    id: 'jih',
    name: '정이황',
    back: 34,
    role: '불펜',
    throws: 'R',
    age: 27,
    note: '포크로 헛스윙을 받아냅니다. 낮은 공이 빠지면 그대로 볼넷이 됩니다',
    pitches: [
      { name: '포심', usage: 0.5, velo: 146 },
      { name: '포크', usage: 0.28, velo: 134 },
      { name: '슬라이더', usage: 0.22, velo: 133 },
    ],
    stat: {
      g: 27,
      gs: 0,
      ipOuts: 78,
      h: 27,
      hr: 3,
      bb: 12,
      ibb: 0,
      hbp: 2,
      so: 22,
      r: 15,
      er: 14,
      w: 1,
      l: 2,
      sv: 0,
      hld: 3,
      bf: 121,
      gbRate: 0.46,
      fbRate: 0.35,
      ldRate: 0.19,
    },
  },
  {
    id: 'kjs',
    name: '김종수',
    back: 38,
    role: '불펜',
    throws: 'L',
    age: 29,
    note: '좌완 필승조. 이닝당 주자를 적게 내보내 연투 부담이 덜합니다',
    pitches: [
      { name: '포심', usage: 0.45, velo: 144 },
      { name: '슬라이더', usage: 0.32, velo: 131 },
      { name: '커브', usage: 0.23, velo: 118 },
    ],
    stat: {
      g: 41,
      gs: 0,
      ipOuts: 120,
      h: 38,
      hr: 3,
      bb: 16,
      ibb: 1,
      hbp: 2,
      so: 35,
      r: 19,
      er: 17,
      w: 2,
      l: 2,
      sv: 0,
      hld: 11,
      bf: 180,
      gbRate: 0.48,
      fbRate: 0.33,
      ldRate: 0.19,
    },
  },
  {
    id: 'pjk',
    name: '박재규',
    back: 39,
    role: '불펜',
    throws: 'R',
    age: 26,
    note: '추격조. 21이닝 표본이라 ERA 한 경기로 0.5 씩 움직입니다',
    pitches: [
      { name: '포심', usage: 0.51, velo: 145 },
      { name: '슬라이더', usage: 0.3, velo: 132 },
      { name: '체인지업', usage: 0.19, velo: 130 },
    ],
    stat: {
      g: 22,
      gs: 0,
      ipOuts: 63,
      h: 23,
      hr: 3,
      bb: 11,
      ibb: 0,
      hbp: 2,
      so: 18,
      r: 14,
      er: 13,
      w: 1,
      l: 1,
      sv: 0,
      hld: 2,
      bf: 101,
      gbRate: 0.44,
      fbRate: 0.37,
      ldRate: 0.19,
    },
  },
  {
    id: 'kbj',
    name: '김범준',
    back: 40,
    role: '불펜',
    throws: 'R',
    age: 28,
    note: '셋업. 볼넷을 거의 주지 않아 주자 있는 상황에 먼저 올라옵니다',
    pitches: [
      { name: '포심', usage: 0.48, velo: 149 },
      { name: '슬라이더', usage: 0.33, velo: 137 },
      { name: '체인지업', usage: 0.19, velo: 135 },
    ],
    stat: {
      g: 47,
      gs: 0,
      ipOuts: 144,
      h: 42,
      hr: 3,
      bb: 15,
      ibb: 2,
      hbp: 3,
      so: 47,
      r: 18,
      er: 16,
      w: 3,
      l: 2,
      sv: 2,
      hld: 18,
      bf: 207,
      gbRate: 0.47,
      fbRate: 0.34,
      ldRate: 0.19,
    },
  },
  {
    id: 'bms',
    name: '배민서',
    back: 45,
    role: '불펜',
    throws: 'R',
    age: 24,
    note: '18이닝 표본. 삼진율은 볼 만한데 볼넷이 같이 늘어 아직 위쪽 보직이 아닙니다',
    pitches: [
      { name: '포심', usage: 0.53, velo: 146 },
      { name: '커브', usage: 0.25, velo: 120 },
      { name: '슬라이더', usage: 0.22, velo: 134 },
    ],
    stat: {
      g: 19,
      gs: 0,
      ipOuts: 54,
      h: 20,
      hr: 2,
      bb: 10,
      ibb: 0,
      hbp: 1,
      so: 15,
      r: 12,
      er: 11,
      w: 1,
      l: 1,
      sv: 0,
      hld: 2,
      bf: 88,
      gbRate: 0.45,
      fbRate: 0.36,
      ldRate: 0.19,
    },
  },
  {
    id: 'kdb',
    name: '김도빈',
    back: 46,
    role: '불펜',
    throws: 'R',
    age: 22,
    note: '8이닝 표본. 이 정도면 어떤 지표든 값을 읽는 것 자체가 무의미합니다',
    pitches: [
      { name: '포심', usage: 0.57, velo: 147 },
      { name: '슬라이더', usage: 0.27, velo: 134 },
      { name: '체인지업', usage: 0.16, velo: 132 },
    ],
    stat: {
      g: 9,
      gs: 0,
      ipOuts: 24,
      h: 10,
      hr: 1,
      bb: 6,
      ibb: 0,
      hbp: 1,
      so: 7,
      r: 7,
      er: 6,
      w: 0,
      l: 0,
      sv: 0,
      hld: 1,
      bf: 42,
      gbRate: 0.46,
      fbRate: 0.35,
      ldRate: 0.19,
    },
  },
  {
    id: 'ysu',
    name: '양수호',
    back: 47,
    role: '불펜',
    throws: 'R',
    age: 23,
    note: '150 가까운 공을 던지지만 아직 15이닝. 구속과 성적은 별개라는 사례로 쓰입니다',
    pitches: [
      { name: '포심', usage: 0.52, velo: 148 },
      { name: '슬라이더', usage: 0.29, velo: 136 },
      { name: '커브', usage: 0.19, velo: 122 },
    ],
    stat: {
      g: 16,
      gs: 0,
      ipOuts: 45,
      h: 17,
      hr: 2,
      bb: 9,
      ibb: 0,
      hbp: 1,
      so: 13,
      r: 10,
      er: 9,
      w: 0,
      l: 1,
      sv: 0,
      hld: 2,
      bf: 74,
      gbRate: 0.47,
      fbRate: 0.34,
      ldRate: 0.19,
    },
  },
  {
    id: 'wjh',
    name: '원종혁',
    back: 48,
    role: '불펜',
    throws: 'R',
    age: 25,
    note: '싱커·슬라이더 조합의 땅볼 투수. 내야 수비에 성적이 크게 좌우됩니다',
    pitches: [
      { name: '싱커', usage: 0.38, velo: 143 },
      { name: '슬라이더', usage: 0.32, velo: 130 },
      { name: '포심', usage: 0.3, velo: 145 },
    ],
    stat: {
      g: 25,
      gs: 0,
      ipOuts: 72,
      h: 25,
      hr: 2,
      bb: 11,
      ibb: 1,
      hbp: 2,
      so: 21,
      r: 13,
      er: 12,
      w: 1,
      l: 1,
      sv: 0,
      hld: 4,
      bf: 113,
      gbRate: 0.48,
      fbRate: 0.33,
      ldRate: 0.19,
    },
  },
  {
    id: 'ysa',
    name: '윤산흠',
    back: 49,
    role: '불펜',
    throws: 'R',
    age: 24,
    note: '스팟 선발도 한 번 맡았습니다. 22이닝이라 선발 적성은 아직 판단할 표본이 아닙니다',
    pitches: [
      { name: '포심', usage: 0.5, velo: 147 },
      { name: '슬라이더', usage: 0.28, velo: 135 },
      { name: '체인지업', usage: 0.22, velo: 133 },
    ],
    stat: {
      g: 20,
      gs: 1,
      ipOuts: 66,
      h: 24,
      hr: 3,
      bb: 12,
      ibb: 0,
      hbp: 2,
      so: 19,
      r: 15,
      er: 14,
      w: 1,
      l: 2,
      sv: 0,
      hld: 2,
      bf: 106,
      gbRate: 0.43,
      fbRate: 0.38,
      ldRate: 0.19,
    },
  },
  {
    id: 'kmw',
    name: '김민우',
    back: 53,
    role: '불펜',
    throws: 'R',
    age: 31,
    note: '선발 경험이 있는 스윙맨. 이닝은 먹어 주지만 삼진이 적어 실점 억제력이 낮습니다',
    pitches: [
      { name: '포심', usage: 0.42, velo: 144 },
      { name: '슬라이더', usage: 0.26, velo: 132 },
      { name: '커브', usage: 0.18, velo: 119 },
      { name: '체인지업', usage: 0.14, velo: 131 },
    ],
    stat: {
      g: 31,
      gs: 3,
      ipOuts: 147,
      h: 53,
      hr: 6,
      bb: 21,
      ibb: 1,
      hbp: 3,
      so: 36,
      r: 29,
      er: 27,
      w: 2,
      l: 4,
      sv: 0,
      hld: 5,
      bf: 229,
      gbRate: 0.45,
      fbRate: 0.37,
      ldRate: 0.18,
    },
  },
];

/**
 * 상대팀(LG) 투수진.
 *
 * 우리 타자가 상대하는 마운드이므로 **반드시 상대팀 선수여야 한다.** 처음에는 데이터를
 * 아끼려고 우리 투수진을 그대로 세웠는데, 그러면 한화 공격 이닝에 한화 투수가 던지는
 * 화면이 나온다. 시연에서 가장 먼저 지적당할 종류의 오류라 별도로 둔다.
 *
 * 실서비스에서는 10개 구단 전체 로스터가 들어오므로 이 구분 자체가 사라진다.
 * ※ 시연용 샘플 데이터입니다.
 */
export const OPPONENT_PITCHERS: Pitcher[] = [
  {
    id: 'lcg',
    name: '임찬규',
    back: 1,
    role: '선발',
    throws: 'R',
    age: 34,
    note: '구속보다 완급으로 던집니다. 뜬공 비율이 높아 잠실을 홈으로 쓰는 이점이 큽니다',
    pitches: [
      { name: '포심', usage: 0.42, velo: 143 },
      { name: '체인지업', usage: 0.26, velo: 128 },
      { name: '커브', usage: 0.19, velo: 118 },
      { name: '슬라이더', usage: 0.13, velo: 132 },
    ],
    stat: {
      g: 19,
      gs: 19,
      ipOuts: 330,
      h: 116,
      hr: 13,
      bb: 38,
      ibb: 2,
      hbp: 4,
      so: 88,
      r: 58,
      er: 53,
      w: 7,
      l: 7,
      sv: 0,
      hld: 0,
      bf: 492,
      gbRate: 0.39,
      fbRate: 0.42,
      ldRate: 0.19,
    },
  },
  {
    id: 'sjy',
    name: '손주영',
    back: 46,
    role: '선발',
    throws: 'L',
    age: 28,
    note: '좌완 땅볼 투수. 좌타자 상대로 특히 강해 플래툰 교체를 부릅니다',
    pitches: [
      { name: '싱커', usage: 0.36, velo: 145 },
      { name: '슬라이더', usage: 0.31, velo: 133 },
      { name: '포심', usage: 0.22, velo: 147 },
      { name: '체인지업', usage: 0.11, velo: 131 },
    ],
    stat: {
      g: 18,
      gs: 18,
      ipOuts: 321,
      h: 104,
      hr: 7,
      bb: 35,
      ibb: 1,
      hbp: 5,
      so: 92,
      r: 47,
      er: 43,
      w: 8,
      l: 5,
      sv: 0,
      hld: 0,
      bf: 470,
      gbRate: 0.53,
      fbRate: 0.29,
      ldRate: 0.18,
    },
  },
  {
    id: 'yyc',
    name: '유영찬',
    back: 43,
    role: '마무리',
    throws: 'R',
    age: 29,
    note: '9회 전담. 포심 구사율이 6할에 가까워 변화구 의존도가 낮습니다',
    pitches: [
      { name: '포심', usage: 0.59, velo: 151 },
      { name: '슬라이더', usage: 0.29, velo: 138 },
      { name: '포크', usage: 0.12, velo: 135 },
    ],
    stat: {
      g: 46,
      gs: 0,
      ipOuts: 144,
      h: 40,
      hr: 4,
      bb: 16,
      ibb: 1,
      hbp: 3,
      so: 53,
      r: 18,
      er: 16,
      w: 3,
      l: 3,
      sv: 24,
      hld: 0,
      bf: 205,
      gbRate: 0.43,
      fbRate: 0.39,
      ldRate: 0.18,
    },
  },
  {
    id: 'hdj',
    name: '함덕주',
    back: 55,
    role: '불펜',
    throws: 'L',
    age: 32,
    note: '좌완 원포인트로도 쓰입니다. 좌타자를 잡으러 올라오는 자리입니다',
    pitches: [
      { name: '포심', usage: 0.44, velo: 144 },
      { name: '커브', usage: 0.33, velo: 120 },
      { name: '체인지업', usage: 0.23, velo: 129 },
    ],
    stat: {
      g: 51,
      gs: 0,
      ipOuts: 132,
      h: 38,
      hr: 3,
      bb: 14,
      ibb: 2,
      hbp: 2,
      so: 48,
      r: 17,
      er: 15,
      w: 2,
      l: 3,
      sv: 1,
      hld: 19,
      bf: 190,
      gbRate: 0.46,
      fbRate: 0.35,
      ldRate: 0.19,
    },
  },
];

// ─────────────────────────────────────────────────────────────
// 지난 시즌(2025) - 올해와 견주기 위한 것
// ─────────────────────────────────────────────────────────────

/**
 * 지난 시즌 성적.
 *
 * ⚠ **전부 시연용 샘플이다.** 2025 실측을 확보하지 못해 그럴듯한 값으로 채웠다.
 * 올해 기록과 달리 검색으로 맞춘 항목이 하나도 없으므로, 화면에서도 "작년보다
 * 얼마나"라는 **방향**을 말하는 데까지만 쓴다.
 *
 * ── 없는 선수는 왜 없나 ─────────────────────────────────────
 * 2026 에 새로 온 선수(외국인·아시아쿼터)는 지난 시즌 KBO 기록이 없다. 억지로
 * 지어 넣지 않고 **빼 둔다** - 화면은 없으면 그 구역을 아예 그리지 않는다.
 * 있지도 않은 작년을 만들어 보여 주는 것이 빈 자리보다 나쁘다.
 *
 * 라인은 비교에 쓰는 항목만 적고 나머지는 0 으로 채운다(zeroBatter/zeroPitcher).
 * 파생값(타율·OPS·ERA)은 여기 두지 않는다 - 올해 기록과 같은 공식을 태워야
 * 두 해가 같은 잣대로 비교된다.
 */
const zeroBatter: BatterStatLine = {
  g: 0,
  pa: 0,
  ab: 0,
  h: 0,
  double: 0,
  triple: 0,
  hr: 0,
  bb: 0,
  ibb: 0,
  hbp: 0,
  so: 0,
  sf: 0,
  sh: 0,
  sb: 0,
  cs: 0,
  r: 0,
  rbi: 0,
  gdp: 0,
  gbRate: 0.45,
  fbRate: 0.36,
  ldRate: 0.19,
  fieldingRuns: 0,
  positionAdj: 0,
};

const zeroPitcher: PitcherStatLine = {
  g: 0,
  gs: 0,
  ipOuts: 0,
  h: 0,
  hr: 0,
  bb: 0,
  ibb: 0,
  hbp: 0,
  so: 0,
  r: 0,
  er: 0,
  w: 0,
  l: 0,
  sv: 0,
  hld: 0,
  bf: 0,
  gbRate: 0.45,
  fbRate: 0.36,
  ldRate: 0.19,
};

const pb = (p: Partial<BatterStatLine>): BatterStatLine => ({ ...zeroBatter, ...p });
const pp = (p: Partial<PitcherStatLine>): PitcherStatLine => ({ ...zeroPitcher, ...p });

export const PREV_BATTER: Record<string, BatterStatLine> = {
  nsh: pb({
    g: 133,
    pa: 543,
    ab: 476,
    h: 126,
    double: 24,
    triple: 1,
    hr: 27,
    bb: 55,
    ibb: 2,
    hbp: 8,
    so: 130,
    sf: 4,
    sh: 0,
    sb: 4,
    cs: 2,
    r: 78,
    rbi: 89,
    gdp: 12,
  }),
  ces: pb({
    g: 126,
    pa: 512,
    ab: 458,
    h: 128,
    double: 26,
    triple: 0,
    hr: 18,
    bb: 44,
    ibb: 3,
    hbp: 6,
    so: 88,
    sf: 4,
    sh: 0,
    sb: 2,
    cs: 1,
    r: 62,
    rbi: 84,
    gdp: 14,
  }),
  mhb: pb({
    g: 138,
    pa: 561,
    ab: 505,
    h: 148,
    double: 24,
    triple: 4,
    hr: 10,
    bb: 44,
    ibb: 1,
    hbp: 7,
    so: 72,
    sf: 5,
    sh: 0,
    sb: 16,
    cs: 6,
    r: 76,
    rbi: 65,
    gdp: 8,
  }),
  // 이적 전 소속팀에서의 기록이다. 팀이 달라도 같은 리그라 견줄 수 있다
  kbh: pb({
    g: 116,
    pa: 468,
    ab: 411,
    h: 116,
    double: 22,
    triple: 1,
    hr: 19,
    bb: 48,
    ibb: 4,
    hbp: 5,
    so: 74,
    sf: 4,
    sh: 0,
    sb: 3,
    cs: 2,
    r: 61,
    rbi: 71,
    gdp: 11,
  }),
  swj: pb({
    g: 118,
    pa: 421,
    ab: 375,
    h: 94,
    double: 15,
    triple: 4,
    hr: 5,
    bb: 29,
    ibb: 0,
    hbp: 5,
    so: 78,
    sf: 3,
    sh: 9,
    sb: 24,
    cs: 8,
    r: 52,
    rbi: 38,
    gdp: 7,
  }),
  ldy: pb({
    g: 92,
    pa: 288,
    ab: 253,
    h: 63,
    double: 9,
    triple: 1,
    hr: 2,
    bb: 22,
    ibb: 0,
    hbp: 3,
    so: 46,
    sf: 2,
    sh: 8,
    sb: 6,
    cs: 3,
    r: 31,
    rbi: 24,
    gdp: 6,
  }),
  his: pb({
    g: 38,
    pa: 96,
    ab: 84,
    h: 18,
    double: 3,
    triple: 0,
    hr: 0,
    bb: 8,
    ibb: 0,
    hbp: 2,
    so: 24,
    sf: 1,
    sh: 1,
    sb: 0,
    cs: 0,
    r: 8,
    rbi: 7,
    gdp: 2,
  }),
  lws: pb({
    g: 74,
    pa: 214,
    ab: 189,
    h: 48,
    double: 8,
    triple: 2,
    hr: 2,
    bb: 20,
    ibb: 0,
    hbp: 2,
    so: 42,
    sf: 1,
    sh: 2,
    sb: 9,
    cs: 4,
    r: 28,
    rbi: 16,
    gdp: 3,
  }),
  cjh: pb({
    g: 88,
    pa: 298,
    ab: 252,
    h: 63,
    double: 10,
    triple: 0,
    hr: 3,
    bb: 38,
    ibb: 1,
    hbp: 5,
    so: 52,
    sf: 3,
    sh: 0,
    sb: 0,
    cs: 1,
    r: 28,
    rbi: 29,
    gdp: 9,
  }),
  kty: pb({
    g: 96,
    pa: 312,
    ab: 279,
    h: 76,
    double: 14,
    triple: 1,
    hr: 8,
    bb: 26,
    ibb: 0,
    hbp: 4,
    so: 54,
    sf: 3,
    sh: 0,
    sb: 4,
    cs: 2,
    r: 38,
    rbi: 42,
    gdp: 7,
  }),
  // per(페라자)는 2026 에 온 외국인이라 지난 시즌 KBO 기록이 없다
};

export const PREV_PITCHER: Record<string, PitcherStatLine> = {
  ryu: pp({
    g: 28,
    gs: 28,
    ipOuts: 465,
    h: 158,
    hr: 14,
    bb: 34,
    ibb: 2,
    hbp: 5,
    so: 118,
    r: 66,
    er: 61,
    w: 10,
    l: 8,
    bf: 668,
  }),
  mdj: pp({
    g: 21,
    gs: 21,
    ipOuts: 336,
    h: 106,
    hr: 9,
    bb: 48,
    ibb: 1,
    hbp: 6,
    so: 106,
    r: 54,
    er: 49,
    w: 7,
    l: 7,
    bf: 500,
  }),
  // 이적 전 소속팀 기록. 78억 FA 의 근거가 된 해다
  usb: pp({
    g: 27,
    gs: 24,
    ipOuts: 396,
    h: 132,
    hr: 16,
    bb: 46,
    ibb: 1,
    hbp: 7,
    so: 108,
    r: 68,
    er: 62,
    w: 8,
    l: 9,
    bf: 588,
  }),
  ksh: pp({
    g: 55,
    gs: 0,
    ipOuts: 174,
    h: 42,
    hr: 3,
    bb: 30,
    ibb: 2,
    hbp: 4,
    so: 68,
    r: 20,
    er: 17,
    w: 3,
    l: 4,
    sv: 21,
    hld: 6,
    bf: 252,
  }),
  kmw: pp({
    g: 26,
    gs: 8,
    ipOuts: 216,
    h: 80,
    hr: 8,
    bb: 32,
    ibb: 1,
    hbp: 4,
    so: 52,
    r: 44,
    er: 40,
    w: 3,
    l: 6,
    bf: 336,
  }),
  kbj: pp({
    g: 42,
    gs: 0,
    ipOuts: 132,
    h: 40,
    hr: 4,
    bb: 18,
    ibb: 1,
    hbp: 3,
    so: 38,
    r: 21,
    er: 19,
    w: 2,
    l: 3,
    sv: 1,
    hld: 12,
    bf: 196,
  }),
  lhb: pp({
    g: 39,
    gs: 0,
    ipOuts: 111,
    h: 40,
    hr: 4,
    bb: 16,
    ibb: 2,
    hbp: 2,
    so: 26,
    r: 22,
    er: 20,
    w: 2,
    l: 3,
    sv: 0,
    hld: 8,
    bf: 172,
  }),
  // wht(화이트) · zim(짐머맨) · wyc(왕옌청)은 2026 에 왔다
};

// ─────────────────────────────────────────────────────────────
// 월별 추이 - 시즌 합계가 감추는 것
// ─────────────────────────────────────────────────────────────

/**
 * 월별 성적.
 *
 * 시즌 합계는 "얼마나 잘했나"만 말하고 **"언제 잘했나"는 감춘다.** 타율 .272 가
 * 내내 그랬던 것인지, 5월에 바닥을 치고 7월에 살아난 것인지는 전혀 다른 이야기인데
 * 합계만 보면 둘이 같아 보인다.
 *
 * ⚠ **월별 합은 시즌 합계와 정확히 같아야 한다.** 어긋나면 같은 화면 안에서 앱이
 * 자기 말을 뒤집는다. 손으로 적으면 반드시 어긋나므로 비중만 정하고 값은 생성한 뒤
 * 마지막 활동 월이 나머지를 흡수하게 했다. verifyRoster() 가 이 합을 검사한다.
 *
 * 비중에는 확인한 사실을 넣었다 - 문동주 5월 부상, 엄상백 4월 수술, 짐머맨 7월 합류,
 * 채은성 부상 결장, 김서현 2군행. 등판·출장 기록이 없는 달은 값이 0 이고, 화면도 그
 * 달을 빈 칸으로 그린다. **앞으로 나올지 안 나올지는 말하지 않는다** - 기록에 없는
 * 것과 앞으로 없을 것은 다른 이야기다. 성적 자체는 다른 데와 마찬가지로 시연용 샘플이다.
 */
export interface BatterMonth {
  month: string;
  pa: number;
  ab: number;
  h: number;
  hr: number;
  rbi: number;
}

export interface PitcherMonth {
  month: string;
  g: number;
  ipOuts: number;
  er: number;
  so: number;
}

export const BATTER_MONTHS: Record<string, BatterMonth[]> = {
  lws: [
    { month: '3·4월', pa: 91, ab: 80, h: 20, hr: 1, rbi: 7 },
    { month: '5월', pa: 95, ab: 83, h: 23, hr: 1, rbi: 8 },
    { month: '6월', pa: 91, ab: 80, h: 23, hr: 1, rbi: 8 },
    { month: '7월', pa: 91, ab: 80, h: 22, hr: 1, rbi: 8 },
    { month: '8월', pa: 86, ab: 75, h: 20, hr: 2, rbi: 7 },
  ],
  per: [
    { month: '3·4월', pa: 100, ab: 89, h: 27, hr: 5, rbi: 17 },
    { month: '5월', pa: 95, ab: 85, h: 22, hr: 4, rbi: 14 },
    { month: '6월', pa: 100, ab: 89, h: 26, hr: 5, rbi: 16 },
    { month: '7월', pa: 90, ab: 81, h: 21, hr: 4, rbi: 13 },
    { month: '8월', pa: 90, ab: 81, h: 22, hr: 3, rbi: 14 },
  ],
  mhb: [
    { month: '3·4월', pa: 102, ab: 91, h: 26, hr: 3, rbi: 12 },
    { month: '5월', pa: 97, ab: 87, h: 24, hr: 2, rbi: 11 },
    { month: '6월', pa: 97, ab: 87, h: 26, hr: 3, rbi: 12 },
    { month: '7월', pa: 97, ab: 87, h: 25, hr: 2, rbi: 12 },
    { month: '8월', pa: 91, ab: 82, h: 24, hr: 2, rbi: 11 },
  ],
  kbh: [
    { month: '3·4월', pa: 107, ab: 92, h: 31, hr: 6, rbi: 22 },
    { month: '5월', pa: 102, ab: 88, h: 28, hr: 6, rbi: 20 },
    { month: '6월', pa: 97, ab: 84, h: 25, hr: 5, rbi: 18 },
    { month: '7월', pa: 92, ab: 80, h: 23, hr: 5, rbi: 16 },
    { month: '8월', pa: 88, ab: 76, h: 21, hr: 4, rbi: 14 },
  ],
  nsh: [
    { month: '3·4월', pa: 92, ab: 80, h: 16, hr: 3, rbi: 11 },
    { month: '5월', pa: 81, ab: 71, h: 16, hr: 3, rbi: 10 },
    { month: '6월', pa: 122, ab: 107, h: 37, hr: 8, rbi: 24 },
    { month: '7월', pa: 112, ab: 98, h: 28, hr: 6, rbi: 19 },
    { month: '8월', pa: 102, ab: 89, h: 24, hr: 5, rbi: 15 },
  ],
  ces: [
    { month: '3·4월', pa: 95, ab: 84, h: 25, hr: 4, rbi: 18 },
    { month: '5월', pa: 20, ab: 18, h: 5, hr: 1, rbi: 3 },
    { month: '6월', pa: 68, ab: 60, h: 17, hr: 3, rbi: 12 },
    { month: '7월', pa: 78, ab: 69, h: 19, hr: 3, rbi: 14 },
    { month: '8월', pa: 79, ab: 69, h: 18, hr: 2, rbi: 15 },
  ],
  his: [
    { month: '3·4월', pa: 38, ab: 33, h: 6, hr: 0, rbi: 3 },
    { month: '5월', pa: 48, ab: 42, h: 9, hr: 0, rbi: 4 },
    { month: '6월', pa: 59, ab: 52, h: 13, hr: 1, rbi: 6 },
    { month: '7월', pa: 62, ab: 55, h: 15, hr: 1, rbi: 7 },
    { month: '8월', pa: 61, ab: 54, h: 15, hr: 1, rbi: 6 },
  ],
  ldy: [
    { month: '3·4월', pa: 70, ab: 62, h: 16, hr: 1, rbi: 6 },
    { month: '5월', pa: 70, ab: 62, h: 16, hr: 1, rbi: 7 },
    { month: '6월', pa: 70, ab: 62, h: 16, hr: 1, rbi: 7 },
    { month: '7월', pa: 70, ab: 62, h: 17, hr: 1, rbi: 7 },
    { month: '8월', pa: 72, ab: 64, h: 17, hr: 0, rbi: 6 },
  ],
  swj: [
    { month: '3·4월', pa: 84, ab: 75, h: 18, hr: 1, rbi: 8 },
    { month: '5월', pa: 80, ab: 71, h: 19, hr: 1, rbi: 8 },
    { month: '6월', pa: 80, ab: 71, h: 18, hr: 1, rbi: 8 },
    { month: '7월', pa: 80, ab: 71, h: 18, hr: 1, rbi: 8 },
    { month: '8월', pa: 75, ab: 68, h: 19, hr: 3, rbi: 9 },
  ],
  cjh: [
    { month: '3·4월', pa: 55, ab: 47, h: 12, hr: 1, rbi: 5 },
    { month: '5월', pa: 46, ab: 39, h: 10, hr: 0, rbi: 4 },
    { month: '6월', pa: 38, ab: 32, h: 8, hr: 0, rbi: 3 },
    { month: '7월', pa: 36, ab: 31, h: 7, hr: 0, rbi: 3 },
    { month: '8월', pa: 35, ab: 29, h: 7, hr: 1, rbi: 5 },
  ],
  kty: [
    { month: '3·4월', pa: 48, ab: 43, h: 11, hr: 1, rbi: 6 },
    { month: '5월', pa: 48, ab: 43, h: 12, hr: 1, rbi: 6 },
    { month: '6월', pa: 48, ab: 43, h: 11, hr: 1, rbi: 6 },
    { month: '7월', pa: 48, ab: 43, h: 11, hr: 1, rbi: 6 },
    { month: '8월', pa: 46, ab: 42, h: 12, hr: 2, rbi: 7 },
  ],
};

export const PITCHER_MONTHS: Record<string, PitcherMonth[]> = {
  ryu: [
    { month: '3·4월', g: 5, ipOuts: 85, er: 10, so: 20 },
    { month: '5월', g: 4, ipOuts: 78, er: 10, so: 17 },
    { month: '6월', g: 4, ipOuts: 71, er: 8, so: 18 },
    { month: '7월', g: 4, ipOuts: 64, er: 5, so: 21 },
    { month: '8월', g: 3, ipOuts: 55, er: 5, so: 18 },
  ],
  mdj: [
    { month: '3·4월', g: 4, ipOuts: 71, er: 12, so: 20 },
    { month: '5월', g: 3, ipOuts: 43, er: 6, so: 16 },
    { month: '6월', g: 0, ipOuts: 0, er: 0, so: 0 },
    { month: '7월', g: 0, ipOuts: 0, er: 0, so: 0 },
    { month: '8월', g: 0, ipOuts: 0, er: 0, so: 0 },
  ],
  usb: [
    { month: '3·4월', g: 4, ipOuts: 51, er: 18, so: 11 },
    { month: '5월', g: 0, ipOuts: 0, er: 0, so: 0 },
    { month: '6월', g: 0, ipOuts: 0, er: 0, so: 0 },
    { month: '7월', g: 0, ipOuts: 0, er: 0, so: 0 },
    { month: '8월', g: 0, ipOuts: 0, er: 0, so: 0 },
  ],
  zim: [
    { month: '3·4월', g: 0, ipOuts: 0, er: 0, so: 0 },
    { month: '5월', g: 0, ipOuts: 0, er: 0, so: 0 },
    { month: '6월', g: 0, ipOuts: 0, er: 0, so: 0 },
    { month: '7월', g: 3, ipOuts: 44, er: 6, so: 13 },
    { month: '8월', g: 4, ipOuts: 73, er: 11, so: 20 },
  ],
  wht: [
    { month: '3·4월', g: 4, ipOuts: 78, er: 9, so: 29 },
    { month: '5월', g: 4, ipOuts: 74, er: 9, so: 25 },
    { month: '6월', g: 4, ipOuts: 74, er: 9, so: 26 },
    { month: '7월', g: 4, ipOuts: 74, er: 9, so: 26 },
    { month: '8월', g: 4, ipOuts: 72, er: 9, so: 26 },
  ],
  ksh: [
    { month: '3·4월', g: 10, ipOuts: 28, er: 5, so: 10 },
    { month: '5월', g: 9, ipOuts: 26, er: 4, so: 10 },
    { month: '6월', g: 2, ipOuts: 4, er: 1, so: 2 },
    { month: '7월', g: 8, ipOuts: 24, er: 3, so: 11 },
    { month: '8월', g: 9, ipOuts: 26, er: 3, so: 12 },
  ],
  lhb: [
    { month: '3·4월', g: 9, ipOuts: 28, er: 3, so: 8 },
    { month: '5월', g: 9, ipOuts: 27, er: 3, so: 8 },
    { month: '6월', g: 9, ipOuts: 27, er: 4, so: 7 },
    { month: '7월', g: 9, ipOuts: 27, er: 4, so: 7 },
    { month: '8월', g: 9, ipOuts: 26, er: 4, so: 6 },
  ],
  wyc: [
    { month: '3·4월', g: 5, ipOuts: 74, er: 9, so: 22 },
    { month: '5월', g: 5, ipOuts: 71, er: 9, so: 19 },
    { month: '6월', g: 4, ipOuts: 64, er: 9, so: 16 },
    { month: '7월', g: 4, ipOuts: 64, er: 10, so: 15 },
    { month: '8월', g: 4, ipOuts: 63, er: 10, so: 16 },
  ],
  hjs: [
    { month: '3·4월', g: 5, ipOuts: 33, er: 6, so: 9 },
    { month: '5월', g: 5, ipOuts: 32, er: 5, so: 9 },
    { month: '6월', g: 5, ipOuts: 30, er: 5, so: 9 },
    { month: '7월', g: 5, ipOuts: 29, er: 5, so: 8 },
    { month: '8월', g: 4, ipOuts: 26, er: 5, so: 9 },
  ],
  kjs: [
    { month: '3·4월', g: 8, ipOuts: 24, er: 3, so: 7 },
    { month: '5월', g: 8, ipOuts: 24, er: 3, so: 7 },
    { month: '6월', g: 8, ipOuts: 24, er: 3, so: 7 },
    { month: '7월', g: 8, ipOuts: 24, er: 3, so: 7 },
    { month: '8월', g: 9, ipOuts: 24, er: 5, so: 7 },
  ],
  kbj: [
    { month: '3·4월', g: 9, ipOuts: 29, er: 3, so: 9 },
    { month: '5월', g: 9, ipOuts: 29, er: 3, so: 9 },
    { month: '6월', g: 9, ipOuts: 29, er: 3, so: 9 },
    { month: '7월', g: 9, ipOuts: 29, er: 3, so: 10 },
    { month: '8월', g: 11, ipOuts: 28, er: 4, so: 10 },
  ],
  kmw: [
    { month: '3·4월', g: 7, ipOuts: 32, er: 6, so: 8 },
    { month: '5월', g: 7, ipOuts: 31, er: 6, so: 8 },
    { month: '6월', g: 6, ipOuts: 29, er: 5, so: 7 },
    { month: '7월', g: 6, ipOuts: 28, er: 5, so: 7 },
    { month: '8월', g: 5, ipOuts: 27, er: 5, so: 6 },
  ],
};

// ─────────────────────────────────────────────────────────────
// 상황별 스플릿 - 같은 타율도 상황에 따라 다르다
// ─────────────────────────────────────────────────────────────

/**
 * 상황별 성적.
 *
 * 타율 .272 하나로는 **주자를 두고 쳤을 때도 그런지**를 알 수 없다. 득점권에서만
 * 살아나는 타자와 주자가 없을 때만 치는 타자는 같은 타율을 갖고도 팀에 주는 값이
 * 다르다. 좌우 투수 상대도 마찬가지라 대타·플래툰의 근거가 여기서 나온다.
 *
 * ⚠ **두 쪽의 합은 시즌 합계와 같다.** 주자 있음 + 주자 없음 = 시즌, 좌투 + 우투 =
 * 시즌이다. 생성기가 한쪽을 정하고 나머지는 빼기로 구해 어긋날 수가 없고,
 * verifyRoster() 가 다시 검사한다.
 *
 * tb(총루타)를 따로 두는 이유: 장타율의 분자다. 2루타·3루타를 쪼개지 않고 총루타만
 * 나누면 **시즌 장타율과 정확히 맞아떨어진다.**
 *
 * 라이브 탭의 매치업 예측이 지금은 시즌 전체 성적만 쓰는데, 이 스플릿이 그 계산의
 * 다음 재료다. **성적 자체는 다른 데와 마찬가지로 시연용 샘플이다.**
 */
export interface BatterSplit {
  /** 같은 축끼리 묶어 그린다 - men(주자 유무) / lhp(상대 투수 손) */
  group: 'men' | 'lhp';
  label: string;
  pa: number;
  ab: number;
  h: number;
  /** 총루타 = 장타율의 분자 */
  tb: number;
  hr: number;
}

export interface PitcherSplit {
  label: string;
  bf: number;
  h: number;
  hr: number;
  bb: number;
  so: number;
}

export const BATTER_SPLITS: Record<string, BatterSplit[]> = {
  lws: [
    { group: 'men', label: '주자 있음', pa: 173, ab: 151, h: 40, tb: 56, hr: 2 },
    { group: 'men', label: '주자 없음', pa: 281, ab: 247, h: 68, tb: 95, hr: 4 },
    { group: 'lhp', label: '좌투 상대', pa: 127, ab: 111, h: 32, tb: 45, hr: 2 },
    { group: 'lhp', label: '우투 상대', pa: 327, ab: 287, h: 76, tb: 106, hr: 4 },
  ],
  per: [
    { group: 'men', label: '주자 있음', pa: 200, ab: 179, h: 50, tb: 89, hr: 9 },
    { group: 'men', label: '주자 없음', pa: 275, ab: 246, h: 68, tb: 120, hr: 12 },
    { group: 'lhp', label: '좌투 상대', pa: 124, ab: 111, h: 26, tb: 47, hr: 5 },
    { group: 'lhp', label: '우투 상대', pa: 351, ab: 314, h: 92, tb: 162, hr: 16 },
  ],
  mhb: [
    { group: 'men', label: '주자 있음', pa: 208, ab: 187, h: 53, tb: 79, hr: 5 },
    { group: 'men', label: '주자 없음', pa: 276, ab: 247, h: 72, tb: 109, hr: 7 },
    { group: 'lhp', label: '좌투 상대', pa: 121, ab: 109, h: 28, tb: 42, hr: 3 },
    { group: 'lhp', label: '우투 상대', pa: 363, ab: 325, h: 97, tb: 146, hr: 9 },
  ],
  kbh: [
    { group: 'men', label: '주자 있음', pa: 228, ab: 197, h: 64, tb: 116, hr: 13 },
    { group: 'men', label: '주자 없음', pa: 258, ab: 223, h: 64, tb: 116, hr: 13 },
    { group: 'lhp', label: '좌투 상대', pa: 126, ab: 109, h: 30, tb: 55, hr: 6 },
    { group: 'lhp', label: '우투 상대', pa: 360, ab: 311, h: 98, tb: 177, hr: 20 },
  ],
  nsh: [
    { group: 'men', label: '주자 있음', pa: 224, ab: 196, h: 55, tb: 100, hr: 11 },
    { group: 'men', label: '주자 없음', pa: 285, ab: 249, h: 66, tb: 120, hr: 14 },
    { group: 'lhp', label: '좌투 상대', pa: 137, ab: 120, h: 35, tb: 64, hr: 7 },
    { group: 'lhp', label: '우투 상대', pa: 372, ab: 325, h: 86, tb: 156, hr: 18 },
  ],
  ces: [
    { group: 'men', label: '주자 있음', pa: 167, ab: 147, h: 44, tb: 74, hr: 7 },
    { group: 'men', label: '주자 없음', pa: 173, ab: 153, h: 40, tb: 67, hr: 6 },
    { group: 'lhp', label: '좌투 상대', pa: 92, ab: 81, h: 24, tb: 40, hr: 4 },
    { group: 'lhp', label: '우투 상대', pa: 248, ab: 219, h: 60, tb: 101, hr: 9 },
  ],
  his: [
    { group: 'men', label: '주자 있음', pa: 110, ab: 97, h: 23, tb: 30, hr: 1 },
    { group: 'men', label: '주자 없음', pa: 158, ab: 139, h: 35, tb: 46, hr: 2 },
    { group: 'lhp', label: '좌투 상대', pa: 72, ab: 64, h: 16, tb: 21, hr: 1 },
    { group: 'lhp', label: '우투 상대', pa: 196, ab: 172, h: 42, tb: 55, hr: 2 },
  ],
  ldy: [
    { group: 'men', label: '주자 있음', pa: 141, ab: 125, h: 33, tb: 45, hr: 2 },
    { group: 'men', label: '주자 없음', pa: 211, ab: 187, h: 49, tb: 66, hr: 2 },
    { group: 'lhp', label: '좌투 상대', pa: 92, ab: 81, h: 22, tb: 29, hr: 1 },
    { group: 'lhp', label: '우투 상대', pa: 260, ab: 231, h: 60, tb: 82, hr: 3 },
  ],
  swj: [
    { group: 'men', label: '주자 있음', pa: 156, ab: 139, h: 35, tb: 51, hr: 3 },
    { group: 'men', label: '주자 없음', pa: 243, ab: 217, h: 57, tb: 82, hr: 4 },
    { group: 'lhp', label: '좌투 상대', pa: 108, ab: 96, h: 26, tb: 37, hr: 2 },
    { group: 'lhp', label: '우투 상대', pa: 291, ab: 260, h: 66, tb: 96, hr: 5 },
  ],
  cjh: [
    { group: 'men', label: '주자 있음', pa: 88, ab: 75, h: 18, tb: 24, hr: 1 },
    { group: 'men', label: '주자 없음', pa: 122, ab: 103, h: 26, tb: 34, hr: 1 },
    { group: 'lhp', label: '좌투 상대', pa: 59, ab: 50, h: 12, tb: 16, hr: 1 },
    { group: 'lhp', label: '우투 상대', pa: 151, ab: 128, h: 32, tb: 42, hr: 1 },
  ],
  kty: [
    { group: 'men', label: '주자 있음', pa: 98, ab: 88, h: 24, tb: 36, hr: 3 },
    { group: 'men', label: '주자 없음', pa: 140, ab: 126, h: 33, tb: 50, hr: 3 },
    { group: 'lhp', label: '좌투 상대', pa: 81, ab: 73, h: 22, tb: 33, hr: 2 },
    { group: 'lhp', label: '우투 상대', pa: 157, ab: 141, h: 35, tb: 53, hr: 4 },
  ],
};

export const PITCHER_SPLITS: Record<string, PitcherSplit[]> = {
  ryu: [
    { label: '좌타 상대', bf: 207, h: 44, hr: 3, bb: 7, so: 43 },
    { label: '우타 상대', bf: 285, h: 68, hr: 4, bb: 10, so: 51 },
  ],
  mdj: [
    { label: '좌타 상대', bf: 83, h: 18, hr: 2, bb: 9, so: 16 },
    { label: '우타 상대', bf: 93, h: 20, hr: 2, bb: 9, so: 20 },
  ],
  usb: [
    { label: '좌타 상대', bf: 45, h: 13, hr: 2, bb: 6, so: 5 },
    { label: '우타 상대', bf: 48, h: 13, hr: 2, bb: 6, so: 6 },
  ],
  zim: [
    { label: '좌타 상대', bf: 71, h: 15, hr: 2, bb: 5, so: 14 },
    { label: '우타 상대', bf: 101, h: 25, hr: 2, bb: 7, so: 19 },
  ],
  wht: [
    { label: '좌타 상대', bf: 242, h: 52, hr: 5, bb: 16, so: 59 },
    { label: '우타 상대', bf: 283, h: 58, hr: 5, bb: 19, so: 73 },
  ],
  ksh: [
    { label: '좌타 상대', bf: 76, h: 15, hr: 1, bb: 10, so: 20 },
    { label: '우타 상대', bf: 92, h: 17, hr: 2, bb: 12, so: 25 },
  ],
  lhb: [
    { label: '좌타 상대', bf: 76, h: 18, hr: 1, bb: 6, so: 13 },
    { label: '우타 상대', bf: 125, h: 26, hr: 2, bb: 9, so: 23 },
  ],
  wyc: [
    { label: '좌타 상대', bf: 198, h: 40, hr: 3, bb: 15, so: 38 },
    { label: '우타 상대', bf: 297, h: 68, hr: 6, bb: 25, so: 50 },
  ],
  hjs: [
    { label: '좌타 상대', bf: 113, h: 24, hr: 2, bb: 12, so: 22 },
    { label: '우타 상대', bf: 122, h: 28, hr: 3, bb: 14, so: 22 },
  ],
  lkh: [
    { label: '좌타 상대', bf: 81, h: 16, hr: 1, bb: 7, so: 18 },
    { label: '우타 상대', bf: 50, h: 12, hr: 1, bb: 5, so: 9 },
  ],
  kjs: [
    { label: '좌타 상대', bf: 99, h: 19, hr: 2, bb: 8, so: 21 },
    { label: '우타 상대', bf: 81, h: 19, hr: 1, bb: 8, so: 14 },
  ],
  kbj: [
    { label: '좌타 상대', bf: 91, h: 18, hr: 1, bb: 7, so: 21 },
    { label: '우타 상대', bf: 116, h: 24, hr: 2, bb: 8, so: 26 },
  ],
  kmw: [
    { label: '좌타 상대', bf: 103, h: 24, hr: 3, bb: 10, so: 16 },
    { label: '우타 상대', bf: 126, h: 29, hr: 3, bb: 11, so: 20 },
  ],
};

// ─────────────────────────────────────────────────────────────
// 원자료 정합 검사
// ─────────────────────────────────────────────────────────────

/**
 * 원자료가 야구적으로 말이 되는지 검사한다.
 *
 * 목업 데이터는 손으로 적는 순간 반드시 어긋난다(타석 합이 안 맞거나, 2루타+홈런이
 * 안타보다 많거나). 그 상태로 계산 엔진에 넣으면 wOBA 가 태연히 계산되어 나오므로
 * **틀린 줄도 모르고 화면에 뜬다.** 개발 중에 콘솔로 잡는다.
 */
export function verifyRoster(): string[] {
  const errs: string[] = [];

  // 지난 시즌 라인도 같은 잣대로 검사한다. 비교 화면이 같은 공식을 태우므로
  // 여기가 어긋나면 "작년 대비"가 조용히 거짓말을 한다
  const batterLines: [string, BatterStatLine][] = [
    ...BATTERS.map((b) => [b.name, b.stat] as [string, BatterStatLine]),
    ...Object.entries(PREV_BATTER).map(([id, l]) => [`${id}(2025)`, l] as [string, BatterStatLine]),
  ];
  const pitcherLines: [string, PitcherStatLine][] = [
    ...[...PITCHERS, ...OPPONENT_PITCHERS].map(
      (p) => [p.name, p.stat] as [string, PitcherStatLine],
    ),
    ...Object.entries(PREV_PITCHER).map(
      ([id, l]) => [`${id}(2025)`, l] as [string, PitcherStatLine],
    ),
  ];

  for (const [name, s] of batterLines) {
    const b = { name };
    const paSum = s.ab + s.bb + s.hbp + s.sf + s.sh;
    if (paSum !== s.pa) {
      errs.push(`${b.name}: 타석(${s.pa}) ≠ 타수+볼넷+사구+희생타(${paSum})`);
    }
    if (s.double + s.triple + s.hr > s.h) {
      errs.push(`${b.name}: 장타 합이 안타보다 많다`);
    }
    if (s.ibb > s.bb) errs.push(`${b.name}: 고의4구가 볼넷보다 많다`);
    // 한 경기에 타석이 7번을 넘을 수는 없다. 경기 수가 터무니없으면 여기서 걸린다
    if (s.g > 0 && s.pa / s.g > 7) {
      errs.push(`${b.name}: 경기당 타석(${(s.pa / s.g).toFixed(1)})이 말이 안 된다`);
    }
    if (s.h + s.so > s.ab) errs.push(`${b.name}: 안타+삼진이 타수를 넘는다`);
    const batted = s.gbRate + s.fbRate + s.ldRate;
    if (Math.abs(batted - 1) > 0.001) {
      errs.push(`${b.name}: 타구 유형 비율 합이 1이 아니다 (${batted.toFixed(3)})`);
    }
  }

  for (const [name, s] of pitcherLines) {
    const p = { name };
    // 상대한 타자 수는 최소한 (아웃 + 안타 + 볼넷 + 사구) 이상이어야 한다
    const minBf = s.ipOuts + s.h + s.bb + s.hbp;
    if (s.bf < minBf) {
      errs.push(`${p.name}: 상대타자(${s.bf})가 최소치(${minBf})보다 적다`);
    }
    if (s.hr > s.h) errs.push(`${p.name}: 피홈런이 피안타보다 많다`);
    if (s.er > s.r) errs.push(`${p.name}: 자책점이 실점보다 많다`);
    const batted = s.gbRate + s.fbRate + s.ldRate;
    if (Math.abs(batted - 1) > 0.001) {
      errs.push(`${p.name}: 타구 유형 비율 합이 1이 아니다 (${batted.toFixed(3)})`);
    }
  }

  // 월별 합이 시즌 합계와 어긋나면 같은 화면에서 앱이 자기 말을 뒤집는다
  for (const bat of BATTERS) {
    const ms = BATTER_MONTHS[bat.id];
    if (!ms) continue;
    const f = (k: 'pa' | 'ab' | 'h' | 'hr' | 'rbi') => ms.reduce((a, m) => a + m[k], 0);
    for (const k of ['pa', 'ab', 'h', 'hr', 'rbi'] as const) {
      if (f(k) !== bat.stat[k]) {
        errs.push(`${bat.name}: 월별 ${k} 합(${f(k)})이 시즌 ${bat.stat[k]} 과 다르다`);
      }
    }
    for (const m of ms) {
      if (m.h > m.ab) errs.push(`${bat.name} ${m.month}: 안타가 타수보다 많다`);
      if (m.hr > m.h) errs.push(`${bat.name} ${m.month}: 홈런이 안타보다 많다`);
    }
  }
  for (const pit of PITCHERS) {
    const ms = PITCHER_MONTHS[pit.id];
    if (!ms) continue;
    const f = (k: 'g' | 'ipOuts' | 'er' | 'so') => ms.reduce((a, m) => a + m[k], 0);
    for (const k of ['g', 'ipOuts', 'er', 'so'] as const) {
      if (f(k) !== pit.stat[k]) {
        errs.push(`${pit.name}: 월별 ${k} 합(${f(k)})이 시즌 ${pit.stat[k]} 과 다르다`);
      }
    }
  }

  // 스플릿 두 쪽의 합도 시즌과 같아야 한다
  for (const bat of BATTERS) {
    const sp = BATTER_SPLITS[bat.id];
    if (!sp) continue;
    const tb = bat.stat.h + bat.stat.double + 2 * bat.stat.triple + 3 * bat.stat.hr;
    for (const g of ['men', 'lhp'] as const) {
      const rows = sp.filter((x) => x.group === g);
      if (rows.length !== 2) {
        errs.push(`${bat.name}: ${g} 스플릿이 두 쪽이 아니다`);
        continue;
      }
      const f = (k: 'pa' | 'ab' | 'h' | 'hr') => rows.reduce((a, x) => a + x[k], 0);
      for (const k of ['pa', 'ab', 'h', 'hr'] as const) {
        if (f(k) !== bat.stat[k]) {
          errs.push(`${bat.name}: ${g} ${k} 합(${f(k)})이 시즌 ${bat.stat[k]} 과 다르다`);
        }
      }
      const tbSum = rows.reduce((a, x) => a + x.tb, 0);
      if (tbSum !== tb) errs.push(`${bat.name}: ${g} 총루타 합(${tbSum})이 시즌 ${tb} 과 다르다`);
      for (const x of rows) {
        if (x.h > x.ab) errs.push(`${bat.name} ${x.label}: 안타가 타수보다 많다`);
        if (x.hr > x.h) errs.push(`${bat.name} ${x.label}: 홈런이 안타보다 많다`);
      }
    }
  }
  for (const pit of PITCHERS) {
    const sp = PITCHER_SPLITS[pit.id];
    if (!sp) continue;
    const f = (k: 'bf' | 'h' | 'hr' | 'bb' | 'so') => sp.reduce((a, x) => a + x[k], 0);
    for (const k of ['bf', 'h', 'hr', 'bb', 'so'] as const) {
      if (f(k) !== pit.stat[k]) {
        errs.push(`${pit.name}: 좌우타 ${k} 합(${f(k)})이 시즌 ${pit.stat[k]} 과 다르다`);
      }
    }
  }

  // 구종 구사율은 스탯 라인이 아니라 선수의 것이라 따로 돈다
  for (const p of [...PITCHERS, ...OPPONENT_PITCHERS]) {
    const usage = p.pitches.reduce((a, x) => a + x.usage, 0);
    if (Math.abs(usage - 1) > 0.011) {
      errs.push(`${p.name}: 구종 구사율 합이 1이 아니다 (${usage.toFixed(3)})`);
    }
  }

  return errs;
}

// ═════════════════════════════════════════════════════════════
// 투수 vs 타자 상대전적
// ═════════════════════════════════════════════════════════════
//
// ── 왜 시즌 성적만으로는 부족한가 ────────────────────────────
// 매치업 확률은 두 사람의 **시즌 성적**을 승산비로 결합해 낸다(로그5). 그런데 중계석과
// 관중석이 실제로 하는 말은 늘 "이 타자가 저 투수한테 유독 강하다"이다. 시즌 성적이
// 같아도 그 투수만 만나면 못 치는 타자가 있고, 그 반대도 있다.
//
// ── 그런데 표본이 작다 ───────────────────────────────────────
// 한 시즌에 같은 투수를 만나는 타석은 많아야 스무 번 남짓이다. 그 스무 번을 시즌
// 오백 타석과 같은 무게로 쓰면 **우연이 실력을 이겨 버린다** - 3타수 3안타 하나로
// 확률이 통째로 뒤집힌다. 그래서 이 값은 **표본 크기만큼만** 반영한다
// (liveEngine 의 headToHeadAdj 주석 참조).
//
// ⚠ 목업이다. 실서비스에서는 KBO 기록에서 투수-타자 조합별 타석을 집계해 넣는다.
//   구조는 그대로 받는다 - 키가 `투수id:타자id` 이고 값이 네 수라는 것만 지키면 된다.
export interface HeadToHead {
  /** 상대한 타석 */
  pa: number;
  h: number;
  bb: number;
  hr: number;
}

/** 키는 `투수id:타자id`. 기록이 없으면 아예 넣지 않는다 - 0 과 '없음'은 다르다 */
export const HEAD_TO_HEAD: Record<string, HeadToHead> = {
  // 임찬규(LG) 상대
  'lcg:mhb': { pa: 14, h: 5, bb: 2, hr: 1 },
  'lcg:kbh': { pa: 21, h: 4, bb: 3, hr: 1 },
  'lcg:nsh': { pa: 18, h: 2, bb: 1, hr: 0 },
  'lcg:ces': { pa: 25, h: 7, bb: 2, hr: 2 },
  'lcg:his': { pa: 4, h: 1, bb: 0, hr: 0 },
  'lcg:ldy': { pa: 9, h: 1, bb: 1, hr: 0 },

  // 유영찬(LG) 상대 - 불펜이라 타석이 더 적다
  'yyc:swj': { pa: 6, h: 2, bb: 0, hr: 0 },
  'yyc:lws': { pa: 8, h: 1, bb: 1, hr: 0 },
  'yyc:mhb': { pa: 5, h: 0, bb: 0, hr: 0 },
  'yyc:kbh': { pa: 11, h: 4, bb: 1, hr: 1 },
  'yyc:nsh': { pa: 7, h: 3, bb: 0, hr: 0 },
  // 페라자(per)는 2026 에 온 외국인이라 이 둘을 상대한 기록이 아직 없다
};

/** 없으면 undefined - 화면과 엔진이 '기록 없음'을 다르게 다뤄야 한다 */
export function headToHead(pitcherId: string, batterId: string): HeadToHead | undefined {
  return HEAD_TO_HEAD[`${pitcherId}:${batterId}`];
}
