// 구단 앱 디자인 토큰 - 한화 이글스
//
// 값과 그 값을 고른 짧은 이유만 둔다. 방향 전환의 서사(왜 다크에서 라이트로 뒤집었는지,
// 왜 iOS 그룹 리스트 문법을 따르는지)는 docs/design-decisions.md 가 갖는다.
// 여기에 문단이 쌓이면 토큰 파일이 코드로 읽히지 않는다.
import { Dimensions, Platform, StatusBar, TextStyle } from 'react-native';

/**
 * 구단 색 음영 계단.
 *
 * 구단 워드마크 가이드가 쓰는 면은 셋뿐이다 - 흰색 · Eagles Orange · Thunderstorm Navy.
 * 그 둘에서 각각 열 칸을 뽑았다. **없던 색을 지어내지 않는다** - 계단 전체가 원본과
 * 같은 색상각(hue)을 쓰고, 원본 자체가 계단의 한 칸으로 그대로 들어 있다.
 *
 *   orange-500 = #FC4E00  (엠블럼 오렌지 원본)
 *   navy-900   = #07111F  (Thunderstorm Navy 원본)
 *
 * L 은 OKLCh 로 고르게 벌리고 채도는 양 끝에서 줄인다(밝은 칸에 원본 채도를 그대로
 * 두면 형광 살구색이 된다). sRGB 밖으로 나가는 칸은 **C 를 줄여서** 안으로 들인다 -
 * 그냥 자르면 채널마다 다르게 잘려 hue 가 조용히 틀어진다.
 *
 * ⚠ **손으로 고치지 말 것.** 산출·검증은 `node tools/brand-scale.js` 가 한다.
 *   그 도구가 대비까지 같이 재므로 아래 '쓸 수 있는 자리'도 함께 다시 나온다.
 *
 * ── 어느 칸을 어디에 쓰나 (흰 카드 기준 대비) ───────────────
 *   50~400   면·틴트 전용        글자로 쓰면 안 된다 (1.1~2.3:1)
 *   500      큰 글자·테두리까지   3.4:1 - 본문 글자는 안 된다
 *   600~900  글자로 써도 되고,   5.1:1 이상. 같은 값이 **면으로 깔고 흰 글자를
 *            면으로 깔아도 된다   얹을 때의 대비이기도 하다 (대비는 방향이 없다)
 *
 * 어두운 면(navy-900) 위에 얹을 때는 반대다 - 500 이하가 4.5:1 을 넘고 600 부터
 * 떨어진다. 다크 헤더에 brandText 를 쓰면 안 되는 이유가 여기 있다.
 */
const orangeScale = {
  50: '#FFF4F1',
  100: '#FFE7E0',
  200: '#FFCFC0',
  300: '#FFB19A',
  400: '#FF8865',
  500: '#FC4E00',
  600: '#C83C00',
  700: '#962B00',
  800: '#681B00',
  900: '#3D0C00',
} as const;

const navyScale = {
  50: '#F4F7FA',
  100: '#E8EDF4',
  200: '#D3DCE9',
  300: '#BBC9DC',
  400: '#9EB0CA',
  500: '#768DAC',
  600: '#566B88',
  700: '#384B63',
  800: '#1E2C40',
  900: '#07111F',
} as const;

/** 화면에서 계단을 직접 집어야 할 때. 의미 토큰(colors)으로 안 되는 자리만 */
export const palette = { orange: orangeScale, navy: navyScale } as const;

/**
 * 구단 색 - Hanwha Eagles Orange (2024-11-12 새 엠블럼).
 *
 * ⚠ **면으로만 쓴다.** 흰 바탕 위 글자로 쓰면 3.4:1 이라 본문 대비에 못 미친다.
 * 글자로 써야 하는 자리에는 `brandText` 를 쓴다.
 * 오렌지 면 위의 글자는 흰색을 쓰되 **14pt 굵게 이상**일 때만 허용된다.
 */
const eaglesOrange = orangeScale[500];

/**
 * 오렌지를 글자로 쓸 때. 흰 바탕 5.12:1
 *
 * 예전에는 `#C63A00` 을 손으로 넣어 뒀는데, 계단을 뽑아 보니 600 칸이 그 자리를
 * 그대로 되찾았다(ΔL 0.006). 값을 두 벌 두지 않으려고 계단 쪽으로 합쳤다 -
 * 대비가 5.20 에서 5.12 로 아주 조금 내려가지만 AA(4.5) 안쪽이다.
 */
const eaglesOrangeText = orangeScale[600];

/** Thunderstorm Navy - 새 엠블럼의 바탕색. 브랜드 마크와 어두운 헤더에만 */
const stormNavy = navyScale[900];

// ── 파생 ─────────────────────────────────────────────────────

/**
 * 틴트 배지의 바탕. 색을 10% 알파로 깔아 만든다.
 *
 * 원래 brandSoft·liveSoft·winSoft·warnSoft 네 개가 각각 하드코딩되어 있었는데,
 * 역산해 보니 전부 9~10% 알파였다(warnSoft 만 어긋나 있었다). 규칙이 이미 있었지만
 * 코드에 적혀 있지 않아 색을 하나 더 만들 때마다 손으로 틴트를 만들어야 했다.
 *
 * ⚠ **10% 이지 15% 가 아니다.** HeroUI 의 soft 변형은 15% 인데, 그 값을 쓰면
 * 위 글자 대비가 4.27~4.39:1 로 **AA(4.5:1) 아래로 떨어진다**(실측).
 * 10% 에서 최저 4.62:1 로, 기존 하드코딩 값과 같은 수준을 유지한다.
 *
 * ⚠ **알파는 뒤에 무엇이 있는지를 탄다.** 위 수치는 전부 흰 카드 기준이다.
 * 회색 지면(`bg`) 위에 얹으면 3.9:1 로 떨어진다. **틴트 배지는 카드 안에만 둔다.**
 */
export const soft = (hex: string) => `${hex}1A`;

/**
 * 회색 계열의 색상각(hue). **구단 오렌지와 같은 37.4°다.**
 *
 * 원래 지면은 `#F2F2F7`(iOS systemGroupedBackground) 이었고 회색 계열 전체가
 * hue 260~286 의 **파란 회색**이었다. 구단 색은 오렌지인데 지면이 파랗게 식어 있으면
 * 브랜드가 화면 어디에도 묻지 않는다 - 오렌지는 칩과 게이지에만 점점이 떠 있고
 * 나머지 전부가 "기본값을 그대로 쓴 화면"으로 읽힌다.
 *
 * ⚠ **L(명도)은 한 토큰도 건드리지 않았다.** hue 만 돌리고 채도를 C=0.008 로 통일했다.
 * L 을 함께 움직이면 면 위계(카드 > 지면 > 눌림)와 글자 대비가 동시에 흔들려
 * 무엇 때문에 달라졌는지 알 수 없게 된다. 산출·검증은 `tools/tint-ground-final.js`.
 *
 * C=0.008 인 이유: 원래 `bg` 의 채도가 0.0066 이었다. **강도는 원저자가 쓰던 만큼
 * 그대로 두고 방향만 반대로 돌린 것**이다. 0.012 이상은 살구빛이 뚜렷해져 지면이
 * 스스로를 주장하고, 0.004 이하는 흰 카드 옆에서 사라진다.
 *
 * 값을 상수로 두지 않는 이유: hue 를 코드로 쓰려면 OKLCh 변환기를 앱 번들에 넣어야
 * 하는데, 지면색은 빌드 때 한 번 정해지면 런타임에 변하지 않는다. 대신 위 도구가
 * 같은 검사를 다시 돌려 주므로 색을 바꿀 때는 **손으로 고치지 말고 도구를 돌린다.**
 */

export const colors = {
  // ── 지면 ─────────────────────────────────────────────────────
  // ⚠ 아래 회색은 전부 GROUND_HUE 에서 나왔다. 손으로 값을 고치지 말 것 -
  //    하나만 옛 hue 로 남으면 그 자리에서만 파란 회색이 튄다.
  bg: '#F8F1EF', // 페이지 배경 - 구단 색으로 기울인 따뜻한 회색
  card: '#FFFFFF', // 카드 면 - 순백을 유지한다. 지면이 따뜻해야 카드가 떠오른다
  surface: '#FAF3F1', // 카드 안의 한 단계 낮은 면 (타일·게이지 트랙·보조 버튼)
  raised: '#F0E9E7', // 눌린 상태·선택되지 않은 세그먼트

  // ── 구단 색 ──────────────────────────────────────────────────
  brand: eaglesOrange, // 면 전용 - 선택 상태·게이지 채움·주요 버튼
  brandText: eaglesOrangeText, // 글자 전용 - 핵심 수치·강조 링크 (5.12:1)
  navy: stormNavy, // 브랜드 마크·어두운 헤더
  onBrand: '#FFFFFF', // 오렌지 면 위 글자 - 14pt 굵게 이상에서만
  onNavy: '#FFFFFF', // 네이비 면 위 글자 (18.9:1)

  // ── 텍스트 3단 ───────────────────────────────────────────────
  // 흰 카드 위에서 세 단계 모두 AA(4.5:1)를 넘는다
  text: '#16181D', // 1단: 제목·핵심 수치 (17.7:1)
  subText: '#5B6270', // 2단: 본문·라벨 (6.1:1)
  mutedText: '#6E7581', // 3단: 캡션·크레딧 (4.6:1)

  // ── 구분·비활성 ──────────────────────────────────────────────
  // 여기도 GROUND_HUE 다. 선과 트랙이 파란 회색으로 남으면 지면 위에서 그 선만 떠 보인다
  border: '#EFE8E6', // 카드 내부 행 구분선
  borderStrong: '#DFD8D6', // outline 버튼 테두리 - 구분선보다 한 단계 진하다
  // 게이지 **트랙**. 채움이 중립색일 때도 구분되도록 채움보다 확실히 밝아야 한다
  dim: '#EAE3E1',
  /** 게이지 채움이 브랜드색이 아닐 때 - 트랙 위에서 3.2:1 로 구분된다 */
  neutralFill: '#98A0AB',

  // ── 상태색 ───────────────────────────────────────────────────
  // 구단 색이 오렌지라 LIVE 를 채운 빨강으로 두면 붙었을 때 탁해진다. 틴트로만 쓴다
  live: '#D00F31', // 진행 중 (흰 바탕 6.4:1)
  win: '#1F7A4D', // 승 (흰 바탕 5.1:1)
  lose: '#8A9099',
  scheduled: '#6E7581',
  final: '#8A9099',

  // ── 경고 ─────────────────────────────────────────────────────
  // '임박' 류. brand 를 쓰면 선택 상태(칩)와 같은 옷이 되어 경고가 안 읽힌다
  warn: '#8A6416', // 흰 바탕 5.9:1

  // ── 스탯 신뢰도 ──────────────────────────────────────────────
  // 심화 지표는 표본이 적으면 믿으면 안 되는 값이다. 그 사실을 색으로도 말한다
  trustHigh: '#1F7A4D',
  trustMid: '#8A6416',
  trustLow: '#8A9099',

  // ── 틴트 (파생) ──────────────────────────────────────────────
  // 손으로 값을 넣지 않는다. 색이 바뀌면 틴트도 따라온다
  brandSoft: soft(eaglesOrange),
  liveSoft: soft('#D00F31'),
  winSoft: soft('#1F7A4D'),
  warnSoft: soft('#8A6416'),
};

/**
 * 항목을 **구분만** 하는 색.
 *
 * 위 색들은 전부 의미를 갖는다(브랜드·진행중·승·경고). 구종 비율이나 타구 방향처럼
 * 의미는 없고 서로 구별만 되면 되는 자리에는 쓸 수 없다. 승을 뜻하는 초록으로
 * '슬라이더'를 칠할 수는 없다.
 *
 * ⚠ **오렌지 인접 hue 를 통째로 비웠다.** 구단 색이 오렌지라 카테고리에 오렌지가
 * 섞이면 선택 상태와 혼동된다.
 *
 * 눈으로 고르지 않았다. OKLab 기준 6개 검사(명도 밴드·채도 하한·색각이상 분리·
 * 정상시각 하한·지면 대비)를 통과한 값이다. 첫 후보는 청록↔파랑이 ΔE 12.2 로
 * **색각 이상이 아닌 사람도 구분하기 어려워** 탈락했다.
 *
 * ⚠ **다섯에서 멈춘다.** 여섯 번째 항목은 색을 새로 만드는 게 아니라 `other` 로 접는다.
 * 색을 늘리는 순간 위 검사가 깨진다.
 */
export const categorical = {
  light: ['#0A78D4', '#00A08C', '#7A45E0', '#D1257E', '#3E9B22'],
  /** 다크는 자동 반전이 아니라 어두운 지면에 맞춰 다시 스텝한 값이다 */
  dark: ['#2E86DB', '#0FA88A', '#8B60E2', '#DB4A8F', '#4FAE33'],
  /** 6번째부터 - 카테고리가 아니라 '기타' */
  other: '#98A0AB',
} as const;

/**
 * 카테고리 슬롯 → 색.
 *
 * 화면은 색을 직접 고르지 않고 **몇 번째 항목인지만** 넘긴다. 그래야 여섯 번째가
 * 생겼을 때 색을 새로 만드는 대신 `other` 로 접히는 규칙이 저절로 지켜진다.
 */
export const categoryColor = (i: number) => categorical.light[i] ?? categorical.other;

export const radius = {
  card: 24, // 콘센트릭 라운드 - 카드
  chip: 999, // 칩·배지·캡슐 버튼
  tile: 14, // 카드 안 타일·세그먼트·입력창
  bar: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,

  screenX: 18,
  cardPad: 18,
  cardGap: 12,
  sectionTop: 28,

  touchMin: 44,
  scrollBottom: 112, // 떠 있는 탭 캡슐 아래로 콘텐츠가 숨지 않게
};

/**
 * 타이포.
 *
 * ⚠ **굵기는 400 / 600 / 700 세 단계뿐이다.** 500 과 800 을 버렸다.
 * 단계가 다섯이면 무엇이 더 중요한지 눈이 판단하지 못하고, 화면이 굵기 대결이 된다.
 * 머리글은 이미 작은 회색으로 물러나 있었는데 **카드 안쪽에서 같은 대결이 다시**
 * 벌어지고 있었다.
 *
 * HeroUI 는 UI 전반이 500 하나인데, 한글은 500 이 얇게 뭉개져 그대로 쓸 수 없다.
 */
export const typography = {
  /** 섹션 머리글 - 작고 회색. 아래 카드의 소유물로 읽혀야 한다 */
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
    lineHeight: 18,
    color: colors.mutedText,
  } as TextStyle,

  /** 카드 안 제목. 가장 굵은 자리는 수치(metric)에 넘겼다 */
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 24,
    color: colors.text,
  } as TextStyle,

  /** 카드 안 제목 위의 작은 라벨 */
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 16,
    color: colors.mutedText,
  } as TextStyle,

  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    color: colors.subText,
  } as TextStyle,

  bodyStrong: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
    color: colors.text,
  } as TextStyle,

  /** 캡션은 물러나는 자리다. 500 은 400 과 구분되지 않으면서 단계만 늘렸다 */
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    color: colors.mutedText,
  } as TextStyle,

  /** 11pt 는 600 이어야 읽힌다 */
  micro: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    color: colors.mutedText,
  } as TextStyle,

  /** 스탯 타일의 값. 크기로 이미 강하니 굵기까지 최대로 두지 않는다 */
  metric: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.7,
    lineHeight: 30,
    color: colors.text,
  } as TextStyle,
};

/**
 * 컨트롤 크기 축.
 *
 * ⚠ **HeroUI 는 32/36/40 인데 그건 마우스로 누르는 웹 기준이다.**
 * 손가락 최소 터치는 44 이고 `spacing.touchMin` 에 이미 그렇게 적혀 있다.
 * md 를 44 로 올리고 나머지를 다시 잡았다. 구조는 따르되 수치는 모바일로 옮긴 자리다.
 */
export const control = {
  sm: { height: 36, padX: 14, fontSize: 14 },
  md: { height: spacing.touchMin, padX: 18, fontSize: 15 },
  lg: { height: 52, padX: 20, fontSize: 16 },
};

export type ControlSize = keyof typeof control;

/**
 * 버튼 variant.
 *
 * `primary` 가 원래 없었다. 그래서 가장 중요한 행동의 자리를 카드 전체 터치가
 * 대신 메우고 있었는데, 그러면 무엇이 일어나는지 눌러 봐야 안다.
 */
export const buttonTone = {
  primary: { bg: colors.brand, fg: colors.onBrand },
  secondary: { bg: colors.raised, fg: colors.text },
  outline: { bg: 'transparent', fg: colors.text, border: colors.borderStrong },
  ghost: { bg: 'transparent', fg: colors.brandText },
  soft: { bg: colors.brandSoft, fg: colors.brandText },
  danger: { bg: colors.live, fg: colors.onBrand },
} as const;

export type ButtonVariant = keyof typeof buttonTone;

/**
 * 게이지 채움색 - **여기를 통해서만 고른다.**
 *
 * `Gauge` 의 `tone` 이 `string` 이라 화면이 `colors.brand` 같은 원시 값을 직접
 * 넘기고 있었다. 토큰 체계 밖으로 새는 구멍이라, 새 토큰을 만들어도 화면이 우회한다.
 * 타입으로 막으면 벗어날 때 컴파일이 멈춘다.
 */
export const gaugeFill = {
  brand: colors.brand,
  neutral: colors.neutralFill,
  good: colors.win,
  warn: colors.warn,
  bad: colors.live,
} as const;

export type GaugeTone = keyof typeof gaugeFill;

/**
 * 상태.
 *
 * `disabled` 와 `loading` 을 받는 컴포넌트가 하나도 없었다. 눌림만 있고
 * **'지금은 누를 수 없다'와 '기다리는 중이다'를 말할 방법이 없었다.**
 */
export const states = {
  pressed: { opacity: 0.6 },
  /** Material 의 disabled 불투명도. 0.5 는 아직 눌릴 것처럼 보인다 */
  disabled: { opacity: 0.38 },
};

/**
 * 로딩 자리표시자. 지면(surface)보다 어두워야 '비어 있음'이 아니라 '오는 중'으로 읽힌다.
 * 이것도 GROUND_HUE 다 - 부팅 순간에만 파란 회색이 튀면 그 한 장이 남의 앱처럼 보인다.
 */
export const skeleton = {
  base: '#ECE5E3',
  sheen: '#F5EEEC',
};

/** 눌리는 동안 가라앉는 표시 */
export const pressHighlight = states.pressed;

/**
 * 한글 제목의 줄바꿈을 단어 단위로.
 *
 * 웹은 CJK 를 글자 단위로 꺾어서 "유니폼"이 "유니/폼"으로 갈라진다.
 * RN 타입에는 없는 웹 속성이라 웹에서만 얹는다.
 */
export const keepAll =
  Platform.OS === 'web' ? ({ wordBreak: 'keep-all' } as unknown as TextStyle) : ({} as TextStyle);

/** 숫자 자형 폭을 고정한다. 값마다 폭이 다르면 타일 행이 미세하게 기울어 보인다 */
export const tabularFigures = { fontVariant: ['tabular-nums'] } as TextStyle;

export const screenW = Dimensions.get('window').width;

export const statusBarH = Platform.select({
  android: StatusBar.currentHeight ?? 24,
  ios: 47,
  default: 0,
}) as number;

/**
 * 하단 탭 - 화면 가장자리에 붙은 바가 아니라 **떠 있는 캡슐**이다.
 *
 * 붙은 바는 화면을 위아래로 자르지만, 떠 있는 캡슐은 콘텐츠가 그 아래로 계속 흐르는
 * 것처럼 읽힌다. 선택 표시도 색이 아니라 흰 버블이라 색을 하나 더 쓰지 않아도 된다.
 */
export const tabCapsule = {
  offset: 12, // 화면 하단에서 띄우는 거리
  pad: 6, // 캡슐 내부 패딩 (선택 버블과 캡슐 벽 사이)
  /**
   * 아이콘(22) + 사이(3) + 라벨(14) 이 들어가고 위아래로 숨 쉴 자리까지.
   *
   * 글자만 있던 시절에는 56 이었다. 픽토그램이 위에 얹히면서 한 칸이 세로로 두 층이
   * 되었으므로 그만큼만 키운다 - 손가락 최소 터치(44)는 진작 넘겨 있었고, 여기서
   * 더 키우면 캡슐이 '떠 있는 칩'이 아니라 '바닥에 깔린 바'로 보인다.
   */
  height: spacing.touchMin + 22,
};

/** 떠 있는 탭이 가려 두는 세로 구간 - 스크롤 하단 여백이 여기서 나온다 */
export const tabClearance = tabCapsule.offset + tabCapsule.height + spacing.lg;
