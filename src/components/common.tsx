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
import { ReactNode, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
  style?: ViewStyle;
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

/** 상단 서브탭 - 텍스트 + 밑줄. 칩은 '고르는 것', 서브탭은 '있는 곳'이라 형태를 나눈다 */
export function TopTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  value: T;
  onChange: (k: T) => void;
}) {
  return (
    <View style={s.topTabs}>
      {tabs.map((t) => {
        const on = t.key === value;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={s.topTab}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
          >
            <Text style={[s.topTabText, on && s.topTabTextOn]}>{t.label}</Text>
            <View style={[s.topTabBar, on && s.topTabBarOn]} />
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
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.chip,
        selected && s.chipOn,
        pressed && !selected && pressHighlight,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
    >
      <Text style={[s.chipText, selected && s.chipTextOn]}>{label}</Text>
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
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'brand' | 'plain';
}) {
  return (
    <View style={s.tile}>
      <Text style={s.tileLabel}>{label}</Text>
      <Text style={[s.tileValue, tone === 'brand' && { color: colors.brandText }]}>{value}</Text>
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
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.sheetBackdrop}>
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
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
          >
            {children}
          </ScrollView>

          {actions ? <View style={s.sheetActions}>{actions}</View> : null}
        </View>
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
      <Switch
        value={on}
        onValueChange={onPress}
        trackColor={{ false: colors.dim, true: colors.brand }}
        thumbColor="#FFFFFF"
        // 웹(react-native-web)은 켜진 상태의 썸 색을 activeThumbColor 로 받는다 - 타입에는 없다
        {...(Platform.OS === 'web' ? ({ activeThumbColor: '#FFFFFF' } as object) : null)}
        accessibilityLabel={label ?? '알림 신청'}
      />
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

const s = StyleSheet.create({
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
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, flexWrap: 'wrap' },
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

  topTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  topTab: { flex: 1, alignItems: 'center', paddingTop: spacing.md, gap: spacing.sm },
  topTabText: { fontSize: 15, fontWeight: '600', color: colors.mutedText },
  topTabTextOn: { color: colors.text, fontWeight: '700' },
  topTabBar: { height: 2, alignSelf: 'stretch', backgroundColor: 'transparent' },
  topTabBarOn: { backgroundColor: colors.brand },

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
  momentWrap: {
    backgroundColor: colors.brandSoft,
    paddingHorizontal: spacing.cardPad,
    paddingVertical: spacing.md,
    gap: 5,
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

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(7,17,31,0.35)', justifyContent: 'flex-end' },
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
    alignSelf: 'center',
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
