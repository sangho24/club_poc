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
import { ReactNode } from 'react';
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

import { keepAll, colors, pressHighlight, radius, spacing, tabularFigures, typography } from '../theme';

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
            style={({ pressed }) => [s.segItem, on && s.segItemOn, pressed && !on && pressHighlight]}
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
      style={({ pressed }) => [s.chip, selected && s.chipOn, pressed && !selected && pressHighlight]}
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
  tone = colors.brand,
}: {
  position: number;
  markerAt?: number;
  tone?: string;
}) {
  const pct = Math.min(1, Math.max(0, position));
  return (
    <View style={s.gaugeTrack}>
      <View style={[s.gaugeFill, { width: `${pct * 100}%`, backgroundColor: tone }]} />
      {markerAt !== undefined ? (
        <View style={[s.gaugeMarker, { left: `${Math.min(99, markerAt * 100)}%` }]} />
      ) : null}
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

/** 보조 버튼 - iOS .bordered. 회색 면, 테두리 없음 */
export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.secBtn, pressed && pressHighlight]}
      accessibilityRole="button"
    >
      <Text style={s.secLabel}>{label}</Text>
    </Pressable>
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
  topTabTextOn: { color: colors.text, fontWeight: '800' },
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
  tileSub: { ...typography.micro, ...tabularFigures, fontWeight: '500' },

  gaugeTrack: {
    height: 4,
    borderRadius: radius.bar,
    backgroundColor: colors.dim,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  gaugeFill: { height: 4, borderRadius: radius.bar },
  gaugeMarker: { position: 'absolute', width: 2, height: 10, backgroundColor: colors.text, top: -3 },

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
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
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
