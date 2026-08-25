// 라이브 - 경기 중 상황별 승부 예측
//
// 1차 리뷰 3번(최우선)의 화면. 창희쌤이 든 예시를 그대로 구현한다.
//   "지금 이 승부는 B란 타자가 더 유리한 확률이 xx%이며 그 이유는 ~~~ 와 같다"
//
// ── 화면 규칙 ────────────────────────────────────────────────
// ① 확률과 첫 근거는 떼어놓지 않는다. 헤드라인 옆에 가장 큰 이유 하나는 항상 보이고,
//    나머지 근거와 계산 과정은 시트로 - 본문이 근거 목록으로 길어지면 리포트가 된다
// ② 화면의 뼈대는 문자중계다. 예측은 중계 위에 얹힌 한 장의 카드로 보여야
//    "분석 도구"가 아니라 "중계의 다음 문장"으로 읽힌다
// ③ 화면이 스스로를 해설하지 않는다. 설계 의도는 README 로, 화면에는 결과만
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Card,
  CardHeading,
  DetailSheet,
  Divider,
  GroupCard,
  KeyValueRow,
  ReasonList,
  Row,
  SectionTitle,
  Segmented,
  SponsorMoment,
} from '../components/common';
import { PhotoHeader, PlayerAvatar, stadiumPhoto } from '../components/photos';
import { PLATE_SEQUENCE, TODAY_GAME } from '../game';
import {
  CLUTCH_LI,
  basesLabel,
  bullpenAdvice,
  leverageIndex,
  liveAlerts,
  predictMatchup,
  runExpectancy,
} from '../liveEngine';
import { KNOWLEDGE_OPTIONS, KnowledgeLevel, UserProfile } from '../profile';
import { BATTERS, OPPONENT_PITCHERS } from '../roster';
import { colors, radius, spacing, tabularFigures, typography } from '../theme';

export function LiveScreen({
  profile,
  onLevel,
}: {
  profile: UserProfile;
  onLevel: (l: KnowledgeLevel) => void;
}) {
  const [step, setStep] = useState(3); // 만루 직전부터 - 시연에서 바로 핵심을 보여준다
  const [showWhy, setShowWhy] = useState(false);

  const pa = PLATE_SEQUENCE[step];
  const batter = BATTERS.find((b) => b.id === pa.batterId) ?? BATTERS[0];
  // 마운드는 상대팀이다. 우리 투수진에서 찾으면 한화 공격에 한화 투수가 서게 된다
  const pitcher = OPPONENT_PITCHERS.find((p) => p.id === pa.pitcherId) ?? OPPONENT_PITCHERS[0];

  const pred = useMemo(
    () => predictMatchup(pa.situation, batter, pitcher),
    [pa.situation, batter, pitcher],
  );
  // 교체 판단도 상대 불펜으로 - 팬이 궁금한 건 "상대 감독이 여기서 바꿀까"다
  const advice = useMemo(
    () => bullpenAdvice(pa.situation, batter, pitcher, OPPONENT_PITCHERS),
    [pa.situation, batter, pitcher],
  );
  const alerts = useMemo(
    () => liveAlerts(pa.situation, batter, pitcher),
    [pa.situation, batter, pitcher],
  );

  const s = pa.situation;
  const pct = Math.round(pred.onBaseProb * 100);
  const li = pred.context.leverageIndex;
  const halfLabel = s.half === 'bottom' ? '말' : '초';

  // 문자중계 - 이번 이닝에서 끝난 타석들. 최신이 위로 온다
  const pastLog = PLATE_SEQUENCE.slice(0, step)
    .map((p, i) => ({ ...p, i, li: leverageIndex(p.situation) }))
    .filter((p) => p.situation.inning === s.inning && p.situation.half === s.half)
    .reverse();

  // 스폰서가 후원하는 '결정적 순간'. 지면을 파는 게 아니라 **순간을 판다**.
  // 지나간 타석 중 레버리지가 가장 높았던 자리에 한 번만 끼어든다 - 매 행마다 붙으면
  // 그건 광고 지면이지 순간이 아니고, 팬은 피드를 못 읽는다.
  const peak = pastLog.reduce<(typeof pastLog)[number] | null>(
    (best, p) => (p.li >= CLUTCH_LI && (!best || p.li > best.li) ? p : best),
    null,
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
        {/* ── 스코어보드 - 구장 사진 위의 방송 자막 ─────────── */}
        <View style={st.heroWrap}>
          {stadiumPhoto('대전') ? (
            <PhotoHeader source={stadiumPhoto('대전')!} height={148}>
              <View style={st.heroTop}>
                <View style={st.liveDot} />
                <Text style={st.heroLive}>LIVE</Text>
                <Text style={st.heroInning}>
                  {s.inning}회{halfLabel} {s.outs}아웃
                </Text>
              </View>
              <View style={st.heroScoreRow}>
                <Text style={st.heroTeam}>{TODAY_GAME.opponent.short}</Text>
                <Text style={st.heroScore}>{TODAY_GAME.theirScore}</Text>
                <Text style={st.heroColon}>:</Text>
                <Text style={st.heroScore}>{TODAY_GAME.ourScore}</Text>
                <Text style={st.heroTeam}>한화</Text>
              </View>
            </PhotoHeader>
          ) : null}
        </View>

        {/* ── 현재 상황 ──────────────────────────────────────── */}
        <Card style={{ marginTop: spacing.cardGap }}>
          <View style={st.situationRow}>
            <BaseDiamond first={s.bases.first} second={s.bases.second} third={s.bases.third} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={st.situationText}>
                {basesLabel(s.bases)} · {s.balls}볼 {s.strikes}스트라이크
              </Text>
              <Text style={st.reText}>
                기대득점 {pred.context.runExpectancy}점 · 레버리지 {li}
              </Text>
            </View>
          </View>
        </Card>

        {/* ── 이 승부 ────────────────────────────────────────── */}
        <SectionTitle title="이 승부" presenter="한화생명" />
        <Card>
          <CardHeading
            label={pred.flipped ? '상황이 뒤집은 승부' : '매치업'}
            title={pred.headline}
          />

          <View style={st.matchupRow}>
            <View style={st.side}>
              <PlayerAvatar playerId={batter.id} team="HH" size={46} />
              <Text style={st.sideRole}>타자</Text>
              <Text style={st.sideName}>{batter.name}</Text>
              <Text style={st.sideMeta}>
                {batter.bats === 'L' ? '좌타' : batter.bats === 'R' ? '우타' : '스위치'} ·{' '}
                {batter.pos}
              </Text>
            </View>

            <View style={st.probBox}>
              <Text style={st.probValue}>{pct}%</Text>
              <Text style={st.probLabel}>출루 확률</Text>
            </View>

            <View style={st.side}>
              <PlayerAvatar playerId={pitcher.id} team="LG" size={46} />
              <Text style={st.sideRole}>투수</Text>
              <Text style={st.sideName}>{pitcher.name}</Text>
              <Text style={st.sideMeta}>
                {pitcher.throws === 'L' ? '좌투' : '우투'} · {pitcher.role}
              </Text>
            </View>
          </View>

          <View>
            <View style={st.probTrack}>
              <View
                style={[
                  st.probFill,
                  {
                    width: `${pct}%`,
                    backgroundColor: pred.favors === 'batter' ? colors.brand : colors.neutralFill,
                  },
                ]}
              />
              <View style={[st.probMarker, { left: '35.2%' }]} />
            </View>
            <Text style={st.probNote}>리그 평균 출루율 35.2%</Text>
          </View>

          <Divider />

          {/* 가장 큰 이유 하나는 항상 보인다. 나머지는 시트로 */}
          <Text style={st.topReason}>{pred.reasons[0]}</Text>
          <Pressable onPress={() => setShowWhy(true)} hitSlop={8}>
            <Text style={st.whyBtn}>근거와 계산 보기 ›</Text>
          </Pressable>
        </Card>

        {/* ── 문자중계 ───────────────────────────────────────── */}
        <SectionTitle title={`${s.inning}회${halfLabel} 문자중계`} />
        <GroupCard>
          <Row style={st.logRow} last={pastLog.length === 0}>
            <Text style={[st.logName, { color: colors.brandText }]}>{batter.name}</Text>
            <Text style={st.logText}>
              타석 진행 중 · {s.balls}볼 {s.strikes}스트라이크
            </Text>
          </Row>
          {pastLog.map((p, idx) => {
            const name = BATTERS.find((b) => b.id === p.batterId)?.name ?? '';
            const isLast = idx === pastLog.length - 1;
            return (
              <View key={p.i}>
                <Row style={st.logRow} last={isLast && p.i !== peak?.i}>
                  <Text style={st.logName}>{name}</Text>
                  <Text style={st.logText}>{p.logLine}</Text>
                </Row>
                {/* 그 타석 바로 아래에 붙어야 방금 읽은 줄과 해석이 이어진다 */}
                {p.i === peak?.i ? (
                  <SponsorMoment
                    presenter="한화생명"
                    title={`${p.situation.inning}회${p.situation.half === 'bottom' ? '말' : '초'} ${basesLabel(p.situation.bases)}, 승패가 갈린 타석`}
                    body={`이 타석 하나가 평균 타석의 **${p.li.toFixed(1)}배**만큼 승패를 흔들었습니다. 당시 기대득점은 ${runExpectancy(p.situation).toFixed(2)}점이었습니다.`}
                    last={isLast}
                  />
                ) : null}
              </View>
            );
          })}
        </GroupCard>

        {/* ── 투수 교체 ──────────────────────────────────────── */}
        <SectionTitle title="투수 교체" />
        <Card>
          <CardHeading
            label={advice.candidate ? `후보 · ${advice.candidate.name}` : undefined}
            title={advice.shouldChange ? '교체할 만합니다' : '지금 투수가 낫습니다'}
          />
          <Text style={st.adviceText}>{advice.sentence}</Text>
        </Card>

        {/* ── 감지 - 알릴 것이 있을 때만 나타난다 ─────────────── */}
        {profile.alerts.clutch && alerts.length > 0 ? (
          <>
            <SectionTitle title="지금 눈여겨볼 것" />
            <GroupCard>
              {alerts.map((a, i) => (
                <Row key={i} last={i === alerts.length - 1} style={st.alertRow}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={st.alertTitle}>{a.title}</Text>
                    <Text style={st.alertBody}>{a.body}</Text>
                  </View>
                </Row>
              ))}
            </GroupCard>
          </>
        ) : null}

        {/* ── 설명 깊이 ──────────────────────────────────────── */}
        <SectionTitle title="설명 깊이" />
        <Card>
          <Segmented
            options={KNOWLEDGE_OPTIONS.map((o) => ({ key: o.key, label: o.short }))}
            value={profile.level}
            onChange={onLevel}
          />
          <Text style={st.levelNote}>
            {KNOWLEDGE_OPTIONS.find((o) => o.key === profile.level)?.desc}
          </Text>
        </Card>

        {/* ── 시연용 ─────────────────────────────────────────── */}
        <SectionTitle title="타석 이동" right={<Text style={st.sectionCount}>시연용</Text>} />
        <Card>
          <Text style={st.seqOutcome}>{pa.outcome}</Text>
          <View style={st.seqRow}>
            <Pressable
              onPress={() => setStep((v) => Math.max(0, v - 1))}
              disabled={step === 0}
              style={[st.seqBtn, step === 0 && st.seqBtnOff]}
            >
              <Text style={st.seqBtnText}>이전</Text>
            </Pressable>
            <Text style={st.seqCount}>
              {step + 1} / {PLATE_SEQUENCE.length}
            </Text>
            <Pressable
              onPress={() => setStep((v) => Math.min(PLATE_SEQUENCE.length - 1, v + 1))}
              disabled={step === PLATE_SEQUENCE.length - 1}
              style={[st.seqBtn, step === PLATE_SEQUENCE.length - 1 && st.seqBtnOff]}
            >
              <Text style={st.seqBtnText}>다음</Text>
            </Pressable>
          </View>
        </Card>
      </ScrollView>

      {/* ── 근거·계산 시트 ───────────────────────────────────── */}
      <DetailSheet
        visible={showWhy}
        title="이 확률의 근거"
        subtitle={`${batter.name} 출루 확률 ${pct}%`}
        onClose={() => setShowWhy(false)}
      >
        <GroupCard style={{ paddingHorizontal: spacing.cardPad }}>
          <ReasonList reasons={pred.reasons} />
        </GroupCard>

        <SectionTitle title="계산" />
        <GroupCard>
          <KeyValueRow
            label={`${batter.name} 출루율`}
            value={pred.breakdown.batterOBP.toFixed(3)}
          />
          <KeyValueRow
            label={`${pitcher.name} 피출루율`}
            value={pred.breakdown.pitcherOBPAllowed.toFixed(3)}
          />
          <KeyValueRow label="로그5 기본 확률" value={pred.breakdown.log5Base.toFixed(3)} />
          <KeyValueRow
            label="좌우 상성"
            value={`${pred.breakdown.platoon >= 0 ? '+' : ''}${pred.breakdown.platoon.toFixed(3)}`}
          />
          <KeyValueRow
            label="상황 보정"
            value={`${pred.breakdown.situational >= 0 ? '+' : ''}${pred.breakdown.situational.toFixed(3)}`}
          />
          <KeyValueRow label="최종" value={pred.breakdown.final.toFixed(3)} last />
        </GroupCard>
      </DetailSheet>
    </>
  );
}

/** 주자 다이아몬드 */
function BaseDiamond({
  first,
  second,
  third,
}: {
  first: boolean;
  second: boolean;
  third: boolean;
}) {
  const on = (v: boolean) => ({ backgroundColor: v ? colors.brand : colors.dim });
  return (
    <View style={st.diamond}>
      <View style={[st.baseDot, st.baseSecond, on(second)]} />
      <View style={[st.baseDot, st.baseThird, on(third)]} />
      <View style={[st.baseDot, st.baseFirst, on(first)]} />
    </View>
  );
}

const st = StyleSheet.create({
  heroWrap: { marginTop: spacing.sm },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  // 다크 스크림 위의 LIVE 점 - 본문용 레드(#D00F31)는 어두운 면에서 가라앉는다
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF5C5C' },
  heroLive: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', letterSpacing: 1 },
  heroInning: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginLeft: 4 },
  heroScoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  heroTeam: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.88)' },
  heroScore: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
    ...tabularFigures,
  },
  heroColon: { fontSize: 22, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },

  situationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  situationText: typography.bodyStrong,
  reText: typography.micro,

  diamond: { width: 48, height: 48 },
  baseDot: {
    position: 'absolute',
    width: 13,
    height: 13,
    borderRadius: 3,
    transform: [{ rotate: '45deg' }],
  },
  baseSecond: { top: 0, left: 17 },
  baseThird: { top: 17, left: 0 },
  baseFirst: { top: 17, left: 34 },

  matchupRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  side: { flex: 1, gap: 2, alignItems: 'center' },
  sideRole: typography.micro,
  sideName: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  sideMeta: typography.micro,
  probBox: { alignItems: 'center', paddingHorizontal: spacing.sm },
  probValue: { ...typography.metric, ...tabularFigures, fontSize: 32, color: colors.brandText },
  probLabel: typography.micro,

  probTrack: {
    height: 8,
    borderRadius: radius.bar,
    backgroundColor: colors.dim,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  probFill: { height: 8, borderRadius: radius.bar },
  probMarker: { position: 'absolute', width: 2, height: 14, backgroundColor: colors.text, top: -3 },
  probNote: { ...typography.micro, marginTop: 5 },

  topReason: { ...typography.body, fontSize: 13.5, lineHeight: 21 },
  whyBtn: { ...typography.caption, color: colors.brandText, fontWeight: '700' },

  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  logName: { ...typography.bodyStrong, fontSize: 14, width: 64 },
  logText: { ...typography.body, fontSize: 13.5, lineHeight: 21, flex: 1 },

  sectionCount: typography.micro,

  adviceText: typography.body,

  alertRow: { alignItems: 'flex-start', paddingVertical: spacing.lg },
  alertTitle: { ...typography.bodyStrong, lineHeight: 21 },
  alertBody: { ...typography.caption, lineHeight: 19 },

  levelNote: typography.caption,

  seqOutcome: typography.body,
  seqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seqBtn: {
    paddingHorizontal: spacing.xl,
    height: spacing.touchMin,
    justifyContent: 'center',
    borderRadius: radius.chip,
    backgroundColor: colors.surface,
  },
  seqBtnOff: { opacity: 0.35 },
  seqBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
  seqCount: { ...typography.micro, ...tabularFigures },
});
