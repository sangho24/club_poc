import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent 는 AppRegistry.registerComponent('main', () => App) 을 호출하고,
// Expo Go / 네이티브 빌드 어느 환경에서 열든 같은 진입점이 되도록 환경을 맞춰 준다.
registerRootComponent(App);
