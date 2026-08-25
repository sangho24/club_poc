// MY - 프로필 · 알림 · 나의 직관 (kbo_poc MY 탭의 구단 앱 이식판)
//
// kbo_poc MY 는 응원 구단 / 알림 / 프로필 / 내 선수 / 직관 인증 / 원장 / 앱 정보의
// 7개 계단식(Disclosure) 섹션이다. 구단 앱은 응원 구단이 정해져 있고 최애도 한 명이라
// 접을 만큼 길지 않다 - 아코디언 없이 이 앱의 기본 문법(작은 회색 머리글 + 그룹 리스트)로
// 전부 펼쳐 둔다.
//
//   프로필      최애 선수(홈과 같은 픽커) · 설명 깊이 · 온보딩 다시 하기
//   알림        온보딩 STEP 3 와 같은 세 스위치 - 온보딩 이후의 유일한 변경 지점
//   나의 직관   직관 기록과 집계 (kbo_poc 정체성 원장의 라이트판)
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  AlertToggle,
  Card,
  DetailSheet,
  Divider,
  GroupCard,
  Row,
  SectionTitle,
  Segmented,
  StatTile,
} from '../components/common';
import { FavoritePicker } from '../components/FavoritePicker';
import { PlayerAvatar } from '../components/photos';
import { ATTENDANCE, attendanceSummary } from '../my';
import { KNOWLEDGE_OPTIONS, KnowledgeLevel, UserProfile } from '../profile';
import { BATTERS, PITCHERS } from '../roster';
import { colors, spacing, tabularFigures, typography } from '../theme';

export function MyScreen({
  profile,
  onLevel,
  onFavorite,
  onAlert,
  onResetOnboarding,
}: {
  profile: UserProfile;
  onLevel: (l: KnowledgeLevel) => void;
  onFavorite: (id?: string) => void;
  onAlert: (key: keyof UserProfile['alerts'], value: boolean) => void;
  onResetOnboarding: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  const fav =
    BATTERS.find((b) => b.id === profile.favoritePlayerId) ??
    PITCHERS.find((p) => p.id === profile.favoritePlayerId);
  const favSub = fav
    ? 'pos' in fav
      ? `${fav.back} · ${fav.pos}`
      : `${fav.back} · ${fav.role}`
    : undefined;

  const summary = attendanceSummary(ATTENDANCE);

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.screenX,
          paddingBottom: spacing.scrollBottom,
        }}
      >
        {/* ── 프로필 ─────────────────────────────────────────── */}
        <SectionTitle title="프로필" />
        <Card>
          <Row style={st.favRow} onPress={() => setPickerOpen(true)}>
            <PlayerAvatar playerId={fav?.id ?? ''} size={44} />
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={st.favLabel}>최애 선수</Text>
              <Text style={st.favName}>{fav ? fav.name : '아직 없어요'}</Text>
            </View>
            {favSub ? <Text style={st.favSub}>{favSub}</Text> : null}
            <Text style={st.chevron}>›</Text>
          </Row>

          <Divider />

          <Text style={st.blockLabel}>설명 깊이</Text>
          <Segmented
            options={KNOWLEDGE_OPTIONS.map((o) => ({ key: o.key, label: o.short }))}
            value={profile.level}
            onChange={onLevel}
          />
          <Text style={st.levelNote}>
            {KNOWLEDGE_OPTIONS.find((o) => o.key === profile.level)?.desc}
          </Text>

          <Divider />

          {/* 항목별 수정 화면 대신 온보딩을 다시 태운다 - 시연 반복과 개발 확인에 모두 필요하다 */}
          <Pressable
            onPress={onResetOnboarding}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="온보딩 다시 하기"
          >
            <Text style={st.resetText}>온보딩 다시 하기 ›</Text>
          </Pressable>
        </Card>

        {/* ── 알림 - 온보딩 STEP 3 와 같은 부품 ──────────────── */}
        <SectionTitle title="알림" />
        <GroupCard style={{ paddingHorizontal: spacing.cardPad }}>
          <Row>
            <View style={{ flex: 1 }}>
              <AlertToggle
                on={profile.alerts.clutch}
                onPress={() => onAlert('clutch', !profile.alerts.clutch)}
                label="결정적 순간"
                caption="레버리지가 치솟는 타석"
              />
            </View>
          </Row>
          <Row>
            <View style={{ flex: 1 }}>
              <AlertToggle
                on={profile.alerts.goodsDrop}
                onPress={() => onAlert('goodsDrop', !profile.alerts.goodsDrop)}
                label="굿즈 발매"
                caption="발매 시작 · 품절 임박 · 최애 선수 굿즈"
              />
            </View>
          </Row>
          <Row last>
            <View style={{ flex: 1 }}>
              <AlertToggle
                on={profile.alerts.ticketOpen}
                onPress={() => onAlert('ticketOpen', !profile.alerts.ticketOpen)}
                label="예매 오픈"
                caption="예매가 열리는 시각"
              />
            </View>
          </Row>
        </GroupCard>

        {/* ── 나의 직관 ──────────────────────────────────────── */}
        <SectionTitle title="나의 직관" right={<Text style={st.headNote}>2026 시즌</Text>} />
        <Card>
          <View style={st.tileRow}>
            <StatTile label="직관" value={`${summary.games}회`} tone="brand" />
            <StatTile label="전적" value={`${summary.wins}-${summary.losses}`} />
            <StatTile label="승률" value={summary.winRate.toFixed(3)} />
          </View>

          <Divider />

          {/* 요약 셋은 "올해 내가 얼마나 갔나"에 답하고 끝난다. 어느 날 누구와
              어디 앉았는지는 **다시 들춰 볼 때만** 필요한 것이라 눌러서 연다 */}
          <Row last style={st.logRow} onPress={() => setLogOpen(true)}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={st.logLabel}>경기 기록</Text>
              <Text style={st.logHint}>{ATTENDANCE.length}경기 · 날짜 · 상대 · 좌석</Text>
            </View>
            <Text style={st.chevron}>›</Text>
          </Row>
        </Card>

        {/* iOS 설정 하단의 버전 표기 문법 - 카드가 아니라 지면에 직접 */}
        <Text style={st.appInfo}>이글스 앱 PoC v0.1 · 모든 데이터는 시연용 샘플</Text>
      </ScrollView>

      <DetailSheet
        visible={logOpen}
        title="경기 기록"
        subtitle={`2026 시즌 · ${summary.games}회`}
        onClose={() => setLogOpen(false)}
      >
        <GroupCard>
          {ATTENDANCE.map((r, i) => (
            <View key={r.date} style={[st.gameRow, i < ATTENDANCE.length - 1 && st.gameDivider]}>
              <Text style={st.gameDate}>{r.date}</Text>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={st.gameTitle}>
                  {r.opponent}전 {r.score}
                </Text>
                <Text style={st.gameSeat}>{r.seat}</Text>
              </View>
              <Text style={[st.gameResult, { color: r.result === 'W' ? colors.win : colors.lose }]}>
                {r.result === 'W' ? '승' : '패'}
              </Text>
            </View>
          ))}
        </GroupCard>
      </DetailSheet>

      <FavoritePicker
        visible={pickerOpen}
        current={profile.favoritePlayerId}
        onSelect={onFavorite}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}

const st = StyleSheet.create({
  favRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  favLabel: typography.micro,
  favName: { ...typography.bodyStrong, fontSize: 16 },
  favSub: typography.micro,
  chevron: { fontSize: 18, color: colors.mutedText },

  blockLabel: typography.label,
  levelNote: typography.caption,

  resetText: { ...typography.caption, color: colors.brandText, fontWeight: '700' },

  headNote: typography.micro,
  tileRow: { flexDirection: 'row', gap: spacing.sm },

  // 접어 둔 기록을 여는 줄 - 카드 안이라 Row 의 좌우 여백을 지우고 카드에 맞춘다
  logRow: { paddingHorizontal: 0, paddingVertical: 0 },
  logLabel: { fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  logHint: { ...typography.micro, fontWeight: '500', lineHeight: 17 },

  gameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 10 },
  gameDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  gameDate: { ...typography.caption, ...tabularFigures, width: 40 },
  gameTitle: { ...typography.bodyStrong, fontSize: 14 },
  gameSeat: typography.micro,
  gameResult: { fontSize: 14, fontWeight: '700' },

  appInfo: { ...typography.micro, textAlign: 'center', marginTop: spacing.xxl },
});
