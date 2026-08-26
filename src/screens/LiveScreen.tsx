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
  Badge,
  KeyValueRow,
  ReasonList,
  Row,
  SectionTitle,
  SponsorMoment,
} from '../components/common';
import { PhotoHeader, PlayerAvatar, stadiumPhoto } from '../components/photos';
import { LINEUP, PLATE_SEQUENCE, TODAY_GAME } from '../game';
import { LineScore, buildFeed, lineScoreAt } from '../liveFeed';
import {
  CLUTCH_LI,
  basesLabel,
  bullpenAdvice,
  leverageIndex,
  liveAlerts,
  predictMatchup,
  runExpectancy,
} from '../liveEngine';
import { UserProfile } from '../profile';
import { BATTERS, OPPONENT_PITCHERS, PITCHERS } from '../roster';
import { avgOf, eraOf } from '../sabermetrics';
import { colors, radius, spacing, tabularFigures, typography } from '../theme';

/**
 * 라인스코어 표.
 *
 * ── 390px 에 12열을 넣는다 ──────────────────────────────────
 * 9이닝 + R·H·E 에 팀 이름까지 13열이다. 가로 스크롤로 밀면 **오른쪽 끝의 R(총점)이
 * 안 보이는데**, 총점은 이 표에서 가장 자주 보는 값이라 스크롤 뒤에 숨기면 안 된다.
 * 숫자 칸을 24px 로 좁히고 팀 이름을 짧게 잡아 한 화면에 들어가게 했다.
 *
 * ── 아직 치르지 않은 이닝은 비운다 ──────────────────────────
 * 8회말 진행 중인데 그 칸에 0 을 적으면 **'0점으로 끝난 이닝'**이 되어 지금 벌어지는
 * 공격이 표에서 사라진다. `null` 은 '·' 로 그리고, **지금 공격 중인 칸만** 구단 색
 * 점으로 표시해 눈이 현재 위치를 찾게 한다.
 *
 * ── 값은 중계에서 나온다 ────────────────────────────────────
 * 전에는 표가 상수(`LINESCORE`)를 그렸다. 그래서 타석을 9회말까지 넘겨도 **8회말 칸이
 * 비어 있었고**(이미 치른 이닝인데 '·' 였다) 8회말 첫 타석인데 안타가 벌써 7개였다.
 * 이제 `lineScoreAt(step)` 이 문자중계를 합산한다 - 표와 중계가 어긋날 수 없다.
 */
function LineScoreBoard({
  line,
  inning,
  half,
}: {
  line: { away: LineScore; home: LineScore };
  inning: number;
  half: 'top' | 'bottom';
}) {
  const INNINGS = line.away.innings.length;

  const row = (name: string, team: LineScore, runs: number, isHome: boolean, ours: boolean) => (
    <View style={st.lsRow}>
      <Text style={[st.lsTeam, ours && st.lsOurs]} numberOfLines={1}>
        {name}
      </Text>
      {team.innings.map((v, i) => {
        // 지금 공격 중인 칸 - 이닝이 같고 초/말이 이 팀의 차례일 때
        const active = i + 1 === inning && (half === 'bottom') === isHome;
        return (
          <View key={i} style={st.lsCell}>
            {v === null ? (
              active ? (
                <View style={st.lsNow} />
              ) : (
                <Text style={st.lsEmpty}>·</Text>
              )
            ) : (
              <Text style={[st.lsScore, v > 0 && st.lsScored]}>{v}</Text>
            )}
          </View>
        );
      })}
      <Text style={[st.lsTotal, ours && st.lsOurs]}>{runs}</Text>
      <Text style={st.lsSub}>{team.hits}</Text>
      <Text style={st.lsSub}>{team.errors}</Text>
    </View>
  );

  return (
    <Card style={{ marginTop: spacing.cardGap, paddingHorizontal: spacing.md }}>
      <View style={st.lsRow}>
        <Text style={st.lsTeam} />
        {Array.from({ length: INNINGS }, (_, i) => (
          <View key={i} style={st.lsCell}>
            <Text style={st.lsHead}>{i + 1}</Text>
          </View>
        ))}
        <Text style={[st.lsTotal, st.lsHead]}>R</Text>
        <Text style={[st.lsSub, st.lsHead]}>H</Text>
        <Text style={[st.lsSub, st.lsHead]}>E</Text>
      </View>

      <View style={st.lsDivider} />

      {row(TODAY_GAME.opponent.short, line.away, TODAY_GAME.theirScore, false, false)}
      {row('한화', line.home, TODAY_GAME.ourScore, true, true)}
    </Card>
  );
}

/**
 * 선발 라인업.
 *
 * ── 왜 2열인가 ───────────────────────────────────────────────
 * 한 줄에 한 명씩 아홉 줄을 세우면 카드 하나가 화면을 통째로 먹는다. 그러면 예측 카드와
 * 문자중계 사이가 벌어져 이 화면의 규칙 ②("화면의 뼈대는 문자중계이고 예측은 그 위에
 * 얹힌 한 장")가 깨진다. 라인업은 **한 번 확인하고 마는 참고 지면**이라 자리를 많이
 * 가져가면 안 된다. 2열로 접으면 다섯 줄에서 끝난다.
 *
 * 열을 가로로 채우지 않고 **왼쪽 1~5, 오른쪽 6~9** 로 내려 읽게 둔다. 타순은 순서가
 * 곧 의미라 1·2 / 3·4 로 가로 배치하면 눈이 두 칸씩 되돌아온다.
 *
 * ── 왜 그냥 명단이 아닌가 ────────────────────────────────────
 * 정적인 명단은 중계 화면에서 금방 안 보게 된다. **지금 타순이 어디까지 왔는지**는
 * 중계를 보는 내내 궁금한 것이라 현재 타석을 표시한다. 그러면 이 카드도 라인스코어처럼
 * "경기가 여기까지 어떻게 왔나"를 말하는 자리가 된다.
 *
 * 열 번째 칸은 선발투수다. 아홉 칸만 두면 오른쪽 아래가 비는데, 그 자리를 투수가 채우면
 * 빈 칸이 사라지는 동시에 라인업 카드가 실제로 갖춰야 할 정보가 갖춰진다.
 *
 * ⚠ 타율·평균자책점을 여기서 계산해 넣지 않는다. `sabermetrics` 가 원자료에서 뽑는다 -
 * 화면이 값을 따로 들면 선수 탭의 같은 수치와 어긋난다.
 */
function LineupCard({ currentBatterId }: { currentBatterId: string }) {
  const starter = PITCHERS.find((p) => p.id === LINEUP.starterId) ?? PITCHERS[0];
  const oppStarter =
    OPPONENT_PITCHERS.find((p) => p.id === LINEUP.opponentStarterId) ?? OPPONENT_PITCHERS[0];

  // 타율은 한국 야구 표기대로 앞의 0 을 뗀다 (.271). 0.271 로 적으면 다른 나라 표기가 된다
  const noZero = (v: number) => v.toFixed(3).replace(/^0/, '');

  const cells = LINEUP.order.map((id, i) => {
    const b = BATTERS.find((x) => x.id === id);
    return {
      key: id,
      no: String(i + 1),
      name: b?.name ?? '',
      meta: b?.pos ?? '',
      stat: b ? noZero(avgOf(b.stat)) : '',
      now: id === currentBatterId,
    };
  });
  cells.push({
    key: starter.id,
    no: 'P',
    name: starter.name,
    meta: starter.throws === 'L' ? '좌투' : '우투',
    stat: eraOf(starter.stat).toFixed(2),
    now: false,
  });

  const column = (from: number, to: number) => (
    <View style={{ flex: 1 }}>
      {cells.slice(from, to).map((c) => (
        <View key={c.key} style={[st.luCell, c.now && st.luCellNow]}>
          <Text style={[st.luNo, c.now && st.luNowText]}>{c.no}</Text>
          <Text style={[st.luName, c.now && st.luNowText]} numberOfLines={1}>
            {c.name}
            <Text style={st.luMeta}> {c.meta}</Text>
          </Text>
          <Text style={st.luStat}>{c.stat}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <>
      <SectionTitle
        title="선발 라인업"
        right={
          <Text style={st.luHead}>
            {TODAY_GAME.opponent.short} 선발 {oppStarter.name}
          </Text>
        }
      />
      <Card style={{ marginTop: spacing.cardGap, paddingHorizontal: spacing.md }}>
        <View style={st.luGrid}>
          {column(0, 5)}
          {column(5, 10)}
        </View>
        {/* 숫자만 놓으면 .271 과 3.42 가 무엇인지 알 수 없다. 카드에 한 번만 적는다 */}
        <Text style={st.luNote}>타자는 시즌 타율 · 투수는 평균자책점</Text>
      </Card>
    </>
  );
}

export function LiveScreen({ profile }: { profile: UserProfile }) {
  const [step, setStep] = useState(3); // 만루 직전부터 - 시연에서 바로 핵심을 보여준다
  const [showWhy, setShowWhy] = useState(false);
  // 이닝 펼침. 값이 없으면 진행 중인 이닝만 펼쳐 둔다 - 지난 이닝은 접혀 있어야
  // 지금 벌어지는 타석이 화면 안에 남는다
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
  /**
   * ⚠ `liveAlerts` 는 **푸시 알림용**이다. 앱 밖에서 한 줄만 보고도 상황을 알 수 있게
   * 문장을 통째로 담는다. 그 목록을 화면에 그대로 부으면 **이미 보이는 것을 다시 말한다.**
   *
   * 실제로 이 화면에서 이런 일이 벌어지고 있었다.
   *   clutch  "이 타석 하나가 평균 타석의 4.3배… 현재 기대득점은 1.47점입니다"
   *           → 바로 위 카드가 `기대득점 1.47점 · 레버리지 4.29` 로 이미 말했다
   *   matchup  title=pred.headline · body=pred.reasons[0]
   *           → '이 승부' 카드의 제목과 첫 근거가 **글자 그대로 같다**
   *
   * 같은 수치가 화면 하나에 세 번 나오면 정보가 많은 게 아니라 읽을 것이 없어진다.
   * 화면에는 **화면이 아직 말하지 않은 것만** 남긴다. 엔진은 손대지 않는다 -
   * 알림으로 나갈 때는 그 문장들이 그대로 필요하다.
   */
  const alerts = useMemo(
    () =>
      liveAlerts(pa.situation, batter, pitcher).filter(
        (a) => a.kind !== 'clutch' && a.kind !== 'matchup',
      ),
    [pa.situation, batter, pitcher],
  );

  const s = pa.situation;
  const pct = Math.round(pred.onBaseProb * 100);
  const li = pred.context.leverageIndex;
  const halfLabel = s.half === 'bottom' ? '말' : '초';

  // 1회부터 지금까지의 중계. 이닝은 최신이 위, 이닝 안은 시간순이다
  const feed = useMemo(() => buildFeed(step), [step]);
  const line = useMemo(() => lineScoreAt(step), [step]);

  // 스폰서가 후원하는 '결정적 순간'. 지면을 파는 게 아니라 **순간을 판다**.
  // 지나간 타석 중 레버리지가 가장 높았던 자리에 한 번만 끼어든다 - 매 행마다 붙으면
  // 그건 광고 지면이지 순간이 아니고, 팬은 피드를 못 읽는다.
  //
  // ⚠ 후보는 **이번 이닝**의 지나간 타석뿐이다. 중계가 1회까지 길어졌다고 후보를 경기
  // 전체로 넓히면, 스폰서 카드가 접힌 3회 안에 들어가 아무도 보지 못하는 자리에 붙는다.
  const peak = useMemo(() => {
    const inThisHalf = PLATE_SEQUENCE.slice(0, step)
      .map((p, i) => ({ ...p, i, li: leverageIndex(p.situation) }))
      .filter((p) => p.situation.inning === s.inning && p.situation.half === s.half);
    return inThisHalf.reduce<(typeof inThisHalf)[number] | null>(
      (best, p) => (p.li >= CLUTCH_LI && (!best || p.li > best.li) ? p : best),
      null,
    );
  }, [step, s.inning, s.half]);

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

        {/* ── 라인스코어 ─────────────────────────────────────────
            중계 화면에서 가장 먼저 보는 것인데 없었다. 총점 3:4 는 "몇 점 차인가"에만
            답하고 **"어떻게 흘러온 경기인가"에는 답하지 못한다.** 5회에 2점을 준 경기와
            매 이닝 1점씩 준 경기는 같은 4점이어도 다른 경기다.

            이 앱에서는 특히 필요하다 - 레버리지가 "지금이 왜 결정적인가"를 말하는데
            그 근거의 절반이 경기가 여기까지 어떻게 왔는가이기 때문이다.

            히어로 바로 아래, '이 승부'보다 위다. 승부 예측은 이 표를 읽은 다음에 오는
            이야기라 순서가 뒤집히면 안 된다 ── */}
        <LineScoreBoard line={line} inning={s.inning} half={s.half} />

        {/* ── 이 승부 ────────────────────────────────────────────
            베이스·볼카운트·레버리지가 따로 카드를 갖고 있었다. 둘 다 **같은 한 가지**
            (지금 이 타석)를 말하는데 카드가 갈려 있으면, 레버리지 4.29 라는 수치가
            매치업과 떨어져서 "그래서 이게 왜 중요한가"가 보이지 않는다.
            상황은 승부의 머리다 - 한 카드 안에서 위아래로 잇는다 ── */}
        <SectionTitle title="이 승부" presenter="한화생명" />
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

          <Divider />

          {/* ⚠ `pred.headline` 을 쓰면 안 된다. 그건 알림용이라 베이스·볼카운트·확률을
              전부 담고 있는데, 이 카드는 **그 셋을 이미 그리고 있다**(바로 위 상황 행,
              아래 37% 숫자). 같은 말이 두 번 나오는 데다 세 줄짜리 굵은 제목이 카드를
              짓눌러 아래 문자중계와의 경계까지 흐려졌다. 제목이 할 일은 판정 하나다 */}
          <CardHeading
            label={pred.flipped ? '상황이 뒤집은 승부' : '매치업'}
            title={pred.verdict}
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
            <Text style={st.whyBtn}>AI 계산 근거 보기 ›</Text>
          </Pressable>
        </Card>

        {/* ── 선발 라인업 ────────────────────────────────────────
            중계 화면의 기본인데 없었다. 문자중계에 이름이 쏟아지는데 그 이름이 몇 번
            타자인지 모르면 흐름이 안 읽힌다.

            자리는 '이 승부' 아래 · 문자중계 위다. 라인스코어와 문자중계 사이라는 점은
            같지만 예측 카드보다 위로는 올리지 않았다 - 승부 예측이 이 화면의 최우선
            항목이고, 명단은 그것을 읽은 뒤 확인하는 참고 지면이다.
            문자중계 바로 위에 두면 중계를 읽기 직전에 명단이 눈에 들어온다 ── */}
        <LineupCard currentBatterId={pa.batterId} />

        {/* ── 문자중계 ─────────────────────────────────────────
            네 행짜리 목록은 중계가 아니다. 지금 이닝만 보여 주고 있어서 "여기까지 어떻게
            왔나"는 라인스코어의 숫자 아홉 개로만 남았다.

            이제 1회부터 전부 있다. 다만 **지난 이닝은 접는다** - 마흔 행을 펼쳐 두면
            지금 벌어지는 타석이 스크롤 저 위로 밀려나 중계의 쓸모가 사라진다.
            접힌 머리에 그 이닝 득점을 적어 두면, 펼치지 않고도 경기 흐름이 읽힌다 ── */}
        <SectionTitle title="문자중계" right={<Text style={st.sectionCount}>1회부터</Text>} />
        <GroupCard>
          {feed.map((inn, i) => {
            const open = expanded[inn.key] ?? inn.live;
            const last = i === feed.length - 1;
            return (
              <View key={inn.key}>
                <Row
                  style={st.inningHead}
                  last={last && !open}
                  onPress={() => setExpanded((v) => ({ ...v, [inn.key]: !open }))}
                >
                  <Text style={[st.inningLabel, inn.live && st.inningLabelLive]}>
                    {inn.inning}회{inn.half === 'bottom' ? '말' : '초'}
                  </Text>
                  <Text style={st.inningTeam}>
                    {inn.ours ? '한화' : TODAY_GAME.opponent.short} 공격
                  </Text>
                  <View style={{ flex: 1 }} />
                  {inn.live ? (
                    <Badge text="진행 중" tone="live" />
                  ) : inn.runs > 0 ? (
                    <Badge text={`${inn.runs}점`} tone="brand" />
                  ) : (
                    <Text style={st.inningZero}>무득점</Text>
                  )}
                  {/* 접힘 표시는 글자로 - 아이콘을 하나 더 들이면 행에 네 종류가 선다 */}
                  <Text style={st.inningCaret}>{open ? '⌃' : '⌄'}</Text>
                </Row>

                {open
                  ? inn.rows.map((r, ri) => {
                      const rowLast = last && ri === inn.rows.length - 1;
                      if (r.kind === 'sub') {
                        return (
                          <Row key={ri} style={st.subRow} last={rowLast}>
                            <Text style={st.subText}>{r.text}</Text>
                          </Row>
                        );
                      }
                      const isPeak = r.paIndex !== undefined && r.paIndex === peak?.i;
                      return (
                        <View key={ri}>
                          <Row style={st.logRow} last={rowLast && !isPeak}>
                            <Text style={[st.logName, r.live && st.logNameLive]}>{r.name}</Text>
                            <Text style={st.logText}>
                              {r.text}
                              {r.live ? ` · ${s.balls}볼 ${s.strikes}스트라이크` : ''}
                            </Text>
                            {r.runs ? <Text style={st.logRun}>+{r.runs}</Text> : null}
                          </Row>
                          {/* 그 타석 바로 아래에 붙어야 방금 읽은 줄과 해석이 이어진다 */}
                          {isPeak && peak ? (
                            <SponsorMoment
                              presenter="한화생명"
                              title={`${peak.situation.inning}회${peak.situation.half === 'bottom' ? '말' : '초'} ${basesLabel(peak.situation.bases)}, 승패가 갈린 타석`}
                              body={`이 타석 하나가 평균 타석의 **${peak.li.toFixed(1)}배**만큼 승패를 흔들었습니다. 당시 기대득점은 ${runExpectancy(peak.situation).toFixed(2)}점이었습니다.`}
                              last={rowLast}
                            />
                          ) : null}
                        </View>
                      );
                    })
                  : null}
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

        <SectionTitle title="타석 이동" />
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
          {/* 기록이 없으면 줄을 아예 두지 않는다. `0.000` 을 적으면 '상대전적이 없다'가
              아니라 '상대전적이 영향을 안 줬다'로 읽힌다 - 둘은 다른 말이다 */}
          {pred.breakdown.headToHeadRecord ? (
            <KeyValueRow
              label={`상대전적 ${pred.breakdown.headToHeadRecord.pa}타석`}
              value={`${pred.breakdown.headToHead >= 0 ? '+' : ''}${pred.breakdown.headToHead.toFixed(3)}`}
            />
          ) : null}
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

  // ── 이닝 아코디언 ────────────────────────────────────────
  // 머리 행은 본문 행보다 촘촘하다 - 같은 높이면 접힌 이닝 열여섯 개가 목록이 되어
  // 그 자체로 스크롤을 잡아먹는다
  inningHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 11 },
  inningLabel: { ...typography.bodyStrong, fontSize: 14, ...tabularFigures },
  inningLabelLive: { color: colors.brandText },
  inningTeam: typography.micro,
  inningZero: typography.micro,
  inningCaret: { ...typography.micro, fontSize: 13, width: 12, textAlign: 'center' },

  // 투수 교체 같은 상황 행 - 타석이 아니므로 이름 칸을 비우고 한 단계 물린다
  subRow: { paddingVertical: 8, backgroundColor: colors.surface },
  subText: { ...typography.micro, flex: 1, textAlign: 'center' },
  // 득점 표시. 행 끝의 작은 값이라 문장으로 적지 않는다
  logRun: { ...typography.bodyStrong, fontSize: 13, color: colors.brandText, ...tabularFigures },
  logNameLive: { color: colors.brandText },

  // ── 선발 라인업 ──────────────────────────────────────────
  // 두 열 사이 간격은 md. 더 좁히면 오른쪽 열의 타율과 왼쪽 열의 이름이 붙어 읽힌다
  luHead: typography.micro,
  luGrid: { flexDirection: 'row', gap: spacing.md },
  luCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: radius.tile,
  },
  // 틴트 면은 흰 카드 안에서만 - 지면 위로 나가면 대비가 조용히 무너진다(theme.soft 참고)
  luCellNow: { backgroundColor: colors.brandSoft },
  luNo: {
    ...typography.micro,
    ...tabularFigures,
    width: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  luName: { flex: 1, fontSize: 13.5, fontWeight: '600', color: colors.text, letterSpacing: -0.2 },
  luMeta: { ...typography.micro, fontSize: 11 },
  luStat: { ...typography.micro, ...tabularFigures, fontSize: 11.5 },
  luNowText: { color: colors.brandText },
  luNote: { ...typography.micro, marginTop: spacing.sm, paddingHorizontal: 6 },

  adviceText: typography.body,

  alertRow: { alignItems: 'flex-start', paddingVertical: spacing.lg },
  alertTitle: { ...typography.bodyStrong, lineHeight: 21 },
  alertBody: { ...typography.caption, lineHeight: 19 },

  // ── 라인스코어 ───────────────────────────────────────────
  // 숫자 칸은 24px. 여기서 더 넓히면 R(총점)이 화면 밖으로 밀린다
  lsRow: { flexDirection: 'row', alignItems: 'center' },
  lsTeam: { ...typography.micro, width: 34, color: colors.text },
  lsOurs: { color: colors.brandText },
  lsCell: { width: 24, alignItems: 'center', justifyContent: 'center', height: 26 },
  lsHead: { ...typography.micro, fontSize: 10, color: colors.mutedText, fontWeight: '600' },
  lsScore: { ...typography.micro, ...tabularFigures, fontWeight: '400', color: colors.subText },
  // 점수가 난 이닝만 진하게 - 0 이 늘어선 표에서 눈이 갈 곳을 만든다
  lsScored: { color: colors.text, fontWeight: '700' },
  lsEmpty: { ...typography.micro, color: colors.dim },
  // 지금 공격 중인 칸. 숫자가 아니라 점이라 '아직 결과가 없다'가 그대로 읽힌다
  lsNow: { width: 6, height: 6, borderRadius: radius.chip, backgroundColor: colors.brand },
  lsTotal: {
    ...typography.bodyStrong,
    ...tabularFigures,
    fontSize: 14,
    width: 28,
    textAlign: 'center',
  },
  lsSub: {
    ...typography.micro,
    ...tabularFigures,
    fontWeight: '400',
    width: 22,
    textAlign: 'center',
  },
  lsDivider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },

  // 면을 비우고 테두리만 - 콘텐츠 카드와 나란히 놓였을 때 한눈에 갈린다
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
