// 홈 - 오늘의 이글스
//
// 구단 앱의 홈은 리그 앱의 홈과 다르다. KBO 앱의 홈이 "오늘 열린 다섯 경기"를 다루는
// 대시보드라면, 구단 앱의 홈은 우리 팀 하나만 다룬다. 경기가 하나뿐이라 그 경기를
// 깊게 파고들 지면이 생기고, 그게 구단 앱이 리그 앱보다 잘할 수 있는 유일한 축이다.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Badge,
  Card,
  CardHeading,
  Divider,
  GroupCard,
  Row,
  SectionTitle,
  StatTile,
} from '../components/common';
import { FavoritePicker } from '../components/FavoritePicker';
import { PhotoHeader, PlayerAvatar, TeamEmblem, stadiumPhoto } from '../components/photos';
import { PLATE_SEQUENCE, RECENT, STANDING, TODAY_GAME } from '../game';
import { dropAlerts } from '../goods';
import { liveAlerts, predictMatchup } from '../liveEngine';
import { UserProfile } from '../profile';
import { BATTERS, OPPONENT_PITCHERS, PITCHERS } from '../roster';
import { batterWarOf, eraOf, fipOf, opsOf, pitcherWarOf, wrcPlusOf } from '../sabermetrics';
import { colors, spacing, tabularFigures, typography } from '../theme';

const DEMO_NOW = Date.parse('2026-08-11T15:00:00+09:00');

export function HomeScreen({
  profile,
  onFavorite,
  onGoLive,
  onGoStore,
}: {
  profile: UserProfile;
  onFavorite: (id?: string) => void;
  onGoLive: () => void;
  onGoStore: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pa = PLATE_SEQUENCE[3];
  const batter = BATTERS.find((b) => b.id === pa.batterId) ?? BATTERS[0];
  const pitcher = OPPONENT_PITCHERS.find((p) => p.id === pa.pitcherId) ?? OPPONENT_PITCHERS[0];
  const pred = predictMatchup(pa.situation, batter, pitcher);
  const alerts = liveAlerts(pa.situation, batter, pitcher);

  const favBatter = BATTERS.find((b) => b.id === profile.favoritePlayerId);
  const favPitcher = PITCHERS.find((p) => p.id === profile.favoritePlayerId);
  const goods = dropAlerts(DEMO_NOW, profile.favoritePlayerId);

  return (
    <>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: spacing.screenX,
        paddingBottom: spacing.scrollBottom,
      }}
    >
      {/* ── 오늘 경기 ─────────────────────────────────────── */}
      <View style={st.heroWrap}>
        {stadiumPhoto(TODAY_GAME.stadium) ? (
          <PhotoHeader source={stadiumPhoto(TODAY_GAME.stadium)!} height={148}>
            <Text style={st.heroTitle}>대전 한화생명 볼파크</Text>
            <Text style={st.heroSub}>
              {TODAY_GAME.startTime} · {TODAY_GAME.opponent.name}전
            </Text>
          </PhotoHeader>
        ) : null}
      </View>

      <SectionTitle title="오늘 경기" />
      <Card onPress={onGoLive}>
        <View style={st.scoreRow}>
          <View style={st.teamCol}>
            <TeamEmblem team="LG" size={34} />
            <Text style={st.teamName}>{TODAY_GAME.opponent.short}</Text>
            <Text style={st.score}>{TODAY_GAME.theirScore}</Text>
          </View>
          <View style={st.scoreMid}>
            <Badge text="LIVE" tone="live" />
            <Text style={st.inning}>
              {pa.situation.inning}회{pa.situation.half === 'bottom' ? '말' : '초'}
            </Text>
          </View>
          <View style={st.teamCol}>
            <TeamEmblem team="HH" size={34} />
            <Text style={[st.teamName, { color: colors.brandText }]}>한화</Text>
            <Text style={[st.score, { color: colors.brandText }]}>{TODAY_GAME.ourScore}</Text>
          </View>
        </View>

        <Divider />

        <CardHeading label="지금 이 승부" title={pred.headline} />
        <Text style={st.reason}>{pred.reasons[0]}</Text>
        <Text style={st.more}>근거 보기 ›</Text>
      </Card>

      {/* ── 감지 ───────────────────────────────────────────── */}
      {alerts.length > 0 ? (
        <>
          <SectionTitle title="지금 눈여겨볼 것" />
          <GroupCard>
            {alerts.slice(0, 2).map((a, i, arr) => (
              <Row key={i} last={i === arr.length - 1} style={st.alertRow}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={st.alertTitle}>{a.title}</Text>
                  <Text style={st.alertBody}>{a.body}</Text>
                </View>
              </Row>
            ))}
          </GroupCard>
        </>
      ) : null}

      {/* ── 순위 ───────────────────────────────────────────── */}
      <SectionTitle title="2026 정규시즌" />
      <Card>
        <View style={st.tileRow}>
          <StatTile
            label="순위"
            value={`${STANDING.rank}위`}
            sub={`4위와 ${STANDING.gapUp}경기`}
            tone="brand"
          />
          <StatTile
            label="전적"
            value={`${STANDING.w}-${STANDING.l}`}
            sub={`${STANDING.d}무`}
          />
          <StatTile
            label="승률"
            value={STANDING.winRate.toFixed(3)}
            sub={`${STANDING.w + STANDING.l + STANDING.d}경기`}
          />
        </View>

        <Divider />

        <View style={st.recentRow}>
          {RECENT.map((g) => {
            const won = g.result === 'W';
            return (
              <View key={g.date} style={st.recentItem}>
                <View style={[st.resultDot, won ? st.resultWin : st.resultLose]}>
                  <Text style={[st.resultText, won ? st.resultTextWin : st.resultTextLose]}>
                    {g.result}
                  </Text>
                </View>
                <Text style={st.recentOpp}>{g.opponent}</Text>
                <Text style={st.recentScore}>{g.score}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* ── 최애 선수 ─────────────────────────────────────── */}
      <SectionTitle
        title="최애 선수"
        right={
          <Pressable onPress={() => setPickerOpen(true)} hitSlop={8}>
            <Text style={st.changeBtn}>변경</Text>
          </Pressable>
        }
      />
      {favBatter ? (
        <Card>
          <CardHeading
            label={`${favBatter.back} · ${favBatter.pos}`}
            title={favBatter.name}
            right={<PlayerAvatar playerId={favBatter.id} size={52} />}
          />
          <Text style={st.favNote}>{favBatter.note}</Text>
          <View style={st.tileRow}>
            <StatTile label="wRC+" value={String(wrcPlusOf(favBatter.stat, '대전'))} tone="brand" />
            <StatTile label="WAR" value={String(batterWarOf(favBatter.stat, '대전'))} />
            <StatTile label="OPS" value={opsOf(favBatter.stat).toFixed(3)} />
          </View>
        </Card>
      ) : favPitcher ? (
        <Card>
          <CardHeading
            label={`${favPitcher.back} · ${favPitcher.role}`}
            title={favPitcher.name}
            right={<PlayerAvatar playerId={favPitcher.id} size={52} />}
          />
          <Text style={st.favNote}>{favPitcher.note}</Text>
          <View style={st.tileRow}>
            <StatTile label="ERA" value={eraOf(favPitcher.stat).toFixed(2)} tone="brand" />
            <StatTile label="FIP" value={fipOf(favPitcher.stat).toFixed(2)} />
            <StatTile label="WAR" value={String(pitcherWarOf(favPitcher.stat, '대전'))} />
          </View>
        </Card>
      ) : (
        <Card onPress={() => setPickerOpen(true)}>
          <View style={st.favEmptyRow}>
            <Text style={st.favEmptyText}>최애 선수 고르기</Text>
            <Text style={st.chevron}>›</Text>
          </View>
        </Card>
      )}

      {/* ── 굿즈 ───────────────────────────────────────────── */}
      {profile.alerts.goodsDrop && goods.length > 0 ? (
        <>
          <SectionTitle title="발매 소식" />
          <GroupCard>
            {goods.slice(0, 2).map((g, i, arr) => (
              <Row key={i} last={i === arr.length - 1} onPress={onGoStore}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={st.goodsText}>{g.message}</Text>
                  <Text style={st.goodsNote}>{g.note}</Text>
                </View>
                <Text style={st.chevron}>›</Text>
              </Row>
            ))}
          </GroupCard>
        </>
      ) : null}
    </ScrollView>

      {/* ── 최애 선수 선택 시트 - MY 탭과 공용 ─────────────── */}
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
  heroWrap: { marginTop: spacing.sm },
  heroTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  heroSub: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.86)' },

  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  teamCol: { flex: 1, alignItems: 'center', gap: 3 },
  teamName: { ...typography.caption, fontWeight: '700', color: colors.subText },
  score: { ...typography.metric, ...tabularFigures, fontSize: 34, lineHeight: 40 },
  scoreMid: { alignItems: 'center', gap: 6, paddingHorizontal: spacing.md },
  inning: typography.micro,

  reason: { ...typography.caption, lineHeight: 19 },
  more: { ...typography.micro, color: colors.brandText, fontWeight: '700' },

  alertRow: { alignItems: 'flex-start', paddingVertical: spacing.lg },
  alertTitle: { ...typography.bodyStrong, lineHeight: 21 },
  alertBody: { ...typography.caption, lineHeight: 19 },

  tileRow: { flexDirection: 'row', gap: spacing.sm },

  recentRow: { flexDirection: 'row', gap: spacing.sm },
  recentItem: { flex: 1, alignItems: 'center', gap: 4 },
  resultDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  resultWin: { backgroundColor: colors.win },
  resultLose: { backgroundColor: colors.surface },
  resultText: { fontSize: 11, fontWeight: '700' },
  resultTextWin: { color: '#FFFFFF' },
  resultTextLose: { color: colors.subText },
  recentOpp: typography.micro,
  recentScore: { ...typography.micro, ...tabularFigures, fontWeight: '400' },

  changeBtn: { ...typography.caption, color: colors.brandText, fontWeight: '700' },
  favEmptyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  favEmptyText: { ...typography.bodyStrong, fontSize: 15 },
  favNote: { ...typography.caption, lineHeight: 19 },

  goodsText: { ...typography.body, flex: 1, fontSize: 13.5, lineHeight: 20 },
  goodsNote: typography.caption,
  chevron: { fontSize: 18, color: colors.mutedText },
});
