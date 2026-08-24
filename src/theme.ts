// 구단 앱 디자인 토큰 - 한화 이글스
//
// ── 방향 전환 (2026-08-11, 1차 디자인 리뷰) ──────────────────
// 처음에는 다크 네이비 위에 오렌지가 발광하는 톤으로 잡았다. 구단 앱의 성격(팬덤 미디어)에는
// 맞았지만 **읽는 화면으로는 실패했다.** 심화 스탯·확률 근거처럼 글자가 많은 화면에서
// 어두운 면은 대비를 벌기 어렵고, 오렌지가 넓게 쓰이면 그 자체가 소음이 되어
// 정작 봐야 할 수치가 묻힌다.
//
// **그래서 뒤집는다. 흰 바탕이 기본이고, 구단 색은 보조다.**
// 기존 KBO 앱(kbo_poc)이 확립한 iOS 그룹 리스트 문법을 그대로 따른다.
//   #F2F2F7 배경 + 흰 카드 + 작은 회색 섹션 머리글 / 모서리 24·14·999 / 평평한 카드
//
// 구단 앱임을 드러내는 것은 **면적이 아니라 자리**다. 오렌지는 브랜드 마크·선택 상태·
// 핵심 수치·게이지에만 놓고, 본문과 카드는 무채색이 가져간다. 같은 규칙을 KBO 앱은
// 네이비로, 이 앱은 오렌지로 쓰는 것이라 두 앱은 여전히 한눈에 구분된다.
import { Dimensions, Platform, StatusBar, TextStyle } from 'react-native';

/**
 * 구단 색 - Hanwha Eagles Orange (2024-11-12 새 엠블럼).
 *
 * ⚠ **이 값은 면으로만 쓴다.** 흰 바탕 위 글자로 쓰면 3.4:1 이라 본문 대비에 못 미친다.
 * 오렌지를 글자로 써야 하는 자리에는 아래 `brandText`(5.2:1)를 쓴다.
 * 반대로 오렌지 면 위의 글자는 흰색을 쓰되 **14pt 굵게 이상**일 때만 허용된다
 * (큰 글자 기준 3:1 을 3.4:1 로 넘긴다). 작은 라벨을 오렌지 면에 얹지 않는다.
 */
const eaglesOrange = '#FC4E00';

/** 오렌지를 글자로 쓸 때의 값. 흰 바탕 5.2:1 로 본문 대비를 넘긴다 */
const eaglesOrangeText = '#C63A00';

/** Thunderstorm Navy - 새 엠블럼의 바탕색. 브랜드 마크와 어두운 헤더에만 */
const stormNavy = '#07111F';

export const colors = {
  // ── 지면 ─────────────────────────────────────────────────────
  bg: '#F2F2F7', // 페이지 배경 - iOS systemGroupedBackground
  card: '#FFFFFF', // 카드 면
  surface: '#F4F5F7', // 카드 안의 한 단계 낮은 면 (타일·게이지 트랙·보조 버튼)
  raised: '#E9EBF0', // 눌린 상태·선택되지 않은 세그먼트

  // ── 구단 색 ──────────────────────────────────────────────────
  brand: eaglesOrange, // 면 전용 - 선택 상태·게이지 채움·주요 버튼
  brandText: eaglesOrangeText, // 글자 전용 - 핵심 수치·강조 링크 (5.2:1)
  brandSoft: '#FFEDE5', // 틴트 배지 바탕 (brandText 를 얹어 4.6:1)
  navy: stormNavy, // 브랜드 마크·어두운 헤더
  onBrand: '#FFFFFF', // 오렌지 면 위 글자 - 14pt 굵게 이상에서만
  onNavy: '#FFFFFF', // 네이비 면 위 글자 (18.9:1)

  // ── 텍스트 3단 ───────────────────────────────────────────────
  // 흰 카드 위에서 세 단계 모두 AA(4.5:1)를 넘는다
  text: '#16181D', // 1단: 제목·핵심 수치 (17.7:1)
  subText: '#5B6270', // 2단: 본문·라벨 (6.1:1)
  mutedText: '#6E7581', // 3단: 캡션·크레딧 (4.6:1)

  // ── 구분·비활성 ──────────────────────────────────────────────
  border: '#E8EAEE', // 카드 내부 행 구분선
  // 게이지 **트랙**. 채움이 중립색일 때도 구분되도록 채움보다 확실히 밝아야 한다
  // (처음에 트랙과 중립 채움을 같은 회색으로 뒀더니 막대가 통째로 사라졌다)
  dim: '#E2E5EA',
  /** 게이지 채움이 브랜드색이 아닐 때 - 트랙 위에서 3.2:1 로 구분된다 */
  neutralFill: '#98A0AB',

  // ── 상태색 ───────────────────────────────────────────────────
  // 구단 색이 오렌지라 LIVE 를 빨강으로 두면 붙었을 때 탁해진다.
  // 그래서 LIVE 는 채운 빨강이 아니라 틴트 배지로만 쓴다 (kbo_poc 과 같은 처리)
  live: '#D00F31', // 진행 중 (흰 바탕 6.4:1)
  liveSoft: '#FBE9ED',
  win: '#1F7A4D', // 승 (흰 바탕 5.1:1)
  winSoft: '#E8F3ED',
  lose: '#8A9099',
  scheduled: '#6E7581',
  final: '#8A9099',

  // ── 경고 ─────────────────────────────────────────────────────
  // '임박' 류. brand 를 쓰면 선택 상태(칩)와 같은 옷이 되어 경고가 안 읽힌다
  warn: '#8A6416', // 흰 바탕 5.9:1
  warnSoft: '#F6EEDC',

  // ── 스탯 신뢰도 ──────────────────────────────────────────────
  // 심화 지표는 표본이 적으면 믿으면 안 되는 값이다. 그 사실을 색으로도 말한다
  trustHigh: '#1F7A4D',
  trustMid: '#8A6416',
  trustLow: '#8A9099',
};

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
 * ⚠ **섹션 머리글이 이 파일에서 가장 중요한 토큰이다.** 초판은 섹션 제목을 18pt 굵은
 * 검정으로 뒀는데, 그러면 화면을 내릴 때마다 굵은 제목이 연달아 나와 **화면 전체가
 * 제목 대결**이 된다. 그 균일한 반복이 곧 "만들다 만 화면"처럼 보이는 원인이다.
 *
 * 머리글은 물러나야 흰 카드(그룹)가 시각 단위로 읽힌다. iOS 그룹 리스트가 머리글을
 * 작은 회색으로 두는 이유가 그것이고, 기존 KBO 앱도 같은 판단을 했다.
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

  /** 카드 안 제목 - 여기가 화면에서 가장 굵은 글자다 */
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
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

  caption: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    color: colors.mutedText,
  } as TextStyle,

  micro: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    color: colors.mutedText,
  } as TextStyle,

  /** 스탯 타일의 값 */
  metric: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.7,
    lineHeight: 30,
    color: colors.text,
  } as TextStyle,
};

/**
 * 한글 제목의 줄바꿈을 단어 단위로.
 *
 * 웹은 CJK 를 글자 단위로 꺾어서 "유니폼"이 "유니/폼"으로 갈라진다. 제목이 음절
 * 중간에서 꺾이는 것이 "덜 만든 화면"으로 읽히는 미세하지만 확실한 신호다.
 * RN 타입에는 없는 웹 속성이라 웹에서만 얹는다.
 */
export const keepAll =
  Platform.OS === 'web' ? ({ wordBreak: 'keep-all' } as unknown as TextStyle) : ({} as TextStyle);

/** 숫자 자형 폭을 고정한다. 값마다 폭이 다르면 타일 행이 미세하게 기울어 보인다 */
export const tabularFigures = { fontVariant: ['tabular-nums'] } as TextStyle;

/** 눌리는 동안 가라앉는 표시 */
export const pressHighlight = { opacity: 0.6 };

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
  height: spacing.touchMin + 12,
};

/** 떠 있는 탭이 가려 두는 세로 구간 - 스크롤 하단 여백이 여기서 나온다 */
export const tabClearance = tabCapsule.offset + tabCapsule.height + spacing.lg;
