// 선수 - 심화 스탯과 그 해설
//
// 1차 리뷰 2번의 화면. "WRC, WAR, wOBA 등 좀더 심화된 수치" + "BABIP 설명 수준 보완".
//
// ── 화면 규칙 ────────────────────────────────────────────────
// ① 선수 목록은 **카드 하나 안의 행**이다. 선수마다 카드를 띄우면 같은 흰 상자가
//    서른 번 반복되어 어디가 묶음인지 사라진다
// ② 숫자 옆에 항상 셋이 붙는다: 값 / 리그 평균 대비 위치 / 이 값을 믿어도 되는지
// ③ ③번(신뢰도)이 이 화면의 차별점이다. 표본이 모자라 아직 판단하면 안 되는 값이라는
//    사실까지 말해 주는 앱은 없다
//
// ── 2026-08-25 목록 안 확장 → 상세 시트 ──────────────────────
// 원래는 행을 누르면 **그 자리에서 펼쳐졌다.** 셋이 걸렸다.
//   ① 목록 카드 안이라 폭이 320px 남짓이다. 무엇을 넣든 비좁고, 스탯을 더 얹을 자리가
//      아예 없다 (월별 추이·상황별 스플릿을 넣을 곳이 없었다)
//   ② 펼치는 순간 아래 행들이 밀려 스크롤 위치가 튄다
//   ③ 용어 설명이 화면 **맨 아래**에 떠서, 누른 타일과 멀찍이 떨어져 나타났다
// 셋 다 "목록 안"이라는 자리에서 나온 문제라 자리를 옮긴다. 굿즈·직관이 쓰는
// DetailSheet 를 그대로 쓴다 - 폭과 높이를 다 쓰고, 목록 행은 다시 훑기 좋게 작아진다.
import { ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Card,
  CardHeading,
  Chip,
  DetailSheet,
  Divider,
  Gauge,
  GroupCard,
  Label,
  NoticeCard,
  NoticeRow,
  RangeGauge,
  RichText,
  Row,
  SectionTitle,
  SecondaryButton,
  SplitBar,
  StatTile,
  TopTabs,
} from '../components/common';
import type { Band } from '../components/common';
import { DataTable, TableColumn } from '../components/DataTable';
import { PlayerAvatar, PlayerFormLoop } from '../components/photos';
import {
  DEFAULT_BATTER_METRICS,
  DEFAULT_PITCHER_METRICS,
  METRIC_MAX,
  METRIC_MIN,
  UserProfile,
} from '../profile';
import { PlayerAnalysis, analyzeBatter, analyzePitcher } from '../playerAnalysis';
import { STANDING } from '../game';
import {
  BATTERS,
  BATTER_MONTHS,
  BATTER_SPLITS,
  Batter,
  PITCHERS,
  PITCHER_MONTHS,
  PITCHER_SPLITS,
  PREV_BATTER,
  PREV_PITCHER,
  Pitcher,
} from '../roster';
import type { BatterStatLine, PitcherStatLine } from '../sabermetrics';
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
  isoOf,
  kRateOf,
  obpOf,
  opsOf,
  pitcherWarOf,
  qualifiedBF,
  qualifiedIPOuts,
  qualifiedPA,
  slgOf,
  soRateOf,
  sumBatterLines,
  sumPitcherLines,
  trustOf,
  trustSentence,
  walkRateOf,
  whipOf,
  wobaOf,
  wrcPlusOf,
} from '../sabermetrics';
import { GLOSSARY, explainFor, gaugePosition } from '../statGlossary';
import { colors, radius, spacing, states, tabularFigures, typography } from '../theme';

const PARK = '대전';

type Tab = 'batter' | 'pitcher' | 'record';
type RoleFilter = '전체' | '선발' | '불펜' | '마무리';

/** 규정 타석·이닝의 기준이 되는 팀 경기 수 */
const TEAM_GAMES = STANDING.w + STANDING.l + STANDING.d;
const QUAL_PA = qualifiedPA(TEAM_GAMES);
const QUAL_OUTS = qualifiedIPOuts(TEAM_GAMES);
/** 투수 타일은 상대타자로 표본을 세므로 규정선도 그 단위로 환산해 둔다 */
const QUAL_BF = qualifiedBF(TEAM_GAMES);

/**
 * 정렬 기준.
 *
 * `format` 이 따로 있는 이유: 정렬을 바꾸면 **행 오른쪽에 뜨는 수치도 같이 바뀐다.**
 * 홈런 순으로 세워 놓고 오른쪽에 WAR 이 떠 있으면 무엇을 기준으로 줄 세운 건지
 * 눈으로 확인할 수가 없다.
 */
interface SortOpt<T> {
  key: string;
  label: string;
  value: (x: T) => number;
  format: (x: T) => string;
  /** 낮을수록 좋은 지표(ERA)는 오름차순 */
  asc?: boolean;
}

const BATTER_SORTS: SortOpt<Batter>[] = [
  {
    key: 'war',
    label: 'WAR',
    value: (b) => batterWarOf(b.stat, PARK),
    format: (b) => batterWarOf(b.stat, PARK).toFixed(1),
  },
  {
    key: 'avg',
    label: '타율',
    value: (b) => avgOf(b.stat),
    format: (b) => avgOf(b.stat).toFixed(3),
  },
  { key: 'hr', label: '홈런', value: (b) => b.stat.hr, format: (b) => String(b.stat.hr) },
  { key: 'rbi', label: '타점', value: (b) => b.stat.rbi, format: (b) => String(b.stat.rbi) },
  {
    key: 'ops',
    label: 'OPS',
    value: (b) => opsOf(b.stat),
    format: (b) => opsOf(b.stat).toFixed(3),
  },
];

const PITCHER_SORTS: SortOpt<Pitcher>[] = [
  {
    key: 'war',
    label: 'WAR',
    value: (p) => pitcherWarOf(p.stat, PARK),
    format: (p) => pitcherWarOf(p.stat, PARK).toFixed(1),
  },
  {
    key: 'era',
    label: 'ERA',
    value: (p) => eraOf(p.stat),
    format: (p) => eraOf(p.stat).toFixed(2),
    asc: true,
  },
  { key: 'so', label: '탈삼진', value: (p) => p.stat.so, format: (p) => String(p.stat.so) },
  { key: 'ip', label: '이닝', value: (p) => p.stat.ipOuts, format: (p) => ipLabel(p.stat.ipOuts) },
];

const ROLE_FILTERS: RoleFilter[] = ['전체', '선발', '불펜', '마무리'];

/**
 * 타자 카드에 띄울 수 있는 세부 지표.
 *
 * 정렬(BATTER_SORTS)과 다른 축이다. 정렬은 **누구를 먼저 볼까**를 정하고, 이쪽은
 * 고른 선수에 대해 **무엇을 볼까**를 정한다. 그래서 목록이 겹치는 것(WAR·OPS)이
 * 있어도 한쪽으로 합치지 않는다 - 홈런 순으로 세워 놓고 wRC+ 를 보는 일이 흔하다.
 *
 * `key` 는 GLOSSARY · STABILIZATION_PA 의 키와 같아야 한다. 이 하나로 타일의 설명,
 * 신뢰도 점, 게이지 눈금이 전부 따라온다 - 여기 없는 키를 넣으면 설명도 눈금도 없는
 * 맹탕 타일이 뜬다(그래서 profile.normalizeBatterMetrics 가 저장값도 한 번 거른다).
 */
interface MetricOpt<T> {
  key: string;
  label: string;
  value: (x: T) => number;
  format: (x: T) => string;
}

const pctText = (v: number) => `${(v * 100).toFixed(1)}%`;

const BATTER_METRICS: MetricOpt<BatterStatLine>[] = [
  {
    key: 'wrcPlus',
    label: 'wRC+',
    value: (b) => wrcPlusOf(b, PARK),
    format: (b) => String(wrcPlusOf(b, PARK)),
  },
  { key: 'woba', label: 'wOBA', value: wobaOf, format: (b) => wobaOf(b).toFixed(3) },
  { key: 'babip', label: 'BABIP', value: babipOf, format: (b) => babipOf(b).toFixed(3) },
  {
    key: 'war',
    label: 'WAR',
    value: (b) => batterWarOf(b, PARK),
    format: (b) => batterWarOf(b, PARK).toFixed(1),
  },
  { key: 'ops', label: 'OPS', value: opsOf, format: (b) => opsOf(b).toFixed(3) },
  { key: 'iso', label: 'ISO', value: isoOf, format: (b) => isoOf(b).toFixed(3) },
  { key: 'soRate', label: '삼진율', value: soRateOf, format: (b) => pctText(soRateOf(b)) },
  { key: 'walkRate', label: '볼넷율', value: walkRateOf, format: (b) => pctText(walkRateOf(b)) },
];

/**
 * 투수 쪽 목록.
 *
 * 타자와 한 목록으로 합치지 않는다. 지표가 다르기도 하지만 무엇보다 **표본의 단위가
 * 다르다** - 타자는 타석, 투수는 상대타자로 세고 규정선도 따로다(QUAL_PA vs QUAL_BF).
 *
 * ERA·WHIP·피BABIP 는 STABILIZATION_PA 에 값이 없다. 일부러 비워 둔 것이다 - 셋 다
 * '몇 타자면 자리를 잡는다'고 말할 수 있는 지표가 아니라서, readableAt() 이 규정선으로
 * 되돌린다. 즉 이 셋은 '규정이닝만큼 던졌나'로 판정된다.
 */
const PITCHER_METRICS: MetricOpt<PitcherStatLine>[] = [
  { key: 'era', label: 'ERA', value: eraOf, format: (p) => eraOf(p).toFixed(2) },
  { key: 'fip', label: 'FIP', value: fipOf, format: (p) => fipOf(p).toFixed(2) },
  { key: 'whip', label: 'WHIP', value: whipOf, format: (p) => whipOf(p).toFixed(2) },
  {
    key: 'war',
    label: 'WAR',
    value: (p) => pitcherWarOf(p, PARK),
    format: (p) => pitcherWarOf(p, PARK).toFixed(1),
  },
  { key: 'kRate', label: '삼진율', value: kRateOf, format: (p) => pctText(kRateOf(p)) },
  { key: 'bbRate', label: '볼넷율', value: bbRateOf, format: (p) => pctText(bbRateOf(p)) },
  {
    key: 'babipAllowed',
    label: '피BABIP',
    value: babipAllowedOf,
    format: (p) => babipAllowedOf(p).toFixed(3),
  },
  { key: 'gbRate', label: '땅볼 비율', value: (p) => p.gbRate, format: (p) => pctText(p.gbRate) },
];

/**
 * 저장된 키 목록을 그릴 수 있는 지표로 - 모르는 키는 조용히 버린다.
 *
 * 기본값마저 목록에 없으면(카탈로그를 갈아엎은 판) 앞의 셋으로 물러선다. 재귀로 두면
 * 그 상황에서 스택이 터지는데, 화면이 안 뜨는 것보다는 다른 지표라도 뜨는 편이 낫다.
 */
function metricsOf<T>(keys: string[], catalog: MetricOpt<T>[], fallback: string[]): MetricOpt<T>[] {
  const pick = (ks: string[]) =>
    ks.map((k) => catalog.find((m) => m.key === k)).filter((m): m is MetricOpt<T> => !!m);
  const picked = pick(keys);
  if (picked.length > 0) return picked;
  const base = pick(fallback);
  return base.length > 0 ? base : catalog.slice(0, 3);
}

/** 목록의 한 줄에 들어가는 것 - 시트를 열지 않고도 훑을 수 있어야 한다 */
interface RowData {
  id: string;
  back: number;
  name: string;
  /** 포지션(타자) 또는 보직(투수) */
  meta: string;
  /** 누구나 아는 스탯 한 줄 */
  lead: string;
  /** 오른쪽 큰 수치 - 지금 정렬 기준을 그대로 보여준다 */
  statValue: string;
  statLabel: string;
}

export function PlayersScreen({
  profile,
  onBatterMetrics,
  onPitcherMetrics,
}: {
  profile: UserProfile;
  /** '지표 편집'의 결과. App 이 받아 저장소까지 보낸다 */
  onBatterMetrics: (keys: string[]) => void;
  onPitcherMetrics: (keys: string[]) => void;
}) {
  const [tab, setTab] = useState<Tab>('batter');
  /** 지표 편집 시트가 열려 있는가 */
  const [editing, setEditing] = useState(false);
  const [batterSort, setBatterSort] = useState('war');
  const [pitcherSort, setPitcherSort] = useState('war');
  const [role, setRole] = useState<RoleFilter>('전체');
  /** 상세 시트에 열려 있는 선수. null 이면 시트가 닫힌 상태 */
  const [openId, setOpenId] = useState<string | null>(null);
  const [glossaryKey, setGlossaryKey] = useState<string | null>(null);

  const metrics = metricsOf(profile.batterMetrics, BATTER_METRICS, DEFAULT_BATTER_METRICS);
  const pMetrics = metricsOf(profile.pitcherMetrics, PITCHER_METRICS, DEFAULT_PITCHER_METRICS);

  const openBatter = BATTERS.find((b) => b.id === openId);
  const openPitcher = PITCHERS.find((p) => p.id === openId);
  const open = openBatter ?? openPitcher;

  // 시트를 닫을 때 용어 설명도 같이 접는다. 남겨 두면 다음에 다른 선수를 열었을 때
  // 누르지도 않은 설명이 펼쳐진 채로 나타난다
  const closeSheet = () => {
    setOpenId(null);
    setGlossaryKey(null);
  };
  const openPlayer = (id: string) => {
    setOpenId(id);
    setGlossaryKey(null);
  };

  const bOpt = BATTER_SORTS.find((o) => o.key === batterSort) ?? BATTER_SORTS[0];
  const pOpt = PITCHER_SORTS.find((o) => o.key === pitcherSort) ?? PITCHER_SORTS[0];
  const by =
    <T,>(o: SortOpt<T>) =>
    (a: T, b: T) =>
      o.asc ? o.value(a) - o.value(b) : o.value(b) - o.value(a);

  const batterRows: RowData[] = BATTERS.slice()
    .sort(by(bOpt))
    .map((b) => ({
      id: b.id,
      back: b.back,
      name: b.name,
      meta: b.pos,
      lead: `타율 ${avgOf(b.stat).toFixed(3)} · ${b.stat.hr}홈런 · ${b.stat.rbi}타점`,
      statValue: bOpt.format(b),
      statLabel: bOpt.label,
    }));

  const pitcherRows: RowData[] = PITCHERS.filter((p) => role === '전체' || p.role === role)
    .sort(by(pOpt))
    .map((p) => {
      const s = p.stat;
      const relief = s.sv > 0 ? ` ${s.sv}세이브` : s.hld > 0 ? ` ${s.hld}홀드` : '';
      return {
        id: p.id,
        back: p.back,
        name: p.name,
        meta: p.role,
        lead: `ERA ${eraOf(s).toFixed(2)} · ${s.w}승 ${s.l}패${relief} · ${s.so}탈삼진`,
        statValue: pOpt.format(p),
        statLabel: pOpt.label,
      };
    });

  const rows = tab === 'batter' ? batterRows : pitcherRows;
  const sortLabel = tab === 'batter' ? bOpt.label : pOpt.label;

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.scrollBottom }}
      >
        <View style={st.tabsWrap}>
          <TopTabs
            tabs={[
              { key: 'batter' as const, label: '타자' },
              { key: 'pitcher' as const, label: '투수' },
              { key: 'record' as const, label: '기록' },
            ]}
            value={tab}
            onChange={(t) => {
              setTab(t);
              setEditing(false);
            }}
          />
        </View>

        <View style={{ paddingHorizontal: spacing.screenX }}>
          {tab === 'record' ? (
            <RecordTab onOpen={openPlayer} />
          ) : (
            <>
              {/* ── 오른쪽 자리를 명수에서 '편집'으로 바꾼다 ──────────
                  명수는 목록을 보면 알 수 있는 값이라 이 자리에 있을 이유가 약했다.
                  반면 아래 카드에 뜨는 세 지표는 **바꿀 수 있다는 사실 자체가**
                  화면 어디에도 없었다. 카드 안에 편집 버튼을 넣으면 펼쳐 둔 한 명의
                  설정처럼 보이므로, 목록 전체를 지배하는 머리글에 둔다.

                  타자·투수 양쪽에 둔다. 한쪽에만 있으면 탭을 옮겼을 때 기능이
                  사라진 것처럼 보이고, 실제로 투수 카드도 고칠 것이 셋이다 */}
              <SectionTitle
                title={`${tab === 'batter' ? '타자' : '투수'} ${sortLabel} 순`}
                right={
                  <Pressable
                    onPress={() => setEditing(true)}
                    hitSlop={10}
                    style={({ pressed }) => [st.editBtn, pressed && states.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`세부 지표 편집 · 현재 ${(tab === 'batter'
                      ? metrics
                      : pMetrics
                    )
                      .map((m) => m.label)
                      .join(', ')}`}
                  >
                    <Text style={st.editBtnText}>지표 편집</Text>
                  </Pressable>
                }
              />

              {/* 정렬 - 무엇을 기준으로 줄 세울지. 오른쪽 수치도 따라 바뀐다 */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={st.chipRow}
              >
                {(tab === 'batter' ? BATTER_SORTS : PITCHER_SORTS).map((o) => (
                  <Chip
                    key={o.key}
                    label={o.label}
                    selected={o.key === (tab === 'batter' ? batterSort : pitcherSort)}
                    onPress={() =>
                      tab === 'batter' ? setBatterSort(o.key) : setPitcherSort(o.key)
                    }
                  />
                ))}
              </ScrollView>

              {/* 투수는 24명이라 보직으로 한 번 걸러야 훑을 만해진다 */}
              {tab === 'pitcher' ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[st.chipRow, { marginTop: spacing.sm }]}
                >
                  {ROLE_FILTERS.map((r) => (
                    <Chip key={r} label={r} selected={r === role} onPress={() => setRole(r)} />
                  ))}
                </ScrollView>
              ) : null}

              {/* ── 첫 줄은 펼쳐 둔다 ─────────────────────────
                  목록만 있으면 화면에 들어왔을 때 **읽을 것이 하나도 없다.** 전부
                  눌러야 나오는 화면은 "무엇을 눌러야 하는지"부터 정해야 해서, 이
                  탭이 무엇을 보여주는 곳인지 자체가 안 보인다.

                  그래서 지금 정렬 기준 1위 한 명을 펼친 채로 둔다. 들어오자마자
                  이 탭의 성격(심화 지표를 이만큼 판다)이 그림으로 읽히고, 나머지는
                  같은 것을 눌러서 본다. 정렬을 바꾸면 펼쳐지는 사람도 따라 바뀐다 */}
              <View style={{ marginTop: spacing.md }}>
                <GroupCard>
                  {rows.map((r, i) => (
                    <PlayerRow
                      key={r.id}
                      data={r}
                      last={i === rows.length - 1}
                      onPress={() => openPlayer(r.id)}
                      detail={
                        i === 0 ? (
                          <FeaturedDetail
                            row={r}
                            metrics={metrics}
                            pitcherMetrics={pMetrics}
                            profile={profile}
                            glossaryKey={glossaryKey}
                            onGlossary={setGlossaryKey}
                          />
                        ) : null
                      }
                    />
                  ))}
                </GroupCard>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* ── 선수 상세 ────────────────────────────────────────
          목록이 "무엇이 있는지"까지 말하고, 판단에 필요한 것은 전부 여기 있다 */}
      <DetailSheet
        visible={!!open}
        title={open ? open.name : ''}
        subtitle={
          openBatter
            ? `${openBatter.back} · ${openBatter.pos} · ${bats(openBatter.bats)}`
            : openPitcher
              ? `${openPitcher.back} · ${openPitcher.role} · ${openPitcher.throws === 'L' ? '좌투' : '우투'}`
              : ''
        }
        onClose={closeSheet}
      >
        {openBatter ? (
          <BatterDetail
            batter={openBatter}
            metrics={metrics}
            profile={profile}
            glossaryKey={glossaryKey}
            onGlossary={setGlossaryKey}
          />
        ) : null}
        {openPitcher ? (
          <PitcherDetail
            pitcher={openPitcher}
            metrics={pMetrics}
            profile={profile}
            glossaryKey={glossaryKey}
            onGlossary={setGlossaryKey}
          />
        ) : null}
      </DetailSheet>

      {/* 두 시트를 동시에 매달지 않는다. 지금 보고 있는 탭의 것 하나만 존재한다 */}
      {tab === 'pitcher' ? (
        <MetricPicker
          visible={editing}
          title="투수 세부 지표"
          catalog={PITCHER_METRICS}
          defaults={DEFAULT_PITCHER_METRICS}
          selected={profile.pitcherMetrics}
          onChange={onPitcherMetrics}
          onClose={() => setEditing(false)}
        />
      ) : (
        <MetricPicker
          visible={editing}
          title="타자 세부 지표"
          catalog={BATTER_METRICS}
          defaults={DEFAULT_BATTER_METRICS}
          selected={profile.batterMetrics}
          onChange={onBatterMetrics}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}

/**
 * 세부 지표 고르기.
 *
 * ── 왜 순서를 보이게 했나 ───────────────────────────────────
 * 체크 표시 대신 **몇 번째인지**를 적는다. 고른 순서가 곧 타일 순서라, 체크만 찍으면
 * 시트를 닫은 뒤 "내가 왼쪽에 두려던 게 이게 아닌데"가 된다. 숫자가 그 약속을 미리 말한다.
 *
 * ── 왜 최대치에서 막기만 하고 밀어내지 않나 ─────────────────
 * 가득 찬 상태에서 새로 누르면 가장 먼저 고른 것이 빠지게 할 수도 있었다. 누르는 만큼
 * 계속 바뀌니 편하긴 한데, **내가 지우지 않은 것이 사라진다.** 대신 막고, 왜 막혔는지와
 * 어떻게 푸는지를 같은 자리에서 말한다.
 */
function MetricPicker({
  visible,
  title,
  catalog,
  defaults,
  selected,
  onChange,
  onClose,
}: {
  visible: boolean;
  title: string;
  /** 고를 수 있는 것 전부. 값 계산은 필요 없으니 이름만 받는다 */
  catalog: { key: string; label: string }[];
  defaults: string[];
  selected: string[];
  onChange: (keys: string[]) => void;
  onClose: () => void;
}) {
  const picked = selected.filter((k) => catalog.some((m) => m.key === k));
  const full = picked.length >= METRIC_MAX;
  const atMin = picked.length <= METRIC_MIN;

  const toggle = (key: string) => {
    if (picked.includes(key)) {
      if (atMin) return; // 마지막 하나는 끌 수 없다 - 빈 카드는 스스로 빠져나올 수 없다
      onChange(picked.filter((k) => k !== key));
      return;
    }
    if (full) return;
    onChange([...picked, key]);
  };

  const isDefault = picked.length === defaults.length && picked.every((k, i) => k === defaults[i]);

  return (
    <DetailSheet
      visible={visible}
      title={title}
      subtitle={`카드에 띄울 지표 · ${picked.length} / ${METRIC_MAX}`}
      onClose={onClose}
      actions={
        isDefault ? null : (
          <SecondaryButton label="기본값으로 되돌리기" onPress={() => onChange(defaults)} />
        )
      }
    >
      <View style={{ gap: spacing.cardGap }}>
        <NoticeCard
          tone={full ? 'warn' : 'muted'}
          title={full ? '더 고르려면 하나를 빼세요' : `${METRIC_MAX}개까지 고를 수 있습니다`}
        >
          <Text style={st.pickIntro}>
            {full
              ? '다른 지표를 넣으려면 고른 것 중 하나를 다시 눌러 빼세요. 고른 순서가 그대로 타일 순서가 됩니다.'
              : '고른 순서가 그대로 타일 순서가 됩니다. 지표마다 값·리그 위치·표본 신뢰도가 함께 붙습니다.'}
          </Text>
        </NoticeCard>

        <GroupCard>
          {catalog.map((m, i) => {
            const at = picked.indexOf(m.key);
            const on = at >= 0;
            // 더 고를 수 없어 지금은 누를 수 없는 줄. 없는 것처럼 지우지 않고 물러나게만 한다
            const blocked = !on && full;
            const g = GLOSSARY[m.key];
            return (
              <Row
                key={m.key}
                last={i === catalog.length - 1}
                onPress={() => toggle(m.key)}
                style={st.pickRow}
              >
                <View style={[st.pickMark, on && st.pickMarkOn]}>
                  <Text style={[st.pickMarkText, on && st.pickMarkTextOn]}>
                    {on ? String(at + 1) : ''}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[st.pickLabel, blocked && st.pickDim]}>{m.label}</Text>
                  <Text style={[st.pickHint, blocked && st.pickDim]}>{g?.short ?? ''}</Text>
                </View>
              </Row>
            );
          })}
        </GroupCard>

        <Text style={st.pickFoot}>
          고른 지표는 목록에 펼쳐 둔 선수와 선수 상세 양쪽에 같이 적용되고, 앱을 껐다 켜도 남습니다.
        </Text>
      </View>
    </DetailSheet>
  );
}

const bats = (b: 'L' | 'R' | 'S') => (b === 'L' ? '좌타' : b === 'R' ? '우타' : '스위치');

// ─────────────────────────────────────────────────────────────
// 기록 탭 - 부문별 순위
// ─────────────────────────────────────────────────────────────

/**
 * 기록 탭.
 *
 * 타자·투수 목록이 "누가 있나"에 답한다면 여기는 **"올해 어떻게 하고 있나"**에 답한다.
 * 선수 한 명을 열어 보지 않고도 팀의 타율과 부문별 1위가 잡혀야 한다.
 *
 * ⚠ 맨 위 합계는 **이 앱 명단의 합**이지 구단 공식 팀 기록이 아니다. 명단이 35명뿐이고
 * 성적도 시연용 샘플이라 실제 팀 기록과 다르다. 제목에 그렇게 적는다.
 */
function RecordTab({ onOpen }: { onOpen: (id: string) => void }) {
  const bAgg = sumBatterLines(BATTERS.map((b) => b.stat));
  const pAgg = sumPitcherLines(PITCHERS.map((p) => p.stat));

  return (
    <>
      <SectionTitle title="선수단 합계" right={<Text style={st.headNote}>{TEAM_GAMES}경기</Text>} />
      <Card>
        <Label>타격</Label>
        <View style={st.metricRow}>
          <StatTile label="타율" value={avgOf(bAgg).toFixed(3)} sub={`${bAgg.h}안타`} />
          <StatTile label="출루율" value={obpOf(bAgg).toFixed(3)} sub={`${bAgg.bb}볼넷`} />
          <StatTile label="OPS" value={opsOf(bAgg).toFixed(3)} sub={`${bAgg.hr}홈런`} />
        </View>

        <Divider />

        <Label>투구</Label>
        <View style={st.metricRow}>
          <StatTile label="평균자책점" value={eraOf(pAgg).toFixed(2)} sub={`${pAgg.er}자책`} />
          <StatTile label="WHIP" value={whipOf(pAgg).toFixed(2)} sub={`${pAgg.h}피안타`} />
          <StatTile label="탈삼진" value={String(pAgg.so)} sub={`${pAgg.bb}볼넷`} />
        </View>
      </Card>

      {/* 부문 카드는 "1위가 누구냐"에 답하고, 표는 "전부 늘어놓고 비교"에 답한다.
          둘 다 필요하다 - 카드만 있으면 4위부터는 아예 볼 수가 없다 */}
      <StatTable
        title="타자 세부지표"
        note={`규정 ${QUAL_PA}타석 이상 굵게`}
        columns={BATTER_COLS}
        rows={BATTERS.map((x) => ({
          id: x.id,
          name: x.name,
          meta: x.pos,
          strong: x.stat.pa >= QUAL_PA,
          item: x,
        }))}
        onOpen={onOpen}
      />

      <StatTable
        title="투수 세부지표"
        note={`규정 ${QUAL_OUTS / 3}이닝 이상 굵게`}
        columns={PITCHER_COLS}
        rows={PITCHERS.map((x) => ({
          id: x.id,
          name: x.name,
          meta: x.role,
          strong: x.stat.ipOuts >= QUAL_OUTS,
          item: x,
        }))}
        onOpen={onOpen}
      />

      <SectionTitle title="타격 부문" />
      <View style={{ gap: spacing.cardGap }}>
        <LeaderCard
          title="타율"
          note={`규정 ${QUAL_PA}타석`}
          rows={leaders(
            BATTERS.filter((b) => b.stat.pa >= QUAL_PA),
            (b) => avgOf(b.stat),
            (b) => avgOf(b.stat).toFixed(3),
          )}
          onOpen={onOpen}
        />
        <LeaderCard
          title="홈런"
          rows={leaders(
            BATTERS,
            (b) => b.stat.hr,
            (b) => `${b.stat.hr}개`,
          )}
          onOpen={onOpen}
        />
        <LeaderCard
          title="타점"
          rows={leaders(
            BATTERS,
            (b) => b.stat.rbi,
            (b) => `${b.stat.rbi}점`,
          )}
          onOpen={onOpen}
        />
        <LeaderCard
          title="OPS"
          note={`규정 ${QUAL_PA}타석`}
          rows={leaders(
            BATTERS.filter((b) => b.stat.pa >= QUAL_PA),
            (b) => opsOf(b.stat),
            (b) => opsOf(b.stat).toFixed(3),
          )}
          onOpen={onOpen}
        />
      </View>

      <SectionTitle title="투구 부문" />
      <View style={{ gap: spacing.cardGap }}>
        <LeaderCard
          title="평균자책점"
          note={`규정 ${QUAL_OUTS / 3}이닝`}
          rows={leaders(
            PITCHERS.filter((p) => p.stat.ipOuts >= QUAL_OUTS),
            (p) => -eraOf(p.stat), // 낮을수록 위로
            (p) => eraOf(p.stat).toFixed(2),
          )}
          onOpen={onOpen}
        />
        <LeaderCard
          title="탈삼진"
          rows={leaders(
            PITCHERS,
            (p) => p.stat.so,
            (p) => `${p.stat.so}개`,
          )}
          onOpen={onOpen}
        />
        <LeaderCard
          title="승리"
          rows={leaders(
            PITCHERS,
            (p) => p.stat.w,
            (p) => `${p.stat.w}승`,
          )}
          onOpen={onOpen}
        />
        <LeaderCard
          title="세이브·홀드"
          rows={leaders(
            PITCHERS,
            (p) => p.stat.sv * 2 + p.stat.hld,
            (p) => (p.stat.sv > 0 ? `${p.stat.sv}세이브` : `${p.stat.hld}홀드`),
          )}
          onOpen={onOpen}
        />
      </View>
    </>
  );
}

/** 표의 한 열. 정렬도 이 정의 하나로 굴러간다 */
/**
 * 표의 한 열.
 *
 * 스무 개 넘는 열을 DataTable 의 TableColumn 형태로 그대로 적으면 `key` 와 `render` 가
 * 라벨마다 되풀이된다. 여기서는 짧게 적고 toColumns() 가 옮긴다.
 */
interface Col<T> {
  label: string;
  /** 정렬에 쓰는 값 */
  value: (x: T) => number;
  format: (x: T) => string;
  /** 낮을수록 좋은 지표(ERA·WHIP)는 첫 정렬이 오름차순 */
  asc?: boolean;
  /** 이 열로 처음 열리는 정렬 기준 */
  initial?: boolean;
}

// 표가 다루는 것은 선수(T) 가 아니라 **줄(TableRow<T>)** 이다 - 규정 충족 여부처럼
// 선수에는 없고 줄에만 있는 것이 붙어 있다. 그래서 여기서 한 겹 벗겨 넘긴다
const toColumns = <T,>(cols: Col<T>[]): TableColumn<TableRow<T>>[] =>
  cols.map((c) => ({
    key: c.label,
    label: c.label,
    allowsSorting: true,
    sortValue: (r: TableRow<T>) => c.value(r.item),
    ascendingFirst: c.asc,
    render: (r: TableRow<T>) => c.format(r.item),
  }));

const BATTER_COLS: Col<Batter>[] = [
  { label: '타율', value: (x) => avgOf(x.stat), format: (x) => dec3(avgOf(x.stat)) },
  { label: '경기', value: (x) => x.stat.g, format: (x) => String(x.stat.g) },
  { label: '타석', value: (x) => x.stat.pa, format: (x) => String(x.stat.pa) },
  { label: '타수', value: (x) => x.stat.ab, format: (x) => String(x.stat.ab) },
  { label: '안타', value: (x) => x.stat.h, format: (x) => String(x.stat.h) },
  { label: '2루타', value: (x) => x.stat.double, format: (x) => String(x.stat.double) },
  { label: '3루타', value: (x) => x.stat.triple, format: (x) => String(x.stat.triple) },
  { label: '홈런', value: (x) => x.stat.hr, format: (x) => String(x.stat.hr) },
  { label: '타점', value: (x) => x.stat.rbi, format: (x) => String(x.stat.rbi) },
  { label: '득점', value: (x) => x.stat.r, format: (x) => String(x.stat.r) },
  { label: '도루', value: (x) => x.stat.sb, format: (x) => String(x.stat.sb) },
  { label: '볼넷', value: (x) => x.stat.bb, format: (x) => String(x.stat.bb) },
  { label: '사구', value: (x) => x.stat.hbp, format: (x) => String(x.stat.hbp) },
  { label: '삼진', value: (x) => x.stat.so, format: (x) => String(x.stat.so), asc: true },
  { label: '병살', value: (x) => x.stat.gdp, format: (x) => String(x.stat.gdp), asc: true },
  { label: '출루율', value: (x) => obpOf(x.stat), format: (x) => dec3(obpOf(x.stat)) },
  { label: '장타율', value: (x) => slgOf(x.stat), format: (x) => dec3(slgOf(x.stat)) },
  { label: 'OPS', value: (x) => opsOf(x.stat), format: (x) => dec3(opsOf(x.stat)) },
  { label: 'IsoP', value: (x) => isoOf(x.stat), format: (x) => dec3(isoOf(x.stat)) },
  { label: 'BABIP', value: (x) => babipOf(x.stat), format: (x) => dec3(babipOf(x.stat)) },
  { label: 'wOBA', value: (x) => wobaOf(x.stat), format: (x) => dec3(wobaOf(x.stat)) },
  {
    label: 'wRC+',
    value: (x) => wrcPlusOf(x.stat, PARK),
    format: (x) => String(wrcPlusOf(x.stat, PARK)),
  },
  {
    label: 'WAR',
    value: (x) => batterWarOf(x.stat, PARK),
    format: (x) => batterWarOf(x.stat, PARK).toFixed(1),
    initial: true,
  },
];

const PITCHER_COLS: Col<Pitcher>[] = [
  { label: 'ERA', value: (x) => eraOf(x.stat), format: (x) => eraOf(x.stat).toFixed(2), asc: true },
  { label: '경기', value: (x) => x.stat.g, format: (x) => String(x.stat.g) },
  { label: '선발', value: (x) => x.stat.gs, format: (x) => String(x.stat.gs) },
  { label: '이닝', value: (x) => x.stat.ipOuts, format: (x) => ipLabel(x.stat.ipOuts) },
  { label: '승', value: (x) => x.stat.w, format: (x) => String(x.stat.w) },
  { label: '패', value: (x) => x.stat.l, format: (x) => String(x.stat.l), asc: true },
  { label: '세이브', value: (x) => x.stat.sv, format: (x) => String(x.stat.sv) },
  { label: '홀드', value: (x) => x.stat.hld, format: (x) => String(x.stat.hld) },
  { label: '피안타', value: (x) => x.stat.h, format: (x) => String(x.stat.h), asc: true },
  { label: '피홈런', value: (x) => x.stat.hr, format: (x) => String(x.stat.hr), asc: true },
  { label: '볼넷', value: (x) => x.stat.bb, format: (x) => String(x.stat.bb), asc: true },
  { label: '사구', value: (x) => x.stat.hbp, format: (x) => String(x.stat.hbp), asc: true },
  { label: '탈삼진', value: (x) => x.stat.so, format: (x) => String(x.stat.so) },
  {
    label: 'WHIP',
    value: (x) => whipOf(x.stat),
    format: (x) => whipOf(x.stat).toFixed(2),
    asc: true,
  },
  { label: 'K%', value: (x) => kRateOf(x.stat), format: (x) => (kRateOf(x.stat) * 100).toFixed(1) },
  {
    label: 'BB%',
    value: (x) => bbRateOf(x.stat),
    format: (x) => (bbRateOf(x.stat) * 100).toFixed(1),
    asc: true,
  },
  { label: 'FIP', value: (x) => fipOf(x.stat), format: (x) => fipOf(x.stat).toFixed(2), asc: true },
  {
    label: '피BABIP',
    value: (x) => babipAllowedOf(x.stat),
    format: (x) => dec3(babipAllowedOf(x.stat)),
    asc: true,
  },
  {
    label: 'WAR',
    value: (x) => pitcherWarOf(x.stat, PARK),
    format: (x) => pitcherWarOf(x.stat, PARK).toFixed(1),
    initial: true,
  },
];

/** 앞의 0 을 떼는 야구 표기 (.272) */
const dec3 = (v: number) => v.toFixed(3).replace(/^0\./, '.');

interface TableRow<T> {
  id: string;
  name: string;
  meta: string;
  /** 규정 타석·이닝을 채웠나. 비율 지표를 곧이곧대로 읽어도 되는 줄인지 표시한다 */
  strong: boolean;
  item: T;
}

/**
 * 세부지표 표.
 *
 * 부문 카드는 "1위가 누구냐"에 답하고 표는 **"전부 늘어놓고 비교"**에 답한다. 둘 다
 * 필요하다 - 카드만 있으면 4위부터는 볼 방법이 없고, 표만 있으면 무엇부터 봐야 할지
 * 알 수 없다.
 *
 * ── 이름 열은 고정하고 지표만 가로로 흐른다 ──────────────────
 * 390px 에 열 스무 개를 우겨넣으면 글자가 뭉개진다. 그렇다고 통째로 가로 스크롤하면
 * **오른쪽 끝 열을 볼 때 그게 누구 기록인지 알 수 없다.** 그래서 이름은 왼쪽에
 * 붙박이로 두고 지표만 흐르게 한다.
 *
 * ── 머리글을 누르면 그 열로 정렬한다 ────────────────────────
 * 열이 스무 개가 넘으면 "삼진 제일 적은 사람"을 찾는 방법이 스크롤밖에 없어진다.
 * 낮을수록 좋은 지표(ERA·삼진·병살)는 **처음 누를 때 오름차순**으로 열린다 - 누르는
 * 사람이 원하는 것은 1위이지 꼴찌가 아니다.
 */
function StatTable<T>({
  title,
  note,
  columns,
  rows,
  onOpen,
}: {
  title: string;
  note?: string;
  columns: Col<T>[];
  rows: TableRow<T>[];
  onOpen: (id: string) => void;
}) {
  if (rows.length === 0) return null;
  const initial = columns.find((c) => c.initial) ?? columns[0];

  return (
    <>
      <SectionTitle title={title} right={note ? <Text style={st.headNote}>{note}</Text> : null} />
      <DataTable
        label={title}
        columns={toColumns(columns)}
        items={rows}
        getKey={(r) => r.id}
        // 이름 열은 값이 아니라 사람이라 붙박이로 둔다 (DataTable 주석 참고)
        stickyColumn={{
          label: '선수',
          render: (r) => (
            <>
              <Text style={[st.tblName, !r.strong && { color: colors.subText }]} numberOfLines={1}>
                {r.name}
              </Text>
              <Text style={st.tblMeta} numberOfLines={1}>
                {r.meta}
              </Text>
            </>
          ),
        }}
        defaultSortDescriptor={{
          column: initial.label,
          direction: initial.asc ? 'ascending' : 'descending',
        }}
        onRowAction={(id) => onOpen(id)}
        // 규정을 못 채운 줄은 흐리게 - 비율 지표를 곧이곧대로 읽으면 안 된다
        rowMuted={(r) => !r.strong}
        isStriped
        emptyContent="아직 기록이 없습니다"
      />
    </>
  );
}

interface LeaderRow {
  id: string;
  name: string;
  meta: string;
  value: string;
}

/** 상위 셋만 뽑는다. 다섯을 넘기면 카드가 목록이 되어 부문 사이 구분이 사라진다 */
function leaders<T extends { id: string; name: string; back: number }>(
  list: T[],
  score: (x: T) => number,
  format: (x: T) => string,
): LeaderRow[] {
  return list
    .slice()
    .sort((a, b) => score(b) - score(a))
    .slice(0, 3)
    .map((x) => ({ id: x.id, name: x.name, meta: String(x.back), value: format(x) }));
}

function LeaderCard({
  title,
  note,
  rows,
  onOpen,
}: {
  title: string;
  /** 규정 타석·이닝 같은 자격 기준 */
  note?: string;
  rows: LeaderRow[];
  onOpen: (id: string) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <GroupCard>
      <View style={st.leaderHead}>
        <Text style={st.leaderTitle}>{title}</Text>
        {note ? <Text style={st.headNote}>{note}</Text> : null}
      </View>
      {rows.map((r, i) => (
        <Row key={r.id} last={i === rows.length - 1} onPress={() => onOpen(r.id)}>
          <Text style={[st.rank, i === 0 && { color: colors.brandText }]}>{i + 1}</Text>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
            <Text style={st.leaderName}>{r.name}</Text>
            <Text style={st.pos}>{r.meta}</Text>
          </View>
          <Text style={[st.leaderValue, i === 0 && { color: colors.brandText }]}>{r.value}</Text>
          <Text style={st.rowChevron}>›</Text>
        </Row>
      ))}
    </GroupCard>
  );
}

// ─────────────────────────────────────────────────────────────
// 목록
// ─────────────────────────────────────────────────────────────

/**
 * 목록의 한 행 - 타자와 투수가 같은 부품을 쓴다.
 *
 * 상세가 시트로 빠지면서 이 행이 할 일은 **훑기**뿐이다. 등번호·이름·기본 스탯 한 줄과
 * 정렬 기준인 WAR 만 남긴다.
 */
/**
 * 펼쳐 둔 한 명의 상세 - 목록 첫 줄 아래에 붙는다.
 *
 * 시트에 있는 것을 전부 옮기지 않는다. **들어오자마자 읽히는 만큼만** 둔다 -
 * 폼 · 심화 지표 셋 · 그 값이 어느 구간인지 · 그리고 이 선수를 한 줄로 말하는 문장.
 * 작년 대비 · 월별 · 상황별처럼 파고드는 것은 눌러서 시트로 간다.
 */
function FeaturedDetail({
  row,
  metrics,
  pitcherMetrics,
  profile,
  glossaryKey,
  onGlossary,
}: {
  row: RowData;
  /** '지표 편집'에서 고른 것 - 이 줄이 타자면 앞것, 투수면 뒷것을 쓴다 */
  metrics: MetricOpt<BatterStatLine>[];
  pitcherMetrics: MetricOpt<PitcherStatLine>[];
  profile: UserProfile;
  glossaryKey: string | null;
  onGlossary: (k: string | null) => void;
}) {
  const batter = BATTERS.find((x) => x.id === row.id);
  const pitcher = PITCHERS.find((x) => x.id === row.id);

  const glossary = (
    <GlossaryCard statKey={glossaryKey} profile={profile} onClose={() => onGlossary(null)} />
  );

  if (batter) {
    return (
      <>
        <PlayerFormLoop playerId={batter.id} label="타격 준비" height={170} />
        <MetricTiles
          stat={batter.stat}
          sample={batter.stat.pa}
          qual={QUAL_PA}
          metrics={metrics}
          glossaryKey={glossaryKey}
          onGlossary={onGlossary}
        />
        {glossary}
        <MetricGauges stat={batter.stat} metrics={metrics} />
        <AiAnalysis analysis={analyzeBatter(batter, PARK)} />
      </>
    );
  }

  if (!pitcher) return null;
  const st1 = pitcher.stat;
  return (
    <>
      <PlayerFormLoop playerId={pitcher.id} label="와인드업" height={170} />
      {/* 전에는 StatTile 셋이 붙박이였다. 고를 수 없는 것은 물론이고 **누를 수도 없어**
          ERA·FIP 가 무슨 값인지 물을 데가 없었다 - 타자 쪽에는 있던 것이 여기만 없었다 */}
      <MetricTiles
        stat={st1}
        sample={st1.bf}
        qual={QUAL_BF}
        metrics={pitcherMetrics}
        glossaryKey={glossaryKey}
        onGlossary={onGlossary}
      />
      {glossary}
      <MetricGauges stat={st1} metrics={pitcherMetrics} />
      <Label>구종</Label>
      <View style={{ gap: spacing.sm }}>
        {pitcher.pitches.map((pt, i) => (
          <View key={pt.name} style={st.pitchRow}>
            <Text style={st.pitchName}>{pt.name}</Text>
            <View style={{ flex: 1 }}>
              <Gauge position={pt.usage} category={i} />
            </View>
            <Text style={st.pitchPct}>{Math.round(pt.usage * 100)}%</Text>
            {pt.velo ? <Text style={st.pitchVelo}>{pt.velo}</Text> : null}
          </View>
        ))}
      </View>
      <AiAnalysis analysis={analyzePitcher(pitcher, PARK, QUAL_BF)} />
    </>
  );
}

function PlayerRow({
  data,
  last,
  onPress,
  detail,
}: {
  data: RowData;
  last: boolean;
  onPress: () => void;
  /** 펼쳐 둘 줄이면 여기에 상세가 들어온다. 나머지 줄은 눌러서 시트로 본다 */
  detail?: ReactNode;
}) {
  const row = (
    <Row last={last || !!detail} onPress={onPress} style={st.playerRow}>
      <PlayerAvatar playerId={data.id} team="HH" size={42} />
      <View style={{ flex: 1 }}>
        <View style={st.nameRow}>
          <Text style={st.back}>{data.back}</Text>
          <Text style={st.name}>{data.name}</Text>
          <Text style={st.pos}>{data.meta}</Text>
        </View>
        {/* 접힌 줄에도 **누구나 아는 스탯**이 먼저 온다 */}
        <Text style={st.basicLine}>{data.lead}</Text>
      </View>
      <View style={st.rightStat}>
        <Text style={st.warValue}>{data.statValue}</Text>
        <Text style={st.warLabel}>{data.statLabel}</Text>
      </View>
      <Text style={st.rowChevron}>›</Text>
    </Row>
  );
  if (!detail) return row;
  return (
    <View style={!last ? st.featuredWrap : undefined}>
      {row}
      <View style={st.featured}>{detail}</View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 상세 시트의 내용
// ─────────────────────────────────────────────────────────────

/** 시트 맨 위 - 사진과 핵심 수치 하나. 누구를 보고 있는지 먼저 못 박는다 */
function SummaryCard({
  id,
  war,
  warLabel,
  lines,
}: {
  id: string;
  war: number;
  warLabel: string;
  lines: string[];
}) {
  return (
    <Card>
      <View style={st.summaryRow}>
        <PlayerAvatar playerId={id} team="HH" size={56} />
        <View style={{ flex: 1, gap: 3 }}>
          {lines.map((l) => (
            <Text key={l} style={st.summaryLine}>
              {l}
            </Text>
          ))}
        </View>
        <View style={st.rightStat}>
          <Text style={st.summaryWar}>{war.toFixed(1)}</Text>
          <Text style={st.warLabel}>{warLabel}</Text>
        </View>
      </View>
    </Card>
  );
}

function BatterDetail({
  batter,
  metrics,
  profile,
  glossaryKey,
  onGlossary,
}: {
  batter: Batter;
  metrics: MetricOpt<BatterStatLine>[];
  profile: UserProfile;
  glossaryKey: string | null;
  onGlossary: (k: string | null) => void;
}) {
  const b = batter.stat;
  const war = batterWarOf(b, PARK);
  const bd = batterWarBreakdown(b, PARK);

  return (
    <View style={{ gap: spacing.cardGap }}>
      <SummaryCard
        id={batter.id}
        war={war}
        warLabel="WAR"
        lines={[
          // 야구에서 타자를 한 줄로 소개하는 관용 표기 - 타율/출루율/장타율
          `${avgOf(b).toFixed(3)} / ${obpOf(b).toFixed(3)} / ${slgOf(b).toFixed(3)}`,
          `${b.pa}타석 · ${b.h}안타 · ${b.hr}홈런 · ${b.rbi}타점`,
        ]}
      />

      {/* 지표만 있으면 좋아하는 마음이 생길 자리가 없다. 팬덤 미디어의 몫 */}
      <PlayerFormLoop playerId={batter.id} label="타격 준비" height={190} />

      {/* ── 기본 → 세부 → 심화 ─────────────────────────────
          심화 지표부터 내밀면 그 셋이 야구의 전부인 것처럼 보인다. 타율·홈런·타점을
          먼저 두고 거기서 한 겹씩 들어가야 심화 지표가 '기본의 다음'으로 읽힌다 */}
      <SectionTitle title="시즌 기록" />
      <Card>
        <Label>기본</Label>
        <View style={st.metricRow}>
          <StatTile label="타율" value={avgOf(b).toFixed(3)} sub={`${b.h}안타`} />
          <StatTile label="홈런" value={String(b.hr)} sub={`${b.double + b.triple + b.hr}장타`} />
          <StatTile label="타점" value={String(b.rbi)} sub={`${b.r}득점`} />
        </View>

        <Divider />

        <Label>출루와 장타</Label>
        <View style={st.metricRow}>
          <StatTile label="출루율" value={obpOf(b).toFixed(3)} sub={`${b.bb}볼넷`} />
          {/* `${b.double}2루타` 로 쓰면 "202루타" 가 되어 숫자 202 로 읽힌다 */}
          <StatTile label="장타율" value={slgOf(b).toFixed(3)} sub={`2루타 ${b.double}`} />
          <StatTile label="OPS" value={opsOf(b).toFixed(3)} sub={`${b.pa}타석`} />
        </View>

        <Divider />

        {/* 목록에서 고른 지표가 여기에도 그대로 온다. 두 자리가 다른 셋을 띄우면
            펼쳐 둔 줄에서 본 것과 눌러서 들어온 것이 어긋난다 */}
        <Label>심화 지표 · 누르면 설명이 열립니다</Label>
        <MetricTiles
          stat={b}
          sample={b.pa}
          qual={QUAL_PA}
          metrics={metrics}
          glossaryKey={glossaryKey}
          onGlossary={onGlossary}
        />
        <MetricGauges stat={b} metrics={metrics} />
      </Card>

      {/* 설명은 누른 타일 **바로 아래**에 열린다. 화면 맨 끝에 뜨면 누른 것과 뜬 것을
          눈으로 잇지 못한다 */}
      <GlossaryCard statKey={glossaryKey} profile={profile} onClose={() => onGlossary(null)} />

      <MonthlyTrend
        months={(BATTER_MONTHS[batter.id] ?? []).map((m) => ({
          month: m.month,
          bar: m.pa,
          value: m.ab > 0 ? (m.h / m.ab).toFixed(3).replace(/^0\./, '.') : null,
          sub: m.pa > 0 ? `${m.pa}타석` : '결장',
          // 20타수도 안 되는 달이 최고 기록으로 뽑히면 그게 더 거짓말이다
          rank: m.ab >= 20 ? m.h / m.ab : null,
        }))}
        title="월별 타율"
        higherIsBetter
      />

      {/* 지난 시즌이 있는 선수만. 없는 선수는 이 구역을 아예 그리지 않는다 -
          있지도 않은 작년을 만들어 보여 주는 것이 빈 자리보다 나쁘다 */}
      <CompareSection
        prev={PREV_BATTER[batter.id]}
        rows={
          PREV_BATTER[batter.id]
            ? [
                cmp('타율', avgOf(PREV_BATTER[batter.id]), avgOf(b), 3),
                cmp('출루율', obpOf(PREV_BATTER[batter.id]), obpOf(b), 3),
                cmp('OPS', opsOf(PREV_BATTER[batter.id]), opsOf(b), 3),
                cmp('홈런', PREV_BATTER[batter.id].hr, b.hr, 0),
                cmp('타점', PREV_BATTER[batter.id].rbi, b.rbi, 0),
              ]
            : []
        }
      />

      <SectionTitle title="WAR 은 어디서 나왔나" />
      <Card>
        <View style={{ gap: spacing.sm }}>
          <WarRow label="타격" value={bd.batting} />
          <WarRow label="주루" value={bd.baserunning} />
          <WarRow label="수비" value={bd.fielding} />
          <WarRow label={`포지션 조정 (${batter.pos})`} value={bd.position} />
          <WarRow label="대체 수준" value={bd.replacement} />
          <View style={st.warSum}>
            <Text style={st.warSumLabel}>
              {(bd.batting + bd.baserunning + bd.fielding + bd.position + bd.replacement).toFixed(
                1,
              )}
              런 ÷ {LEAGUE.runsPerWin}
            </Text>
            <Text style={st.warSumValue}>{war.toFixed(1)} WAR</Text>
          </View>
        </View>
      </Card>

      <SplitSection
        groups={[
          {
            title: '주자 유무',
            rows: (BATTER_SPLITS[batter.id] ?? [])
              .filter((x) => x.group === 'men')
              .map((x) => ({
                label: x.label,
                main: (x.h / x.ab).toFixed(3).replace(/^0\./, '.'),
                sub: `장타 ${(x.tb / x.ab).toFixed(3).replace(/^0\./, '.')} · ${x.hr}홈런`,
                size: x.pa,
                rank: x.h / x.ab,
              })),
          },
          {
            title: '상대 투수',
            rows: (BATTER_SPLITS[batter.id] ?? [])
              .filter((x) => x.group === 'lhp')
              .map((x) => ({
                label: x.label,
                main: (x.h / x.ab).toFixed(3).replace(/^0\./, '.'),
                sub: `장타 ${(x.tb / x.ab).toFixed(3).replace(/^0\./, '.')} · ${x.hr}홈런`,
                size: x.pa,
                rank: x.h / x.ab,
              })),
          },
        ]}
        unit="타석"
        mainLabel="타율"
        // 리그 타율이 오가는 폭. 평균 .270 을 한가운데 두어 선 좌우가 곧 평균 위아래가 된다
        domain={{ low: 0.18, mid: 0.27, high: 0.36, midText: '.270' }}
        // 좌우 스플릿은 보통 120~140타석에서 갈린다. 100 아래면 타율 하나가
        // 안타 두어 개에 30포인트씩 흔들려, 두 쪽을 견주는 것 자체가 무리다
        thinBelow={100}
      />

      <SectionTitle title="타구 유형" />
      <Card>
        <BattedBall gb={b.gbRate} fb={b.fbRate} ld={b.ldRate} />
      </Card>

      {/* 신뢰도도 **지금 보고 있는 지표**를 따라간다. 입문 수준에는 그중 가장 못 믿을
          것 하나만 - 셋을 다 늘어놓으면 경고가 배경이 되어 아무것도 안 읽힌다 */}
      <TrustCard
        sample={b.pa}
        qual={QUAL_PA}
        items={
          profile.level === 'rookie'
            ? worstTrustItems(metrics, b.pa, QUAL_PA)
            : metrics.map((m) => ({ metric: m.key, label: m.label }))
        }
      />

      <AiAnalysis analysis={analyzeBatter(batter, PARK)} />
    </View>
  );
}

function PitcherDetail({
  pitcher,
  metrics,
  profile,
  glossaryKey,
  onGlossary,
}: {
  pitcher: Pitcher;
  metrics: MetricOpt<PitcherStatLine>[];
  profile: UserProfile;
  glossaryKey: string | null;
  onGlossary: (k: string | null) => void;
}) {
  const p = pitcher.stat;
  const era = eraOf(p);
  const fip = fipOf(p);
  const war = pitcherWarOf(p, PARK);
  const bab = babipAllowedOf(p);
  const gap = era - fip;

  return (
    <View style={{ gap: spacing.cardGap }}>
      <SummaryCard
        id={pitcher.id}
        war={war}
        warLabel="WAR"
        lines={[
          `ERA ${era.toFixed(2)} · WHIP ${whipOf(p).toFixed(2)}`,
          `${p.g}경기 ${ipLabel(p.ipOuts)}이닝 · ${p.w}승 ${p.l}패 · ${p.so}탈삼진`,
        ]}
      />

      <PlayerFormLoop playerId={pitcher.id} label="와인드업" height={190} />

      {/* 타자와 같은 순서 - 기본 → 세부 → 심화. 투수를 처음 보는 사람이 아는 것은
          평균자책점·승패·탈삼진이지 FIP 가 아니다 */}
      <SectionTitle title="시즌 기록" />
      <Card>
        <Label>기본</Label>
        <View style={st.metricRow}>
          <StatTile label="평균자책점" value={era.toFixed(2)} sub={`${p.er}자책`} />
          <StatTile
            label={p.sv > 0 ? '세이브' : p.hld > 0 ? '홀드' : '승-패'}
            value={p.sv > 0 ? String(p.sv) : p.hld > 0 ? String(p.hld) : `${p.w}-${p.l}`}
            sub={p.sv > 0 || p.hld > 0 ? `${p.w}승 ${p.l}패` : `${p.g}경기`}
          />
          <StatTile label="탈삼진" value={String(p.so)} sub={`${p.bb}볼넷`} />
        </View>

        <Divider />

        <Label>이닝과 제구</Label>
        <View style={st.metricRow}>
          <StatTile label="이닝" value={ipLabel(p.ipOuts)} sub={`${p.g}경기`} />
          <StatTile label="WHIP" value={whipOf(p).toFixed(2)} sub={`${p.h}피안타`} />
          <StatTile label="피홈런" value={String(p.hr)} sub={`${p.bf}타자`} />
        </View>

        <Divider />

        {/* 목록에서 고른 지표가 여기에도 그대로 온다 - 타자 쪽과 같은 규칙 */}
        <Label>심화 지표 · 누르면 설명이 열립니다</Label>
        <MetricTiles
          stat={p}
          sample={p.bf}
          qual={QUAL_BF}
          metrics={metrics}
          glossaryKey={glossaryKey}
          onGlossary={onGlossary}
        />
        <MetricGauges stat={p} metrics={metrics} />
      </Card>

      <GlossaryCard statKey={glossaryKey} profile={profile} onClose={() => onGlossary(null)} />

      <MonthlyTrend
        months={(PITCHER_MONTHS[pitcher.id] ?? []).map((m) => ({
          month: m.month,
          bar: m.ipOuts,
          value: m.ipOuts > 0 ? ((m.er * 27) / m.ipOuts).toFixed(2) : null,
          sub: m.ipOuts > 0 ? `${ipLabel(m.ipOuts)}이닝` : '결장',
          rank: m.ipOuts >= 15 ? (m.er * 27) / m.ipOuts : null,
        }))}
        title="월별 평균자책점"
      />

      <CompareSection
        prev={PREV_PITCHER[pitcher.id]}
        rows={
          PREV_PITCHER[pitcher.id]
            ? [
                // ERA·WHIP 은 **낮을수록 좋다.** 방향을 뒤집지 않으면 나빠진 해가
                // 초록으로 칠해져 정반대로 읽힌다
                cmp('평균자책점', eraOf(PREV_PITCHER[pitcher.id]), era, 2, true),
                cmp('WHIP', whipOf(PREV_PITCHER[pitcher.id]), whipOf(p), 2, true),
                cmp('탈삼진', PREV_PITCHER[pitcher.id].so, p.so, 0),
                cmp('이닝', PREV_PITCHER[pitcher.id].ipOuts / 3, p.ipOuts / 3, 1),
              ]
            : []
        }
      />

      <SectionTitle title="ERA 와 FIP 의 차이" />
      <Card>
        {/* 앞날을 말할지 말지는 **표본 크기**로 정한다.
            부상이나 시즌 종료 여부는 우리가 단정할 수 있는 것이 아니고, 애초에
            250타자도 안 되는 표본으로는 ERA-FIP 차이가 무엇을 뜻하는지 말할 수 없다 */}
        <Text style={st.gapText}>
          {Math.abs(gap) < 0.2
            ? '두 값이 거의 같습니다. 지금까지의 성적이 실력 그대로였다는 뜻입니다.'
            : gap > 0
              ? `ERA 가 FIP 보다 ${gap.toFixed(2)} 높습니다. 삼진·볼넷·피홈런만 보면 더 잘 던졌는데 실점이 많았다는 뜻입니다.`
              : `ERA 가 FIP 보다 ${(-gap).toFixed(2)} 낮습니다. 실점이 적었지만 그 이유가 투수 본인의 결과만으로는 설명되지 않습니다.`}
          {Math.abs(gap) < 0.2
            ? ''
            : p.bf < 250
              ? ` 다만 상대한 타자가 ${p.bf}명뿐이라, 이 차이를 앞날의 근거로 삼기에는 표본이 모자랍니다.`
              : gap > 0
                ? ' 표본이 쌓인 만큼 앞으로 좋아질 여지가 있다고 볼 만합니다.'
                : ' 표본이 쌓인 만큼 지금 성적이 그대로 유지되기는 어렵다고 볼 만합니다.'}
        </Text>
        {profile.level !== 'rookie' ? (
          <Text style={st.note}>
            피BABIP {bab.toFixed(3)} · 리그 평균 {LEAGUE.babipPitcher.toFixed(3)} ·{' '}
            {ipLabel(p.ipOuts)}이닝
          </Text>
        ) : null}
      </Card>

      <SplitSection
        groups={[
          {
            title: '상대 타자',
            rows: (PITCHER_SPLITS[pitcher.id] ?? []).map((x) => ({
              label: x.label,
              main: `${((x.so / x.bf) * 100).toFixed(1)}%`,
              sub: `볼넷 ${((x.bb / x.bf) * 100).toFixed(1)}% · 피홈런 ${x.hr}`,
              size: x.bf,
              rank: x.so / x.bf,
            })),
          },
        ]}
        unit="타자"
        mainLabel="삼진율"
        domain={{ low: 0.1, mid: 0.2, high: 0.35, midText: '20%' }}
        // 불펜은 좌우 각 50타자 남짓인 경우가 흔하다. 그 구간을 그냥 두면
        // 삼진율 3%p 차이가 '좌타에 강한 투수'로 읽힌다
        thinBelow={80}
      />

      <SectionTitle title="구종" />
      <Card>
        <View style={{ gap: spacing.sm }}>
          {pitcher.pitches.map((pt, i) => (
            <View key={pt.name} style={st.pitchRow}>
              <Text style={st.pitchName}>{pt.name}</Text>
              <View style={{ flex: 1 }}>
                {/* 구종은 의미가 아니라 구별만 되면 된다. 순번을 넘기면 여섯 번째가
                    '기타'로 접히는 규칙이 저절로 지켜진다 */}
                <Gauge position={pt.usage} category={i} />
              </View>
              <Text style={st.pitchPct}>{Math.round(pt.usage * 100)}%</Text>
              {pt.velo ? <Text style={st.pitchVelo}>{pt.velo}</Text> : null}
            </View>
          ))}
        </View>
      </Card>

      <SectionTitle title="타구 유형" />
      <Card>
        <BattedBall gb={p.gbRate} fb={p.fbRate} ld={p.ldRate} />
      </Card>

      <AiAnalysis analysis={analyzePitcher(pitcher, PARK, QUAL_BF)} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 조각
// ─────────────────────────────────────────────────────────────

interface SplitRow {
  label: string;
  /** 큰 수치 - 타자는 타율, 투수는 삼진율 */
  main: string;
  sub: string;
  /** 이 상황을 몇 번 겪었나 (타석·상대타자). 표본이 얼마나 되는지를 글로 말한다 */
  size: number;
  /** 막대 길이가 되는 값이자 더 나은 쪽을 고르는 값 - main 의 원본 수치 */
  rank: number;
}

/**
 * 상황별 스플릿.
 *
 * 타율 하나로는 **주자를 두고 쳤을 때도 그런지**를 알 수 없다. 득점권에서만 살아나는
 * 타자와 주자가 없을 때만 치는 타자는 같은 타율을 갖고도 팀에 주는 값이 다르다.
 *
 * ── 2026-08-26 막대를 표본에서 지표로 옮긴다 ────────────────
 * 원래 막대는 **그 상황을 몇 번 겪었는지**(타석)였다. 표본이 작은 스플릿을 덜 믿게 하려는
 * 의도였는데, 화면에서는 정반대로 읽혔다.
 *
 *   주자 있음 · 224타석 · 타율 .281  → 짧은 막대
 *   주자 없음 · 285타석 · 타율 .265  → 긴 막대
 *
 * 막대 바로 옆의 큰 숫자가 타율이고 **막대 색까지 타율이 좋은 쪽을 따라가는데**, 길이만
 * 홀로 타석을 말했다. 그래서 '더 긴 막대 = 더 나쁜 타율'이 되어, 한 줄 안에서 길이와
 * 숫자가 서로를 부정했다. 길이는 옆에 붙은 숫자를 그려야 한다.
 *
 * 표본은 없어진 게 아니라 **글로 옮겨 갔다** - 타석 수 옆에 기준 미만이면 '표본 적음'이
 * 붙는다. 두 가지를 한 도형에 겹쳐 싣는 대신, 크기는 도형이 말하고 신뢰는 글이 말한다.
 *
 * ── 눈금을 왜 고정하나 ──────────────────────────────────────
 * 두 줄 중 큰 값을 100%로 잡으면 .281 과 .265 가 100% 대 94% 가 되어 **차이가 안 보인다.**
 * 대신 그 지표가 실제로 오가는 범위(domain)를 눈금으로 박고, 리그 평균 자리에 세로선을
 * 세운다. 막대가 그 선을 넘었나 아닌가가 곧 '평균 위인가'다.
 */
function SplitSection({
  groups,
  unit,
  mainLabel,
  domain,
  thinBelow,
}: {
  groups: { title: string; rows: SplitRow[] }[];
  unit: string;
  mainLabel: string;
  /**
   * 막대 눈금. `low` 가 왼쪽 끝, `high` 가 오른쪽 끝이고 `mid` 에 평균 선이 선다.
   * 낮을수록 좋은 지표는 low > high 로 뒤집어 적는다 (gaugePosition 과 같은 규칙).
   */
  domain: { low: number; mid: number; high: number; midText: string };
  /** 이 표본에 못 미치면 '표본 적음'을 붙인다 */
  thinBelow: number;
}) {
  const at = (v: number) => Math.min(1, Math.max(0, (v - domain.low) / (domain.high - domain.low)));
  const live = groups.filter((g) => g.rows.length === 2 || g.rows.length === 1);
  if (live.length === 0 || live.every((g) => g.rows.length === 0)) return null;

  return (
    <>
      <SectionTitle title="상황별" right={<Text style={st.headNote}>{mainLabel}</Text>} />
      <Card>
        {live.map((g, gi) => {
          const best = g.rows.reduce((a, b) => (b.rank > a.rank ? b : a), g.rows[0]);
          return (
            <View key={g.title} style={{ gap: spacing.sm }}>
              {gi > 0 ? <Divider /> : null}
              <Label>{g.title}</Label>
              {g.rows.map((r) => {
                const on = g.rows.length > 1 && r.label === best.label;
                // 표본이 얇으면 그 사실을 글로 말한다. 막대에 겹쳐 싣지 않는다
                const thin = r.size < thinBelow;
                return (
                  <View key={r.label} style={st.splitRow}>
                    <View style={st.splitLeft}>
                      <Text style={st.splitLabel}>{r.label}</Text>
                      <Text style={[st.splitSub, thin && st.splitThin]}>
                        {r.size}
                        {unit}
                        {thin ? ' · 표본 적음' : ''}
                      </Text>
                      <View style={st.splitTrack}>
                        <View
                          style={[
                            st.splitFill,
                            {
                              width: `${Math.round(at(r.rank) * 100)}%`,
                              backgroundColor: on ? colors.brand : colors.dim,
                            },
                          ]}
                        />
                        {/* 리그 평균 자리. 막대가 이 선을 넘었나가 곧 '평균 위인가'다 */}
                        <View style={[st.splitMid, { left: `${at(domain.mid) * 100}%` }]} />
                      </View>
                    </View>
                    <View style={st.splitRight}>
                      <Text style={[st.splitMain, on && { color: colors.brandText }]}>
                        {r.main}
                      </Text>
                      <Text style={st.splitSub}>{r.sub}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
        {/* 눈금을 한 번 밝힌다. 세로선을 설명 없이 두면 그냥 흠집으로 읽힌다 */}
        <Text style={st.splitLegend}>
          막대는 {mainLabel}, 세로선이 리그 평균 {domain.midText}입니다. {unit} 수가 적은 쪽은
          그만큼 덜 믿을 값입니다.
        </Text>
      </Card>
    </>
  );
}

interface MonthPoint {
  month: string;
  /** 막대 높이가 되는 값 - 출장량(타석·이닝) */
  bar: number;
  /** 막대 위에 적히는 성적. 결장이면 null */
  value: string | null;
  sub: string;
  /** 최고의 달을 고를 때 쓰는 값. 표본이 너무 작은 달은 null 로 빼 둔다 */
  rank: number | null;
}

/**
 * 월별 추이.
 *
 * 시즌 합계는 "얼마나"만 말하고 "언제"를 감춘다. 타율 .272 가 내내 그랬던 것인지,
 * 5월에 바닥을 치고 6월에 폭발한 것인지는 전혀 다른 이야기다.
 *
 * ── 막대는 성적이 아니라 **출장량**이다 ──────────────────────
 * 타율을 막대로 그리면 0 부터 그릴지 .200 부터 그릴지에 따라 같은 성적이 전혀 다르게
 * 보이고, ERA 는 **낮을수록 좋아서 큰 막대가 잘한 것처럼 읽힌다.** 그래서 막대에는
 * 타석·이닝을 싣고 성적은 숫자로 올린다. 부수 효과가 하나 더 있는데, 막대가 짧은 달은
 * 표본이 작다는 뜻이라 **그 달의 숫자를 얼마나 믿을지까지 같이 보인다.**
 */
function MonthlyTrend({
  months,
  title,
  higherIsBetter,
}: {
  months: MonthPoint[];
  title: string;
  higherIsBetter?: boolean;
}) {
  if (months.length === 0) return null;
  const maxBar = Math.max(...months.map((m) => m.bar), 1);
  const ranked = months.filter((m) => m.rank !== null);
  const best = ranked.length
    ? ranked.reduce((a, b) =>
        (
          higherIsBetter
            ? (b.rank as number) > (a.rank as number)
            : (b.rank as number) < (a.rank as number)
        )
          ? b
          : a,
      )
    : null;

  return (
    <>
      <SectionTitle
        title={title}
        right={best ? <Text style={st.headNote}>최고 {best.month}</Text> : null}
      />
      <Card>
        <View style={st.trendRow}>
          {months.map((m) => {
            const on = best !== null && m.month === best.month;
            return (
              <View key={m.month} style={st.trendCol}>
                <Text style={[st.trendValue, on && { color: colors.brandText }]} numberOfLines={1}>
                  {m.value ?? '–'}
                </Text>
                <View style={st.trendTrack}>
                  <View
                    style={[
                      st.trendBar,
                      {
                        height: Math.max(2, Math.round((m.bar / maxBar) * 56)),
                        backgroundColor: on ? colors.brand : colors.dim,
                      },
                    ]}
                  />
                </View>
                <Text style={st.trendMonth} numberOfLines={1}>
                  {m.month}
                </Text>
                <Text style={st.trendSub} numberOfLines={1}>
                  {m.sub}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={st.trendNote}>막대는 출장량(타석·이닝)입니다. 짧은 달은 표본이 작습니다</Text>
      </Card>
    </>
  );
}

interface CompareRow {
  label: string;
  prev: string;
  now: string;
  delta: string;
  /** 나아졌나. 색은 이 값만 따른다 */
  better: boolean | null;
}

/**
 * 두 해를 견주는 한 줄을 만든다.
 *
 * `lowerIsBetter` 가 이 함수의 본론이다. ERA 가 4.23 에서 9.53 이 된 해를 초록으로
 * 칠하면 화면이 정반대를 말한다 - 부호가 아니라 **좋아졌는지**로 색을 정한다.
 */
function cmp(
  label: string,
  prev: number,
  now: number,
  digits: number,
  lowerIsBetter = false,
): CompareRow {
  const fix = (v: number) => v.toFixed(digits);
  const diff = now - prev;
  const sign = diff > 0 ? '+' : diff < 0 ? '−' : '';
  // 소수 지표는 앞의 0 을 떼는 것이 야구 표기다 (.023 / +.017)
  const mag = fix(Math.abs(diff)).replace(/^0\./, '.');
  return {
    label,
    prev: fix(prev),
    now: fix(now),
    delta: diff === 0 ? '변화 없음' : sign + mag,
    better: diff === 0 ? null : lowerIsBetter ? diff < 0 : diff > 0,
  };
}

/** 지난 시즌이 없으면 구역째로 사라진다 */
function CompareSection({ prev, rows }: { prev: unknown; rows: CompareRow[] }) {
  if (!prev || rows.length === 0) return null;
  return (
    <>
      <SectionTitle title="작년 대비" right={<Text style={st.headNote}>2025 → 2026</Text>} />
      <Card>
        <View style={{ gap: spacing.md }}>
          {rows.map((r) => (
            <View key={r.label} style={st.cmpRow}>
              <Text style={st.cmpLabel}>{r.label}</Text>
              <Text style={st.cmpPrev}>{r.prev}</Text>
              <Text style={st.cmpArrow}>→</Text>
              <Text style={st.cmpNow}>{r.now}</Text>
              <Text
                style={[
                  st.cmpDelta,
                  {
                    color:
                      r.better === null ? colors.mutedText : r.better ? colors.win : colors.live,
                  },
                ]}
              >
                {r.delta}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </>
  );
}

/**
 * 고른 지표 타일 줄.
 *
 * 셋까지는 한 줄에 나란히, 넷이면 2×2 로 접는다. 넷을 억지로 한 줄에 밀어 넣으면
 * 타일 폭이 70px 남짓이 되어 `0.360` 이 두 줄로 꺾이거나 `…` 로 잘린다 - 값이 안 읽히면
 * 지표를 넷 고른 의미가 없다.
 */
function MetricTiles<T>({
  stat,
  sample,
  qual,
  metrics,
  glossaryKey,
  onGlossary,
}: {
  stat: T;
  /** 표본 - 타자는 타석, 투수는 상대타자. 신뢰도 점이 이걸 본다 */
  sample: number;
  /** 표본을 견줄 규정선 */
  qual: number;
  metrics: MetricOpt<T>[];
  glossaryKey: string | null;
  onGlossary: (k: string | null) => void;
}) {
  const wide = metrics.length === 4;
  return (
    <View style={st.metricRow}>
      {metrics.map((m) => (
        <MetricTile
          key={m.key}
          label={m.label}
          value={m.format(stat)}
          statKey={m.key}
          sample={sample}
          qual={qual}
          onGlossary={onGlossary}
          active={glossaryKey === m.key}
          wide={wide}
        />
      ))}
    </View>
  );
}

/** 같은 지표를 구간 게이지로 한 번 더 - 값 옆에 '어디쯤인가'가 붙는 이 화면의 규칙 */
function MetricGauges<T>({ stat, metrics }: { stat: T; metrics: MetricOpt<T>[] }) {
  return (
    <View style={{ gap: spacing.md }}>
      {metrics.map((m) => (
        <MetricGauge key={m.key} statKey={m.key} label={m.label} value={m.value(stat)} />
      ))}
    </View>
  );
}

/** AI 선수 분석. 문장을 짓는 규칙은 src/playerAnalysis.ts 에 있다 */
function AiAnalysis({ analysis: a }: { analysis: PlayerAnalysis }) {
  return (
    <View style={st.aiWrap}>
      <Text style={st.aiTitle}>AI 선수 분석</Text>
      {a.lines.map((line, i) => (
        <RichText key={i} text={line} style={st.aiLine} />
      ))}
    </View>
  );
}

function MetricTile({
  label,
  value,
  statKey,
  sample,
  qual,
  onGlossary,
  active,
  wide,
}: {
  label: string;
  value: string;
  statKey: string;
  sample: number;
  /** 이 표본을 견줄 규정선 - 타자는 규정타석, 투수는 그것을 상대타자로 옮긴 값 */
  qual: number;
  onGlossary: (k: string | null) => void;
  /** 지금 이 지표의 설명이 열려 있는가 - 어느 타일을 눌렀는지 표시한다 */
  active?: boolean;
  /** 한 줄에 둘씩 접히는 폭 - 넷을 고른 경우 */
  wide?: boolean;
}) {
  const trust = trustOf(statKey, sample, qual);
  const dot = { high: colors.trustHigh, mid: colors.trustMid, low: colors.trustLow }[trust];
  // 설명이 없는 지표는 누를 수 없다. 꺾쇠만 있고 아무 일도 안 일어나면 그게 더 나쁘다
  const explained = !!GLOSSARY[statKey];

  const body = (
    <>
      <View style={st.metricHead}>
        <Text style={[st.metricLabel, active && { color: colors.brandText }]}>{label}</Text>
        {/* 표본이 이 값을 믿을 만한지 - 심화 지표에서 가장 자주 생략되는 정보다 */}
        <View style={[st.trustDot, { backgroundColor: dot }]} />
      </View>
      <Text style={[st.metricValue, active && { color: colors.brandText }]} numberOfLines={1}>
        {value}
      </Text>
    </>
  );

  if (!explained) return <View style={[st.metricTile, wide && st.metricTileWide]}>{body}</View>;

  return (
    <Pressable
      // 같은 타일을 다시 누르면 닫힌다 - 닫기 버튼을 따로 찾지 않아도 된다
      onPress={() => onGlossary(active ? null : statKey)}
      style={({ pressed }) => [
        st.metricTile,
        wide && st.metricTileWide,
        active && st.metricTileOn,
        pressed && states.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ expanded: !!active }}
      accessibilityLabel={`${label} ${value} 설명 보기`}
    >
      {body}
    </Pressable>
  );
}

function MetricGauge({ statKey, label, value }: { statKey: string; label: string; value: number }) {
  const pos = gaugePosition(statKey, value);
  const g = GLOSSARY[statKey];
  if (pos === null || !g?.scale) return null;
  const midPos = gaugePosition(statKey, g.scale.mid) ?? 0.5;

  // 막대 길이만 그리면 이 값이 높은 건지 낮은 건지 아무 말도 못 한다. 심화 지표는
  // 크기 자체보다 **어느 구간에 있는가**가 곧 정보라, 구간을 함께 그린다.
  //
  // 경계는 기존 low·mid·high 세 지점의 중간이다 - 없던 기준을 지어내지 않는다.
  // gaugePosition 이 방향을 이미 정규화해 둬서(1 이 언제나 좋은 쪽 끝, ERA 처럼
  // 낮을수록 좋은 지표도 마찬가지) 상위·하위로 읽을 수 있다.
  const bands: Band[] = [
    { to: midPos / 2, label: '하위' },
    { to: (midPos + 1) / 2, label: '평균권' },
    { to: 1, label: '상위', tone: 'brand' },
  ];

  return (
    <View style={st.gaugeRow}>
      <Text style={st.gaugeLabel}>{label}</Text>
      <View style={{ flex: 1 }}>
        <RangeGauge value={pos} bands={bands} />
      </View>
      <Text style={st.gaugeMid}>평균 {g.scale.midText ?? g.scale.mid}</Text>
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

/**
 * 타구 유형 - 세 값의 합이 100% 이므로 숫자 셋이 아니라 **한 줄의 막대**로 보여준다.
 *
 * 원래는 회색 타일 셋이었는데, 그러면 "45 / 37 / 18" 을 각각 읽고 머릿속에서 더해야
 * 비율이 잡힌다. 막대를 깔면 비율이 먼저 보이고 숫자는 확인용이 된다 (Flighty 의
 * 정시/지연/결항 표시와 같은 구조). 타일의 색 막대와 아래 막대의 색이 같아야 이어진다.
 */
function BattedBall({ gb, fb, ld }: { gb: number; fb: number; ld: number }) {
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={st.metricRow}>
        <StatTile label="땅볼" value={pct(gb)} category={0} />
        <StatTile label="뜬공" value={pct(fb)} category={1} />
        <StatTile label="라인드라이브" value={pct(ld)} category={2} />
      </View>
      <SplitBar
        segments={[
          { value: gb, category: 0, label: '땅볼' },
          { value: fb, category: 1, label: '뜬공' },
          { value: ld, category: 2, label: '라인드라이브' },
        ]}
      />
    </View>
  );
}

/**
 * 표본 신뢰도 - 지표가 여러 개여도 **카드는 하나다.**
 *
 * 처음에는 지표마다 틴트 카드를 하나씩 띄웠는데, 그러면 색 있는 상자가 연달아 서서
 * 경고가 배경이 된다(common.tsx 의 NoticeCard 주석과 같은 이유). Flighty 도 공항의
 * 출발·도착·날씨 문제를 카드 하나 안의 세 행으로 묶는다.
 *
 * 카드의 색은 **가장 못 믿을 지표**를 따른다. 셋 중 하나가 표본 부족이면 그 카드는
 * 초록일 수 없다 - 안심하고 넘어가라는 신호가 되어 버린다.
 */
const TRUST_RANK = { low: 0, mid: 1, high: 2 } as const;

/**
 * 고른 지표 중 **가장 못 믿을 것 하나**.
 *
 * 입문 수준에서 쓴다. 신뢰도 경고를 지표 수만큼 늘어놓으면 그 카드가 화면에서 가장
 * 긴 덩어리가 되고, 정작 '무엇을 조심하라'는 말은 배경으로 밀린다.
 */
function worstTrustItems<T>(metrics: MetricOpt<T>[], sample: number, qual: number) {
  const items = metrics.map((m) => ({ metric: m.key, label: m.label }));
  if (items.length === 0) return items;
  return [
    items.reduce((a, c) =>
      TRUST_RANK[trustOf(c.metric, sample, qual)] < TRUST_RANK[trustOf(a.metric, sample, qual)]
        ? c
        : a,
    ),
  ];
}

function TrustCard({
  items,
  sample,
  qual,
}: {
  items: { metric: string; label: string }[];
  sample: number;
  /** 규정선. 판정이 '안정화 표본'이 아니라 여기서 나온다 */
  qual: number;
}) {
  if (items.length === 0) return null;
  const levels = items.map((i) => trustOf(i.metric, sample, qual));
  const worst = levels.reduce((a, b) => (TRUST_RANK[b] < TRUST_RANK[a] ? b : a));
  const tone = ({ high: 'win', mid: 'warn', low: 'live' } as const)[worst];
  const word = { high: '충분', mid: '보통', low: '부족' } as const;

  return (
    <NoticeCard tone={tone} title={`표본 ${sample}타석 · 규정 ${qual}타석 대비 ${word[worst]}`}>
      <View>
        {items.map((it, i) => (
          <NoticeRow
            key={it.metric}
            first={i === 0}
            label={`${it.label} · ${word[levels[i]]}`}
            text={trustSentence(it.metric, sample, qual)}
          />
        ))}
      </View>
    </NoticeCard>
  );
}

/**
 * 용어 설명 - 누른 타일 바로 아래에 열린다.
 *
 * 예전에는 화면 맨 아래에 떴다. 목록 안에서 펼치던 시절의 한계였는데, 누른 것과
 * 뜬 것이 멀찍이 떨어져 있어 무엇에 대한 설명인지 눈으로 잇기 어려웠다.
 */
function GlossaryCard({
  statKey,
  profile,
  onClose,
}: {
  statKey: string | null;
  profile: UserProfile;
  onClose: () => void;
}) {
  if (!statKey) return null;
  const g = GLOSSARY[statKey];
  if (!g) return null;
  const lines = explainFor(statKey, profile.level);

  return (
    <Card>
      <CardHeading
        label={{ rookie: '입문', fan: '일반', nerd: '심화' }[profile.level]}
        title={g.short}
        right={
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={st.closeText}>닫기</Text>
          </Pressable>
        }
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
  );
}

const st = StyleSheet.create({
  // 알약 탭은 지면 위에 떠 있는다 - 흰 띠를 깔면 브랜드 바가 두 겹으로 보인다
  tabsWrap: { paddingHorizontal: spacing.screenX, paddingTop: spacing.md },

  playerRow: { paddingVertical: spacing.lg },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  back: { ...typography.micro, ...tabularFigures, color: colors.brandText, fontWeight: '800' },
  name: { fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  pos: typography.micro,
  // 접힌 줄의 기본 스탯 - 회색 캡션이 아니라 읽으라고 있는 줄이다
  basicLine: {
    ...tabularFigures,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    color: colors.subText,
    marginTop: 3,
  },
  rightStat: { alignItems: 'flex-end' },
  warValue: { ...typography.metric, ...tabularFigures, fontSize: 22, color: colors.brandText },
  warLabel: { ...typography.micro, fontSize: 10 },
  rowChevron: { fontSize: 18, color: colors.mutedText, marginLeft: -4 },
  headNote: typography.micro,

  // 머리글 오른쪽의 '지표 편집' - 작은 캡슐. 회색 글자로 두면 명수와 구분이 안 돼
  // 누를 수 있다는 신호가 사라진다
  editBtn: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.chip,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  editBtnText: { ...typography.micro, fontSize: 12, color: colors.brandText, fontWeight: '700' },

  // 지표 고르기 시트
  pickIntro: { ...typography.caption, lineHeight: 20 },
  pickRow: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  // 번호 자리 - 안 고른 줄에도 자리를 비워 둬야 라벨 시작점이 줄마다 흔들리지 않는다
  pickMark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.dim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickMarkOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  pickMarkText: { ...typography.micro, ...tabularFigures, fontSize: 12, fontWeight: '700' },
  pickMarkTextOn: { color: '#FFFFFF' },
  pickLabel: { fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  pickHint: { ...typography.micro, lineHeight: 17 },
  pickDim: { color: colors.mutedText },
  pickFoot: { ...typography.micro, lineHeight: 17, paddingHorizontal: spacing.xs },

  // AI 선수 분석 - 결정적 순간(common.tsx `momentWrap`)과 같은 왼쪽 띠.
  // 회색 면 + 라운드였는데, 둥근 모서리를 따라 띠가 휘어 손톱처럼 보였다. 면까지 깔면
  // 위의 지표 타일과 같은 회색 상자가 하나 더 느는 셈이라 띠 하나로 줄인다
  aiWrap: {
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand,
  },
  aiTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: colors.brandText,
  },
  aiLine: { ...typography.body, fontSize: 13.5, lineHeight: 21 },

  // 상황별 - 왼쪽에 라벨과 기회 막대, 오른쪽에 성적
  splitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  splitLeft: { flex: 1, gap: 3 },
  splitLabel: { ...typography.caption, color: colors.text, fontWeight: '700' },
  // 4px 이던 것을 6px 로. 평균 선을 안에 세우려면 이만큼은 있어야 선이 점으로 안 보인다
  splitTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surface, overflow: 'hidden' },
  splitFill: { height: 6, borderRadius: 3 },
  // 리그 평균 눈금. 막대 위에 그려야 브랜드색 구간에서도 살아남는다(형제 순서로 해결)
  splitMid: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.mutedText,
  },
  // 표본이 얇은 줄 - 숫자를 지우지 않고 색으로 물러서게만 한다
  splitThin: { color: colors.warn, fontWeight: '700' },
  splitLegend: { ...typography.micro, lineHeight: 16, marginTop: spacing.xs },
  splitRight: { alignItems: 'flex-end', gap: 1 },
  splitMain: { ...typography.metric, ...tabularFigures, fontSize: 20, lineHeight: 24 },
  splitSub: { ...typography.micro, ...tabularFigures, fontWeight: '500' },

  // 월별 추이 - 막대는 아래에서 자란다(justifyContent flex-end)
  trendRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  trendCol: { flex: 1, alignItems: 'center', gap: 4 },
  trendValue: { ...typography.caption, ...tabularFigures, fontWeight: '700', color: colors.text },
  trendTrack: { height: 56, justifyContent: 'flex-end' },
  trendBar: { width: 18, borderRadius: 3 },
  trendMonth: { ...typography.micro, color: colors.subText, fontWeight: '600' },
  trendSub: { ...typography.micro, ...tabularFigures, fontSize: 10 },
  trendNote: { ...typography.micro, fontWeight: '500' },

  // 작년 대비 - 라벨/작년/화살표/올해/증감. 숫자 열은 폭을 고정해야 줄이 안 흔들린다
  cmpRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  cmpLabel: { ...typography.caption, color: colors.subText, fontWeight: '600', flex: 1 },
  cmpPrev: {
    ...typography.caption,
    ...tabularFigures,
    color: colors.mutedText,
    width: 52,
    textAlign: 'right',
  },
  cmpArrow: { ...typography.micro, color: colors.dim },
  cmpNow: {
    ...typography.bodyStrong,
    ...tabularFigures,
    fontSize: 15,
    width: 56,
    textAlign: 'right',
  },
  cmpDelta: {
    ...typography.caption,
    ...tabularFigures,
    fontWeight: '700',
    width: 62,
    textAlign: 'right',
  },
  chipRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.screenX },

  // 기록 탭 - 세부지표 표. 칸·머리글·줄무늬는 전부 DataTable 로 옮겼고,
  // 여기 남은 둘은 붙박이 이름 열에 넣는 내용물이다
  tblName: { fontSize: 14, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  tblMeta: { ...typography.micro, fontSize: 10 },

  // 기록 탭 - 부문 카드
  leaderHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.cardPad,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  leaderTitle: { fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  // 순위 숫자는 폭을 고정한다. 안 그러면 이름 시작점이 줄마다 어긋난다
  rank: {
    ...typography.caption,
    ...tabularFigures,
    fontWeight: '800',
    color: colors.mutedText,
    width: 14,
  },
  leaderName: { fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  leaderValue: { ...typography.bodyStrong, ...tabularFigures, fontSize: 15 },

  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summaryLine: {
    ...typography.caption,
    ...tabularFigures,
    color: colors.subText,
    fontWeight: '600',
  },
  summaryWar: { ...typography.metric, ...tabularFigures, fontSize: 30, color: colors.brandText },

  metricRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  // 펼쳐 둔 줄 - 목록 안이지만 카드 안쪽 여백을 그대로 쓴다
  featured: { gap: spacing.md, paddingHorizontal: spacing.cardPad, paddingBottom: spacing.lg },
  featuredWrap: { borderBottomWidth: 1, borderBottomColor: colors.border },

  // 공용 StatTile 과 같은 문법 - 상자를 걷고 숫자를 키운다
  // 지표 타일은 **카드 안의 한 단계 낮은 면**이다. 상자를 걷어냈던 판이 있었는데
  // 그러면 셋이 그냥 나란한 글자 덩어리가 되어 어디까지가 한 지표인지 경계가 없고,
  // 눌러서 설명이 열린다는 신호도 사라진다. 면이 곧 그 두 가지를 다 말한다
  metricTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    padding: spacing.md,
    gap: 2,
  },
  // 넷을 골랐을 때 2×2 로 접는 폭. flex 를 0 으로 되돌린 뒤 basis 를 다시 준다 -
  // flex:1 이 남아 있으면 basis 가 0 으로 눌려 넷이 한 줄에 구겨진다
  metricTileWide: { flex: 0, flexGrow: 1, flexBasis: '46%' },
  // 열려 있는 타일은 면째로 틴트가 된다 - 어느 것을 눌러 이 설명이 떴는지
  metricTileOn: { backgroundColor: colors.brandSoft },
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

  note: typography.micro,

  glossaryText: { ...typography.body, fontSize: 13.5, lineHeight: 21 },
  glossaryTrap: { ...typography.body, fontSize: 13.5, lineHeight: 21, color: colors.text },
  closeText: { ...typography.micro, color: colors.brandText, fontWeight: '700' },
});
