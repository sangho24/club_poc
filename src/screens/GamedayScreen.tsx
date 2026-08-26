// 직관 - 티켓 · 주차 · 접근 · 팬 상권 (1차 리뷰 5번 + 6번)
//
// ── 이 화면의 원칙: 백링크 직전까지는 앱이 다 한다 ───────────
// 예매와 결제는 외부로 넘긴다(계약상 대체 불가). 하지만 **넘어가기 전에 필요한 결정은
// 전부 앱 안에서** 끝나야 한다. 어느 좌석이 얼마인지, 지금 어디에 댈 수 있는지, 어느
// 게이트가 덜 붐비는지, 뭘 들고 갈 수 있는지, 경기 끝나고 어디서 먹을지.
//
// 그 결정을 다 하고 넘어가면 외부 링크는 '이탈'이 아니라 '완결'이다. 반대로 앱이
// 링크만 던지면 그 앱은 북마크 모음이다.
//
// ── 서브탭으로 나눈 이유 ─────────────────────────────────────
// 처음에는 하나의 긴 스크롤이었고 그 결과 후원의 집(6번)이 최하단에 묻혀 구현 자체가
// 안 된 것처럼 보였다. 동선은 하나지만 목적은 둘이라(오늘 갈 준비 / 어디서 먹지) 갈랐다.
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import {
  AlertToggle,
  Badge,
  Card,
  CardHeading,
  Chip,
  DetailSheet,
  Divider,
  ExternalButton,
  GroupCard,
  SectionCard,
  InfoRow,
  InfoTip,
  Label,
  Row,
  SecondaryButton,
  SectionTitle,
  Segmented,
  TopTabs,
} from '../components/common';
import { PhotoHeader, stadiumPhoto } from '../components/photos';
import {
  BRING_RULES,
  GATES,
  PARKING_BASIS,
  PARKING_SORTS,
  ParkingLot,
  ParkingSort,
  SEAT_GRADES,
  TICKET_CHANNEL,
  TICKET_OPEN_AT,
  TRANSIT,
  kakaoMapUrl,
  minutesToStart,
  naverMapUrl,
  parkingAdvice,
  telUrl,
} from '../gameday';
import { SEAT_VIEWS, SEAT_VIEW_CAPTION, seatViewUrl } from '../seatView';
import { SCHEDULE, TODAY_GAME } from '../game';
import { countdown } from '../goods';
import { Partner, TIER_SPEC, couponCode, sortedPartners, todayPerks } from '../partners';
import BringIcon from '../../assets/icons/bring.svg';
import GateIcon from '../../assets/icons/gate.svg';
import TransitIcon from '../../assets/icons/transit.svg';
import { colors, radius, spacing, states, tabularFigures, typography } from '../theme';

type Sub = 'go' | 'eat';

/**
 * 눌러서 여는 참고 지면.
 *
 * 이 화면이 실제로 답하는 것은 "어디 대고 어느 문으로 들어가나"다. 게이트 다섯 개와
 * 반입 목록과 교통편을 전부 펼쳐 두면 그 답이 스크롤 아래로 밀린다. **필요한 사람이
 * 눌러서 보게** 하고 지면에는 한 줄씩만 남긴다
 */
type InfoKey = 'gate' | 'bring' | 'transit';

const INFO_META: Record<InfoKey, { title: string }> = {
  gate: { title: '입장 게이트' },
  bring: { title: '반입 규정' },
  transit: { title: '대중교통' },
};

const INFO_ORDER: InfoKey[] = ['gate', 'bring', 'transit'];

/**
 * 셋을 여는 타일. 세로로 쌓지 않고 **한 줄에 나란히** 둔다.
 *
 * 세로로 쌓으면 목록이 되고, 목록은 "위에서부터 읽는 것"이라 셋 다 훑게 만든다.
 * 나란히 두면 **고르는 것**이 되어 필요한 하나만 짚고 지나간다. 설명 줄을 뺀 것도
 * 같은 이유다 - 세 칸에 여섯 줄이 들어차면 그게 다시 읽을 거리가 된다.
 */
function InfoTiles({ onPick }: { onPick: (k: InfoKey) => void }) {
  return (
    <View style={st.infoRow}>
      {INFO_ORDER.map((k) => (
        <Pressable
          key={k}
          onPress={() => onPick(k)}
          style={({ pressed }) => [st.infoTile, pressed && states.pressed]}
          accessibilityRole="button"
          accessibilityLabel={INFO_META[k].title}
        >
          <GamedayIcon name={k} color={colors.brandText} />
          <Text style={st.infoTileLabel} numberOfLines={1}>
            {INFO_META[k].title}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * 좌석 위치 미니 배치도.
 *
 * **구역 번호는 처음 오는 팬에게 암호다.** '105~108'이 1루인지 외야인지 알 수 없어서
 * 번호 옆에 '1루 응원석'이라고 글로 덧붙이고 있었는데, 목록 다섯 줄에 그 설명이
 * 반복되면 그게 다시 읽을 거리가 된다. 그림 하나가 설명을 대신하고 **눈이 글자보다
 * 자리를 먼저 잡는다.**
 *
 * 구장을 사실적으로 그리지 않는다. 파울라인 둘 + 외야 아치 + 내야 마름모면 야구장으로
 * 읽히고, 22px 에서 그보다 자세히 그리면 선이 뭉갠다. 구단 공식 배치도를 쓰지 않은
 * 이유이기도 하다 - 그건 이 크기로 줄이면 아무것도 안 보인다.
 */
function SeatSpot({ x, y }: { x: number; y: number }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      {/* 외야 펜스 - 홈에서 퍼지는 아치 */}
      <Path
        d="M4.2 13.2 A11 11 0 0 1 19.8 13.2"
        stroke={colors.borderStrong}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
      />
      {/* 파울라인 */}
      <Path
        d="M12 21 L4.2 13.2 M12 21 L19.8 13.2"
        stroke={colors.borderStrong}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
      />
      {/* 내야 - 있어야 '어디가 홈인지'가 잡힌다 */}
      <Path
        d="M12 19.2 L14.6 16.6 L12 14 L9.4 16.6 Z"
        stroke={colors.dim}
        strokeWidth={1.2}
        fill="none"
        strokeLinejoin="round"
      />
      {/* r 2.6 으로 그렸더니 점이 구장을 덮어 무엇을 가리키는지 되레 흐려졌다.
          자리를 짚는 표시이지 그 자체가 주인공이 아니다 */}
      <Circle cx={x} cy={y} r={1.9} fill={colors.brand} />
    </Svg>
  );
}

/** 세 타일의 픽토그램. 하단 탭과 같은 규칙 - 파일에서 불러오고 색만 밖에서 준다 */
const INFO_ICONS = { gate: GateIcon, bring: BringIcon, transit: TransitIcon };

function GamedayIcon({ name, color }: { name: InfoKey; color: string }) {
  const Icon = INFO_ICONS[name];
  return <Icon width={24} height={24} color={color} />;
}

/** 시연 기준 시각 - Date.now() 를 쓰면 실행할 때마다 카운트다운이 달라진다 */
const DEMO_NOW = Date.parse('2026-08-11T15:00:00+09:00');

export function GamedayScreen() {
  const [sub, setSub] = useState<Sub>('go');
  const [sort, setSort] = useState<ParkingSort>('near');
  // 렌더마다 new Date() 를 부르면 순수하지 않다. 화면이 열린 시각을 한 번만 잡는다
  const [now] = useState(() => new Date());
  const { minutes, assumed } = minutesToStart(TODAY_GAME.startTime, now);
  const [won, setWon] = useState(true);
  const [openLot, setOpenLot] = useState<ParkingLot | null>(null);
  const [openPartner, setOpenPartner] = useState<Partner | null>(null);
  const [ticketAlert, setTicketAlert] = useState(false);
  const [info, setInfo] = useState<InfoKey | null>(null);
  const [coupons, setCoupons] = useState<Record<string, boolean>>({});

  const advice = parkingAdvice(minutes, sort);
  // 전부 만차면 목록은 순위가 아니라 '다 늦었다'는 사실을 말하는 것이다
  const allFull = advice.every((a) => a.status === 'late');
  const perks = todayPerks(won);
  const partners = sortedPartners();
  const openIn = countdown(TICKET_OPEN_AT, DEMO_NOW);

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.scrollBottom }}
      >
        <View style={st.tabsWrap}>
          <TopTabs
            tabs={[
              { key: 'go' as const, label: '가는 길' },
              { key: 'eat' as const, label: '후원의 집' },
            ]}
            value={sub}
            onChange={setSub}
          />
        </View>

        <View style={{ paddingHorizontal: spacing.screenX }}>
          {sub === 'go' ? (
            <>
              <View style={{ marginTop: spacing.md }}>
                {stadiumPhoto('대전') ? (
                  <PhotoHeader source={stadiumPhoto('대전')!} height={140}>
                    <Text style={st.heroTitle}>대전 한화생명 볼파크</Text>
                    <Text style={st.heroSub}>
                      {TODAY_GAME.startTime} · {TODAY_GAME.opponent.name}전
                    </Text>
                  </PhotoHeader>
                ) : null}
              </View>

              {/* ── 일정 ───────────────────────────────────────
                  일정만 있는 화면은 달력이지 앱이 아니다. 팬이 일정을 보는 이유는
                  **"언제 갈까"** 하나이고, 정하면 곧바로 예매와 주차가 필요하다.
                  그래서 여기 맨 위에 두어 **일정 → 예매 → 주차**가 한 화면에서 이어진다.

                  원정 경기도 지운다 - 못 가는 날인지 아는 것도 정보다. 다만 예매·주차가
                  걸리지 않으므로 회색으로 물리고 '원정'을 명시한다 ── */}
              <SectionCard title="다가오는 경기" right={<Text style={st.headNote}>8월</Text>}>
                {SCHEDULE.map((g, i) => (
                  <Row key={g.date} last={i === SCHEDULE.length - 1} style={st.gameRow}>
                    <Text style={[st.gameDate, !g.home && st.gameAway]}>
                      {g.date}
                      <Text style={st.gameDay}> {g.day}</Text>
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[st.gameOpp, !g.home && st.gameAway]}>
                        {g.home ? `${g.opponent}전` : `${g.opponent}전 (원정)`}
                      </Text>
                      <Text style={st.gameTime}>
                        {g.startTime}
                        {g.home ? ' · 대전' : ''}
                      </Text>
                    </View>
                    {/* 예매가 열린 홈경기만 배지를 단다 - 전부 달면 배지가 배경이 된다 */}
                    {g.home && g.ticketOpen ? <Badge text="예매 중" tone="brand" /> : null}
                  </Row>
                ))}
              </SectionCard>

              {/* ── 예매 ───────────────────────────────────────
                  예매·주차·혜택은 각각 **묶음**이다. 셋 다 "가기 전에 정하는 것"이지만
                  서로 다른 결정이고, 한 화면에 흰 카드로 나란히 서면 어디서 하나가
                  끝나고 다음이 시작하는지 사라진다 ── */}
              <SectionCard
                title="예매"
                padded
                right={openIn ? <Text style={st.headNote}>{openIn}</Text> : null}
              >
                <CardHeading label={TICKET_CHANNEL.channel} title="8월 14일 오후 2시 오픈" />

                <View>
                  {SEAT_GRADES.map((g, i) => {
                    const view = SEAT_VIEWS[g.id];
                    return (
                      <View
                        key={g.id}
                        style={[st.seatRow, i < SEAT_GRADES.length - 1 && st.divider]}
                      >
                        {/* 그림이 이름 왼쪽에 붙는다 - 목록을 훑을 때 눈이 글자를 읽기
                            전에 자리부터 잡는다 */}
                        <SeatSpot x={view.spot.x} y={view.spot.y} />
                        <View style={{ flex: 1 }}>
                          <Text style={st.seatName}>{g.name}</Text>
                          <Text style={st.seatNote}>{g.note}</Text>
                          {/* 구역 표기와 링크를 한 줄로 합쳤다. 행에는 이미 이름·설명·
                              가격·잔여가 있어서, 구역을 따로 적고 링크를 또 버튼으로
                              세우면 한 등급이 다섯 조각으로 흩어진다. 구역 번호 자체가
                              누를 수 있는 것이 되면 "저기를 보여준다"가 한 번에 읽힌다.
                              작은 글자라 표적이 모자라므로 hitSlop 으로 벌린다 */}
                          <Pressable
                            onPress={() => Linking.openURL(seatViewUrl(view.scene))}
                            hitSlop={10}
                            accessibilityRole="link"
                            accessibilityLabel={`${view.zoneLabel} 대표 구역 360도 시야 보기`}
                            style={({ pressed }) => [st.seatViewLink, pressed && states.pressed]}
                          >
                            {/* 구역 번호는 사실이고 '시야 ›' 만 행동이다. 줄 전체를 구단
                                색으로 칠했더니 좌석 다섯 줄이 오렌지로 반복되어, 정작
                                이 카드가 답해야 하는 가격·잔여보다 먼저 눈에 들어왔다.
                                누를 수 있다는 신호는 꺾쇠 쪽에만 남긴다 */}
                            <Text style={st.seatViewText}>
                              {view.zoneLabel}
                              <Text style={st.seatViewCta}> · 시야 ›</Text>
                            </Text>
                          </Pressable>
                        </View>
                        <View style={st.seatRight}>
                          <Text style={st.seatPrice}>{g.price.toLocaleString()}원</Text>
                          {/* 내부 비율(%)은 관리자 대시보드의 단위다. 팬에게는 판단만 말한다 */}
                          <Text
                            style={[
                              st.seatRemain,
                              g.remainRatio <= 0.05
                                ? { color: colors.live, fontWeight: '700' }
                                : g.remainRatio <= 0.25
                                  ? { color: colors.warn, fontWeight: '600' }
                                  : null,
                            ]}
                          >
                            {g.remainRatio <= 0.05
                              ? '매진 임박'
                              : g.remainRatio <= 0.25
                                ? '잔여 적음'
                                : '여유'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* 캡션은 카드에 한 번만. 행마다 붙이면 다섯 줄짜리 경고문이 되어
                    정작 가격·잔여가 안 읽힌다 */}
                <Text style={st.seatViewCaption}>{SEAT_VIEW_CAPTION}</Text>

                <AlertToggle
                  on={ticketAlert}
                  onPress={() => setTicketAlert((v) => !v)}
                  label="예매 오픈 알림"
                />

                <ExternalButton
                  label="티켓링크에서 예매"
                  onPress={() => Linking.openURL(TICKET_CHANNEL.url)}
                />
              </SectionCard>

              {/* ── 주차 ───────────────────────────────────────
                  남은 시간은 앱이 안다. 팬이 고르는 것은 **무엇을 아쉬워할 것인가**다 */}
              {/* 스폰서를 여기 둔 이유: 자동차보험 브랜드와 주차 안내는 맥락이 맞는다.
                  팬이 "지금 어디에 댈까"를 묻는 자리에 자동차 관련 브랜드가 있으면
                  광고가 아니라 후원으로 읽힌다. 맥락이 안 맞는 지면에 붙이면 그때부터 소음이다. */}
              {/* 카운트다운·정렬과 주차장 목록이 카드 둘로 갈려 있었다. 같은 질문
                  ("지금 출발하면 어디에 대나")에 답하는 한 덩어리인데 갈라 두면
                  정렬 기준을 바꿔도 그게 아래 목록에 걸리는 건지 알 수 없다.
                  하나로 합치되 **목록 행은 카드 끝까지 닿아야** 하므로 위쪽만 여백을 준다 */}
              <SectionCard title="주차" presenter="한화손해보험">
                <View style={{ padding: spacing.cardPad, gap: spacing.md }}>
                  <View style={st.countdownRow}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={st.countdown}>
                        {/* '0시간 38분'은 사람이 쓰지 않는 말이다 */}
                        경기까지{' '}
                        {minutes >= 60
                          ? `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`
                          : `${minutes}분`}
                      </Text>
                      <Text style={st.countdownSub}>
                        {TODAY_GAME.startTime} · {TODAY_GAME.opponent.name}전
                      </Text>
                    </View>
                    {/* 시연 시각이 경기 시각과 동떨어졌을 때 조용히 바꿔치기하지 않는다 */}
                    <Badge text={assumed ? '시연 기준' : '지금 출발 기준'} tone="brand" />
                  </View>

                  {/* 근거는 머리글에서 카드 안으로 내렸다. 스폰서 표기와 한 줄에 두면
                    390px 폭에서 둘 다 안 읽힌다 */}
                  <Text style={st.basisNote}>{PARKING_BASIS}</Text>

                  {/* 늦게 열면 전부 만차다. 그때 정렬 기준을 내밀면 고를 수 없는 것을 고르라는 말이 된다.
                    이 시간대에 팬이 실제로 필요한 답은 "주차 말고 다른 방법"이다 */}
                  {allFull ? (
                    <View style={st.fullNote}>
                      <Text style={st.fullTitle}>지금 출발하면 주차는 어렵습니다</Text>
                      <Text style={st.fullBody}>
                        네 곳 모두 경기 {Math.min(...advice.map((a) => a.lot.fullBeforeMinutes))}분
                        전에는 찹니다. 아래 대중교통 안내를 보시거나, 다음 경기에는 조금 일찍
                        출발하세요.
                      </Text>
                    </View>
                  ) : (
                    <Segmented options={PARKING_SORTS} value={sort} onChange={(k) => setSort(k)} />
                  )}
                </View>

                {advice.map(({ lot, status, summary }, i) => (
                  <Row
                    key={lot.id}
                    last={i === advice.length - 1}
                    style={st.lotRow}
                    onPress={() => setOpenLot(lot)}
                  >
                    <View style={{ flex: 1, gap: 5 }}>
                      <Text style={st.lotName}>{lot.name}</Text>
                      {/* 막대와 긴 문장은 상세 시트의 몫이다. 목록 행이 카드만큼 커지면
                          그룹이 "따로 노는 카드 더미"로 읽힌다 (2차 리뷰의 회귀 지점) */}
                      <Text style={st.lotMeta}>
                        도보 {lot.walkMinutes}분 · {lot.fee} · 출차 {lot.exitMinutes}분
                      </Text>
                    </View>
                    {/* 상태는 문장이 아니라 값이다. 행 오른쪽 끝에서 한눈에 훑힌다 */}
                    <Badge
                      text={summary}
                      tone={status === 'open' ? 'win' : status === 'tight' ? 'warn' : 'muted'}
                    />
                    <Text style={st.chevron}>›</Text>
                  </Row>
                ))}
              </SectionCard>

              {/* ── 가기 전에 ─────────────────────────────────
                  게이트 · 반입 · 교통은 필요한 정보지만 **매번 읽는 것은 아니다.**
                  펼쳐 두면 이 화면이 실제로 답해야 하는 것(어디 대나)이 그만큼
                  아래로 밀린다. 한 줄에 나란히 접고 눌러서 연다 */}
              <SectionTitle title="가기 전에" />
              <InfoTiles onPick={setInfo} />
            </>
          ) : (
            <>
              {/* ── 오늘 열리는 혜택 ─────────────────────────── */}
              <SectionCard title="오늘 열리는 혜택">
                <View style={{ padding: spacing.cardPad, paddingBottom: 0 }}>
                  <View style={st.chipRow}>
                    <Chip label="승리한 날" selected={won} onPress={() => setWon(true)} />
                    <Chip label="평소" selected={!won} onPress={() => setWon(false)} />
                  </View>
                </View>

                {perks.map(({ partner, perk }, i) => (
                  <Row
                    key={partner.id}
                    last={i === perks.length - 1}
                    onPress={() => setOpenPartner(partner)}
                  >
                    <Text style={st.perkName}>{partner.name}</Text>
                    <Text style={st.perkText}>{perk}</Text>
                    <Text style={st.chevron}>›</Text>
                  </Row>
                ))}
              </SectionCard>
              <Text style={st.footNote}>{won ? '승리한 날 열리는 혜택' : '당일 티켓 인증 시'}</Text>

              {/* ── 제휴 가게 ───────────────────────────────────
                  설명은 지면을 차지하지 않고 물음표 뒤에 있다 - 묻는 사람에게만 답한다 */}
              <SectionCard
                title="제휴 가게"
                right={
                  <View style={st.headRight}>
                    <Text style={st.headNote}>{partners.length}곳</Text>
                    <InfoTip
                      title="이글스 후원의 집이란"
                      lines={[
                        '팬이 운영하거나 팬이 모이는 가게가 구단과 제휴한 곳입니다. **구단이 직접 방문해 심사**합니다.',
                        '경기가 있는 날, 그리고 **한화가 이긴 날**에 팬에게 혜택을 줍니다. 가게마다 조건이 다르니 상세에서 확인하세요.',
                      ]}
                    />
                  </View>
                }
              >
                {partners.map((p, i) => (
                  <Row
                    key={p.id}
                    last={i === partners.length - 1}
                    style={st.lotRow}
                    onPress={() => setOpenPartner(p)}
                  >
                    <View style={{ flex: 1, gap: 5 }}>
                      <View style={st.lotHead}>
                        <Text style={st.lotName}>{p.name}</Text>
                        <Badge
                          text={TIER_SPEC[p.tier].label}
                          tone={
                            p.tier === 'flagship'
                              ? 'brand'
                              : p.tier === 'official'
                                ? 'win'
                                : 'muted'
                          }
                        />
                      </View>
                      <Text style={st.lotMeta}>
                        {p.category} · 도보 {p.walkMinutes}분 · 방문 {p.visits.toLocaleString()}명
                      </Text>
                      <Text style={st.fanStory} numberOfLines={2}>
                        {p.fanStory}
                      </Text>
                      {coupons[p.id] ? <Badge text="쿠폰 받음" tone="brand" /> : null}
                    </View>
                    <Text style={st.chevron}>›</Text>
                  </Row>
                ))}
              </SectionCard>

              {/* ── 어떤 구조인가 · 운영 원칙 · 배분 구조 섹션을 걷어냈다 ──
                  팬은 협찬금 구조를 궁금해하지 않는다. 팬의 질문은 "우리 동네에 이글스
                  후원 가게가 있나, 가면 뭘 주나" 하나다. 벤치마크(전북 현대)와 배분 구조는
                  우리가 파트너·구단에게 설명할 내용이지 팬 화면의 콘텐츠가 아니라서
                  제안서(docs/)로 옮겼다.

                  다만 처음 보는 이름이라 한 번은 물어본다. 그래서 목록 머리글의
                  물음표가 그 질문만 받는다. */}
            </>
          )}
        </View>
      </ScrollView>

      {/* ── 주차장 상세 ────────────────────────────────────── */}
      {/* ── 참고 지면 ─────────────────────────────────────────
          셋이 시트 하나를 나눠 쓴다. 성격이 같은 '눌러야 나오는 참고'라 자리를
          나눌 이유가 없다. 내용은 접기 전과 한 글자도 다르지 않다 */}
      <DetailSheet
        visible={info !== null}
        title={info ? INFO_META[info].title : ''}
        subtitle="대전 한화생명 볼파크"
        onClose={() => setInfo(null)}
      >
        {info === 'gate' ? (
          <GroupCard>
            {GATES.map((g, i) => (
              <Row key={g.name} last={i === GATES.length - 1} style={st.gateRow}>
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={st.lotHead}>
                    <Text style={st.gateName}>{g.name}</Text>
                    <Badge
                      text={{ low: '한산', mid: '보통', high: '혼잡' }[g.crowd]}
                      tone={g.crowd === 'low' ? 'win' : g.crowd === 'mid' ? 'muted' : 'live'}
                    />
                  </View>
                  <Text style={st.gateServes}>{g.serves}</Text>
                  <Text style={st.gateNote}>{g.note}</Text>
                </View>
              </Row>
            ))}
          </GroupCard>
        ) : null}

        {info === 'bring' ? (
          <Card>
            <Label>가지고 들어갈 수 있어요</Label>
            <Text style={st.bringText}>{BRING_RULES.allowed.join(' · ')}</Text>
            <Divider />
            <Label>반입할 수 없어요</Label>
            <Text style={st.bringText}>{BRING_RULES.denied.join(' · ')}</Text>
          </Card>
        ) : null}

        {info === 'transit' ? (
          <GroupCard>
            {TRANSIT.map((t, i) => (
              <Row key={t.label} last={i === TRANSIT.length - 1} style={st.lotRow}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={st.transitLabel}>
                    {t.mode} · {t.label}
                  </Text>
                  <Text style={st.transitDetail}>{t.detail}</Text>
                </View>
              </Row>
            ))}
          </GroupCard>
        ) : null}
      </DetailSheet>

      <DetailSheet
        visible={!!openLot}
        title={openLot?.name ?? ''}
        subtitle="주차장"
        onClose={() => setOpenLot(null)}
        actions={
          openLot ? (
            <>
              <View style={{ flex: 1 }}>
                <SecondaryButton
                  label="카카오맵"
                  onPress={() => Linking.openURL(kakaoMapUrl(openLot.address))}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ExternalButton
                  label="길찾기"
                  onPress={() => Linking.openURL(naverMapUrl(openLot.address))}
                />
              </View>
            </>
          ) : null
        }
      >
        {openLot ? (
          <>
            <Card>
              <Label>지금 혼잡도</Label>
              <View style={st.occBig}>
                <Text style={st.occValue}>{Math.round(openLot.liveOccupancy * 100)}%</Text>
                <Text style={st.occLabel}>
                  {Math.round(openLot.capacity * (1 - openLot.liveOccupancy))}대 남음 (추정)
                </Text>
              </View>
              <View style={st.occTrack}>
                <View
                  style={[
                    st.occFill,
                    {
                      width: `${Math.round(openLot.liveOccupancy * 100)}%`,
                      backgroundColor:
                        openLot.liveOccupancy >= 0.9
                          ? colors.live
                          : openLot.liveOccupancy >= 0.7
                            ? colors.brand
                            : colors.win,
                    },
                  ]}
                />
              </View>
            </Card>

            <View style={{ marginTop: spacing.cardGap }}>
              <GroupCard style={{ paddingHorizontal: spacing.cardPad }}>
                <InfoRow label="수용" value={`${openLot.capacity.toLocaleString()}대`} />
                <InfoRow label="요금" value={openLot.fee} />
                <InfoRow label="운영" value={openLot.policy} />
                <InfoRow
                  label="도보"
                  value={`${openLot.walkMinutes}분${openLot.walkMeters ? ` (${openLot.walkMeters}m)` : ''}`}
                />
                <InfoRow label="만차 예상" value={`경기 ${openLot.fullBeforeMinutes}분 전`} />
                <InfoRow label="출차 소요" value={`약 ${openLot.exitMinutes}분`} />
                <InfoRow label="주소" value={openLot.address} last />
              </GroupCard>
            </View>

            <View style={{ marginTop: spacing.cardGap }}>
              <Card>
                <Label>알아두면 좋은 것</Label>
                <Text style={st.sheetBody}>{openLot.tip}</Text>
                {openLot.caution ? (
                  <>
                    <Divider />
                    <Label>주의</Label>
                    <Text style={[st.sheetBody, { color: colors.live }]}>{openLot.caution}</Text>
                  </>
                ) : null}
              </Card>
            </View>
          </>
        ) : null}
      </DetailSheet>

      {/* ── 제휴 가게 상세 ─────────────────────────────────── */}
      <DetailSheet
        visible={!!openPartner}
        title={openPartner?.name ?? ''}
        subtitle={
          openPartner ? `${TIER_SPEC[openPartner.tier].label} · ${openPartner.category}` : ''
        }
        onClose={() => setOpenPartner(null)}
        actions={
          openPartner ? (
            <>
              <View style={{ flex: 1 }}>
                <SecondaryButton
                  label="전화"
                  onPress={() => Linking.openURL(telUrl(openPartner.phone))}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ExternalButton
                  label="길찾기"
                  onPress={() => Linking.openURL(naverMapUrl(openPartner.name))}
                />
              </View>
            </>
          ) : null
        }
      >
        {openPartner ? (
          <>
            <Card>
              <Text style={st.sheetBody}>{openPartner.fanStory}</Text>
            </Card>

            {/* 쿠폰 - 혜택을 '쓰는' 자리 */}
            {openPartner.ticketPerk || openPartner.winPerk ? (
              <View style={{ marginTop: spacing.cardGap }}>
                <Card>
                  <CardHeading
                    label="제휴 혜택"
                    title={openPartner.winPerk ?? openPartner.ticketPerk!}
                  />

                  {coupons[openPartner.id] ? (
                    <View style={st.coupon}>
                      <Text style={st.couponLabel}>쿠폰 번호</Text>
                      <Text style={st.couponCode}>{couponCode(openPartner.id, TODAY_GAME.id)}</Text>
                      <Text style={st.couponNote}>
                        가게에서 이 화면을 보여 주세요 · 오늘 경기일에만 유효
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => setCoupons((c) => ({ ...c, [openPartner.id]: true }))}
                      style={({ pressed }) => [st.couponBtn, pressed && { opacity: 0.85 }]}
                    >
                      <Text style={st.couponBtnText}>쿠폰 받기</Text>
                    </Pressable>
                  )}

                  <Text style={st.footNote}>
                    {openPartner.winPerk
                      ? '경기 결과에 따라 열립니다.'
                      : '당일 티켓 인증 시 사용할 수 있습니다.'}
                  </Text>
                </Card>
              </View>
            ) : null}

            <View style={{ marginTop: spacing.cardGap }}>
              <SectionTitle title="대표 메뉴" />
              <GroupCard style={{ paddingHorizontal: spacing.cardPad }}>
                {openPartner.menu.map((m, i) => (
                  <InfoRow
                    key={m.name}
                    label={m.name}
                    value={`${m.price.toLocaleString()}원`}
                    last={i === openPartner.menu.length - 1}
                  />
                ))}
              </GroupCard>
            </View>

            <View style={{ marginTop: spacing.cardGap }}>
              <GroupCard style={{ paddingHorizontal: spacing.cardPad }}>
                <InfoRow label="영업시간" value={openPartner.openHours} />
                <InfoRow label="붐비는 때" value={openPartner.peak} />
                <InfoRow label="예약" value={openPartner.reservable ? '가능' : '불가'} />
                <InfoRow
                  label="위치"
                  value={`${openPartner.address} · 도보 ${openPartner.walkMinutes}분`}
                />
                <InfoRow label="전화" value={openPartner.phone} />
                <InfoRow
                  label="누적 방문"
                  value={`${openPartner.visits.toLocaleString()}명 · ${openPartner.since}년부터 제휴`}
                  last
                />
              </GroupCard>
            </View>
          </>
        ) : null}
      </DetailSheet>
    </>
  );
}

const st = StyleSheet.create({
  tabsWrap: { backgroundColor: colors.card },
  headNote: typography.micro,

  heroTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  heroSub: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.86)' },

  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },

  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  seatName: { ...typography.bodyStrong, fontSize: 14 },
  seatNote: { ...typography.micro, marginTop: 2 },
  // 링크는 행 안에서 물러난 자리다. 구단 색을 면으로 깔면 좌석 다섯 줄이 전부
  // 오렌지 블록이 되어 무엇이 주된 행동(예매)인지 사라진다 - 글자 색으로만 말한다
  seatViewLink: { alignSelf: 'flex-start', marginTop: 3 },
  seatViewText: { ...typography.micro },
  seatViewCta: { color: colors.brandText },
  seatViewCaption: { ...typography.caption, marginTop: -spacing.xs },
  seatRight: { alignItems: 'flex-end', gap: 2 },
  seatPrice: { ...typography.bodyStrong, ...tabularFigures, fontSize: 14 },
  seatRemain: { ...typography.micro, ...tabularFigures },

  actionRow: { flexDirection: 'row', gap: spacing.sm },

  chipRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },

  headRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  countdown: { ...typography.cardTitle, fontSize: 16 },
  countdownSub: { ...typography.micro, ...tabularFigures },
  basisNote: { ...typography.micro, fontWeight: '400', marginTop: -4 },
  fullNote: {
    backgroundColor: colors.warnSoft,
    borderRadius: radius.tile,
    padding: spacing.md,
    gap: 4,
  },
  fullTitle: { ...typography.bodyStrong, color: colors.warn },
  fullBody: { ...typography.caption, lineHeight: 19 },

  lotRow: { alignItems: 'flex-start', paddingVertical: spacing.lg },
  lotHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lotName: { fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  lotMeta: { ...typography.micro, ...tabularFigures, fontWeight: '400' },
  lotStatus: { ...typography.caption, color: colors.text, fontWeight: '600' },
  chevron: { fontSize: 18, color: colors.mutedText, marginTop: 2 },

  // 일정 행 - 날짜가 붙박이 폭을 가져야 아래로 줄이 맞는다
  gameRow: { gap: spacing.md },
  gameDate: {
    ...typography.bodyStrong,
    ...tabularFigures,
    fontSize: 14,
    width: 58,
    color: colors.text,
  },
  gameDay: { ...typography.micro, fontWeight: '400' },
  gameOpp: { ...typography.bodyStrong, fontSize: 14 },
  gameTime: { ...typography.micro, ...tabularFigures, fontWeight: '400', marginTop: 1 },
  // 원정은 예매·주차가 걸리지 않는 날이다. 지우지 않고 물린다 - 못 가는 날도 정보다
  gameAway: { color: colors.mutedText },

  // 셋을 여는 타일 - 한 줄에 나란히. 각자 곡률 사각형을 등에 지고 서로 갈린다
  infoRow: { flexDirection: 'row', gap: spacing.sm },
  infoTile: {
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
  infoTileLabel: { fontSize: 13, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  // 접어 둔 지면을 여는 줄. 제목 아래 한 줄이 "눌러서 무엇이 나오는지"를 미리 말한다
  infoHint: { ...typography.micro, fontWeight: '500', lineHeight: 17 },

  occTrack: {
    height: 5,
    borderRadius: radius.bar,
    backgroundColor: colors.dim,
    overflow: 'hidden',
  },
  occFill: { height: 5, borderRadius: radius.bar },
  occBig: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  occValue: { ...typography.metric, ...tabularFigures, color: colors.text },
  occLabel: typography.caption,

  gateRow: { alignItems: 'flex-start', paddingVertical: spacing.lg },
  gateName: { fontSize: 15, fontWeight: '700', color: colors.text },
  gateServes: typography.caption,
  gateNote: { ...typography.micro, fontWeight: '400' },

  bringText: { ...typography.body, fontSize: 13.5, lineHeight: 22 },

  transitLabel: { ...typography.bodyStrong, fontSize: 14 },
  transitDetail: { ...typography.micro, fontWeight: '400', lineHeight: 17 },

  perkName: { ...typography.bodyStrong, fontSize: 13.5, flexShrink: 0 },
  perkText: { ...typography.caption, flex: 1, textAlign: 'right' },

  fanStory: { ...typography.micro, fontWeight: '400', lineHeight: 17 },

  bodyText: { ...typography.caption, lineHeight: 20 },
  sheetBody: { ...typography.body, fontSize: 13.5, lineHeight: 21 },

  tierRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  tierName: { ...typography.caption, color: colors.text, fontWeight: '700' },
  tierSlot: typography.micro,
  tierBenefit: { ...typography.micro, fontWeight: '400', lineHeight: 17 },

  ruleText: { ...typography.micro, fontWeight: '400', lineHeight: 18, flex: 1 },

  couponBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.tile,
    minHeight: spacing.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponBtnText: { fontSize: 15, fontWeight: '700', color: colors.onBrand },
  coupon: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.tile,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  couponLabel: typography.micro,
  couponCode: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.brandText,
    letterSpacing: 2,
    ...tabularFigures,
  },
  couponNote: typography.micro,

  footNote: { ...typography.micro, marginTop: spacing.sm, paddingHorizontal: spacing.xs },
});
