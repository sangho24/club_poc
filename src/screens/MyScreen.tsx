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
  DetailSheet,
  Divider,
  GroupCard,
  Row,
  SectionCard,
  Segmented,
  StatTile,
} from '../components/common';
import { FavoritePicker } from '../components/FavoritePicker';
import { PlayerAvatar } from '../components/photos';
import { SEAT_GRADES } from '../gameday';
import { STANDING } from '../game';
import { ATTENDANCE, attendanceEdge, attendanceSummary, membershipOf, seatHabit } from '../my';
import { KNOWLEDGE_OPTIONS, KnowledgeLevel, UserProfile } from '../profile';
import { BATTERS, PITCHERS } from '../roster';
import { colors, radius, spacing, tabularFigures, typography } from '../theme';

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
  const member = membershipOf(summary.games);
  const edge = attendanceEdge(ATTENDANCE, STANDING.winRate);
  const seat = seatHabit(
    ATTENDANCE,
    SEAT_GRADES.map((g) => g.name),
  );

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.screenX,
          paddingBottom: spacing.scrollBottom,
        }}
      >
        {/* ── 프로필 ─────────────────────────────────────────────
            MY 는 세 묶음이 서로 독립적이다 - 내 정보 · 알림 설정 · 내 기록.
            머리글이 카드 밖에 떠 있으면 어느 카드의 것인지 눈으로 이어지지 않아
            셋이 한 덩어리로 흘러 보인다. 제목을 카드 안에 들여 경계를 세운다 ── */}
        <SectionCard title="프로필" padded>
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
        </SectionCard>

        {/* ── 멤버십 ─────────────────────────────────────────────
            상단바가 등급을 배지로 달고만 있었고 **그게 무엇인지 볼 자리가 없었다.**
            등급은 저장하지 않고 직관 기록에서 매번 집계하므로(my.ts 원칙) 여기 값은
            언제나 아래 '나의 직관'과 맞는다 ── */}
        <SectionCard title="멤버십" padded>
          <View style={st.tierHead}>
            <View style={{ gap: 2 }}>
              <Text style={st.tierName}>{member.tier.label}</Text>
              <Text style={st.tierSub}>
                {member.next
                  ? `다음 ${member.next.label}까지 ${member.toNext}회`
                  : '최고 등급입니다'}
              </Text>
            </View>
            <Text style={st.tierCount}>
              {summary.games}
              <Text style={st.tierCountUnit}>
                {member.next ? ` / ${member.next.from}회` : '회'}
              </Text>
            </Text>
          </View>

          {/* 다음 등급까지 얼마나 왔는지. 숫자만 있으면 '5회'가 먼 건지 가까운 건지 모른다 */}
          {member.next ? (
            <View style={st.tierTrack}>
              <View
                style={[
                  st.tierFill,
                  { width: `${Math.min(100, (summary.games / member.next.from) * 100)}%` },
                ]}
              />
            </View>
          ) : null}
        </SectionCard>

        {/* ── 알림 - 온보딩 STEP 3 와 같은 부품 ──────────────── */}
        <SectionCard title="알림">
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
        </SectionCard>

        {/* ── 나의 직관 ──────────────────────────────────────── */}
        <SectionCard title="나의 직관" right={<Text style={st.headNote}>2026 시즌</Text>} padded>
          <View style={st.tileRow}>
            <StatTile label="직관" value={`${summary.games}회`} tone="brand" />
            <StatTile label="전적" value={`${summary.wins}-${summary.losses}`} />
            <StatTile label="승률" value={summary.winRate.toFixed(3)} />
          </View>

          {/* ⚠ 팬이 가장 하고 싶어 하는 말("내가 가면 이긴다")을 앱이 대신 해 주되
              **단정하지 않는다.** 5경기 .600 은 3승 2패일 뿐이고 한 경기만 뒤집혀도
              .400 이 된다. 심화 지표에 표본 신뢰도를 붙인 것과 같은 원칙이다 -
              팬이 재미로 보는 값이어도 근거 없이 단정하면 다른 수치까지 못 믿게 된다 */}
          <View style={st.edgeBox}>
            <Text style={st.edgeLine}>
              내가 간 날 <Text style={st.edgeStrong}>{summary.winRate.toFixed(3)}</Text>
              <Text style={st.edgeDim}> · 팀 시즌 {STANDING.winRate.toFixed(3)}</Text>
            </Text>
            <Text style={st.edgeNote}>
              {edge.settled
                ? `표본이 ${summary.games}경기라 경향으로 읽어도 됩니다.`
                : `${summary.games}경기는 아직 우연입니다. ${edge.gamesToTrust}번 더 가면 경향이라 말할 수 있습니다.`}
            </Text>
          </View>

          {seat ? (
            <Text style={st.seatHabit}>
              가장 자주 앉은 자리 <Text style={st.edgeStrong}>{seat.name}</Text> · {seat.times}회
            </Text>
          ) : null}

          <Divider />

          {/* 요약 셋은 "올해 내가 얼마나 갔나"에 답하고 끝난다. 어느 날 누구와
              어디 앉았는지는 **다시 들춰 볼 때만** 필요한 것이라 눌러서 연다 */}
          {/* 제목 하나면 된다 - 설명 줄을 붙이면 그게 다시 읽을 거리가 된다 */}
          <Row last style={st.logRow} onPress={() => setLogOpen(true)}>
            <Text style={st.logLabel}>경기 기록</Text>
            <Text style={st.chevron}>›</Text>
          </Row>
        </SectionCard>

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

  // 멤버십 - 등급 이름이 이 카드에서 가장 큰 글자다. 팬이 확인하러 오는 값이라 그렇다
  tierHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  tierName: {
    ...typography.metric,
    fontSize: 24,
    lineHeight: 28,
    color: colors.brandText,
    letterSpacing: 0.5,
  },
  tierSub: typography.caption,
  tierCount: { ...typography.bodyStrong, ...tabularFigures, fontSize: 17 },
  tierCountUnit: { ...typography.caption, fontWeight: '400' },
  tierTrack: {
    height: 6,
    borderRadius: radius.bar,
    backgroundColor: colors.dim,
    overflow: 'hidden',
  },
  tierFill: { height: '100%', borderRadius: radius.bar, backgroundColor: colors.brand },

  // 직관 승률 해석 - 사실(수치)과 해석(표본 경고)을 한 상자에 묶는다
  edgeBox: { gap: 3 },
  edgeLine: { ...typography.bodyStrong, ...tabularFigures },
  edgeStrong: { color: colors.brandText },
  edgeDim: { ...typography.caption, fontWeight: '400' },
  edgeNote: { ...typography.caption, lineHeight: 18 },
  seatHabit: { ...typography.caption, lineHeight: 18 },

  // 접어 둔 기록을 여는 줄 - 카드 안이라 Row 의 좌우 여백을 지우고 카드에 맞춘다
  logRow: { paddingHorizontal: 0, paddingVertical: 0 },
  logLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },

  gameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 10 },
  gameDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  gameDate: { ...typography.caption, ...tabularFigures, width: 40 },
  gameTitle: { ...typography.bodyStrong, fontSize: 14 },
  gameSeat: typography.micro,
  gameResult: { fontSize: 14, fontWeight: '700' },

  appInfo: { ...typography.micro, textAlign: 'center', marginTop: spacing.xxl },
});
