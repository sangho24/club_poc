// Metro 설정 - SVG 파일을 컴포넌트로 불러오기 위해서만 존재한다.
//
// 아이콘을 코드 안에 path 문자열로 박아 두면 **고치려면 개발자가 필요해진다.**
// assets/icons/*.svg 로 빼 두면 벡터 편집기로 열어 고치고 그대로 덮어쓰면 된다.
//
// 색은 파일에 넣지 않는다 - 전부 currentColor 로 두고 쓰는 쪽에서 color 를 준다.
// 선택/비선택 두 벌을 겹쳐 교차시키는 하단 탭이 그래야 동작한다.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer/expo');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = config;
