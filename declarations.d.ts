// assets/icons/*.svg 를 컴포넌트로 불러온다 (metro.config.js 의 svg transformer)
declare module '*.svg' {
  import type { FC } from 'react';
  import type { SvgProps } from 'react-native-svg';
  const content: FC<SvgProps>;
  export default content;
}

// Metro 의 require.context - 폴더를 통째로 읽는다.
//
// 정적 require 는 번들 타임에 해석되므로 템플릿 문자열로 경로를 만들 수 없다. 그래서
// 자산 지도를 손으로 나열하게 되는데, require.context 가 바로 그 구멍을 메운다.
// expo/metro-config 가 transformer.unstable_allowRequireContext 를 켜 둔다.
interface RequireContext {
  keys(): string[];
  <T = unknown>(id: string): T;
}

interface NodeRequire {
  context(directory: string, useSubdirectories?: boolean, regExp?: RegExp): RequireContext;
}
