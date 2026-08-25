// 사진 자산 (assets/photo) - 구장 · 선수 얼굴 · 구단 엠블럼
//
// ── 왜 사진이 필요한가 ───────────────────────────────────────
// 사진이 한 장도 없으면 화면이 "콘텐츠를 담는 그릇"이 아니라 "설명을 담는 문서"로 읽힌다.
// 수치와 문장만으로 채운 화면은 아무리 정돈해도 자료집에 머물고, 시연에서 "아직 만드는
// 중"이라는 인상을 준다. 레퍼런스(49ers 공식 앱)는 홈 카드 하나가 경기 사진과 선수 컷으로
// 화면 절반 이상을 이미지로 채운다.
//
// ── 무엇을 쓰고 무엇을 안 쓰는가 ─────────────────────────────
// 위키미디어 커먼즈의 **자유 라이선스 사진만** 쓴다(CC0 / PD / CC BY / CC BY-SA).
// 구단·언론사 보도사진은 저작권이 불명확해 아예 받지 않았다. ND(변경 금지)·NC(비영리)도
// 제외했다 - 크롭이 필요하고 상업 제안 자료에 들어갈 수 있기 때문이다.
//
// 출처·저작자·라이선스는 [assets/photo/SOURCES.md](../../assets/photo/SOURCES.md) 가 갖는다.
// CC BY-SA 는 "무료"가 아니라 "조건부"라 저작자 표시가 필요하다.
//
// ── 정적 require 규칙 ────────────────────────────────────────
// 정적 asset 의 require 는 **번들 타임에 해석된다.** 템플릿 문자열로 경로를 만들 수 없어
// 키를 하나씩 나열한다. Record 로 두면 구단이 빠졌을 때 타입에러로 잡힌다.
import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

// ── 구단 엠블럼 ───────────────────────────────────────────────
export type EmblemTeam = 'HH' | 'LG' | 'KIA' | 'SS' | 'OB' | 'KT' | 'SSG' | 'LT' | 'NC' | 'WO';

const TEAM_EMBLEMS: Record<EmblemTeam, ImageSourcePropType> = {
  // 한화만 2024-11 교체된 **새 엠블럼**을 쓴다. 나머지 9구단은 KBO 공식 엠블럼 세트 그대로다
  HH: require('../../assets/logo/emblem-2025.png'),
  LG: require('../../assets/emblem/LG.png'),
  KIA: require('../../assets/emblem/KIA.png'),
  SS: require('../../assets/emblem/SS.png'),
  OB: require('../../assets/emblem/OB.png'),
  KT: require('../../assets/emblem/KT.png'),
  SSG: require('../../assets/emblem/SSG.png'),
  LT: require('../../assets/emblem/LT.png'),
  NC: require('../../assets/emblem/NC.png'),
  WO: require('../../assets/emblem/WO.png'),
};

// 원본 비율. KBO 공식 엠블럼 세트는 모두 81x59 로 가로가 넓고,
// 한화 새 엠블럼만 960x819 라 거의 정사각에 가깝다
const KBO_SET_ASPECT = 81 / 59;
const EMBLEM_ASPECT: Record<EmblemTeam, number> = {
  HH: 960 / 819,
  LG: KBO_SET_ASPECT,
  KIA: KBO_SET_ASPECT,
  SS: KBO_SET_ASPECT,
  OB: KBO_SET_ASPECT,
  KT: KBO_SET_ASPECT,
  SSG: KBO_SET_ASPECT,
  LT: KBO_SET_ASPECT,
  NC: KBO_SET_ASPECT,
  WO: KBO_SET_ASPECT,
};

/**
 * 구단 엠블럼.
 *
 * 밝은 면 위에서는 배경 없이 그대로 쓴다. 어두운 면에 올려야 하면 bg 로 밝은 받침을
 * 깐다 - 엠블럼 대부분이 검정·남색 외곽선을 갖고 있어 어두운 면에서 형태가 뭉개진다.
 */
export function TeamEmblem({
  team,
  size = 28,
  bg,
}: {
  team: EmblemTeam;
  size?: number;
  bg?: string;
}) {
  const source = TEAM_EMBLEMS[team];

  if (!bg) {
    return <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />;
  }

  const pad = Math.round(size * 0.1);
  const imageW = size - pad * 2;
  const imageH = imageW / EMBLEM_ASPECT[team];
  const boxH = imageH + pad * 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size,
          height: boxH,
          borderRadius: Math.min(radius.tile, boxH * 0.35),
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Image source={source} style={{ width: imageW, height: imageH }} resizeMode="contain" />
      </View>
    </View>
  );
}

/**
 * 구단 워드마크 - 상단 브랜드 바용.
 *
 * 'Hanwha' + 'EAGLES' 두 줄로 짜인 로고라 **작은 쪽 글자가 판독 하한을 정한다.**
 * 원본은 318x144 이고 height 를 받아 폭을 계산한다 - 브랜드 바의 높이는 고정이고
 * 폭이 따라오는 값이기 때문이다.
 */
export function ClubWordmark({ height = 32 }: { height?: number }) {
  return (
    <Image
      source={require('../../assets/logo/eagles-wordmark.png')}
      style={{ height, width: Math.round((height * 318) / 144) }}
      resizeMode="contain"
      accessibilityLabel="한화 이글스"
    />
  );
}

/**
 * 모자 로고 - 'E' 한 글자 마크.
 *
 * 원형 엠블럼은 'Hanwha'·'Baseball Club' 글자를 두르고 있어 **작게 쓰면 그 글자들이
 * 먼저 뭉개진다.** 선수 아바타 폴백처럼 40px 안팎으로 들어가는 자리에는 글자가 없는
 * 모자 마크가 맞다. 같은 브랜드를 크기에 따라 다른 형태로 쓰는 것이 CI 운용의 기본이다.
 */
export function CapMark({ size = 28 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/logo/cap-2025.png')}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      resizeMode="cover"
      accessibilityLabel="한화 이글스"
    />
  );
}

// ── 구장 사진 ─────────────────────────────────────────────────
const STADIUM_PHOTOS: Partial<Record<string, ImageSourcePropType>> = {
  대전: require('../../assets/photo/stadium/HH.jpg'),
  잠실: require('../../assets/photo/stadium/LG.jpg'),
};

export function stadiumPhoto(name: string): ImageSourcePropType | undefined {
  return STADIUM_PHOTOS[name];
}

// ── 선수 사진 ─────────────────────────────────────────────────
// 키는 roster.ts 의 선수 id 다.
//
// **22명 중 5명뿐이다.** 나머지는 위키미디어 커먼즈에 자유 라이선스 사진이 없다.
// 국내 선수는 대부분 구단·언론사 보도사진뿐이라 받지 않았다.
// 그래서 Record 가 아니라 Partial 이고, **폴백은 예외 처리가 아니라 기본 경로다.**
//
// aspect(가로/세로)를 함께 적는 이유는 아래 PlayerAvatar 주석 참조.
interface PlayerPhoto {
  source: ImageSourcePropType;
  aspect: number;
}

const PLAYER_PHOTOS: Partial<Record<string, PlayerPhoto>> = {
  ryu: { source: require('../../assets/photo/player/ryu.jpg'), aspect: 500 / 555 }, // 류현진
  pon: { source: require('../../assets/photo/player/pon.jpg'), aspect: 500 / 700 }, // 폰세
  wei: { source: require('../../assets/photo/player/wei.jpg'), aspect: 500 / 625 }, // 와이스
  mdj: { source: require('../../assets/photo/player/mdj.jpg'), aspect: 500 / 506 }, // 문동주
  flo: { source: require('../../assets/photo/player/flo.jpg'), aspect: 500 / 401 }, // 플로리얼
};

export function hasPlayerPhoto(id: string): boolean {
  return PLAYER_PHOTOS[id] !== undefined;
}

/**
 * 선수 얼굴 원형 썸네일.
 *
 * 이 컴포넌트의 본론은 사진이 아니라 **폴백**이다 - 22명 중 17명은 사진이 없다.
 * 빈 원이나 이니셜 글자를 두면 그 자리가 '깨진 자리'로 읽히므로, 같은 지름의 연회색 원에
 * 구단 엠블럼을 얹어 **없는 것이 아니라 다른 것**으로 보이게 한다.
 *
 * **크롭 주의**: 확보한 사진은 대부분 세로 인물사진이고 얼굴은 늘 위쪽에 있다.
 * RN 코어 Image 의 cover 는 세로 **중앙**을 남기므로 얼굴이 잘려 나간다. CSS
 * object-position 에 해당하는 prop 이 없으므로 원본 비율로 표시 높이를 계산해
 * **위를 기준으로** 잘라 넣는다.
 */
export function PlayerAvatar({
  playerId,
  team = 'HH',
  size = 44,
}: {
  playerId: string;
  team?: EmblemTeam;
  size?: number;
}) {
  const photo = PLAYER_PHOTOS[playerId];
  const box = { width: size, height: size, borderRadius: size / 2 };

  if (!photo) {
    // 한화 선수는 모자 마크가 원을 꽉 채운다. 타 구단은 연회색 원 위에 엠블럼을 얹는다
    // (KBO 엠블럼 세트는 대부분 검정·남색 외곽선이라 어두운 면에서 형태가 뭉개진다)
    if (team === 'HH') {
      return <CapMark size={size} />;
    }
    return (
      <View style={[s.avatar, box]}>
        <TeamEmblem team={team} size={Math.round(size * 0.62)} />
      </View>
    );
  }

  const portrait = photo.aspect <= 1;
  const imageStyle = portrait
    ? { width: size, height: size / photo.aspect }
    : { width: size * photo.aspect, height: size };

  return (
    <View style={[s.avatar, box, s.avatarPhoto]}>
      <Image source={photo.source} style={imageStyle} resizeMode="cover" />
    </View>
  );
}

/**
 * 구장 히어로 - 사진 위에 글자를 얹는 자리.
 *
 * 사진 위 텍스트는 사진이 밝든 어둡든 읽혀야 하므로 어두운 오버레이를 깐다.
 * 오버레이 없이 흰 글자를 올리면 하늘이 밝은 컷에서 글자가 사라진다.
 */
export function PhotoHeader({
  source,
  height = 160,
  children,
}: {
  source: ImageSourcePropType;
  height?: number;
  children?: React.ReactNode;
}) {
  return (
    <View style={[s.hero, { height }]}>
      <Image source={source} style={s.heroImage} resizeMode="cover" />
      <View style={s.heroScrim} />
      {children ? <View style={s.heroBody}>{children}</View> : null}
    </View>
  );
}

const s = StyleSheet.create({
  // justifyContent 기본값(flex-start)이 곧 '위 기준 크롭'이다
  avatar: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // 사진일 때만 위로 붙인다 (폴백 엠블럼은 원 가운데에 있어야 한다)
  avatarPhoto: { justifyContent: 'flex-start' },

  hero: { borderRadius: radius.card, overflow: 'hidden', justifyContent: 'flex-end' },
  // RN 0.86 타입에는 absoluteFillObject 가 없다. 같은 값을 직접 적는다
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  heroScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7,17,31,0.46)',
  },
  heroBody: { padding: 18, gap: 4 },
});

/**
 * 폼 루프 - 선수를 고르면 도는 짧은 화면.
 *
 * ── 왜 필요한가 ──────────────────────────────────────────────
 * 이 앱은 스스로를 팬덤 미디어로 정의했는데 선수 화면에 움직이는 것이 하나도 없었다.
 * 증명사진과 표만 있으면 지표는 훌륭해도 **좋아하는 마음이 생길 자리가 없다.**
 *
 * ── 왜 실제 영상이 아닌가 ───────────────────────────────────
 * KBO 경기 영상의 권리는 KBO·구단·중계사가 나눠 갖는다. 구단 앱이라 자체 촬영분은
 * 쓸 수 있지만 중계 화면은 별도 계약이 필요하다. 그래서 PoC 에서는 이미 출처를 확보한
 * 사진(assets/photo/SOURCES.md)에 느린 줌·팬을 입혀 **자리와 리듬만 증명**한다.
 * 실서비스에서는 이 자리에 3~4초 폼 루프가 들어간다.
 *
 * 기록을 파는 팬에게는 폼 자체가 데이터이기도 하다 - 릴리스 포인트, 타격 준비 자세.
 */
export function PlayerFormLoop({
  playerId,
  height = 200,
  label,
}: {
  playerId: string;
  height?: number;
  /** 무엇을 보는 중인지 - '와인드업' · '타격 준비' */
  label: string;
}) {
  const photo = PLAYER_PHOTOS[playerId];
  const [playing, setPlaying] = useState(true);
  const [t] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!photo || !playing) return;
    // 왕복 루프. 한 방향으로만 돌리면 끝에서 툭 끊겨 '영상'이 아니라 '리셋'으로 보인다
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: 3600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: 3600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [photo, playing, t]);

  if (!photo) return null;

  // 확보한 사진은 세로 인물사진이고 **얼굴은 늘 위쪽에 있다.** cover 로 채우면 세로 중앙이
  // 남아 얼굴이 잘려 나간다(PlayerAvatar 가 같은 이유로 위 기준 크롭을 쓴다).
  // 그래서 폭을 채우고 높이는 원본 비율로 흐르게 둔 뒤 위를 기준으로 자른다.
  //
  // 그리고 **확대는 쓰지 않는다.** 이미지가 상자보다 훨씬 크므로 중심 기준 scale 은
  // 조금만 줘도 보이는 구간이 크게 밀려 얼굴이 다시 사라진다. 세로 이동만으로 충분하다.
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });

  return (
    <Pressable
      onPress={() => setPlaying((v) => !v)}
      accessibilityRole="button"
      accessibilityLabel={`${label} 폼 ${playing ? '멈추기' : '재생'}`}
      style={[fl.wrap, { height }]}
    >
      <Animated.Image
        source={photo.source}
        resizeMode="cover"
        style={[fl.img, { aspectRatio: photo.aspect }, { transform: [{ translateY }] }]}
      />
      {/* 위쪽을 덮어야 라벨이 사진 밝기와 무관하게 읽힌다 */}
      <View style={fl.scrim} />
      <View style={fl.head}>
        <View style={[fl.dot, !playing && fl.dotOff]} />
        <Text style={fl.label}>{label}</Text>
      </View>
      <Text style={fl.hint}>{playing ? '탭하면 멈춥니다' : '탭하면 재생'}</Text>
    </Pressable>
  );
}

const fl = StyleSheet.create({
  wrap: { borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.raised },
  // 높이는 aspectRatio 가 정한다. 상자보다 길어진 만큼 아래가 잘리고 얼굴이 남는다
  img: { width: '100%' },
  // 위쪽 라벨이 사진 밝기와 무관하게 읽히도록 전체를 살짝 덮는다
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7,17,31,0.22)',
  },
  head: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: colors.brand },
  dotOff: { backgroundColor: '#FFFFFF' },
  label: { ...typography.micro, color: '#FFFFFF' },
  hint: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.lg,
    ...typography.micro,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.72)',
  },
});

/**
 * 굿즈 회전 전시 - 상세를 열면 상품이 천천히 도는 자리.
 *
 * ── 왜 필요한가 ──────────────────────────────────────────────
 * 굿즈 탭의 섹션이 전부 글자였다 - 놓치기 전에 · 발매 소식 · 구성 · 사이즈.
 * **커머스인데 물건이 안 보였다.** 유니폼은 색과 질감과 등번호 위치를 보고 사는
 * 물건이라, 사이즈 표만 있으면 팬은 결국 다른 데서 사진을 찾아본다.
 * 그 순간 구매 흐름이 앱 밖으로 나간다.
 *
 * ── 어떻게 도는가 ───────────────────────────────────────────
 * RN 코어에는 3D 원근이 없어서 rotateY 를 써도 납작하게 돈다. 대신 가로 폭을
 * 1 → 0.2 → 1 로 줄였다 늘려 **옆면을 지나가는 것처럼** 보이게 한다.
 * 음수까지 내리면 로고가 좌우로 뒤집혀 읽히므로 0 아래로는 가지 않는다.
 * 받침 그림자도 같이 좁아져야 '도는 물체'로 읽힌다.
 *
 * ⚠ 실서비스에서는 이 자리에 360° 촬영본이 들어간다. 자동차·패션 커머스에서 오래 쓰인
 * 방식이고 촬영 비용도 크지 않다. 지금은 확보한 자산(모자·엠블럼)으로 자리만 증명한다.
 */
export function GoodsShowcase({ kind = 'emblem' }: { kind?: 'cap' | 'emblem' }) {
  const [t] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: 5200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  // 한 바퀴 = 앞면 → 옆면 → 앞면 → 옆면 → 앞면
  const turn = t.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 0.2, 1, 0.2, 1],
  });
  const bob = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -4, 0] });

  return (
    <View style={gs.stage}>
      {/* 받침 그림자 - 물체가 옆면을 지날 때 같이 좁아진다 */}
      <Animated.View style={[gs.shadow, { transform: [{ scaleX: turn }] }]} />
      <Animated.Image
        source={
          kind === 'cap'
            ? require('../../assets/logo/cap-2025.png')
            : require('../../assets/logo/emblem-2025.png')
        }
        resizeMode="contain"
        style={[gs.item, { transform: [{ scaleX: turn }, { translateY: bob }] }]}
      />
      <Text style={gs.hint}>360° 전시</Text>
    </View>
  );
}

const gs = StyleSheet.create({
  stage: {
    height: 210,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: { width: '58%', height: '62%' },
  shadow: {
    position: 'absolute',
    bottom: 34,
    width: 130,
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(7,17,31,0.10)',
  },
  hint: {
    position: 'absolute',
    bottom: spacing.md,
    ...typography.micro,
    fontWeight: '400',
    color: colors.mutedText,
  },
});
