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
  /** 선수 소개 한 줄 - 스탯이 말하지 못하는 맥락 */
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
  note: string;
}

// 타구 유형 비율은 땅볼+뜬공+라인드라이브 = 1.0 이 되게 맞춘다
export const BATTERS: Batter[] = [
  {
    id: 'nsh',
    name: '노시환',
    back: 8,
    pos: '3B',
    bats: 'R',
    age: 26,
    note: '팀 중심 타선. 당겨친 뜬공 비중이 높아 홈런과 병살이 같이 늘어나는 유형',
    stat: {
      pa: 420,
      ab: 365,
      h: 105,
      double: 20,
      triple: 1,
      hr: 22,
      bb: 45,
      ibb: 3,
      hbp: 6,
      so: 88,
      sf: 4,
      sh: 0,
      sb: 4,
      cs: 2,
      r: 62,
      rbi: 78,
      gdp: 9,
      gbRate: 0.38,
      fbRate: 0.44,
      ldRate: 0.18,
      fieldingRuns: 2.5,
      positionAdj: POSITION_ADJ['3B'],
    },
  },
  {
    id: 'ces',
    name: '채은성',
    back: 9,
    pos: '1B',
    bats: 'R',
    age: 36,
    note: '주자 있을 때 타격 접근이 달라지는 베테랑. 밀어치는 비중이 늘면 타점이 붙는다',
    stat: {
      pa: 398,
      ab: 351,
      h: 98,
      double: 22,
      triple: 0,
      hr: 15,
      bb: 38,
      ibb: 4,
      hbp: 5,
      so: 71,
      sf: 4,
      sh: 0,
      sb: 1,
      cs: 1,
      r: 48,
      rbi: 71,
      gdp: 12,
      gbRate: 0.43,
      fbRate: 0.38,
      ldRate: 0.19,
      fieldingRuns: -1.0,
      positionAdj: POSITION_ADJ['1B'],
    },
  },
  {
    id: 'mhb',
    name: '문현빈',
    back: 51,
    pos: 'LF',
    bats: 'L',
    age: 22,
    note: '컨택 위주 좌타자. 삼진이 적어 표본이 빨리 안정되는 편',
    stat: {
      pa: 412,
      ab: 372,
      h: 112,
      double: 19,
      triple: 3,
      hr: 8,
      bb: 32,
      ibb: 1,
      hbp: 4,
      so: 52,
      sf: 4,
      sh: 0,
      sb: 12,
      cs: 4,
      r: 58,
      rbi: 47,
      gdp: 6,
      gbRate: 0.46,
      fbRate: 0.32,
      ldRate: 0.22,
      fieldingRuns: 1.5,
      positionAdj: POSITION_ADJ['LF'],
    },
  },
  {
    id: 'cjh',
    name: '최재훈',
    back: 13,
    pos: 'C',
    bats: 'R',
    age: 37,
    note: '수비 가치가 타격 성적보다 큰 포수. WAR 에서 포지션 조정이 가장 크게 붙는다',
    stat: {
      pa: 286,
      ab: 245,
      h: 62,
      double: 11,
      triple: 0,
      hr: 4,
      bb: 33,
      ibb: 2,
      hbp: 5,
      so: 48,
      sf: 3,
      sh: 0,
      sb: 0,
      cs: 1,
      r: 28,
      rbi: 30,
      gdp: 8,
      gbRate: 0.48,
      fbRate: 0.33,
      ldRate: 0.19,
      fieldingRuns: 8.0,
      positionAdj: POSITION_ADJ.C,
    },
  },
  {
    id: 'ach',
    name: '안치홍',
    back: 13,
    pos: '2B',
    bats: 'R',
    age: 36,
    note: '중장거리형 2루수. 최근 타구 속도는 유지되는데 안타가 줄어 BABIP 가 눌려 있다',
    stat: {
      pa: 375,
      ab: 336,
      h: 88,
      double: 17,
      triple: 1,
      hr: 9,
      bb: 30,
      ibb: 1,
      hbp: 4,
      so: 62,
      sf: 5,
      sh: 0,
      sb: 2,
      cs: 2,
      r: 41,
      rbi: 45,
      gdp: 11,
      gbRate: 0.44,
      fbRate: 0.37,
      ldRate: 0.19,
      fieldingRuns: -2.0,
      positionAdj: POSITION_ADJ['2B'],
    },
  },
  {
    id: 'flo',
    name: '플로리얼',
    back: 17,
    pos: 'CF',
    bats: 'L',
    age: 28,
    note: '스피드와 수비 범위로 먹고사는 중견수. 삼진이 많아 타율 기복이 크다',
    stat: {
      pa: 405,
      ab: 358,
      h: 96,
      double: 18,
      triple: 4,
      hr: 13,
      bb: 38,
      ibb: 1,
      hbp: 5,
      so: 102,
      sf: 4,
      sh: 0,
      sb: 24,
      cs: 6,
      r: 61,
      rbi: 52,
      gdp: 4,
      gbRate: 0.41,
      fbRate: 0.39,
      ldRate: 0.2,
      fieldingRuns: 6.5,
      positionAdj: POSITION_ADJ.CF,
    },
  },
  {
    id: 'hym',
    name: '황영묵',
    back: 24,
    pos: 'SS',
    bats: 'L',
    age: 25,
    note: '표본이 아직 적은 내야수. 지표를 읽을 때 신뢰도 경고가 가장 자주 뜬다',
    stat: {
      pa: 224,
      ab: 201,
      h: 55,
      double: 9,
      triple: 2,
      hr: 3,
      bb: 17,
      ibb: 0,
      hbp: 3,
      so: 38,
      sf: 3,
      sh: 0,
      sb: 7,
      cs: 3,
      r: 30,
      rbi: 22,
      gdp: 5,
      gbRate: 0.5,
      fbRate: 0.3,
      ldRate: 0.2,
      fieldingRuns: 1.0,
      positionAdj: POSITION_ADJ.SS,
    },
  },
  {
    id: 'kty',
    name: '김태연',
    back: 25,
    pos: 'RF',
    bats: 'R',
    age: 29,
    note: '좌투수 상대 지명타자로 자주 나온다. 플래툰 스플릿이 뚜렷한 케이스',
    stat: {
      pa: 268,
      ab: 240,
      h: 66,
      double: 13,
      triple: 0,
      hr: 7,
      bb: 22,
      ibb: 0,
      hbp: 3,
      so: 45,
      sf: 3,
      sh: 0,
      sb: 3,
      cs: 1,
      r: 32,
      rbi: 35,
      gdp: 6,
      gbRate: 0.42,
      fbRate: 0.39,
      ldRate: 0.19,
      fieldingRuns: -1.5,
      positionAdj: POSITION_ADJ.RF,
    },
  },
];

export const PITCHERS: Pitcher[] = [
  {
    id: 'pon',
    name: '폰세',
    back: 42,
    role: '선발',
    throws: 'R',
    age: 29,
    note: '탈삼진형 에이스. 인플레이 타구 자체를 줄여서 수비 영향을 덜 받는다',
    pitches: [
      { name: '포심', usage: 0.44, velo: 152 },
      { name: '슬라이더', usage: 0.28, velo: 138 },
      { name: '스플리터', usage: 0.19, velo: 136 },
      { name: '커브', usage: 0.09, velo: 124 },
    ],
    stat: {
      g: 20,
      gs: 20,
      ipOuts: 384,
      h: 98,
      hr: 9,
      bb: 34,
      ibb: 1,
      hbp: 4,
      so: 158,
      r: 44,
      er: 41,
      w: 11,
      l: 4,
      sv: 0,
      hld: 0,
      bf: 520,
      gbRate: 0.42,
      fbRate: 0.38,
      ldRate: 0.2,
    },
  },
  {
    id: 'mdj',
    name: '문동주',
    back: 1,
    role: '선발',
    throws: 'R',
    age: 23,
    note: '구속은 리그 최상위인데 볼넷이 붙는 유형. ERA 보다 FIP 를 봐야 실체가 보인다',
    pitches: [
      { name: '포심', usage: 0.51, velo: 155 },
      { name: '커브', usage: 0.22, velo: 128 },
      { name: '체인지업', usage: 0.18, velo: 140 },
      { name: '슬라이더', usage: 0.09, velo: 143 },
    ],
    stat: {
      g: 20,
      gs: 20,
      ipOuts: 360,
      h: 108,
      hr: 10,
      bb: 42,
      ibb: 1,
      hbp: 5,
      so: 128,
      r: 52,
      er: 47,
      w: 9,
      l: 6,
      sv: 0,
      hld: 0,
      bf: 515,
      gbRate: 0.44,
      fbRate: 0.37,
      ldRate: 0.19,
    },
  },
  {
    id: 'ryu',
    name: '류현진',
    back: 99,
    role: '선발',
    throws: 'L',
    age: 39,
    note: '구속이 아니라 제구와 완급으로 던진다. 볼넷이 극단적으로 적다',
    pitches: [
      { name: '체인지업', usage: 0.31, velo: 132 },
      { name: '포심', usage: 0.29, velo: 145 },
      { name: '커터', usage: 0.22, velo: 139 },
      { name: '커브', usage: 0.18, velo: 118 },
    ],
    stat: {
      g: 19,
      gs: 19,
      ipOuts: 342,
      h: 112,
      hr: 12,
      bb: 21,
      ibb: 2,
      hbp: 3,
      so: 96,
      r: 50,
      er: 46,
      w: 8,
      l: 6,
      sv: 0,
      hld: 0,
      bf: 483,
      gbRate: 0.47,
      fbRate: 0.35,
      ldRate: 0.18,
    },
  },
  {
    id: 'wei',
    // 확보한 사진(assets/photo/player/wei.jpg)에 등번호 55 가 찍혀 있다.
    // 카드에서 등번호와 사진이 나란히 보이므로 값을 사진에 맞춘다
    name: '와이스',
    back: 55,
    role: '선발',
    throws: 'R',
    age: 27,
    note: '땅볼 유도형. 병살이 승부처가 되는 경기가 많다',
    pitches: [
      { name: '싱커', usage: 0.38, velo: 149 },
      { name: '슬라이더', usage: 0.3, velo: 137 },
      { name: '포심', usage: 0.21, velo: 151 },
      { name: '체인지업', usage: 0.11, velo: 138 },
    ],
    stat: {
      g: 19,
      gs: 19,
      ipOuts: 351,
      h: 118,
      hr: 8,
      bb: 33,
      ibb: 1,
      hbp: 6,
      so: 104,
      r: 54,
      er: 49,
      w: 8,
      l: 5,
      sv: 0,
      hld: 0,
      bf: 514,
      gbRate: 0.54,
      fbRate: 0.28,
      ldRate: 0.18,
    },
  },
  {
    id: 'ksh',
    name: '김서현',
    back: 62, // 와이스가 사진의 55 를 가져가 번호를 비웠다
    role: '마무리',
    throws: 'R',
    age: 22,
    note: '9회 전담. 표본(이닝)이 작아 어떤 지표든 크게 흔들린다는 점을 먼저 봐야 한다',
    pitches: [
      { name: '포심', usage: 0.58, velo: 157 },
      { name: '슬라이더', usage: 0.34, velo: 142 },
      { name: '커브', usage: 0.08, velo: 130 },
    ],
    stat: {
      g: 44,
      gs: 0,
      ipOuts: 138,
      h: 33,
      hr: 2,
      bb: 19,
      ibb: 2,
      hbp: 2,
      so: 62,
      r: 14,
      er: 12,
      w: 3,
      l: 2,
      sv: 26,
      hld: 0,
      bf: 193,
      gbRate: 0.4,
      fbRate: 0.41,
      ldRate: 0.19,
    },
  },
  {
    id: 'jhs',
    name: '주현상',
    back: 46,
    role: '불펜',
    throws: 'R',
    age: 33,
    note: '셋업. 볼넷을 거의 주지 않아 주자 있는 상황에 먼저 올라온다',
    pitches: [
      { name: '포심', usage: 0.46, velo: 148 },
      { name: '슬라이더', usage: 0.31, velo: 136 },
      { name: '체인지업', usage: 0.23, velo: 133 },
    ],
    stat: {
      g: 48,
      gs: 0,
      ipOuts: 165,
      h: 44,
      hr: 3,
      bb: 11,
      ibb: 1,
      hbp: 2,
      so: 54,
      r: 18,
      er: 16,
      w: 4,
      l: 2,
      sv: 2,
      hld: 22,
      bf: 225,
      gbRate: 0.48,
      fbRate: 0.34,
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
    note: '구속보다 완급으로 던지는 유형. 뜬공 비율이 높아 잠실을 홈으로 쓰는 이점이 크다',
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
    note: '좌완 땅볼 투수. 좌타자 상대로 특히 강해 플래툰 교체를 부르는 유형',
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
    note: '9회 전담. 포심 구사율이 6할에 가까워 변화구 의존도가 낮다',
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
    note: '좌완 원포인트로도 쓰인다. 좌타자를 잡으러 올라오는 자리',
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

  for (const b of BATTERS) {
    const s = b.stat;
    const paSum = s.ab + s.bb + s.hbp + s.sf + s.sh;
    if (paSum !== s.pa) {
      errs.push(`${b.name}: 타석(${s.pa}) ≠ 타수+볼넷+사구+희생타(${paSum})`);
    }
    if (s.double + s.triple + s.hr > s.h) {
      errs.push(`${b.name}: 장타 합이 안타보다 많다`);
    }
    if (s.ibb > s.bb) errs.push(`${b.name}: 고의4구가 볼넷보다 많다`);
    if (s.h + s.so > s.ab) errs.push(`${b.name}: 안타+삼진이 타수를 넘는다`);
    const batted = s.gbRate + s.fbRate + s.ldRate;
    if (Math.abs(batted - 1) > 0.001) {
      errs.push(`${b.name}: 타구 유형 비율 합이 1이 아니다 (${batted.toFixed(3)})`);
    }
  }

  for (const p of [...PITCHERS, ...OPPONENT_PITCHERS]) {
    const s = p.stat;
    // 상대한 타자 수는 최소한 (아웃 + 안타 + 볼넷 + 사구) 이상이어야 한다
    const minBf = s.ipOuts + s.h + s.bb + s.hbp;
    if (s.bf < minBf) {
      errs.push(`${p.name}: 상대타자(${s.bf})가 최소치(${minBf})보다 적다`);
    }
    if (s.hr > s.h) errs.push(`${p.name}: 피홈런이 피안타보다 많다`);
    if (s.er > s.r) errs.push(`${p.name}: 자책점이 실점보다 많다`);
    const usage = p.pitches.reduce((a, x) => a + x.usage, 0);
    if (Math.abs(usage - 1) > 0.011) {
      errs.push(`${p.name}: 구종 구사율 합이 1이 아니다 (${usage.toFixed(3)})`);
    }
    const batted = s.gbRate + s.fbRate + s.ldRate;
    if (Math.abs(batted - 1) > 0.001) {
      errs.push(`${p.name}: 타구 유형 비율 합이 1이 아니다 (${batted.toFixed(3)})`);
    }
  }

  return errs;
}
