// 선수 - 심화 스탯과 그 해설
//
// 1차 리뷰 2번의 화면. "WRC, WAR, wOBA 등 좀더 심화된 수치" + "BABIP 설명 수준 보완".
//
// ── 화면 규칙 ────────────────────────────────────────────────
// ① 선수 목록은 **카드 하나 안의 행**이다. 선수마다 카드를 띄우면 같은 흰 상자가
//    여덟 번 반복되어 어디가 묶음인지 사라진다
// ② 숫자 옆에 항상 셋이 붙는다: 값 / 리그 평균 대비 위치 / 이 값을 믿어도 되는지
// ③ ③번(신뢰도)이 이 화면의 차별점이다. 표본이 모자라 아직 판단하면 안 되는 값이라는
//    사실까지 말해 주는 앱은 없다
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Card,
  CardHeading,
  Divider,
  Gauge,
  GroupCard,
  Label,
  RichText,
  Row,
  SectionTitle,
  Segmented,
  StatTile,
  TopTabs,
} from '../components/common';
import { PlayerAvatar } from '../components/photos';
import { KNOWLEDGE_OPTIONS, KnowledgeLevel, UserProfile } from '../profile';
import { BATTERS, Batter, PITCHERS, Pitcher } from '../roster';
import {
  LEAGUE,
  avgOf,
  babipAllowedOf,
  babipOf,
  batterWarBreakdown,
  batterWarOf,
  bbRateOf,
  eraOf,
  fipOf,
  ipLabel,
  kRateOf,
  obpOf,
  pitcherWarOf,
  slgOf,
  trustOf,
  trustSentence,
  whipOf,
  wobaOf,
  wrcPlusOf,
} from '../sabermetrics';
import { GLOSSARY, explainFor, gaugePosition } from '../statGlossary';
import { colors, spacing, tabularFigures, typography } from '../theme';

const PARK = '대전';

export function PlayersScreen({
  profile,
  onLevel,
}: {
  profile: UserProfile;
  onLevel: (l: KnowledgeLevel) => void;
}) {
  const [tab, setTab] = useState<'batter' | 'pitcher'>('batter');
  const [openId, setOpenId] = useState<string | null>('nsh');
  const [glossaryKey, setGlossaryKey] = useState<string | null>(null);

  const batters = BATTERS.slice().sort((a, b) => batterWarOf(b.stat, PARK) - batterWarOf(a.stat, PARK));
  const pitchers = PITCHERS.slice().sort(
    (a, b) => pitcherWarOf(b.stat, PARK) - pitcherWarOf(a.stat, PARK),
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: spacing.scrollBottom }}
    >
      <View style={st.tabsWrap}>
        <TopTabs
          tabs={[
            { key: 'batter' as const, label: '타자' },
            { key: 'pitcher' as const, label: '투수' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      <View style={{ paddingHorizontal: spacing.screenX }}>
        <SectionTitle title="WAR 순" />

        <GroupCard>
          {tab === 'batter'
            ? batters.map((b, i) => (
                <BatterRow
                  key={b.id}
                  batter={b}
                  last={i === batters.length - 1}
                  open={openId === b.id}
                  onToggle={() => setOpenId(openId === b.id ? null : b.id)}
                  onGlossary={setGlossaryKey}
                  profile={profile}
                />
              ))
            : pitchers.map((p, i) => (
                <PitcherRow
                  key={p.id}
                  pitcher={p}
                  last={i === pitchers.length - 1}
                  open={openId === p.id}
                  onToggle={() => setOpenId(openId === p.id ? null : p.id)}
                  profile={profile}
                />
              ))}
        </GroupCard>

        {glossaryKey ? (
          <GlossaryPanel
            statKey={glossaryKey}
            profile={profile}
            onClose={() => setGlossaryKey(null)}
          />
        ) : null}

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

        <Text style={st.footNote}>
          수치는 시연용 샘플입니다. 계산 공식은 실제 세이버메트릭스 정의를 따릅니다.
        </Text>
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────

function BatterRow({
  batter,
  last,
  open,
  onToggle,
  onGlossary,
  profile,
}: {
  batter: Batter;
  last: boolean;
  open: boolean;
  onToggle: () => void;
  onGlossary: (k: string) => void;
  profile: UserProfile;
}) {
  const b = batter.stat;
  const war = batterWarOf(b, PARK);
  const wrc = wrcPlusOf(b, PARK);
  const woba = wobaOf(b);
  const babip = babipOf(b);
  const bd = batterWarBreakdown(b, PARK);

  return (
    <View style={!last && !open ? st.rowDivider : undefined}>
      <Row last onPress={onToggle} style={st.playerRow}>
        <PlayerAvatar playerId={batter.id} team="HH" size={42} />
        <View style={{ flex: 1 }}>
          <View style={st.nameRow}>
            <Text style={st.back}>{batter.back}</Text>
            <Text style={st.name}>{batter.name}</Text>
            <Text style={st.pos}>{batter.pos}</Text>
          </View>
          <Text style={st.slash}>
            {avgOf(b).toFixed(3)} / {obpOf(b).toFixed(3)} / {slgOf(b).toFixed(3)}
          </Text>
        </View>
        <View style={st.rightStat}>
          <Text style={st.warValue}>{war}</Text>
          <Text style={st.warLabel}>WAR</Text>
        </View>
      </Row>

      {open ? (
        <View style={[st.detail, !last && st.rowDivider]}>
          <View style={st.metricRow}>
            <MetricTile label="wRC+" value={String(wrc)} statKey="wrcPlus" sample={b.pa} onGlossary={onGlossary} />
            <MetricTile label="wOBA" value={woba.toFixed(3)} statKey="woba" sample={b.pa} onGlossary={onGlossary} />
            <MetricTile label="BABIP" value={babip.toFixed(3)} statKey="babip" sample={b.pa} onGlossary={onGlossary} />
          </View>

          <View style={{ gap: spacing.md }}>
            <MetricGauge statKey="wrcPlus" label="wRC+" value={wrc} />
            <MetricGauge statKey="woba" label="wOBA" value={woba} />
            <MetricGauge statKey="babip" label="BABIP" value={babip} />
          </View>

          <Divider />

          <Label>WAR 분해</Label>
          <View style={{ gap: spacing.sm }}>
            <WarRow label="타격" value={bd.batting} />
            <WarRow label="주루" value={bd.baserunning} />
            <WarRow label="수비" value={bd.fielding} />
            <WarRow label={`포지션 조정 (${batter.pos})`} value={bd.position} />
            <WarRow label="대체 수준" value={bd.replacement} />
            <View style={st.warSum}>
              <Text style={st.warSumLabel}>
                {(bd.batting + bd.baserunning + bd.fielding + bd.position + bd.replacement).toFixed(1)}
                런 ÷ {LEAGUE.runsPerWin}
              </Text>
              <Text style={st.warSumValue}>{war} WAR</Text>
            </View>
          </View>

          <Divider />

          <View style={st.metricRow}>
            <StatTile label="땅볼" value={`${Math.round(b.gbRate * 100)}%`} />
            <StatTile label="뜬공" value={`${Math.round(b.fbRate * 100)}%`} />
            <StatTile label="라인드라이브" value={`${Math.round(b.ldRate * 100)}%`} />
          </View>

          <TrustNote metric="babip" sample={b.pa} label="BABIP" />
          {profile.level !== 'rookie' ? (
            <TrustNote metric="wrcPlus" sample={b.pa} label="wRC+" />
          ) : null}

          <Text style={st.note}>{batter.note}</Text>
        </View>
      ) : null}
    </View>
  );
}

function PitcherRow({
  pitcher,
  last,
  open,
  onToggle,
  profile,
}: {
  pitcher: Pitcher;
  last: boolean;
  open: boolean;
  onToggle: () => void;
  profile: UserProfile;
}) {
  const p = pitcher.stat;
  const era = eraOf(p);
  const fip = fipOf(p);
  const war = pitcherWarOf(p, PARK);
  const bab = babipAllowedOf(p);
  const gap = era - fip;

  return (
    <View style={!last && !open ? st.rowDivider : undefined}>
      <Row last onPress={onToggle} style={st.playerRow}>
        <PlayerAvatar playerId={pitcher.id} team="HH" size={42} />
        <View style={{ flex: 1 }}>
          <View style={st.nameRow}>
            <Text style={st.back}>{pitcher.back}</Text>
            <Text style={st.name}>{pitcher.name}</Text>
            <Text style={st.pos}>{pitcher.role}</Text>
          </View>
          <Text style={st.slash}>
            {p.w}승 {p.l}패{p.sv > 0 ? ` ${p.sv}세이브` : ''} · ERA {era.toFixed(2)}
          </Text>
        </View>
        <View style={st.rightStat}>
          <Text style={st.warValue}>{war}</Text>
          <Text style={st.warLabel}>WAR</Text>
        </View>
      </Row>

      {open ? (
        <View style={[st.detail, !last && st.rowDivider]}>
          <View style={st.metricRow}>
            <StatTile label="ERA" value={era.toFixed(2)} />
            <StatTile label="FIP" value={fip.toFixed(2)} tone="brand" />
            <StatTile label="WHIP" value={whipOf(p).toFixed(2)} />
          </View>

          <Label>ERA 와 FIP 의 차이</Label>
          <Text style={st.gapText}>
            {Math.abs(gap) < 0.2
              ? '두 값이 거의 같습니다. 지금 성적이 실력 그대로라는 뜻이라 앞으로도 비슷하게 갑니다.'
              : gap > 0
                ? `ERA 가 FIP 보다 ${gap.toFixed(2)} 높습니다. 삼진·볼넷·피홈런만 보면 더 잘 던졌는데 실점이 많았다는 뜻이라, 앞으로 좋아질 여지가 있습니다.`
                : `ERA 가 FIP 보다 ${(-gap).toFixed(2)} 낮습니다. 실점이 적었지만 그 이유가 투수 본인의 결과만으로는 설명되지 않아, 지금 성적이 그대로 유지되기는 어렵습니다.`}
          </Text>

          <Divider />

          <Label>구종</Label>
          <View style={{ gap: spacing.sm }}>
            {pitcher.pitches.map((pt) => (
              <View key={pt.name} style={st.pitchRow}>
                <Text style={st.pitchName}>{pt.name}</Text>
                <View style={{ flex: 1 }}>
                  <Gauge position={pt.usage} tone={colors.neutralFill} />
                </View>
                <Text style={st.pitchPct}>{Math.round(pt.usage * 100)}%</Text>
                {pt.velo ? <Text style={st.pitchVelo}>{pt.velo}</Text> : null}
              </View>
            ))}
          </View>

          <Divider />

          <View style={st.metricRow}>
            <StatTile label="삼진율" value={`${(kRateOf(p) * 100).toFixed(1)}%`} />
            <StatTile label="볼넷율" value={`${(bbRateOf(p) * 100).toFixed(1)}%`} />
            <StatTile label="땅볼" value={`${Math.round(p.gbRate * 100)}%`} />
          </View>

          {profile.level !== 'rookie' ? (
            <Text style={st.note}>
              피BABIP {bab.toFixed(3)} · 리그 평균 {LEAGUE.babipPitcher.toFixed(3)} · {ipLabel(p.ipOuts)}이닝
            </Text>
          ) : null}

          <Text style={st.note}>{pitcher.note}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────

function MetricTile({
  label,
  value,
  statKey,
  sample,
  onGlossary,
}: {
  label: string;
  value: string;
  statKey: string;
  sample: number;
  onGlossary: (k: string) => void;
}) {
  const trust = trustOf(statKey, sample);
  const dot = { high: colors.trustHigh, mid: colors.trustMid, low: colors.trustLow }[trust];
  return (
    <Pressable onPress={() => onGlossary(statKey)} style={st.metricTile}>
      <View style={st.metricHead}>
        <Text style={st.metricLabel}>{label}</Text>
        <View style={[st.trustDot, { backgroundColor: dot }]} />
      </View>
      <Text style={st.metricValue}>{value}</Text>
    </Pressable>
  );
}

function MetricGauge({ statKey, label, value }: { statKey: string; label: string; value: number }) {
  const pos = gaugePosition(statKey, value);
  const g = GLOSSARY[statKey];
  if (pos === null || !g?.scale) return null;
  const midPos = gaugePosition(statKey, g.scale.mid) ?? 0.5;

  // 게이지 셋이 모두 같은 색으로 꽉 차면 그 줄이 색 띠로 보이고 값의 차이가 안 읽힌다.
  // 리그 평균을 넘은 것만 구단 색을 준다 - 색 자체가 "평균 이상인가"를 말하게 된다
  const above = g.scale.better === 'low' ? value < g.scale.mid : value > g.scale.mid;

  return (
    <View style={st.gaugeRow}>
      <Text style={st.gaugeLabel}>{label}</Text>
      <View style={{ flex: 1 }}>
        <Gauge position={pos} markerAt={midPos} tone={above ? colors.brand : colors.neutralFill} />
      </View>
      <Text style={st.gaugeMid}>평균 {g.scale.mid}</Text>
    </View>
  );
}

function WarRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={st.warRow}>
      <Text style={st.warRowLabel}>{label}</Text>
      <Text style={[st.warRowValue, { color: value >= 0 ? colors.win : colors.live }]}>
        {value >= 0 ? '+' : ''}
        {value.toFixed(1)}
      </Text>
    </View>
  );
}

function TrustNote({ metric, sample, label }: { metric: string; sample: number; label: string }) {
  const t = trustOf(metric, sample);
  const tone = { high: colors.trustHigh, mid: colors.trustMid, low: colors.trustLow }[t];
  return (
    <View style={st.trustBox}>
      <View style={st.trustHead}>
        <View style={[st.trustDot, { backgroundColor: tone }]} />
        <Text style={[st.trustTitle, { color: tone }]}>
          {label} · 표본 {{ high: '충분', mid: '보통', low: '부족' }[t]}
        </Text>
      </View>
      <Text style={st.trustText}>{trustSentence(metric, sample)}</Text>
    </View>
  );
}

function GlossaryPanel({
  statKey,
  profile,
  onClose,
}: {
  statKey: string;
  profile: UserProfile;
  onClose: () => void;
}) {
  const g = GLOSSARY[statKey];
  if (!g) return null;
  const lines = explainFor(statKey, profile.level);

  return (
    <>
      <SectionTitle
        title={`${g.label} 설명`}
        right={
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={st.closeText}>닫기</Text>
          </Pressable>
        }
      />
      <Card>
        <CardHeading
          label={{ rookie: '입문', fan: '일반', nerd: '심화' }[profile.level]}
          title={g.short}
        />
        {lines.map((l, i) => (
          <RichText key={i} text={l} style={st.glossaryText} />
        ))}

        {profile.level !== 'rookie' ? (
          <>
            <Divider />
            <Label>언제 이 값을 믿으면 안 되나</Label>
            <RichText text={g.trap} style={st.glossaryTrap} />
          </>
        ) : null}
      </Card>
    </>
  );
}

const st = StyleSheet.create({
  tabsWrap: { backgroundColor: colors.card },
  headNote: typography.micro,

  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },

  playerRow: { paddingVertical: spacing.lg },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  back: { ...typography.micro, ...tabularFigures, color: colors.brandText, fontWeight: '800' },
  name: { fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  pos: typography.micro,
  slash: { ...typography.micro, ...tabularFigures, fontWeight: '500', marginTop: 3 },
  rightStat: { alignItems: 'flex-end' },
  warValue: { ...typography.metric, ...tabularFigures, fontSize: 22, color: colors.brandText },
  warLabel: { ...typography.micro, fontSize: 10 },

  detail: {
    paddingHorizontal: spacing.cardPad,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  metricRow: { flexDirection: 'row', gap: spacing.sm },

  metricTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    gap: 2,
  },
  metricHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metricLabel: typography.micro,
  trustDot: { width: 6, height: 6, borderRadius: 3 },
  metricValue: { ...typography.metric, ...tabularFigures, fontSize: 19, lineHeight: 24 },

  gaugeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  gaugeLabel: { ...typography.caption, color: colors.subText, fontWeight: '600', width: 52 },
  gaugeMid: { ...typography.micro, ...tabularFigures, width: 58, textAlign: 'right' },

  warRow: { flexDirection: 'row', justifyContent: 'space-between' },
  warRowLabel: typography.caption,
  warRowValue: { ...typography.caption, ...tabularFigures, fontWeight: '700' },
  warSum: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  warSumLabel: { ...typography.micro, ...tabularFigures, flex: 1 },
  warSumValue: { ...typography.bodyStrong, ...tabularFigures, color: colors.brandText },

  gapText: { ...typography.caption, lineHeight: 20 },

  pitchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pitchName: { ...typography.caption, color: colors.text, width: 58 },
  pitchPct: { ...typography.micro, ...tabularFigures, width: 32, textAlign: 'right' },
  pitchVelo: { ...typography.micro, ...tabularFigures, width: 30, textAlign: 'right' },

  trustBox: { gap: 3 },
  trustHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustTitle: { ...typography.micro, fontWeight: '800' },
  trustText: { ...typography.micro, fontWeight: '500', lineHeight: 17 },

  note: typography.micro,

  glossaryText: { ...typography.body, fontSize: 13.5, lineHeight: 21 },
  glossaryTrap: { ...typography.body, fontSize: 13.5, lineHeight: 21, color: colors.text },
  closeText: { ...typography.micro, color: colors.brandText, fontWeight: '700' },

  levelNote: typography.caption,
  footNote: { ...typography.micro, marginTop: spacing.xl, paddingHorizontal: spacing.xs },
});
