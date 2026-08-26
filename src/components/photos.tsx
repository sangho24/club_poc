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
import Svg, { Circle, ClipPath, G, Path } from 'react-native-svg';

import type { Colorway } from '../goods';
import { BATTERS, OPPONENT_PITCHERS, PITCHERS } from '../roster';
import { colors, palette, radius, spacing, typography } from '../theme';

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
// **파일을 넣는 것이 곧 배선이다.** assets/photo/player/ 를 통째로 읽어 파일 이름으로
// 선수를 찾는다. 이름은 로스터의 선수 이름(`노시환.jpg`)이거나 선수 id(`cjh.jpg`)면 된다.
// 사진을 올리고 이름만 맞추면 다음 번들부터 나온다 - 여기에 줄을 더할 일이 없다.
//
// 전에는 require 를 손으로 한 줄씩 나열했다. 정적 require 가 번들 타임에 해석되어
// 템플릿 문자열로 경로를 만들 수 없기 때문이었는데, Metro 의 require.context 가
// 정확히 그 구멍을 메운다(declarations.d.ts 주석 참조).
//
// ⚠ **로스터에 없는 이름은 쓰지 않는다.** 손으로 지도를 관리하던 시절의 규칙 - "남의
//   유니폼을 입은 얼굴은 올리지 않는다" - 을 이제 로스터가 대신 지킨다. 2026 로스터에서
//   빠진 플로리얼(flo.jpg)은 파일이 남아 있어도 여기서 조용히 걸러진다. 지우려면
//   로스터에서 빠지는 것으로 충분하고, 살리려면 파일 이름을 로스터 이름에 맞추면 된다.
const PHOTO_FILES = require.context('../../assets/photo/player', false, /\.(jpg|jpeg|png|webp)$/);

// 파일 이름으로 선수를 찾는 열쇠, 그리고 사진 없는 선수의 아바타에 새길 등번호.
// 로스터를 한 번만 훑어 둘 다 만든다 - 번호를 두 벌 두면 트레이드나 번호 변경 때
// 화면이 로스터와 다른 말을 하게 된다(채은성 9 → 22 가 그랬다).
const PLAYER_BY_KEY: Record<string, string> = {};
const BACK_NUMBERS: Record<string, number> = {};
for (const p of [...BATTERS, ...PITCHERS, ...OPPONENT_PITCHERS]) {
  PLAYER_BY_KEY[p.name] = p.id;
  PLAYER_BY_KEY[p.id] = p.id;
  BACK_NUMBERS[p.id] = p.back;
}

const PLAYER_PHOTOS: Partial<Record<string, ImageSourcePropType>> = {};
for (const key of PHOTO_FILES.keys()) {
  const base = key.replace(/^.*\//, '').replace(/\.[^.]+$/, '');
  const id = PLAYER_BY_KEY[base];
  if (id) PLAYER_PHOTOS[id] = PHOTO_FILES<ImageSourcePropType>(key);
}

/**
 * 얼굴 자리 보정.
 *
 * 인물사진은 얼굴이 늘 위쪽에 있는데 cover 는 **가운데**를 남긴다. 원본 비율을 알면
 * 정확히 계산할 수 있지만 그러면 사진마다 비율을 적어야 해서 "파일만 넣으면 된다"가
 * 깨진다 - react-native-web 에는 resolveAssetSource 가 없어 번들 타임에 알 수도 없다.
 *
 * 대신 **상자보다 키가 큰 칸**에 cover 로 채우고 아래를 잘라 위를 남긴다. 비율을 몰라도
 * 되고, 세로 사진이든 가로 사진이든 얼굴이 있는 위쪽이 살아남는다.
 */
const FACE_BIAS = 1.2;

export function hasPlayerPhoto(id: string): boolean {
  return PLAYER_PHOTOS[id] !== undefined;
}

/**
 * 유니폼 아바타 - 사진이 없는 한화 선수의 얼굴 자리.
 *
 * ── 왜 모자 마크로는 부족한가 ───────────────────────────────
 * 전에는 사진 없는 한화 선수가 전원 같은 모자 마크였다. 다섯 명일 때는 견딜 만했지만
 * 서른둘이 되면 **선수 목록 한 화면이 똑같은 동그라미 열 줄**이 된다. 아바타가 아무도
 * 가리키지 못하면 그 자리는 '사진이 없는 것'이 아니라 **'정보가 없는 것'**이 된다.
 *
 * ── 그래서 무엇을 그리나 ────────────────────────────────────
 * 얼굴은 지어낼 수 없다. 하지만 **유니폼은 지어내는 것이 아니다.** 등번호는 로스터가
 * 이미 갖고 있는 사실이고 색은 구단 CI 다. 홈 유니폼 등판을 그대로 옮긴다 -
 * 오렌지 칼라 · 따뜻한 흰 원단 · 네이비 등번호.
 *
 * 32px 에서는 번호만 읽히는데 그것이 맞다. 관중석에서 등번호가 하는 일이 정확히 그것이다.
 *
 * ⚠ 실서비스에서는 이 자리에 구단 프로필 촬영본이 들어간다. 그때도 이 컴포넌트는
 *   시즌 중 합류처럼 **촬영이 아직 없는 선수**의 자리로 남는다 - 지울 코드가 아니다.
 */
export function JerseyAvatar({ back, size = 44 }: { back: number; size?: number }) {
  const digits = String(back);
  // 두 자리는 폭이 두 배다. 같은 크기로 두면 칼라 아래 폭을 넘어 원 밖으로 밀린다
  const fontSize = Math.round(size * (digits.length > 1 ? 0.36 : 0.42));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* 원단. 순백으로 두면 흰 카드 위에서 원의 아래쪽 절반이 사라져 테두리를 준다 */}
        <Circle
          cx={50}
          cy={50}
          r={49}
          fill={palette.orange[50]}
          stroke={palette.orange[200]}
          strokeWidth={2}
        />
        {/* 칼라 - 원의 위쪽을 가로지르는 현(chord)이다. y=26 에서 r=49 원과 만나는 x 가 7.28 */}
        <Path d="M7.28 26A49 49 0 0 1 92.72 26Z" fill={colors.brand} />
        {/* 목둘레 - 언더셔츠가 비치는 자리라 네이비다 */}
        <Path d="M35 26C37 41 63 41 65 26Z" fill={palette.navy[900]} />
      </Svg>
      {/* 번호는 **칼라 아래 74% 의 한가운데**에 온다. 원 전체의 한가운데가 아니다 */}
      <View style={[j.numberBox, { top: size * 0.26 }]}>
        <Text style={[j.number, { fontSize, lineHeight: Math.round(fontSize * 1.06) }]}>
          {digits}
        </Text>
      </View>
    </View>
  );
}

const j = StyleSheet.create({
  numberBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { fontWeight: '800', color: palette.navy[900], letterSpacing: -0.5 },
});

/**
 * 선수 얼굴 원형 썸네일.
 *
 * 이 컴포넌트의 본론은 사진이 아니라 **폴백**이다 - 35명 중 32명은 사진이 없다.
 * 빈 원이나 이니셜 글자를 두면 그 자리가 '깨진 자리'로 읽히므로, 한화 선수는 등번호가
 * 박힌 유니폼 아바타로, 타 구단 선수는 연회색 원 위의 엠블럼으로 채워
 * **없는 것이 아니라 다른 것**으로 보이게 한다.
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
    // 한화 선수는 등번호를 새긴 유니폼 아바타로 채운다. 타 구단은 연회색 원 위에 엠블럼을
    // 얹는다 (KBO 엠블럼 세트는 대부분 검정·남색 외곽선이라 어두운 면에서 형태가 뭉개진다)
    if (team === 'HH') {
      const back = BACK_NUMBERS[playerId];
      // 로스터에 없는 id 는 번호도 없다 - 최애 미선택('')이나 지난 시즌 선수가 그렇다.
      // 그 자리에는 지어낸 번호 대신 모자 마크를 둔다
      return back === undefined ? <CapMark size={size} /> : <JerseyAvatar back={back} size={size} />;
    }
    return (
      <View style={[s.avatar, box]}>
        <TeamEmblem team={team} size={Math.round(size * 0.62)} />
      </View>
    );
  }

  return (
    <View style={[s.avatar, box, s.avatarPhoto]}>
      <Image
        source={photo}
        style={{ width: size, height: size * FACE_BIAS }}
        resizeMode="cover"
      />
    </View>
  );
}

// ── 유니폼 그림 ───────────────────────────────────────────────
/**
 * 유니폼 앞판.
 *
 * ── 왜 사진이 아니라 그림인가 ───────────────────────────────
 * 옷을 고르는 화면인데 옷이 안 보였다. 그렇다고 아무 사진이나 주워 오면 출처가
 * 불명확해지고(이 파일 머리의 라이선스 원칙), 구단 상품 촬영본은 PoC 에 없다.
 *
 * 유니폼은 **얼굴과 달리 지어내는 것이 아니다.** 원단 색과 트림은 구단 CI 가 이미
 * 정해 둔 사실이라 그려도 거짓이 되지 않는다 - JerseyAvatar 가 등판을 그린 것과
 * 같은 논리다. 그리고 옷을 고르는 자리에서 팬이 먼저 보는 것은 **색**이지 글자가
 * 아니므로, 색과 트림만 정확하면 타일은 제 일을 한다.
 *
 * ⚠ 실서비스에서는 이 자리에 상품 촬영본이 들어간다. 그때는 colorway 대신 source 를
 *   받게 바꾸면 되고, 타일 레이아웃은 그대로 쓴다.
 */
interface JerseyPaint {
  /** 원단 */
  body: string;
  /** 칼라 · 소매 트림 */
  trim: string;
  /** 앞섶 선 - 원단 위에서 읽혀야 한다 */
  placket: string;
  /** 원단이 밝을 때만 외곽선을 준다. 흰 옷을 흰 타일에 두면 형태가 사라진다 */
  edge?: string;
  /** 핀스트라이프 (헤리티지) */
  stripe?: string;
}

const COLORWAYS: Record<Colorway, JerseyPaint> = {
  home: { body: '#FFFFFF', trim: colors.brand, placket: palette.navy[900], edge: palette.navy[200] },
  // 원정은 회색이다. 네이비로 두면 얼트(오렌지)와 대비만 남고 '원정'이라는 사실이 사라진다
  away: { body: palette.navy[300], trim: palette.navy[900], placket: '#FFFFFF' },
  alt: { body: colors.brand, trim: palette.navy[900], placket: '#FFFFFF' },
  // 1999 복각은 크림 원단에 네이비 핀스트라이프다
  heritage: {
    body: '#F3EADA',
    trim: palette.navy[900],
    placket: palette.navy[900],
    edge: '#DCCDB4',
    stripe: 'rgba(7,17,31,0.20)',
  },
  youth: { body: '#FFFFFF', trim: colors.brand, placket: palette.navy[900], edge: palette.navy[200] },
};

// 앞판 실루엣 - 목둘레에서 시작해 오른소매 · 밑단 · 왼소매를 돌아 닫는다.
// 120 격자에 그려 두면 어느 크기로 놓든 같은 비율로 확대된다.
const JERSEY_BODY =
  'M46 20Q60 37 74 20L98 27Q106 30 108 40L112 54Q113 59 108 61L88 66L90 104' +
  'Q90 108 86 108L34 108Q30 108 30 104L32 66L12 61Q7 59 8 54L12 40Q14 30 22 27Z';
const JERSEY_COLLAR = 'M46 20Q60 37 74 20';

export function JerseyArt({ colorway, height = 132 }: { colorway: Colorway; height?: number }) {
  const c = COLORWAYS[colorway];

  return (
    <Svg width={height} height={height} viewBox="0 0 120 120">
      <Path
        d={JERSEY_BODY}
        fill={c.body}
        stroke={c.edge ?? 'none'}
        strokeWidth={c.edge ? 1.5 : 0}
        strokeLinejoin="round"
      />
      {/* 핀스트라이프는 옷 밖으로 나가면 안 된다 - 앞판을 클립 경로로 쓴다.
          id 는 문서 전역이라 색 계열로 갈라 둔다 - 같은 화면에 둘이 뜨면 충돌한다 */}
      {c.stripe ? (
        <>
          <ClipPath id={`jersey-${colorway}`}>
            <Path d={JERSEY_BODY} />
          </ClipPath>
          <G clipPath={`url(#jersey-${colorway})`}>
            {[38, 46, 54, 62, 70, 78].map((x) => (
              <Path key={x} d={`M${x} 14V112`} stroke={c.stripe} strokeWidth={2} />
            ))}
          </G>
        </>
      ) : null}
      {/* 칼라 - 목둘레를 따라 굵게 한 번 */}
      <Path
        d={JERSEY_COLLAR}
        fill="none"
        stroke={c.trim}
        strokeWidth={7}
        strokeLinecap="round"
      />
      {/* 소매 트림 - 커프스 자리에 짧게 */}
      <Path d="M12 55L34 61" fill="none" stroke={c.trim} strokeWidth={5} strokeLinecap="round" />
      <Path d="M108 55L86 61" fill="none" stroke={c.trim} strokeWidth={5} strokeLinecap="round" />
      {/* 앞섶 - 목 아래 V 끝에서 밑단까지 */}
      <Path
        d="M60 34V104"
        fill="none"
        stroke={c.placket}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.55}
      />
    </Svg>
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
  // 그래서 상자보다 키가 큰 칸에 채우고 아래를 잘라 위를 남긴다 - FACE_BIAS 주석 참조.
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
        source={photo}
        resizeMode="cover"
        style={[fl.img, { height: height * FACE_BIAS }, { transform: [{ translateY }] }]}
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
  // 높이는 FACE_BIAS 가 정한다. 상자보다 길어진 만큼 아래가 잘리고 얼굴이 남는다
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
