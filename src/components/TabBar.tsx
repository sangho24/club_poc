// 떠 있는 캡슐 탭 바.
//
// ── 왜 드래그를 붙였나 (2026-08-25) ──────────────────────────
// 탭이 여섯 개라 캡슐 한 칸이 좁다. 손가락으로 정확히 한 칸을 노려 누르는 것보다
// **"옆으로 밀어 옮기는"** 쪽이 엄지 하나로 쓰기 편하다. 잡고 끌면 선택 버블이
// 손가락을 따라오고, 놓으면 가장 가까운 칸에 붙는다.
//
// 탭은 여전히 **누를 수도 있다.** 눌림(Pressable)과 끌기(PanResponder)는 서로
// 빼앗는 관계라, 가로로 6px 넘게 움직이기 전까지는 눌림이 이긴다. 그래서 평범하게
// 톡 누르면 예전 그대로 동작하고, 밀기 시작한 순간에만 드래그로 넘어간다.
//
// 제스처 라이브러리를 새로 넣지 않았다. 코어 PanResponder 로 충분하고, RN Web 도
// 같은 responder 체계를 구현하고 있어 마우스 드래그까지 공짜로 따라온다.
//
// ── 부드럽게 (2026-08-25 2차) ────────────────────────────────
// 초판은 끄는 동안 매 프레임 setState 를 했다. 손가락이 한 번 움직일 때마다 여섯 개
// 탭이 통째로 다시 그려지니 버블이 끊겨 보인다. **그래서 드래그 중에는 React 를 아예
// 재렌더하지 않는다** - 라벨의 선택 여부까지 x 값에서 보간해 만든다. 움직이는 값이
// 하나뿐이라 네이티브 드라이버가 UI 스레드에서 통째로 굴린다.
//
// 스프링도 speed/bounciness 대신 물리값(stiffness·damping)으로 바꿨다. 감쇠비가
// 0.83 이라 한 번만 아주 살짝 넘어갔다 앉는다 - 튕기지 않으면서 죽지도 않는 구간.
//
// ⚠ ref 를 쓰지 않는다. react-hooks/refs 가 렌더 중 ref 읽기를 막기 때문에
// 제스처가 필요로 하는 '시작 위치'는 저장하지 않고 index·slot 에서 다시 계산한다
// (드래그 도중에는 확정 탭이 바뀌지 않으므로 같은 값이다).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, tabCapsule } from '../theme';

/** 드래그로 인정하기 시작하는 가로 이동량 - 이보다 작으면 '누름'이다 */
const DRAG_SLOP = 6;
/** 짧게 튕겨도(플릭) 한 칸은 넘어가게 하는 속도 문턱 (px/ms) */
const FLICK_VELOCITY = 0.35;
/** 양 끝을 넘어갔을 때 남는 저항 - 벽에 딱 걸리는 대신 고무줄처럼 늘어난다 */
const RUBBER = 0.35;

/** 버블은 캡슐 안쪽 여백을 뺀 만큼 - 두 층(아이콘·라벨)을 다 덮어야 한 칸으로 읽힌다 */
const BUBBLE_H = tabCapsule.height - tabCapsule.pad * 2;
const BUBBLE_TOP = tabCapsule.pad;

/**
 * 버블이 앉는 방식. 감쇠비 ζ = damping / 2√(stiffness·mass) ≈ 0.83.
 * 1 보다 조금 낮아 한 번 살짝 넘어갔다 돌아온다 - 기계적이지 않으면서 흔들리지도 않는다.
 * rest 문턱을 0.2px 로 두어 눈에 보이지도 않는 꼬리를 끌지 않고 끝낸다.
 */
const SPRING = {
  useNativeDriver: Platform.OS !== 'web',
  stiffness: 210,
  damping: 24,
  mass: 1,
  restDisplacementThreshold: 0.2,
  restSpeedThreshold: 0.2,
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// ─────────────────────────────────────────────────────────────
// 픽토그램
//
// 아이콘 라이브러리를 넣지 않았다. 여섯 개를 위해 SVG 런타임을 붙이면 번들이
// 그만큼 무거워지고, 이 저장소는 이미 View 로 마크를 그리는 관용구를 갖고 있다
// (common.tsx 의 BellButton, photos.tsx 의 CapMark). 같은 방식으로 그린다.
//
// 전부 **선(획) 문법**으로 통일했다 - 굵기 1.8 하나. 채운 것과 선인 것이 섞이면
// 한 줄에 놓였을 때 무게가 들쭉날쭉해 어느 탭이 선택된 것인지가 흐려진다.
// (지붕만은 삼각형이라 채운다 - 1.8px 선 두 개로 꺾인 각을 만들면 이 크기에서
//  이음매가 뭉개진다)
//
// 색은 넘겨받는다. 선택/비선택 두 벌을 겹쳐 놓고 투명도로 교차시키기 때문에
// 아이콘 자신은 자기가 선택됐는지 모른다.
// ─────────────────────────────────────────────────────────────

export type TabIconName = 'home' | 'live' | 'bat' | 'diamond' | 'bag' | 'person';

const STROKE = 1.8;

function TabIcon({ name, color }: { name: TabIconName; color: string }) {
  switch (name) {
    // 집 - 지붕은 채우고 몸통은 선
    case 'home':
      return (
        <View style={ic.box}>
          <View style={[ic.roof, { borderBottomColor: color }]} />
          <View style={[ic.houseBody, { borderColor: color }]} />
        </View>
      );

    // 방송 중 - 가운데 점과 그것을 둘러싼 링. 녹화·생중계의 관용 기호다
    case 'live':
      return (
        <View style={ic.box}>
          <View style={[ic.ring, { borderColor: color }]} />
          <View style={[ic.ringDot, { backgroundColor: color }]} />
        </View>
      );

    // 배트 - 사람 모양을 쓰면 MY 와 겹친다. 이 탭은 '선수단'이지 '나'가 아니다
    case 'bat':
      return (
        <View style={ic.box}>
          <View style={ic.batWrap}>
            <View style={[ic.batBarrel, { backgroundColor: color }]} />
            <View style={[ic.batHandle, { backgroundColor: color }]} />
            <View style={[ic.batKnob, { backgroundColor: color }]} />
          </View>
        </View>
      );

    // 내야 다이아몬드 - 야구장을 한 획으로 말하는 형태
    case 'diamond':
      return (
        <View style={ic.box}>
          <View style={[ic.diamond, { borderColor: color }]} />
        </View>
      );

    // 쇼핑백 - 손잡이는 위쪽만 둥근 'ㄇ' 로 만든다. 원의 한쪽 테두리만 남기는
    // 방식은 플랫폼마다 이음매가 달라 이 크기에서 지저분해진다
    case 'bag':
      return (
        <View style={ic.box}>
          <View style={[ic.bagHandle, { borderColor: color }]} />
          <View style={[ic.bagBody, { borderColor: color }]} />
        </View>
      );

    // 사람 - 머리와 어깨. 어깨는 아래가 열린 반원이라 '상반신'으로 읽힌다
    case 'person':
      return (
        <View style={ic.box}>
          <View style={[ic.head, { borderColor: color }]} />
          <View style={[ic.shoulders, { borderColor: color }]} />
        </View>
      );
  }
}

const ic = StyleSheet.create({
  box: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },

  roof: {
    width: 0,
    height: 0,
    borderBottomWidth: 8,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  houseBody: { width: 12, height: 8, borderWidth: STROKE, borderTopWidth: 0 },

  ring: { width: 18, height: 18, borderRadius: 999, borderWidth: STROKE },
  ringDot: { position: 'absolute', width: 7, height: 7, borderRadius: 999 },

  // 손잡이 끝(knob)이 아래로 오게 세운 뒤 통째로 기울인다
  batWrap: { alignItems: 'center', transform: [{ rotate: '38deg' }] },
  batBarrel: { width: 5, height: 10, borderRadius: 2.5 },
  batHandle: { width: 2.4, height: 6, marginTop: -0.5 },
  batKnob: { width: 4.4, height: 2.2, borderRadius: 1.1 },

  diamond: { width: 13, height: 13, borderWidth: STROKE, transform: [{ rotate: '45deg' }] },

  bagHandle: {
    width: 9,
    height: 5,
    borderWidth: STROKE,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4.5,
    borderTopRightRadius: 4.5,
    // 몸통 테두리와 겹쳐 두 선이 이어져 보이게 한다
    marginBottom: -STROKE,
  },
  bagBody: { width: 15, height: 11, borderWidth: STROKE, borderRadius: 3 },

  head: { width: 7.5, height: 7.5, borderRadius: 999, borderWidth: STROKE },
  shoulders: {
    width: 15,
    height: 7,
    borderWidth: STROKE,
    borderBottomWidth: 0,
    borderTopLeftRadius: 7.5,
    borderTopRightRadius: 7.5,
    marginTop: 2,
  },
});

export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string; icon: TabIconName }[];
  value: T;
  onChange: (key: T) => void;
}) {
  const found = tabs.findIndex((t) => t.key === value);
  const index = found < 0 ? 0 : found;

  // 캡슐 안쪽 폭을 재야 한 칸(slot)이 몇 px 인지 안다. 재기 전에는 버블을 그리지 않는다
  const [innerW, setInnerW] = useState(0);
  const slot = innerW > 0 ? innerW / tabs.length : 0;

  /** 버블의 가로 위치. 이 값 하나가 위치·라벨 진하기·잡힌 느낌을 전부 만든다 */
  const [x] = useState(() => new Animated.Value(0));
  /** 잡고 있는 동안 0 → 1. 버블이 아주 살짝 떠오른다 */
  const [grab] = useState(() => new Animated.Value(0));

  const slideTo = useCallback(
    (to: number, velocity = 0) => Animated.spring(x, { ...SPRING, toValue: to, velocity }).start(),
    [x],
  );
  const grabTo = useCallback(
    (to: number) => Animated.spring(grab, { ...SPRING, toValue: to }).start(),
    [grab],
  );

  // 탭이 바뀌면(눌러서든, 홈 화면의 '라이브 보기' 같은 외부 호출이든) 버블이 미끄러져 간다
  useEffect(() => {
    if (slot > 0) slideTo(index * slot);
  }, [index, slot, slideTo]);

  const pan = useMemo(() => {
    const last = (tabs.length - 1) * slot;
    // 드래그가 시작되는 자리 = 지금 선택된 칸. 제스처 도중에는 바뀌지 않는다
    const from = index;
    const originX = from * slot;

    /** 끝을 넘어가면 저항을 남긴다 - 벽에 부딪히는 대신 고무줄이 늘어나는 느낌 */
    const rubber = (v: number) => {
      if (v < 0) return v * RUBBER;
      if (v > last) return last + (v - last) * RUBBER;
      return v;
    };

    return PanResponder.create({
      // 시작 시점에는 양보한다 - 그래야 톡 누르기가 Pressable 로 간다
      onStartShouldSetPanResponder: () => false,
      // 가로로 유의미하게, 그리고 세로보다 더 많이 움직였을 때만 드래그로 가로챈다
      onMoveShouldSetPanResponder: (_e, g) =>
        slot > 0 && Math.abs(g.dx) > DRAG_SLOP && Math.abs(g.dx) > Math.abs(g.dy),
      // 한번 잡았으면 바깥에 뺏기지 않는다
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: () => grabTo(1),

      // 여기서 setState 를 하지 않는 것이 이 컴포넌트의 핵심이다.
      // 값 하나만 밀어 넣으면 위치도 라벨도 보간으로 따라온다 (재렌더 0회)
      onPanResponderMove: (_e, g) => x.setValue(rubber(originX + g.dx)),

      onPanResponderRelease: (_e, g) => {
        grabTo(0);
        const landed = clamp(originX + g.dx, 0, last);
        let to = clamp(Math.round(landed / slot), 0, tabs.length - 1);
        // 반 칸을 못 넘겼어도 빠르게 튕겼으면 한 칸은 넘어간다 - 스와이프처럼 쓰라고
        if (to === from && Math.abs(g.vx) > FLICK_VELOCITY) {
          to = clamp(from + (g.vx > 0 ? 1 : -1), 0, tabs.length - 1);
        }
        // 제자리로 돌아갈 때는 index 가 그대로라 useEffect 가 안 돈다. 여기서 직접
        // 되돌리되 손이 남긴 속도를 그대로 물려준다 (px/ms → px/s)
        if (to === from) slideTo(originX, g.vx * 1000);
        else onChange(tabs[to].key);
      },

      onPanResponderTerminate: () => {
        grabTo(0);
        slideTo(originX);
      },
    });
  }, [tabs, index, slot, x, slideTo, grabTo, onChange]);

  return (
    <View
      style={s.tabBar}
      onLayout={(e) => setInnerW(e.nativeEvent.layout.width - tabCapsule.pad * 2)}
      {...pan.panHandlers}
    >
      {/* 선택 버블은 칸마다 깔린 배경이 아니라 **하나가 미끄러지는 면**이다.
          그래야 끄는 동안 손가락을 따라올 수 있다 */}
      {slot > 0 ? (
        <Animated.View
          style={[
            s.bubble,
            {
              width: slot,
              transform: [
                { translateX: x },
                { scale: grab.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) },
              ],
            },
          ]}
        />
      ) : null}

      {tabs.map((t, i) => {
        // 버블이 이 칸에 얼마나 걸쳐 있는지(0~1). 진하기는 '선택됐다/아니다'가 아니라
        // 이 연속값이 정한다 - 그래서 끄는 동안 툭 바뀌지 않고 건너간다.
        // 글자 굵기도 아이콘 색도 애니메이션할 수 없으니, **아이콘과 라벨을 묶은 한
        // 벌을 두 개** 겹쳐 두고 서로 교차시킨다
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
            style={s.tabBtn}
            accessibilityRole="tab"
            accessibilityLabel={t.label}
            accessibilityState={{ selected: i === index }}
            aria-selected={i === index}
          >
            <Animated.View style={[s.tabStack, { opacity: offAlpha }]}>
              <TabIcon name={t.icon} color={colors.subText} />
              <Text style={s.tabLabel} numberOfLines={1}>
                {t.label}
              </Text>
            </Animated.View>
            <Animated.View style={[s.tabStack, s.tabStackOver, { opacity: onAlpha }]}>
              <TabIcon name={t.icon} color={colors.brandText} />
              <Text style={[s.tabLabel, s.tabLabelOn]} numberOfLines={1}>
                {t.label}
              </Text>
            </Animated.View>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  // 화면 가장자리에 붙지 않고 떠 있는 캡슐. 선택 탭만 흰 버블
  tabBar: {
    position: 'absolute',
    bottom: tabCapsule.offset,
    left: spacing.lg,
    right: spacing.lg,
    height: tabCapsule.height,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tabCapsule.pad,
    borderRadius: radius.chip,
    // shadcn TabsList 문법 - muted 트랙 위에 흰 활성 버블
    backgroundColor: 'rgba(244,245,247,0.82)',
    borderWidth: 1,
    borderColor: colors.border,
    // 유리는 내비게이션 층에만 (kbo_poc design.md §1). 본문이 캡슐 아래로 흐를 때
    // 비쳐 보여야 "떠 있다"가 성립한다 - 불투명하면 그냥 회색 바다
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 20px rgba(9, 22, 45, 0.10)',
          backdropFilter: 'saturate(180%) blur(16px)',
          WebkitBackdropFilter: 'saturate(180%) blur(16px)',
        }
      : null),
  },
  bubble: {
    position: 'absolute',
    // 버블은 탭 위에 떠 있는 면일 뿐이다 - 터치는 아래 Pressable 로 통과시킨다
    // (props.pointerEvents 는 RN 0.86 에서 폐기됐다. style 쪽으로 쓴다)
    pointerEvents: 'none',
    left: tabCapsule.pad,
    top: BUBBLE_TOP,
    height: BUBBLE_H,
    borderRadius: radius.chip,
    backgroundColor: colors.card,
    ...(Platform.OS === 'web' ? { boxShadow: '0 1px 8px rgba(9, 22, 45, 0.16)' } : null),
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: spacing.touchMin,
    borderRadius: radius.chip,
  },
  // 아이콘 위 · 라벨 아래. 사이는 3px - 더 벌리면 둘이 한 덩어리로 안 읽힌다
  tabStack: { alignItems: 'center', gap: 3 },
  // 선택된 벌은 흐린 벌 위에 겹친다. inset 을 주지 않으면 부모의 정렬(가운데)을 따른다
  tabStackOver: { position: 'absolute' },
  // 아이콘이 위에 서면서 라벨은 이름표로 물러난다. 12 그대로 두면 두 층이 대결한다
  tabLabel: { fontSize: 11, fontWeight: '600', color: colors.subText, letterSpacing: -0.2 },
  tabLabelOn: { color: colors.brandText, fontWeight: '700' },
});
