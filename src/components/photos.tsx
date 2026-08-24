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
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

import { colors, radius } from '../theme';

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
  heroImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
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
