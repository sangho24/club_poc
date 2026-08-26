// 한화 이글스 구단 앱 (PoC)
//
// ── 이 앱이 KBO 공식 앱과 다른 점 ────────────────────────────
//   KBO 앱  = 리그의 공적 인프라. 열 개 구단을 공평하게 다루고, 원정 팬을 돕고, 공시를 낸다
//   구단 앱 = 한 구단의 팬덤 미디어. 우리 팀 하나만 깊게 파고, 커머스를 판다
//
// 시각 문법은 KBO 앱과 **같은 것을 쓴다**(iOS 그룹 리스트 · 떠 있는 캡슐 탭 · 작은 회색
// 머리글). 구단 앱임을 드러내는 것은 색의 면적이 아니라 자리다 - 브랜드 마크·선택 상태·
// 핵심 수치를 이글스 오렌지가 가져가고, 지면과 본문은 무채색이 가져간다.
//
// ── 온보딩·개인화 (kbo_poc S1 이식) ──────────────────────────
// 프로필(지식수준·최애 선수·알림)은 저장소(src/storage.ts)에 영속된다. 온보딩은
// 최초 1회만 탭 앞에 놓이고, 이후의 개별 변경(설명 깊이·최애 변경)은 각 화면이 갖는다.
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';

import { GamedayScreen, Sub } from './src/screens/GamedayScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LiveScreen } from './src/screens/LiveScreen';
import { MyScreen } from './src/screens/MyScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { PlayersScreen } from './src/screens/PlayersScreen';
import { StoreScreen } from './src/screens/StoreScreen';
import { ClubWordmark } from './src/components/photos';
import { TabBar, TabIconName } from './src/components/TabBar';
import {
  BellButton,
  GroupCard,
  DetailSheet,
  Row,
  SectionTitle,
  Skeleton,
  SkeletonCard,
} from './src/components/common';
import { DEFAULT_PROFILE, KnowledgeLevel, UserProfile, normalizeProfile } from './src/profile';
import { ATTENDANCE, attendanceSummary, membershipOf } from './src/my';
import { NOTICE_LABEL, noticesFor, unreadCount } from './src/notifications';
import { STORAGE_KEYS, loadValue, saveValue } from './src/storage';
import { colors, pressHighlight, radius, spacing, typography } from './src/theme';

export type TabKey = 'home' | 'live' | 'players' | 'gameday' | 'store' | 'my';

// 픽토그램은 글자를 그림으로 되풀이하는 것이 아니라 **그 탭이 무엇을 하는 곳인지**를
// 가리킨다. 그래서 선수는 사람이 아니라 배트다 - 사람을 쓰면 MY 와 겹치고, 이 탭은
// '나'가 아니라 '선수단'이기 때문이다.
const TABS: { key: TabKey; label: string; icon: TabIconName }[] = [
  { key: 'home', label: '홈', icon: 'home' },
  { key: 'live', label: '라이브', icon: 'live' },
  { key: 'players', label: '선수', icon: 'bat' },
  { key: 'gameday', label: '직관', icon: 'diamond' },
  { key: 'store', label: '굿즈', icon: 'bag' },
  { key: 'my', label: 'MY', icon: 'person' },
];

export default function App() {
  const [tab, setTab] = useState<TabKey>('home');
  // 직관 탭의 서브탭. MY 의 쿠폰이 후원의 집을 바로 열 수 있어야 해서 여기 둔다
  const [gamedaySub, setGamedaySub] = useState<Sub>('go');
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  // 저장소를 읽기 전에 온보딩이 번쩍이면 안 된다 - 읽기가 끝날 때까지 자리표시자를 그린다
  const [boot, setBoot] = useState<'loading' | 'onboarding' | 'ready'>('loading');
  const [noticeOpen, setNoticeOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const done = await loadValue<boolean>(STORAGE_KEYS.onboardingDone, false);
      const stored = await loadValue<unknown>(STORAGE_KEYS.profile, null);
      if (stored !== null) setProfile(normalizeProfile(stored));
      setBoot(done ? 'ready' : 'onboarding');
    })();
  }, []);

  // 프로필 변경은 전부 이 함수를 지나 저장소에 남는다
  const updateProfile = (p: UserProfile) => {
    setProfile(p);
    void saveValue(STORAGE_KEYS.profile, p);
  };

  const setLevel = (level: KnowledgeLevel) => updateProfile({ ...profile, level });
  // 선수 탭의 '지표 편집'. 최애 선수·알림과 같은 길로 저장소까지 간다 -
  // 고른 세 칸이 새로고침에 날아가면 그건 편집이 아니라 그때뿐인 필터다
  const setBatterMetrics = (batterMetrics: string[]) =>
    updateProfile({ ...profile, batterMetrics });
  const setPitcherMetrics = (pitcherMetrics: string[]) =>
    updateProfile({ ...profile, pitcherMetrics });
  const setFavorite = (id?: string) => updateProfile({ ...profile, favoritePlayerId: id });
  const setAlert = (key: keyof UserProfile['alerts'], value: boolean) =>
    updateProfile({ ...profile, alerts: { ...profile.alerts, [key]: value } });

  // MY 의 '온보딩 다시 하기' - 현재 프로필에서 시작한다 (kbo_poc 판단 유지)
  const resetOnboarding = () => {
    void saveValue(STORAGE_KEYS.onboardingDone, false);
    setBoot('onboarding');
  };

  const completeOnboarding = (p: UserProfile) => {
    updateProfile(p);
    void saveValue(STORAGE_KEYS.onboardingDone, true);
    setBoot('ready');
  };

  // 등급은 저장하지 않고 직관 기록에서 매번 집계한다 (my.ts 의 원칙)
  const { tier } = membershipOf(attendanceSummary(ATTENDANCE).games);
  // 프로필에서 끈 종류는 애초에 도착하지 않는다 - 설정이 실제로 작동한다는 증거가 된다
  const notices = noticesFor(profile);
  const unread = unreadCount(profile);

  // 프로필을 읽는 동안. 전에는 빈 화면을 그렸는데, 빈 화면은 '오는 중'이 아니라
  // '아무것도 없음'으로 읽혀서 앱이 죽은 것처럼 보인다. 뼈대를 먼저 세워 두면
  // 같은 대기 시간이 '곧 채워질 자리'가 된다.
  if (boot === 'loading') {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
        <View style={s.brandBar}>
          <ClubWordmark height={22} />
        </View>
        <View style={s.bootBody}>
          <Skeleton h={148} style={{ borderRadius: radius.card }} />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </SafeAreaView>
    );
  }

  if (boot === 'onboarding') {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
        <OnboardingScreen initialProfile={profile} onDone={completeOnboarding} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      {/* ── 상단 브랜드 바 ───────────────────────────────────
          전에는 오른쪽에 "대전 한화생명 볼파크" 가 박혀 있었다. 홈구장은 바뀌지 않으므로
          매 화면 같은 값을 반복하면서 가장 비싼 자리를 쓰고 있었고, 로고와 텍스트가
          양끝으로 벌어져 있어 로고가 브랜드가 아니라 **레이블**처럼 읽혔다.
          그 자리는 변하는 것이 가져간다 - 등급과 안 읽은 알림. */}
      <View style={s.brandBar}>
        {/* 26px 에서는 워드마크 위쪽의 'Hanwha' 가 뭉개져 읽히지 않는다.
            두 줄로 짜인 로고라 작은 쪽 글자가 판독 하한을 정한다 */}
        <ClubWordmark height={32} />
        <View style={s.barRight}>
          <Pressable
            onPress={() => setTab('my')}
            style={({ pressed }) => [s.tierPill, pressed && pressHighlight]}
            accessibilityRole="button"
            accessibilityLabel={`멤버십 ${tier.label}`}
          >
            <Text style={s.tierText}>{tier.label}</Text>
          </Pressable>
          <BellButton count={unread} onPress={() => setNoticeOpen(true)} />
        </View>
      </View>

      {/* ── 본문 ───────────────────────────────────────────── */}
      <View style={{ flex: 1 }}>
        {tab === 'home' ? (
          <HomeScreen
            profile={profile}
            onFavorite={setFavorite}
            onGoLive={() => setTab('live')}
            onGo={setTab}
          />
        ) : null}
        {tab === 'live' ? <LiveScreen profile={profile} /> : null}
        {tab === 'players' ? (
          <PlayersScreen
            profile={profile}
            onBatterMetrics={setBatterMetrics}
            onPitcherMetrics={setPitcherMetrics}
          />
        ) : null}
        {tab === 'gameday' ? <GamedayScreen sub={gamedaySub} onSub={setGamedaySub} /> : null}
        {tab === 'store' ? <StoreScreen profile={profile} /> : null}
        {tab === 'my' ? (
          <MyScreen
            onGoPartners={() => {
              setGamedaySub('eat');
              setTab('gameday');
            }}
            profile={profile}
            onLevel={setLevel}
            onFavorite={setFavorite}
            onAlert={setAlert}
            onResetOnboarding={resetOnboarding}
          />
        ) : null}
      </View>

      {/* ── 하단 탭 - 떠 있는 캡슐. 누르거나, 옆으로 끌어서 옮긴다 ─── */}
      <TabBar tabs={TABS} value={tab} onChange={setTab} />

      {/* ── 알림함 ─────────────────────────────────────────
          온보딩에서 켠 스위치가 닿는 곳. 여기가 없으면 그 온보딩은 묻기만 하고
          지키지 않은 약속이 된다. */}
      <DetailSheet
        visible={noticeOpen}
        title="알림"
        subtitle={unread > 0 ? `안 읽은 소식 ${unread}건` : '새 소식 없음'}
        onClose={() => setNoticeOpen(false)}
      >
        {notices.length === 0 ? (
          <>
            <SectionTitle title="받는 알림이 없습니다" />
            <GroupCard>
              <Row last>
                <Text style={s.noticeEmpty}>
                  MY 에서 알림을 켜면 결정적 순간·굿즈 발매·예매 오픈 소식이 여기로 옵니다.
                </Text>
              </Row>
            </GroupCard>
          </>
        ) : (
          <GroupCard>
            {notices.map((n, i) => (
              <Row key={n.id} last={i === notices.length - 1} style={s.noticeRow}>
                {/* 안 읽은 것만 점을 단다. 읽은 것도 목록에 남아야 "왔었다"가 남는다 */}
                <View style={[s.noticeDot, !n.unread && { backgroundColor: 'transparent' }]} />
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={s.noticeHead}>
                    <Text style={s.noticeKind}>{NOTICE_LABEL[n.kind]}</Text>
                    <Text style={s.noticeAt}>{n.at}</Text>
                  </View>
                  <Text style={s.noticeTitle}>{n.title}</Text>
                  <Text style={s.noticeBody}>{n.body}</Text>
                </View>
              </Row>
            ))}
          </GroupCard>
        )}
      </DetailSheet>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  // 부팅 자리표시자 - 홈 화면의 골격(히어로 + 카드 둘)과 같은 리듬으로 둔다
  bootBody: { paddingHorizontal: spacing.screenX, paddingTop: spacing.lg, gap: spacing.cardGap },

  brandBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX,
    // 바탕색이 페이지와 같아서 경계가 없으면 로고가 콘텐츠 위에 떠 있는 것처럼 보인다.
    // 헤어라인 하나가 "여기까지가 크롬"을 말해 준다
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  // 로고 반대편 - 변하는 값만 온다
  barRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tierPill: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.chip,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tierText: { ...typography.micro, color: colors.brandText, letterSpacing: 0.6 },

  noticeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  noticeDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.brand,
    marginTop: 7,
  },
  noticeHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noticeKind: { ...typography.micro, color: colors.brandText },
  noticeAt: typography.micro,
  noticeTitle: { ...typography.bodyStrong, lineHeight: 20 },
  noticeBody: { ...typography.caption, lineHeight: 18 },
  noticeEmpty: { ...typography.body, flex: 1 },
});
