// ─────────────────────────────────────────────────────────────
// 구단 앱 영속 저장소 레이어 - kbo_poc 의 storage.ts 패턴을 이식
//
// 온보딩 완료 여부·프로필(지식수준·최애 선수·알림)처럼 새로고침 후에도
// 남아 있어야 하는 값을 저장한다.
//
// 구현 방침 (외부 패키지 추가 금지 컨벤션 준수 - AsyncStorage 미사용):
//   · 웹      : localStorage - 시연이 웹 중심이라 실제 영속은 여기서만 필요
//   · 네이티브: 인메모리 폴백 - 앱을 껐다 켜면 초기화됨 (현재 시연 범위에서는 허용)
//
// ※ AsyncStorage 교체 지점: 공개 API가 모두 Promise 기반이므로 네이티브 영속화가
//   필요해지면 아래 memoryBackend 를 AsyncStorage 호출로 바꾸기만 하면 된다.
// ─────────────────────────────────────────────────────────────
import { Platform } from 'react-native';

// 저장소 키 - 같은 브라우저의 kbo_poc(kbo.*)와 섞이지 않도록 'club.' 접두사
export const STORAGE_KEYS = {
  /** 온보딩 최초 1회 노출 제어 플래그 */
  onboardingDone: 'club.onboardingDone',
  /**
   * 프로필 한 덩어리 (지식수준·최애 선수·알림 항목별 플래그).
   * 항목이 늘 때 키를 새로 파지 않고 필드를 더한 뒤 읽을 때 채워 넣는다
   * (src/profile.ts 의 normalizeProfile 이 예전 저장값 호환의 유일한 지점).
   */
  profile: 'club.profile',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// 문자열 단위 저장 백엔드 (JSON 직렬화는 상위 API에서 처리)
interface StorageBackend {
  read: (key: string) => string | null;
  write: (key: string, value: string) => void;
  remove: (key: string) => void;
}

// ── 인메모리 백엔드 ──────────────────────────────────────────
// 네이티브 기본값이자, 웹에서 localStorage 접근이 막혔을 때의 폴백
const memoryMap = new Map<string, string>();

const memoryBackend: StorageBackend = {
  read: (key) => memoryMap.get(key) ?? null,
  write: (key, value) => {
    memoryMap.set(key, value);
  },
  remove: (key) => {
    memoryMap.delete(key);
  },
};

// ── 웹 localStorage 백엔드 ───────────────────────────────────
// 사파리 프라이빗 모드·쿠키 차단 환경에서는 접근 자체가 예외를 던지므로
// 실제 쓰기까지 시험해 보고 사용 가능할 때만 채택한다.
function resolveWebBackend(): StorageBackend | null {
  if (Platform.OS !== 'web') return null;
  try {
    if (typeof globalThis.localStorage === 'undefined') return null;
    const ls = globalThis.localStorage;
    const probeKey = 'club.__probe';
    ls.setItem(probeKey, '1');
    ls.removeItem(probeKey);
    return {
      read: (key) => ls.getItem(key),
      write: (key, value) => ls.setItem(key, value),
      remove: (key) => ls.removeItem(key),
    };
  } catch {
    // 접근 불가 - 인메모리로 조용히 폴백한다
    return null;
  }
}

// 백엔드는 최초 사용 시점에 한 번만 결정한다 (import 시점 부작용 방지)
let backend: StorageBackend | null = null;

function getBackend(): StorageBackend {
  if (!backend) backend = resolveWebBackend() ?? memoryBackend;
  return backend;
}

// ── 공개 API (Promise 기반) ──────────────────────────────────

/**
 * 저장된 JSON 값을 읽는다.
 * 값이 없거나·JSON 이 깨졌거나·검증(isValid)에 실패하면 기본값으로 복구한다.
 */
export async function loadValue<T>(
  key: StorageKey,
  fallback: T,
  isValid?: (value: unknown) => boolean,
): Promise<T> {
  try {
    const raw = getBackend().read(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (isValid && !isValid(parsed)) return fallback;
    return parsed as T;
  } catch {
    // 깨진 값은 버리고 기본값으로 복구 (다음 저장 때 정상 값으로 덮어써진다)
    return fallback;
  }
}

/** 값을 JSON 으로 직렬화해 저장한다. */
export async function saveValue<T>(key: StorageKey, value: T): Promise<void> {
  try {
    getBackend().write(key, JSON.stringify(value));
  } catch {
    // 용량 초과(QuotaExceeded) 등 - 시연 동작에는 영향이 없으므로 조용히 무시
  }
}

/** 저장된 값을 삭제한다. */
export async function removeValue(key: StorageKey): Promise<void> {
  try {
    getBackend().remove(key);
  } catch {
    // 삭제 실패도 무시 (다음 저장이 덮어쓴다)
  }
}
