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
  Row,
  SectionCard,
  SectionTitle,
  StatTile,
} from '../components/common';
import { FavoritePicker } from '../components/FavoritePicker';
import { PhotoHeader, PlayerAvatar, TeamEmblem, stadiumPhoto } from '../components/photos';
import { PLATE_SEQUENCE, RECENT, STANDING, TODAY_GAME } from '../game';
import { goodsAlerts } from '../goods';
import { liveAlerts, predictMatchup } from '../liveEngine';
import { UserProfile } from '../profile';
import { BATTERS, OPPONENT_PITCHERS, PITCHERS } from '../roster';
import { batterWarOf, eraOf, fipOf, opsOf, pitcherWarOf, wrcPlusOf } from '../sabermetrics';
import { colors, radius, spacing, states, tabularFigures, typography } from '../theme';
import type { TabKey } from '../../App';
import BagIcon from '../../assets/icons/tab-bag.svg';
import StatsIcon from '../../assets/icons/stats.svg';
import TicketIcon from '../../assets/icons/ticket.svg';

const DEMO_NOW = Date.parse('2026-08-11T15:00:00+09:00');

/**
 * 홈에서 다른 탭으로 가는 지름길.
 *
 * 홈은 허브인데 이동 수단이 하단 탭뿐이었다. 그래서 홈이 답해야 할 것("오늘 뭐가
 * 있나")을 넘어 **다른 탭의 내용까지 끌어와 늘어놓고** 있었다 - 발매 소식이 굿즈 탭과
 * 같은 데이터를 두 번 그리는 식이다. 지름길이 생기면 그 지면을 홈이 떠안지 않아도 된다.
 *
 * 세로로 쌓으면 목록이 되고 목록은 위에서부터 읽게 만든다. 나란히 두면 **고르는 것**이
 * 되어 필요한 하나만 짚고 지나간다 - 직관의 '가기 전에'와 같은 판단이라 3열도 맞췄다.
 */
const QUICK: { key: TabKey; label: string; icon: HomeIconName }[] = [
  { key: 'gameday', label: '예매·직관', icon: 'ticket' },
  { key: 'players', label: '기록', icon: 'stats' },
  { key: 'store', label: '굿즈', icon: 'bag' },
];

// 지름길 타일과 하단탭은 **같은 파일**을 쓴다. 두 자리가 같은 곳을 가리키는데 그림이
// 둘이면 언젠가 한쪽만 고쳐져 어긋난다 - 실제로 어긋나 있었다. 기록은 막대그래프 대
// 방망이였고, 굿즈는 옷걸이(shop.svg) 대 쇼핑백이었다.
const HOME_ICONS = { ticket: TicketIcon, stats: StatsIcon, bag: BagIcon };
type HomeIconName = keyof typeof HOME_ICONS;

function QuickTiles({
  onGo,
  dots,
}: {
  onGo: (tab: TabKey) => void;
  /** 새 소식이 있는 탭. 숫자는 쓰지 않는다 - 팬덤 앱에서 숫자 배지는 '밀린 일'로 읽힌다 */
  dots?: Partial<Record<TabKey, boolean>>;
}) {
  return (
    <View style={st.quickRow}>
      {QUICK.map((q) => {
        const Icon = HOME_ICONS[q.icon];
        const hasNew = dots?.[q.key] ?? false;
        return (
          <Pressable
            key={q.key}
            onPress={() => onGo(q.key)}
            style={({ pressed }) => [st.quickTile, pressed && states.pressed]}
            accessibilityRole="button"
            accessibilityLabel={hasNew ? `${q.label} - 새 소식 있음` : q.label}
          >
            <View>
              <Icon width={24} height={24} color={colors.brandText} />
              {hasNew ? <View style={st.quickDot} /> : null}
            </View>
            <Text style={st.quickLabel} numberOfLines={1}>
              {q.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function HomeScreen({
  profile,
  onFavorite,
  onGoLive,
  onGo,
}: {
  profile: UserProfile;
  onFavorite: (id?: string) => void;
  onGoLive: () => void;
  onGo: (tab: TabKey) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pa = PLATE_SEQUENCE[3];
  const batter = BATTERS.find((b) => b.id === pa.batterId) ?? BATTERS[0];
  const pitcher = OPPONENT_PITCHERS.find((p) => p.id === pa.pitcherId) ?? OPPONENT_PITCHERS[0];
  const pred = predictMatchup(pa.situation, batter, pitcher);
  /**
   * ⚠ `liveAlerts` 는 푸시 알림용이라 문장을 통째로 담는다. 그대로 렌더하면
   * **바로 위 '오늘 경기' 카드가 이미 말한 것을 되풀이한다** - `matchup` 알림은
   * title=pred.headline · body=pred.reasons[0] 이라 카드의 제목·근거와 글자 그대로 같다.
   * 라이브 화면과 같은 이유로 화면이 아직 말하지 않은 것만 남긴다.
   */
  const alerts = liveAlerts(pa.situation, batter, pitcher).filter((a) => a.kind !== 'matchup');

  const favBatter = BATTERS.find((b) => b.id === profile.favoritePlayerId);
  const favPitcher = PITCHERS.find((p) => p.id === profile.favoritePlayerId);
  const goods = goodsAlerts(DEMO_NOW, profile.favoritePlayerId);

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

          {/* 라이브와 같은 이유로 verdict 를 쓴다. 다만 홈에는 확률을 보여줄 자리가
              따로 없어서 라벨 옆에 붙인다 - 제목 문장 안에 넣으면 다시 길어진다 */}
          <CardHeading
            label="지금 이 승부"
            title={pred.verdict}
            right={<Text style={st.probPill}>출루 {Math.round(pred.onBaseProb * 100)}%</Text>}
          />
          <Text style={st.reason}>{pred.reasons[0]}</Text>
          <Text style={st.more}>근거 보기 ›</Text>
        </Card>

        {/* 오늘 경기 바로 아래다. 팬이 홈에서 하는 일은 '경기를 본다' 아니면
            '경기를 보러 갈 준비를 한다'인데, 후자로 가는 길이 하단 탭뿐이었다 */}
        <QuickTiles onGo={onGo} dots={{ store: profile.alerts.goodsDrop && goods.length > 0 }} />

        {/* ── 감지 ─────────────────────────────────────────────
            아래 셋은 **묶음**이다 - 감지·팀 성적·최애 선수가 서로 독립적이고, 각각
            안에서만 항목이 묶인다. 위 '오늘 경기'는 히어로에서 이어지는 **흐름**이라
            머리글을 밖에 둔 채로 남긴다 - 거기까지 테두리로 가두면 첫 화면이 답답해진다 ── */}
        {alerts.length > 0 ? (
          <SectionCard title="지금 눈여겨볼 것">
            {alerts.slice(0, 2).map((a, i, arr) => (
              <Row key={i} last={i === arr.length - 1} style={st.alertRow}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={st.alertTitle}>{a.title}</Text>
                  <Text style={st.alertBody}>{a.body}</Text>
                </View>
              </Row>
            ))}
          </SectionCard>
        ) : null}

        {/* ── 순위 ───────────────────────────────────────────── */}
        <SectionCard title="2026 정규시즌" padded>
          <View style={st.tileRow}>
            <StatTile
              label="순위"
              value={`${STANDING.rank}위`}
              sub={`4위와 ${STANDING.gapUp}경기`}
              tone="brand"
            />
            <StatTile label="전적" value={`${STANDING.w}-${STANDING.l}`} sub={`${STANDING.d}무`} />
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
        </SectionCard>

        {/* ── 최애 선수 ─────────────────────────────────────── */}
        <SectionCard
          title="최애 선수"
          padded
          right={
            <Pressable onPress={() => setPickerOpen(true)} hitSlop={8}>
              <Text style={st.changeBtn}>변경</Text>
            </Pressable>
          }
        >
          {favBatter ? (
            <>
              <CardHeading
                label={`${favBatter.back} · ${favBatter.pos}`}
                title={favBatter.name}
                right={<PlayerAvatar playerId={favBatter.id} size={52} />}
              />
              <Text style={st.favNote}>{favBatter.note}</Text>
              <View style={st.tileRow}>
                <StatTile
                  label="wRC+"
                  value={String(wrcPlusOf(favBatter.stat, '대전'))}
                  tone="brand"
                />
                <StatTile label="WAR" value={String(batterWarOf(favBatter.stat, '대전'))} />
                <StatTile label="OPS" value={opsOf(favBatter.stat).toFixed(3)} />
              </View>
            </>
          ) : favPitcher ? (
            <>
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
            </>
          ) : (
            <Pressable onPress={() => setPickerOpen(true)} style={st.favEmptyRow}>
              <Text style={st.favEmptyText}>최애 선수 고르기</Text>
              <Text style={st.chevron}>›</Text>
            </Pressable>
          )}
        </SectionCard>

        {/* ── 굿즈 ─────────────────────────────────────────────
            '발매 소식' 섹션이 여기 있었다. 굿즈 탭의 '놓치기 전에'와 **같은 데이터**
            (dropAlerts)를 두 번 그리고 있었고, 홈이 다른 탭의 지면까지 떠안는 만큼
            길어졌다. 위 굿즈 타일이 그 자리를 대신한다 - 소식을 요약해 보여주는 대신
            소식이 있는 곳으로 보낸다. 안 읽은 발매가 있으면 점으로만 알린다 ── */}
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
  resultDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
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

  chevron: { fontSize: 18, color: colors.mutedText },

  // 확률은 제목 옆에 조용히. 숫자를 크게 세우면 홈이 라이브 화면 흉내가 된다
  probPill: {
    ...typography.micro,
    ...tabularFigures,
    color: colors.brandText,
    backgroundColor: colors.brandSoft,
    borderRadius: radius.chip,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    overflow: 'hidden',
  },

  // 다른 탭으로 가는 지름길 - 직관 '가기 전에'와 같은 문법(3열·아이콘 위·라벨 아래)
  quickRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.cardGap },
  quickTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickLabel: { ...typography.bodyStrong, fontSize: 13, letterSpacing: -0.2 },
  // 아이콘 오른쪽 위. 숫자 없이 점 하나 - 있다는 사실만 말한다
  quickDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 7,
    height: 7,
    borderRadius: radius.chip,
    backgroundColor: colors.live,
  },
});
