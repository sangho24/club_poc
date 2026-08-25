// assets/icons/*.svg 를 컴포넌트로 불러온다 (metro.config.js 의 svg transformer)
declare module '*.svg' {
  import type { FC } from 'react';
  import type { SvgProps } from 'react-native-svg';
  const content: FC<SvgProps>;
  export default content;
}
