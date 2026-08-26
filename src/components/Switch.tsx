// 스위치 - HeroUI Switch 문법
//
// ── 무엇을 바꿨나 (2026-08-26) ───────────────────────────────
// 전에는 react-native 의 `Switch` 를 그대로 썼다. 그러면 **플랫폼이 모양을 정한다** -
// iOS 는 51×31 의 쿠퍼티노 스위치, 안드로이드는 머티리얼, 웹(react-native-web)은 또
// 다른 것을 그린다. 색만 brand 로 덮어씌우고 있었으니 세 플랫폼에서 크기도 라운드도
// 썸의 그림자도 제각각이었고, 이 앱의 다른 부품(알약 탭·칩·게이지)과 아무 관계가 없었다.
// 폰 시연과 웹 시연을 나란히 놓고 보면 그 자리만 서로 다른 제품처럼 보인다.
//
// ── HeroUI 에서 가져온 값 ───────────────────────────────────
// (heroui-native `src/styles/components/switch.css`)
//   - 트랙: 48 × 24 · 완전 라운드 · 안쪽 여백 2px
//   - 썸  : 20 × 20 원 · 흰 면 + 아주 옅은 그림자
//   - 이동: 48 - 20 - 2×2 = 24px
//   - 꺼짐 `--color-default`(muted 면) / 켜짐 `--color-accent`(브랜드)
//   - 비활성: opacity 0.5
//
// ⚠ 높이만 md(28)에서 sm(24)으로 내렸다. **폭은 md 그대로 48 이다.**
//   md 비례(48×28 ≈ 1.7:1)로는 행 안에서 스위치가 뚱뚱해 보였는데, sm 을 통째로 쓰면
//   폭까지 40 으로 줄어 표적이 더 작아진다. 높이만 내려 2:1 로 길쭉하게 눕혔다 -
//   썸이 가는 거리가 20 에서 24 로 늘어 켜고 끄는 것이 오히려 더 잘 보인다.
//
// ── 두 겹으로 그리는 이유 ───────────────────────────────────
// 트랙 색을 하나의 값으로 보간하려면 `useNativeDriver: false` 여야 한다(색은 네이티브
// 드라이버가 못 다룬다). 그러면 이 앱에서 애니메이션하는 다른 것들(알약 탭·시트)과
// 드라이버가 갈려, 같은 화면에서 하나는 UI 스레드로 하나는 JS 스레드로 움직인다.
//
// 그래서 **꺼진 면 위에 켜진 면을 덮고 opacity 만 움직인다.** opacity 와 transform 은
// 둘 다 네이티브 드라이버가 다루므로, 값 하나가 위치와 색을 동시에 만든다.
// 상단 탭의 구분선이 사라지는 방식과 같은 수법이다(common.tsx TopTabs 참고).
import { useEffect, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet } from 'react-native';

import { colors } from '../theme';

const TRACK_W = 48;
const TRACK_H = 24;
const THUMB = 20;
const PAD = 2;
/** 썸이 가는 거리 - 트랙 안쪽 폭에서 썸을 뺀 만큼 */
const TRAVEL = TRACK_W - THUMB - PAD * 2;

/**
 * 알약 탭·하단 탭 캡슐과 같은 물리값.
 * 한 화면 안의 움직임이 서로 다른 속도를 가지면 같은 제품의 부품으로 안 읽힌다.
 */
const SWITCH_SPRING = {
  useNativeDriver: Platform.OS !== 'web',
  stiffness: 210,
  damping: 24,
  mass: 1,
  restDisplacementThreshold: 0.2,
  restSpeedThreshold: 0.2,
};

export function Switch({
  value,
  onValueChange,
  disabled,
  accessibilityLabel,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  /** 0 = 꺼짐, 1 = 켜짐. 이 값 하나가 썸의 위치와 트랙의 색을 다 만든다 */
  const [t] = useState(() => new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    Animated.spring(t, { ...SWITCH_SPRING, toValue: value ? 1 : 0 }).start();
  }, [value, t]);

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      // 트랙이 24px 이라 손가락 최소 표적(44)에 못 미친다. 눈에 보이는 것은 그대로 두고
      // 표적만 넓힌다 - 트랙을 키우면 비례가 다시 뚱뚱해진다.
      // 위아래 10 을 더해 24 + 20 = 44 로 정확히 맞춘다
      hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
      style={[s.track, disabled && s.disabled]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel}
    >
      {/* 켜진 면. 꺼진 면 위에 덮여 있다가 opacity 로 드러난다 */}
      <Animated.View style={[StyleSheet.absoluteFill, s.trackOn, { opacity: t }]} />
      <Animated.View
        style={[
          s.thumb,
          {
            transform: [
              { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, TRAVEL] }) },
            ],
          },
        ]}
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    padding: PAD,
    backgroundColor: colors.dim,
    justifyContent: 'center',
    // ⚠ overflow:hidden 을 걸면 안 된다. 켜진 면은 제 borderRadius 로 이미 둥근데,
    //   이걸 걸면 **썸의 그림자까지 같이 잘린다.** 꺼진 상태는 흰 썸이 옅은 회색 트랙
    //   위에 있어서 그림자가 둘을 떼어놓는 유일한 단서다
  },
  trackOn: { backgroundColor: colors.brand, borderRadius: TRACK_H / 2 },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: '#FFFFFF',
    // HeroUI 의 shadow-small. 썸이 트랙에서 떠 보여야 '집어서 밀 수 있는 것'으로 읽힌다
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  disabled: { opacity: 0.5 },
});
