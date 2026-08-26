// 공용 컴포넌트 - 화면이 View·Text 를 직접 조합하지 않고 여기의 조각만 쓴다.
//
// ── 문법: iOS 그룹 리스트 ────────────────────────────────────
// 기존 KBO 앱이 확립한 규칙을 그대로 따른다.
//   작은 회색 머리글 + 흰 카드(그룹) + 그룹 안에서 행을 구분선으로 나눔
//
// 초판이 어긋났던 지점 둘:
//   ① **머리글이 18pt 굵은 검정**이라 화면을 내릴 때마다 제목이 대결했다.
//      머리글은 물러나야 카드가 시각 단위로 읽힌다
//   ② **목록의 항목마다 카드를 하나씩 띄웠다.** 같은 라운드·같은 패딩의 흰 상자가
//      끝없이 반복되면 어디가 묶음이고 어디가 낱개인지 구분이 사라진다.
//      묶이는 것은 카드 하나 안의 행으로 넣는다
import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import {
  keepAll,
  colors,
  control,
  buttonTone,
  categoryColor,
  gaugeFill,
  pressHighlight,
  radius,
  skeleton,
  spacing,
  states,
  tabularFigures,
  typography,
} from '../theme';
import type { ButtonVariant, ControlSize, GaugeTone } from '../theme';
import { Switch } from './Switch';

/** 평평한 흰 카드. 그림자·테두리 없이 페이지 배경과의 대비만으로 구분한다 */
export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  const inner = <View style={[s.card, style]}>{children}</View>;
  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => (pressed ? pressHighlight : undefined)}>
      {inner}
    </Pressable>
  );
}

/** 여백 없는 카드 - 행 그룹을 담을 때. 구분선이 카드 끝까지 닿아야 한다 */
export function GroupCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[s.groupCard, style]}>{children}</View>;
}

/**
 * 섹션 머리글 - 작은 회색.
 *
 * 여기가 굵어지면 화면 전체가 제목 대결이 된다. 굵은 글자는 카드 **안**에서만 쓴다.
 */
export function SectionTitle({
  title,
  right,
  presenter,
}: {
  title: string;
  right?: ReactNode;
  presenter?: string;
}) {
  return (
    <View style={s.sectionWrap}>
      <View style={s.sectionRow}>
        <View style={s.sectionTitleWrap}>
          <Text style={s.sectionTitle}>{title}</Text>
          {presenter ? <Text style={s.presenter}>presented by {presenter}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

/**
 * 제목을 **카드 안에 들인** 섹션.
 *
 * ── 왜 만들었나 ─────────────────────────────────────────────
 * `SectionTitle` 은 머리글을 카드 **밖에** 띄운다(iOS 그룹 리스트 문법). 그런데 화면이
 * 길어지자 문제가 드러났다 - 머리글이 어느 카드의 것인지 눈으로 이어지지 않고,
 * 모든 섹션이 같은 회색 · 같은 흰 카드라 **어디서 끊기는지 알 수 없다.**
 *
 * 2026-08-11 에 머리글을 작은 회색으로 물린 결정은 그대로 옳다 - 굵은 제목이 연달아
 * 서면 화면이 제목 대결이 된다. 그래서 **굵기를 올려 구분하지 않는다.**
 * 대신 제목을 카드 안으로 들여 **카드 경계가 곧 섹션 경계**가 되게 한다.
 * 글자 크기는 그대로 두고 소속만 바꾸는 것이라 제목 대결이 다시 생기지 않는다.
 *
 * ── 언제 쓰나 ───────────────────────────────────────────────
 * **묶음**에 쓴다 - 여러 항목이 한 주제로 묶이고 그 주제가 위아래와 독립적일 때
 * (알림 설정, 프로필, 나의 직관, 팀 성적).
 *
 * **흐름에는 쓰지 않는다** - 문자중계처럼 위아래로 이어 읽는 지면이나, 히어로 바로
 * 아래의 핵심 카드는 테두리로 가두면 답답해진다. 그런 자리는 `SectionTitle` 이 맞다.
 */
export function SectionCard({
  title,
  right,
  presenter,
  padded,
  children,
  style,
  fold,
}: {
  title: string;
  right?: ReactNode;
  presenter?: string;
  /** 행(`Row`) 목록이 아니라 자유 콘텐츠를 담을 때. 좌우 여백을 준다 */
  padded?: boolean;
  children: ReactNode;
  style?: ViewStyle;
  /**
   * 눌러서 여는 카드로 만든다. `'closed'` 면 접힌 채로 시작한다.
   *
   * 카드가 스스로 접힘 상태를 갖는다 - 쓰는 쪽에 useState 를 하나씩 두면 화면마다
   * 여닫는 규칙이 조금씩 달라지고, 그 차이가 **뜻으로 읽힌다.**
   */
  fold?: 'open' | 'closed';
}) {
  const [open, setOpen] = useState(fold !== 'closed');
  const shown = fold === undefined || open;

  const head = (
    <View style={s.sectionCardHead}>
      <View style={s.sectionTitleWrap}>
        <Text style={s.sectionTitle}>{title}</Text>
        {presenter ? <Text style={s.presenter}>presented by {presenter}</Text> : null}
      </View>
      {right}
      {/* 꺾쇠는 오른쪽 끝이다. right 앞에 두면 값과 손잡이가 뒤섞여 무엇을 누르는
          것인지 흐려진다 */}
      {fold ? <Text style={s.foldCaret}>{open ? '⌃' : '⌄'}</Text> : null}
    </View>
  );

  return (
    <View style={[s.sectionCard, style]}>
      {fold ? (
        <Pressable
          onPress={() => setOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${title} ${open ? '접기' : '펼치기'}`}
          style={({ pressed }) => (pressed ? states.pressed : undefined)}
        >
          {head}
        </Pressable>
      ) : (
        head
      )}
      {shown ? <View style={padded ? s.sectionCardBody : undefined}>{children}</View> : null}
    </View>
  );
}

/** 카드 안 제목 - 작은 라벨 + 굵은 제목의 2단. 화면에서 가장 굵은 글자가 여기다 */
export function CardHeading({
  label,
  title,
  right,
}: {
  label?: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <View style={s.headingRow}>
      <View style={{ flex: 1 }}>
        {label ? <Text style={s.headingLabel}>{label}</Text> : null}
        <Text style={[s.headingTitle, keepAll]}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

/** 그룹 안의 한 행. 마지막 행이 아니면 아래에 구분선이 붙는다 */
export function Row({
  children,
  last,
  onPress,
  style,
}: {
  children: ReactNode;
  last?: boolean;
  onPress?: () => void;
  /**
   * ⚠ `ViewStyle` 이 아니라 `StyleProp<ViewStyle>` 이다.
   *
   * 행에 **상태를 얹는 자리**(선택된 경기, 지난 경기)가 생기면서 `[base, on && onStyle]`
   * 배열을 넘겨야 하는데, 좁은 타입은 그걸 막는다. 호출부가 스프레드로 우회하기 시작하면
   * StyleSheet 가 등록한 스타일이 익명 객체로 풀려 매 렌더 새 객체가 된다.
   */
  style?: StyleProp<ViewStyle>;
}) {
  const inner = <View style={[s.row, !last && s.rowDivider, style]}>{children}</View>;
  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => (pressed ? pressHighlight : undefined)}>
      {inner}
    </Pressable>
  );
}

/** 라벨 - 값 형태의 단순 행 */
export function KeyValueRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <Row last={last}>
      <Text style={s.kvLabel}>{label}</Text>
      <Text style={s.kvValue}>{value}</Text>
    </Row>
  );
}

/** 작은 회색 라벨 - 카드 안 구역 제목 */
export function Label({ children }: { children: ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}

/**
 * 세그먼트 컨트롤 - 서로 배타적인 모드를 고르는 자리.
 *
 * 캡슐 칩 행과 다르다. 칩은 개별 토글처럼 보이지만 세그먼트는 하나의 트랙 안에서
 * 하나만 켜지는 것이 형태로 드러난다. 지식 수준처럼 '지금 어느 모드인가'를 말하는
 * 컨트롤은 세그먼트여야 한다.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (k: T) => void;
}) {
  return (
    <View style={s.segTrack}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={({ pressed }) => [
              s.segItem,
              on && s.segItemOn,
              pressed && !on && pressHighlight,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text style={[s.segLabel, on && s.segLabelOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 트랙 안쪽 여백 - HeroUI `.tabs__list--variant-primary` 의 padding: 3px */
const TOP_TAB_PAD = 3;
/** 한 칸의 높이. 여백까지 더하면 44 라 손가락 최소 터치와 정확히 맞는다 */
const TOP_TAB_H = spacing.touchMin - TOP_TAB_PAD * 2;

/**
 * 알약이 앉는 방식 - 떠 있는 하단 탭 캡슐과 같은 물리값을 쓴다.
 * 위아래 두 탭이 서로 다른 속도로 움직이면 같은 제품의 부품으로 안 읽힌다.
 */
const TOP_TAB_SPRING = {
  useNativeDriver: Platform.OS !== 'web',
  stiffness: 210,
  damping: 24,
  mass: 1,
  restDisplacementThreshold: 0.2,
  restSpeedThreshold: 0.2,
};

/**
 * 상단 서브탭 - HeroUI Tabs 의 `primary` 변형 + `Tabs.Separator`.
 *
 * ── 왜 밑줄을 버렸나 (2026-08-26) ────────────────────────────
 * 초판은 텍스트 + 밑줄이었다. 웹 문서의 탭 문법이라, **떠 있는 캡슐(하단 탭)과 흰 카드로
 * 짜인 이 앱 안에서 그 줄만 홀로 각져 있었다.** 게다가 밑줄을 화면 끝까지 그으려면 지면
 * 폭을 가로지르는 흰 띠가 필요했고, 브랜드 바 바로 아래에 그 띠가 붙으니 헤더가 두 겹으로
 * 보였다 - 크롬이 어디서 끝나는지가 흐려진다.
 *
 * 지금은 트랙 하나 안에서 흰 알약이 미끄러진다. 하단 탭과 같은 어법이라 화면 위아래가
 * 같은 말을 하고, 띠가 사라지니 브랜드 바의 헤어라인 하나가 다시 크롬의 끝이 된다.
 *
 * ── HeroUI 에서 그대로 가져온 값 ────────────────────────────
 * (heroui-native `src/styles/components/tabs.css`)
 *   - 트랙: 안쪽 여백 3px · 큰 라운드 · muted 면(`--color-default`)
 *   - 인디케이터: 흰 면(`--color-segment`) + 아주 옅은 그림자. **위치만** 애니메이션한다
 *   - 구분선: 폭 1px · 높이 60% · 세로 가운데. 선택된 칸에 닿는 순간 사라진다
 *
 * 구분선이 사라지는 것이 이 변형의 핵심이다. 알약의 둥근 옆면을 직선이 찌르면 두 형태가
 * 서로를 자르는 것처럼 보인다. HeroUI 도 같은 이유로 `betweenValues` 를 두고 opacity 만
 * 애니메이션한다.
 *
 * ⚠ 구분선 색은 HeroUI 가 `--color-separator` 의 30% 를 쓰지만 여기서는 `borderStrong`
 * 을 그대로 쓴다. 알파를 섞으면 뒤에 깔린 따뜻한 회색과 hue 가 어긋난 1px 짜리 파란 선이
 * 남는다 - 이 저장소의 회색은 전부 구단 오렌지 쪽으로 기울어 있다(theme.ts 참고).
 */
export function TopTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  value: T;
  onChange: (k: T) => void;
}) {
  const found = tabs.findIndex((t) => t.key === value);
  const index = found < 0 ? 0 : found;

  // 트랙 안쪽 폭을 재야 한 칸(slot)이 몇 px 인지 안다. 재기 전에는 알약을 그리지 않는다
  const [innerW, setInnerW] = useState(0);
  const slot = innerW > 0 ? innerW / tabs.length : 0;

  /** 알약의 가로 위치. 이 값 하나가 위치·라벨 진하기·구분선 유무를 전부 만든다 */
  const [x] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (slot > 0) Animated.spring(x, { ...TOP_TAB_SPRING, toValue: index * slot }).start();
  }, [index, slot, x]);

  return (
    <View
      style={s.topTabs}
      onLayout={(e) => setInnerW(e.nativeEvent.layout.width - TOP_TAB_PAD * 2)}
      accessibilityRole="tablist"
    >
      {slot > 0 ? (
        <Animated.View style={[s.topTabPill, { width: slot, transform: [{ translateX: x }] }]} />
      ) : null}

      {/* 구분선은 칸과 칸 사이에만 선다 - 첫 칸 앞에는 없다.
          HeroUI 도 첫 Tab 에서만 Separator 를 뺀다 */}
      {slot > 0
        ? tabs.slice(1).map((t, i) => {
            const at = (i + 1) * slot;
            return (
              <Animated.View
                key={t.key}
                style={[
                  s.topTabSep,
                  {
                    left: TOP_TAB_PAD + at - 0.5,
                    // 알약이 이 선의 양옆 어느 칸에 걸쳐 있는 동안은 0 이다.
                    // 툭 꺼지지 않고 알약이 다가오는 만큼 옅어진다
                    opacity: x.interpolate({
                      inputRange: [at - 2 * slot, at - slot, at, at + slot],
                      outputRange: [1, 0, 0, 1],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
            );
          })
        : null}

      {tabs.map((t, i) => {
        // 알약이 이 칸에 얼마나 걸쳐 있는지(0~1). 글자색은 애니메이션할 수 없으니
        // 같은 라벨 두 벌을 겹쳐 두고 서로 교차시킨다 - 하단 탭과 같은 수법이다
        const span = slot > 0 ? [(i - 1) * slot, i * slot, (i + 1) * slot] : null;
        const onAlpha = span
          ? x.interpolate({ inputRange: span, outputRange: [0, 1, 0], extrapolate: 'clamp' })
          : i === index
            ? 1
            : 0;
        const offAlpha = span
          ? x.interpolate({ inputRange: span, outputRange: [1, 0, 1], extrapolate: 'clamp' })
          : i === index
            ? 0
            : 1;

        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={s.topTab}
            accessibilityRole="tab"
            accessibilityState={{ selected: i === index }}
            aria-selected={i === index}
          >
            <Animated.Text style={[s.topTabText, { opacity: offAlpha }]} numberOfLines={1}>
              {t.label}
            </Animated.Text>
            <Animated.Text
              style={[s.topTabText, s.topTabTextOn, s.topTabTextOver, { opacity: onAlpha }]}
              numberOfLines={1}
            >
              {t.label}
            </Animated.Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 필터 칩 - 무엇을 걸러 볼지 고르는 자리에만 */
export function Chip({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected?: boolean;
  /**
   * 고를 수 **없는** 선택지. 품절 사이즈처럼 목록에서 지우면 안 되는 것에 쓴다 -
   * 사라지면 팬은 그 사이즈가 원래 없는 줄 알고, 남아 있으면 품절임을 안다.
   */
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.chip,
        selected && !disabled && s.chipOn,
        disabled && states.disabled,
        pressed && !selected && !disabled && pressHighlight,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
    >
      <Text style={[s.chipText, selected && !disabled && s.chipTextOn, disabled && s.chipTextOff]}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * 상태 배지 - 틴트만. 채운 색 블록은 쓰지 않는다.
 *
 * ⚠ **한 카드에 배지는 하나까지.** 배지가 줄줄이 붙으면 그 줄이 콘텐츠보다 강해져
 * 카드가 무슨 카드인지보다 배지 색깔이 먼저 읽힌다.
 */
export function Badge({
  text,
  tone = 'brand',
}: {
  text: string;
  tone?: 'brand' | 'live' | 'muted' | 'win' | 'warn';
}) {
  const fg = {
    brand: colors.brandText,
    live: colors.live,
    muted: colors.subText,
    win: colors.win,
    warn: colors.warn,
  }[tone];
  return (
    <View style={s.badge}>
      <View style={[s.badgeDot, { backgroundColor: fg }]} />
      <Text style={[s.badgeText, { color: fg }]}>{text}</Text>
    </View>
  );
}

/** 수치 타일 - 가로로 최대 3개. 네 개를 두면 값이 두 줄로 접힌다 */
export function StatTile({
  label,
  value,
  sub,
  tone,
  category,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'brand' | 'plain';
  /**
   * SplitBar 와 짝을 이룰 때. 라벨 앞에 같은 구간 색 막대가 붙어 **타일과 막대가
   * 같은 것을 가리킨다**는 사실이 색으로 이어진다. Gauge 와 같이 순번만 받는다
   */
  category?: number;
}) {
  return (
    <View style={s.tile}>
      <View style={s.tileHead}>
        {category !== undefined ? (
          <View style={[s.tileAccent, { backgroundColor: categoryColor(category) }]} />
        ) : null}
        <Text style={[s.tileLabel, { flex: 1 }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      {/* 값은 한 줄로 붙든다. 타일 셋이 나란히 선 자리라 폭이 화면의 1/3 인데,
          `.412` 같은 값은 괜찮아도 `0.941` · `54-53` 처럼 길어지면 두 줄로 접히면서
          **셋의 높이가 어긋난다.** 접히게 두느니 글자를 조금 줄이는 쪽이 낫다 */}
      <Text
        style={[s.tileValue, tone === 'brand' && { color: colors.brandText }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Text>
      {sub ? <Text style={s.tileSub}>{sub}</Text> : null}
    </View>
  );
}

/** 가로 게이지 - 평균 눈금을 같이 그려 숫자를 몰라도 위치가 읽히게 한다 */
export function Gauge({
  position,
  markerAt,
  tone = 'brand',
  category,
}: {
  position: number;
  markerAt?: number;
  /**
   * 색은 여기서만 고른다. 전에는 `string` 이라 화면이 `colors.brand` 같은 원시 값을
   * 직접 넘겼고, 그러면 토큰을 새로 만들어도 화면이 그냥 우회한다.
   */
  tone?: GaugeTone;
  /**
   * 구종처럼 **의미 없이 구별만 되면 되는** 항목일 때 몇 번째인지만 넘긴다.
   * 색을 직접 고르지 않으므로 여섯 번째가 '기타'로 접히는 규칙이 저절로 지켜진다.
   */
  category?: number;
}) {
  const pct = Math.min(1, Math.max(0, position));
  const fill = category === undefined ? gaugeFill[tone] : categoryColor(category);
  return (
    <View style={s.gaugeTrack}>
      <View style={[s.gaugeFill, { width: `${pct * 100}%`, backgroundColor: fill }]} />
      {markerAt !== undefined ? (
        <View style={[s.gaugeMarker, { left: `${Math.min(99, markerAt * 100)}%` }]} />
      ) : null}
    </View>
  );
}

/** 구간 게이지의 한 구간. `to` 는 구간의 오른쪽 끝(0~1)이고 마지막은 1 이어야 한다 */
export type Band = { to: number; label: string; tone?: GaugeTone };

/**
 * 구간 게이지 - 값이 **어느 구간에 있는지**를 말한다.
 *
 * 평범한 게이지는 막대 길이로 크기만 말한다. 그런데 심화 지표는 크기 자체보다
 * **정상 범위 안인지 밖인지**가 곧 정보다. BABIP .342 를 막대로만 그리면 높은 건지
 * 낮은 건지 아무 말도 못 하지만, 리그 평균 구간을 함께 그리면 그림만으로 읽힌다.
 *
 * 값이 든 구간만 색이 차고 나머지는 트랙 색으로 남는다. 그 구간의 라벨만 칩이 된다.
 */
export function RangeGauge({ value, bands }: { value: number; bands: Band[] }) {
  const v = Math.min(1, Math.max(0, value));
  const here = Math.max(
    0,
    bands.findIndex((b) => v <= b.to),
  );

  // 구간 폭 = 자기 끝 - 앞 구간의 끝. 0 이면 flex 가 사라지므로 최소치를 준다
  const seg = bands.map((b, i) => Math.max(0.001, b.to - (i === 0 ? 0 : bands[i - 1].to)));

  return (
    <View style={{ gap: 5 }}>
      <View style={s.bandTrack}>
        {bands.map((b, i) => (
          <View
            key={b.label}
            style={[
              s.band,
              { flex: seg[i] },
              i === here && { backgroundColor: gaugeFill[b.tone ?? 'neutral'] },
            ]}
          />
        ))}
      </View>
      <View style={s.bandLabels}>
        {bands.map((b, i) => (
          <View key={b.label} style={{ flex: seg[i], alignItems: 'center' }}>
            <Text style={[s.bandLabel, i === here && s.bandLabelOn]} numberOfLines={1}>
              {b.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * `**강조**` 를 굵은 글씨로.
 *
 * 해설 문장에서 강조는 장식이 아니라 정보다. 다만 별표를 화면에 그대로 내보낼 수는 없다.
 */
export function RichText({ text, style }: { text: string; style?: TextStyle }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((p) => p.length > 0);
  return (
    <Text style={style}>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <Text key={i} style={s.strong}>
            {p.slice(2, -2)}
          </Text>
        ) : (
          <Text key={i}>{p}</Text>
        ),
      )}
    </Text>
  );
}

/** 근거 목록 - 번호가 아니라 구분선으로 나눈다. 번호 뱃지가 줄줄이 서면 그것부터 읽힌다 */
export function ReasonList({ reasons }: { reasons: string[] }) {
  return (
    <View>
      {reasons.map((r, i) => (
        <View key={i} style={[s.reasonRow, i < reasons.length - 1 && s.rowDivider]}>
          <RichText text={r} style={s.reasonText} />
        </View>
      ))}
    </View>
  );
}

/** 앱 밖으로 나가는 버튼. 보조 설명은 면 위가 아니라 아래에 둔다(대비) */
export function ExternalButton({
  label,
  sub,
  onPress,
}: {
  label: string;
  sub?: string;
  onPress: () => void;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [s.extBtn, pressed && pressHighlight]}
        accessibilityRole="link"
      >
        <Text style={s.extLabel}>{label}</Text>
        <Text style={s.extArrow}>›</Text>
      </Pressable>
      {sub ? <Text style={s.extSub}>{sub}</Text> : null}
    </View>
  );
}

/**
 * 버튼 - variant × size 두 축.
 *
 * 전에는 `ExternalButton`(앱 밖으로 나가는 링크)과 `SecondaryButton`(회색 보조) 둘뿐이라
 * **가장 중요한 행동을 담을 자리가 없었다.** 그래서 그 자리를 카드 전체 터치가 대신
 * 메우고 있었는데, 그러면 무엇이 일어나는지 눌러 봐야 안다. 버튼은 자기 할 일을 글자로 말한다.
 *
 * 크기는 `control` 에서 온다. md 가 44 인 것은 손가락 최소 터치 기준이다.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  full,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ControlSize;
  disabled?: boolean;
  /** 카드 폭을 꽉 채운다 - 화면의 주된 행동일 때 */
  full?: boolean;
}) {
  const tone = buttonTone[variant];
  const dim = control[size];
  const border = 'border' in tone ? tone.border : undefined;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        s.btn,
        {
          height: dim.height,
          paddingHorizontal: dim.padX,
          backgroundColor: tone.bg,
          alignSelf: full ? 'stretch' : 'flex-start',
        },
        border ? { borderWidth: 1, borderColor: border } : null,
        pressed && !disabled && pressHighlight,
        disabled && states.disabled,
      ]}
    >
      <Text style={[s.btnLabel, { fontSize: dim.fontSize, color: tone.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** 보조 버튼 - 회색 면, 테두리 없음. 화면들이 쓰던 이름이라 남겨 둔다 */
export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Button label={label} onPress={onPress} variant="secondary" full />;
}

/**
 * 로딩 자리표시자.
 *
 * 전에는 프로필을 읽는 동안 **빈 화면**이 떴다. 빈 화면은 '오는 중'이 아니라
 * '아무것도 없음'으로 읽혀서, 앱이 죽은 것처럼 보인다.
 */
export function Skeleton({
  w,
  h = 12,
  style,
}: {
  /** 숫자면 px, 문자열이면 '60%' 같은 비율 */
  w?: number | `${number}%`;
  h?: number;
  style?: ViewStyle;
}) {
  return <View style={[s.skeleton, { width: w ?? '100%', height: h }, style]} />;
}

/** 카드 한 장 분량의 자리표시자 - 부팅·목록 로딩에 쓴다 */
export function SkeletonCard() {
  return (
    <Card>
      <Skeleton w="38%" h={11} />
      <Skeleton w="74%" h={17} />
      <Skeleton w="56%" h={11} />
    </Card>
  );
}

/**
 * 상세 시트 - 목록에서 항목을 눌렀을 때 올라오는 화면.
 *
 * 목록만 있는 앱과 상세가 있는 앱은 다른 물건이다. 목록은 "무엇이 있는지"까지만 말하고,
 * **결정에 필요한 것(가격·시간·연락처·규정)은 전부 상세에 있다.** 상세 없이 목록에
 * 모든 정보를 우겨넣으면 목록이 훑어지지 않고, 정보를 덜어내면 목록에서 결정을 못 한다.
 *
 * 하단에 액션 바를 고정한다 - 상세를 끝까지 읽지 않아도 행동할 수 있어야 한다.
 */
/** 시트가 닫힌 자리 - 재기 전에는 화면 높이만큼 아래에 둔다 */
const SHEET_FALLBACK_H = Dimensions.get('window').height;

/** 이만큼 끌어내리면 놓는 순간 닫힌다 (시트 높이 대비) */
const SHEET_DISMISS_RATIO = 0.25;
/** 조금만 끌었어도 이 속도로 튕기면 닫는다 (px/ms) */
const SHEET_FLING = 0.5;

const SHEET_SPRING = {
  useNativeDriver: Platform.OS !== 'web',
  stiffness: 220,
  damping: 26,
  mass: 1,
  restDisplacementThreshold: 0.4,
  restSpeedThreshold: 0.4,
};

export function DetailSheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
  actions,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
}) {
  // 닫는 애니메이션이 끝날 때까지 Modal 을 붙들고 있는다. visible 을 그대로 넘기면
  // 시트가 내려가기도 전에 통째로 사라져 '닫히는 동작'이 아예 안 보인다
  const [mounted, setMounted] = useState(visible);
  const [sheetH, setSheetH] = useState(0);

  /**
   * 시트의 세로 위치 하나가 전부를 만든다 - 0 이 완전히 열린 자리, sheetH 가 닫힌 자리.
   *
   * 손으로 끄는 것과 스프링으로 여닫는 것이 **같은 값**을 움직이므로, 끌던 손을 놓는
   * 순간 이어받는 것이 저절로 된다. 딤의 짙기도 여기서 보간해 만든다.
   */
  const [y] = useState(() => new Animated.Value(SHEET_FALLBACK_H));
  /**
   * ScrollView 가 맨 위에 있는가 - 제스처가 스크롤과 싸우지 않게 하는 판단 재료.
   *
   * 프레임마다 갱신하지 않는다. **맨 위인지 아닌지가 뒤집힐 때만** 상태를 건드리므로
   * 한 번 훑는 동안 재렌더는 많아야 두 번이다
   */
  const [atTop, setAtTop] = useState(true);

  const H = sheetH || SHEET_FALLBACK_H;

  // 열릴 때는 **렌더 중에** 올린다. 이펙트로 미루면 한 프레임 늦어 시트가 한 박자
  // 끊겨 들어오고, setState-in-effect 로 렌더가 한 번 더 돈다. 내릴 때는 반대로
  // 애니메이션이 끝난 뒤에야 내려야 하므로 그건 아래 완료 콜백이 맡는다
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (!mounted) return;
    if (visible) {
      Animated.spring(y, { ...SHEET_SPRING, toValue: 0 }).start();
      return;
    }
    Animated.spring(y, { ...SHEET_SPRING, toValue: H }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [visible, mounted, y, H]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        // 시작에는 양보한다 - 손잡이·닫기 버튼의 눌림이 먼저다
        onStartShouldSetPanResponder: () => false,
        // **아래로**, 세로로, 그리고 스크롤이 맨 위일 때만 가로챈다. 이 셋을 다 걸지
        // 않으면 본문을 위로 훑는 손짓마다 시트가 따라 내려간다
        onMoveShouldSetPanResponder: (_e, g) => g.dy > 6 && g.dy > Math.abs(g.dx) && atTop,
        onPanResponderTerminationRequest: () => false,

        onPanResponderMove: (_e, g) => {
          // 위로는 안 늘어난다 - 시트가 천장을 뚫고 올라갈 자리가 없다
          y.setValue(Math.max(0, g.dy));
        },

        onPanResponderRelease: (_e, g) => {
          const far = g.dy > H * SHEET_DISMISS_RATIO;
          const flung = g.vy > SHEET_FLING;
          if (far || flung) {
            // 닫기로 정했으면 손이 남긴 속도를 그대로 물려 끝까지 내려보낸다.
            // onClose 가 visible 을 내리면 위 useEffect 가 같은 값을 이어 맡는다
            Animated.spring(y, {
              ...SHEET_SPRING,
              toValue: H,
              velocity: g.vy * 1000,
            }).start();
            onClose();
          } else {
            Animated.spring(y, { ...SHEET_SPRING, toValue: 0, velocity: g.vy * 1000 }).start();
          }
        },

        onPanResponderTerminate: () => {
          Animated.spring(y, { ...SHEET_SPRING, toValue: 0 }).start();
        },
      }),
    [y, H, onClose, atTop],
  );

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={s.sheetBackdrop}>
        {/* 시트 바깥의 어두운 면.
            ① **서서히 차오른다.** Modal 의 slide 는 딤까지 통째로 밀어 올려서 어두운
               판이 턱 나타났다. 딤은 밀려 오는 것이 아니라 **짙어지는** 것이다
            ② **누르면 닫힌다.** 시트가 화면을 덮었을 때 덮인 쪽을 누르면 돌아간다는
               것은 배워서 아는 게 아니라 그냥 해보는 동작이다 */}
        <Animated.View
          style={[
            s.sheetDim,
            {
              opacity: y.interpolate({
                inputRange: [0, H],
                outputRange: [1, 0],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <Pressable
            onPress={onClose}
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel="닫기"
          />
        </Animated.View>

        <Animated.View
          style={[s.sheet, { transform: [{ translateY: y }] }]}
          onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}
          {...pan.panHandlers}
        >
          {/* 손잡이는 장식이 아니다. **끌어내리면 시트가 따라오고, 눌러도 닫힌다.**
              막대 자체는 4px 이라 손가락으로 맞출 수 없어서 폭은 시트 전체를 쓰고
              hitSlop 으로 위아래를 넓혀 실제 표적을 30px 남짓으로 만든다 */}
          <Pressable
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 14 }}
            style={({ pressed }) => [s.sheetGrab, pressed && states.pressed]}
            accessibilityRole="button"
            accessibilityLabel="닫기"
          >
            <View style={s.sheetHandle} />
          </Pressable>
          <View style={s.sheetHead}>
            <View style={{ flex: 1 }}>
              {subtitle ? <Text style={s.sheetSub}>{subtitle}</Text> : null}
              <Text style={s.sheetTitle}>{title}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={s.sheetClose}>
              <Text style={s.sheetCloseText}>닫기</Text>
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: spacing.screenX, paddingBottom: spacing.xxl }}
            scrollEventThrottle={16}
            onScroll={(e) => {
              // 맨 위에서 한 번 더 내리려 할 때만 시트가 따라 내려간다.
              // 여백 2px 은 관성 스크롤이 0 을 살짝 넘나드는 것을 흡수한다
              const top = e.nativeEvent.contentOffset.y <= 2;
              if (top !== atTop) setAtTop(top);
            }}
          >
            {children}
          </ScrollView>

          {actions ? <View style={s.sheetActions}>{actions}</View> : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

/** 상세 안의 정보 행 - 라벨과 값 */
export function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.infoRow, !last && s.rowDivider]}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

/**
 * 알림 신청 토글.
 *
 * 이 버튼 하나가 5·6·7번을 "읽는 화면"에서 "쓰는 화면"으로 바꾼다. 발매 소식을 보고
 * 나가면 그 화면은 공지사항이지만, 알림을 걸어 두면 앱이 다시 팬을 부르는 장치가 된다.
 */
export function AlertToggle({
  on,
  onPress,
  label,
  caption,
  compact,
}: {
  on: boolean;
  onPress: () => void;
  label?: string;
  /** 라벨 아래 한 줄 부기 - 이 알림이 언제 오는지. 행 변형에서만 그린다 */
  caption?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [s.alertBtn, on && s.alertBtnOn, pressed && pressHighlight]}
        accessibilityRole="switch"
        accessibilityState={{ checked: on }}
      >
        <Text style={[s.alertLabel, on && s.alertLabelOn]}>
          {on ? '알림 신청됨' : (label ?? '알림 신청')}
        </Text>
      </Pressable>
    );
  }
  return (
    <View style={s.alertRow}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.alertRowLabel}>{label ?? '알림 신청'}</Text>
        {caption ? <Text style={s.alertRowCaption}>{caption}</Text> : null}
      </View>
      {/* 플랫폼이 그리던 스위치를 우리 것으로 바꿨다 - 폰과 웹에서 모양이 갈리던 자리다
          (./Switch 주석 참고). trackColor·thumbColor·activeThumbColor 를 플랫폼별로
          덧대던 것도 같이 사라진다 */}
      <Switch value={on} onValueChange={onPress} accessibilityLabel={label ?? '알림 신청'} />
    </View>
  );
}

export function Divider() {
  return <View style={s.divider} />;
}

/**
 * 물음표 툴팁 - 궁금할 때만 열리는 설명.
 *
 * 지면을 차지하는 설명 섹션을 대신한다. 후원의 집에 "어떤 구조인가 / 운영 원칙"이
 * 통째로 펼쳐져 있었는데, **팬은 협찬금 구조를 궁금해하지 않는다.** 팬의 질문은
 * "우리 동네에 이글스 후원 가게가 있나, 가면 뭘 주나" 하나다.
 *
 * 그렇다고 설명이 필요 없는 건 아니다 - 처음 보는 이름이라 한 번은 물어본다.
 * 그래서 **묻는 사람에게만** 답한다.
 */
export function InfoTip({ title, lines }: { title: string; lines: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`${title} 설명`}
        style={({ pressed }) => [s.tipBtn, pressed && pressHighlight]}
      >
        <Text style={s.tipMark}>?</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        {/* 바깥을 눌러도 닫힌다 - 작은 설명에 닫기 버튼만 두면 갇힌 느낌이 난다 */}
        <Pressable style={s.tipBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={s.tipCard} onPress={() => {}}>
            <Text style={[s.tipTitle, keepAll]}>{title}</Text>
            {lines.map((l, i) => (
              <RichText key={i} text={l} style={s.tipLine} />
            ))}
            <Pressable onPress={() => setOpen(false)} hitSlop={8} style={s.tipClose}>
              <Text style={s.tipCloseText}>닫기</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/**
 * 결정적 순간 - 문자중계 피드 **안에** 끼어드는 스폰서 카드.
 *
 * ── 왜 피드 안인가 ──────────────────────────────────────────
 * 해석을 별도 섹션으로 아래에 두면 "왜 지금 이 말을 하는지"가 붙지 않는다.
 * 중계가 흐르다가 레버리지가 치솟은 그 타석 자리에 끼어들어야, 팬이 방금 읽은 줄과
 * 해석이 이어진다.
 *
 * ── 왜 여기가 광고 자리인가 ─────────────────────────────────
 * 팬덤 앱에서 화면을 가로막는 전면 광고는 구단에 대한 감정까지 깎는다.
 * 지면을 파는 대신 **순간을 판다** - 콘텐츠 자체가 팬에게 가치가 있으므로 방해가 되지
 * 않고, 스폰서에게는 "우리가 이 순간을 후원했다"가 명확해 단가도 그쪽이 높다.
 *
 * 브랜드는 면적이 아니라 자리로만 드러낸다. 로고를 크게 넣지 않고 머리글 한 줄에 둔다.
 */
export function SponsorMoment({
  presenter,
  title,
  body,
  last,
}: {
  presenter: string;
  title: string;
  body: string;
  last?: boolean;
}) {
  return (
    <View style={[s.momentWrap, !last && s.rowDivider]}>
      <View style={s.momentHead}>
        <View style={s.momentDot} />
        <Text style={s.momentKind}>결정적 순간</Text>
        <Text style={s.momentBy}>presented by</Text>
        <Text style={s.momentBrand}>{presenter}</Text>
      </View>
      <Text style={[s.momentTitle, keepAll]}>{title}</Text>
      <RichText text={body} style={s.momentBody} />
    </View>
  );
}

/**
 * 알림 벨 - 상단바 오른쪽.
 *
 * 아이콘 라이브러리를 쓰지 않는 저장소라(RN 코어만) 종 모양을 View 세 개로 그린다.
 * 위는 둥글고 아래는 각진 몸통 + 받침 + 추. 22px 에서 종으로 읽히는 최소 형태다.
 *
 * 안 읽은 알림이 있으면 빨간 점을 얹는다. 숫자는 넣지 않는다 - 팬덤 앱에서 숫자 배지는
 * "밀린 일"처럼 읽혀서, 소식을 반갑게 만드는 목적과 어긋난다.
 */
export function BellButton({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? `알림 ${count}건` : '알림'}
      style={({ pressed }) => [s.bellWrap, pressed && pressHighlight]}
    >
      <View style={s.bellDome} />
      <View style={s.bellSkirt} />
      <View style={s.bellBase} />
      <View style={s.bellClapper} />
      {count > 0 ? <View style={s.bellDot} /> : null}
    </Pressable>
  );
}

/**
 * 틴트 알림 카드 - "지금 이걸 보라"고 말하는 자리.
 *
 * 흰 카드가 줄줄이 선 지면에서 **면 색 하나만 다르면 그것이 곧 시선의 순서**가 된다.
 * 그래서 알림은 카드가 아니라 틴트 면이고, 한 화면에 여러 개 세우지 않는다 -
 * 틴트 상자가 연달아 서면 경고가 배경이 된다.
 *
 * ⚠ 틴트는 `soft()` 규칙(10%)을 따르는 `*Soft` 토큰만 쓴다. 알파는 뒤에 무엇이
 * 있는지를 타므로 **회색 지면이 아니라 카드 안이거나 카드 자리**에 둔다.
 */
export function NoticeCard({
  tone = 'muted',
  title,
  children,
  footer,
  onFooterPress,
}: {
  tone?: 'brand' | 'live' | 'win' | 'warn' | 'muted';
  title: string;
  children?: ReactNode;
  footer?: string;
  onFooterPress?: () => void;
}) {
  const t = {
    brand: { fg: colors.brandText, bg: colors.brandSoft },
    live: { fg: colors.live, bg: colors.liveSoft },
    win: { fg: colors.win, bg: colors.winSoft },
    warn: { fg: colors.warn, bg: colors.warnSoft },
    muted: { fg: colors.subText, bg: colors.surface },
  }[tone];
  return (
    <View style={[s.notice, { backgroundColor: t.bg, borderColor: t.fg + '33' }]}>
      <View style={s.noticeHead}>
        <View style={[s.noticeDot, { backgroundColor: t.fg }]} />
        <Text style={[s.noticeTitle, { color: t.fg }, keepAll]}>{title}</Text>
      </View>
      {children}
      {footer ? (
        <Pressable
          onPress={onFooterPress}
          disabled={!onFooterPress}
          style={({ pressed }) => (pressed && onFooterPress ? pressHighlight : undefined)}
        >
          <Text style={s.noticeFooter}>
            {footer}
            {onFooterPress ? ' ›' : ''}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** 알림 카드 안의 한 줄. 카드 색은 하나뿐이라 행끼리의 차이는 배지가 말한다 */
export function NoticeRow({
  label,
  text,
  first,
  badge,
  onPress,
}: {
  label?: string;
  text: string;
  first?: boolean;
  badge?: ReactNode;
  onPress?: () => void;
}) {
  const inner = (
    <View style={[s.noticeRow, !first && s.noticeRowDivider]}>
      {badge}
      <View style={s.noticeRowBody}>
        <View style={{ flex: 1, gap: 2 }}>
          {label ? <Text style={[s.noticeRowLabel, keepAll]}>{label}</Text> : null}
          <Text style={[s.noticeRowText, keepAll]}>{text}</Text>
        </View>
        {onPress ? <Text style={s.noticeRowChevron}>{'›'}</Text> : null}
      </View>
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => (pressed ? pressHighlight : undefined)}>
      {inner}
    </Pressable>
  );
}

/**
 * 100% 를 나눠 갖는 막대 - 땅볼·뜬공·라인드라이브처럼 **합이 정해진** 비율에.
 *
 * 게이지 세 개를 세로로 쌓으면 각각이 독립된 값처럼 보인다. 하나의 막대를 쪼개야
 * "셋이 합쳐 전부"라는 사실이 그림에 들어온다.
 *
 * 색은 `category` 순번으로만 받는다 - 화면이 원시 색을 넘기기 시작하면 토큰을 새로
 * 만들어도 화면이 그냥 우회한다(Gauge 와 같은 규칙).
 */
export function SplitBar({
  segments,
}: {
  segments: { value: number; category: number; label?: string }[];
}) {
  const total = segments.reduce((a, x) => a + x.value, 0);
  if (total <= 0) return null;
  return (
    <View style={s.splitBar}>
      {segments.map((x, i) => (
        <View
          key={i}
          style={[
            s.splitSeg,
            { flexGrow: x.value / total, backgroundColor: categoryColor(x.category) },
          ]}
          accessibilityLabel={
            x.label ? `${x.label} ${Math.round((x.value / total) * 100)}%` : undefined
          }
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  notice: {
    gap: spacing.sm,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.lg,
  },
  noticeHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  noticeDot: { width: 6, height: 6, borderRadius: 3 },
  noticeTitle: { ...typography.cardTitle, flex: 1 },
  noticeFooter: typography.micro,

  noticeRow: { gap: 4, paddingVertical: spacing.sm },
  // 틴트 면 위에서는 카드용 border 색이 사라져 보인다. 면 위에 얹는 검정 알파로
  noticeRowDivider: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)' },
  noticeRowBody: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  noticeRowLabel: { ...typography.bodyStrong, fontSize: 13, lineHeight: 18 },
  noticeRowText: { ...typography.caption, lineHeight: 19 },
  noticeRowChevron: { ...typography.caption, fontWeight: '700', fontSize: 16, lineHeight: 19 },

  splitBar: { height: 6, flexDirection: 'row', gap: 2 },
  splitSeg: { height: 6, flexBasis: 0, borderRadius: radius.bar },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.cardPad,
    gap: spacing.md,
  },
  groupCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: 'hidden',
  },

  sectionWrap: {
    paddingLeft: spacing.xs,
    marginTop: spacing.sectionTop,
    marginBottom: spacing.sm,
  },

  // 제목을 안에 들인 섹션. 카드 경계가 곧 섹션 경계다
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    marginTop: spacing.sectionTop,
  },
  // 머리와 본문 사이 구분선. 없으면 제목이 첫 행에 붙어 행처럼 읽힌다
  sectionCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.cardPad,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionCardBody: { padding: spacing.cardPad, gap: spacing.md },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, flexWrap: 'wrap' },
  foldCaret: { ...typography.micro, fontSize: 13, width: 12, textAlign: 'center' },
  sectionTitle: typography.sectionHeader,
  presenter: { ...typography.micro, marginLeft: spacing.sm },

  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headingLabel: { ...typography.label, marginBottom: 2 },
  headingTitle: typography.cardTitle,

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.cardPad,
    paddingVertical: spacing.md,
    minHeight: spacing.touchMin,
  },
  // 구분선은 왼쪽 여백에서 시작해 카드 오른쪽 끝까지 - iOS 리스트 문법
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },

  kvLabel: { ...typography.body, flexShrink: 1 },
  kvValue: { ...typography.bodyStrong, ...tabularFigures, textAlign: 'right' },

  label: typography.label,

  segTrack: {
    flexDirection: 'row',
    backgroundColor: colors.raised,
    borderRadius: radius.tile,
    padding: 3,
    gap: 3,
  },
  segItem: {
    flex: 1,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.tile - 3,
  },
  segItemOn: {
    backgroundColor: colors.card,
    ...(Platform.OS === 'web' ? { boxShadow: '0 1px 4px rgba(9, 22, 45, 0.12)' } : null),
  },
  segLabel: { fontSize: 13, fontWeight: '600', color: colors.subText },
  segLabelOn: { color: colors.text, fontWeight: '700' },

  // HeroUI Tabs `primary` - muted 트랙 위에 흰 알약. Segmented 와 같은 가족이지만
  // 라운드가 알약(chip)이고 칸 사이에 구분선이 선다는 점이 다르다
  topTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    height: spacing.touchMin,
    padding: TOP_TAB_PAD,
    borderRadius: radius.chip,
    backgroundColor: colors.raised,
  },
  topTabPill: {
    position: 'absolute',
    // 알약은 탭 위에 떠 있는 면일 뿐이다 - 터치는 아래 Pressable 로 통과시킨다
    // (props.pointerEvents 는 RN 0.86 에서 폐기됐다. style 쪽으로 쓴다)
    pointerEvents: 'none',
    left: TOP_TAB_PAD,
    top: TOP_TAB_PAD,
    height: TOP_TAB_H,
    borderRadius: radius.chip,
    backgroundColor: colors.card,
    ...(Platform.OS === 'web' ? { boxShadow: '0 1px 4px rgba(9, 22, 45, 0.12)' } : null),
  },
  // 폭 1px · 높이 60% · 세로 가운데 (HeroUI `.tabs__separator`)
  topTabSep: {
    position: 'absolute',
    pointerEvents: 'none',
    top: '20%',
    height: '60%',
    width: 1,
    backgroundColor: colors.borderStrong,
  },
  topTab: {
    flex: 1,
    height: TOP_TAB_H,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.chip,
  },
  topTabText: { fontSize: 15, fontWeight: '600', color: colors.subText, letterSpacing: -0.2 },
  topTabTextOn: { color: colors.text, fontWeight: '700' },
  // 선택된 벌은 흐린 벌 위에 겹친다. inset 을 주지 않으면 부모의 정렬(가운데)을 따른다
  topTabTextOver: { position: 'absolute' },

  chip: {
    paddingHorizontal: spacing.lg,
    height: 34,
    justifyContent: 'center',
    borderRadius: radius.chip,
    backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.brandSoft },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.subText },
  chipTextOn: { color: colors.brandText, fontWeight: '700' },
  // 불투명도만으로는 '눌리지 않음'이 약하다. 취소선이 품절을 글자로도 말한다
  chipTextOff: { textDecorationLine: 'line-through' },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.1 },

  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: 2,
    flex: 1,
  },
  tileHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tileAccent: { width: 3, height: 12, borderRadius: 2 },
  tileLabel: typography.micro,
  tileValue: { ...typography.metric, ...tabularFigures, fontSize: 22, lineHeight: 26 },
  tileSub: { ...typography.micro, ...tabularFigures, fontWeight: '400' },

  gaugeTrack: {
    height: 4,
    borderRadius: radius.bar,
    backgroundColor: colors.dim,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  gaugeFill: { height: 4, borderRadius: radius.bar },
  gaugeMarker: {
    position: 'absolute',
    width: 2,
    height: 10,
    backgroundColor: colors.text,
    top: -3,
  },

  // 구간 게이지. 구간 사이에 2px 틈을 둬야 '하나의 막대'가 아니라 '나뉜 구간'으로 읽힌다
  bandTrack: { flexDirection: 'row', gap: 2, height: 6 },
  band: { borderRadius: radius.bar, backgroundColor: colors.dim },
  bandLabels: { flexDirection: 'row', gap: 2 },
  bandLabel: { ...typography.micro, fontSize: 10, lineHeight: 14 },
  bandLabelOn: { color: colors.text },

  btn: {
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnLabel: { fontWeight: '600', letterSpacing: -0.2 },

  skeleton: { backgroundColor: skeleton.base, borderRadius: 7 },

  // 물음표 - 본문을 밀어내지 않도록 작게. 터치 영역은 hitSlop 이 벌린다
  tipBtn: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipMark: { ...typography.micro, fontSize: 11, lineHeight: 14, color: colors.subText },
  tipBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9,22,45,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  tipCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.cardPad,
    gap: spacing.sm,
    maxWidth: 340,
    width: '100%',
  },
  tipTitle: typography.cardTitle,
  tipLine: { ...typography.body, fontSize: 13.5, lineHeight: 21 },
  tipClose: { alignSelf: 'flex-end', paddingTop: spacing.xs },
  tipCloseText: { ...typography.bodyStrong, color: colors.brandText },

  // 결정적 순간 - 피드의 다른 행과 같은 카드 안에 있으면서 면으로 구분된다.
  // 카드를 따로 띄우면 '피드에 끼어든 것'이 아니라 '피드 밖의 광고'로 읽힌다
  // ⚠ 여기는 **광고 자리다.** 처음에는 brandSoft 로 면을 통째로 깔았는데, 그러면
  // 문자중계 행이 흐르다가 색 덩어리가 끼어들어 리듬이 끊기고 **광고가 중계보다
  // 시선을 먼저 가져간다.** 팬은 중계를 읽으러 왔다.
  // 면을 걷고 왼쪽 띠 하나로 바꿨다 - 자리는 그대로 명확한데 오렌지 면적은 1/20 이 된다.
  // theme.ts 가 첫 줄부터 말하는 "브랜드는 면적이 아니라 자리"가 여기에도 적용된다.
  momentWrap: {
    paddingLeft: spacing.cardPad - 3, // 띠 굵기만큼 당겨 위아래 행과 글자 시작점을 맞춘다
    paddingRight: spacing.cardPad,
    paddingVertical: spacing.md,
    gap: 5,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand,
  },
  momentHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  momentDot: { width: 5, height: 5, borderRadius: 999, backgroundColor: colors.brand },
  momentKind: { ...typography.micro, color: colors.brandText },
  momentBy: { ...typography.micro, fontWeight: '400', marginLeft: 2 },
  momentBrand: { ...typography.micro, color: colors.text },
  momentTitle: { ...typography.cardTitle, fontSize: 15.5, lineHeight: 22 },
  momentBody: { ...typography.caption, lineHeight: 19, color: colors.subText },

  // 종 - 위 반원 + 아래로 벌어지는 몸통 + 받침 + 추.
  // 처음에는 둥근 사각형 하나로 뒀는데 확대해 보니 종이 아니라 눌린 상자로 읽혔다.
  // **종의 실루엣은 아래가 벌어지는 데서 나온다.** 사다리꼴은 RN 에 도형이 없어
  // 테두리 트릭으로 만든다 - 아래 테두리만 색을 주고 좌우를 투명하게 두면
  // 위쪽이 좁고 아래가 넓은 사다리꼴이 된다.
  bellWrap: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  bellDome: {
    width: 10,
    height: 5,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    backgroundColor: colors.subText,
    marginTop: -3,
  },
  bellSkirt: {
    width: 10,
    height: 0,
    borderBottomWidth: 7,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderBottomColor: colors.subText,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  bellBase: {
    width: 17,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.subText,
    marginTop: 1.5,
  },
  bellClapper: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.subText,
    marginTop: 1.5,
  },
  // 안 읽은 표시. 흰 테두리를 둘러야 종 위에 얹혀도 형태가 안 뭉갠다
  bellDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: colors.live,
    borderWidth: 1.5,
    borderColor: colors.card,
  },

  reasonRow: { paddingVertical: spacing.md },
  reasonText: { ...typography.body, fontSize: 13.5, lineHeight: 21 },
  strong: { fontWeight: '700', color: colors.text },

  extBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.brandSoft,
    borderRadius: radius.tile,
    paddingHorizontal: spacing.lg,
    minHeight: spacing.touchMin,
    gap: spacing.md,
  },
  extLabel: { fontSize: 15, fontWeight: '700', color: colors.brandText },
  extSub: typography.micro,
  extArrow: { fontSize: 20, fontWeight: '700', color: colors.brandText },

  secBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.chip,
    paddingHorizontal: spacing.lg,
    minHeight: spacing.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secLabel: { fontSize: 14, fontWeight: '600', color: colors.text },

  divider: { height: 1, backgroundColor: colors.border },

  sheetBackdrop: { flex: 1, justifyContent: 'flex-end' },
  // 시트 뒤를 통째로 덮는 누를 수 있는 면. 시트 본체는 형제로 그 위에 올라간다
  sheetDim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7,17,31,0.35)',
  },
  sheetGrab: { alignItems: 'center' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    minHeight: '62%',
    overflow: 'hidden',
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.dim,
    marginTop: spacing.md,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  sheetSub: { ...typography.label, marginBottom: 3 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.4 },
  sheetClose: { minHeight: 32, justifyContent: 'center' },
  sheetCloseText: { ...typography.caption, color: colors.brandText, fontWeight: '700' },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.screenX,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  infoLabel: { ...typography.caption, flexShrink: 0 },
  infoValue: { ...typography.bodyStrong, fontSize: 13.5, flex: 1, textAlign: 'right' },

  alertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    paddingHorizontal: spacing.lg,
    minHeight: spacing.touchMin,
    justifyContent: 'center',
    flex: 1,
  },
  alertBtnOn: { backgroundColor: colors.brandSoft },
  alertLabel: { fontSize: 14, fontWeight: '700', color: colors.subText },
  alertLabelOn: { color: colors.brandText },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: spacing.touchMin,
  },
  alertRowLabel: { ...typography.bodyStrong, fontSize: 14 },
  alertRowCaption: typography.caption,
});
