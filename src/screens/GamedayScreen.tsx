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
import { TODAY_GAME } from '../game';
import { countdown } from '../goods';
import { Partner, TIER_SPEC, couponCode, sortedPartners, todayPerks } from '../partners';
import { colors, radius, spacing, tabularFigures, typography } from '../theme';

type Sub = 'go' | 'eat';

/**
 * 눌러서 여는 참고 지면.
 *
 * 이 화면이 실제로 답하는 것은 "어디 대고 어느 문으로 들어가나"다. 게이트 다섯 개와
 * 반입 목록과 교통편을 전부 펼쳐 두면 그 답이 스크롤 아래로 밀린다. **필요한 사람이
 * 눌러서 보게** 하고 지면에는 한 줄씩만 남긴다
 */
type InfoKey = 'gate' | 'bring' | 'transit';

const INFO_META: Record<InfoKey, { title: string; hint: string }> = {
  gate: { title: '입장 게이트', hint: '어느 문이 덜 붐비나' },
  bring: { title: '반입 규정', hint: '가지고 들어갈 수 있는 것 · 없는 것' },
  transit: { title: '대중교통', hint: '기차 · 버스 · 도보' },
};

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

              {/* ── 예매 ─────────────────────────────────────── */}
              <SectionTitle
                title="예매"
                right={openIn ? <Text style={st.headNote}>{openIn}</Text> : null}
              />
              <Card>
                <CardHeading label={TICKET_CHANNEL.channel} title="8월 14일 오후 2시 오픈" />

                <View>
                  {SEAT_GRADES.map((g, i) => (
                    <View key={g.id} style={[st.seatRow, i < SEAT_GRADES.length - 1 && st.divider]}>
                      <View style={{ flex: 1 }}>
                        <Text style={st.seatName}>{g.name}</Text>
                        <Text style={st.seatNote}>{g.note}</Text>
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
                  ))}
                </View>

                <AlertToggle
                  on={ticketAlert}
                  onPress={() => setTicketAlert((v) => !v)}
                  label="예매 오픈 알림"
                />

                <ExternalButton
                  label="티켓링크에서 예매"
                  onPress={() => Linking.openURL(TICKET_CHANNEL.url)}
                />
              </Card>

              {/* ── 주차 ───────────────────────────────────────
                  남은 시간은 앱이 안다. 팬이 고르는 것은 **무엇을 아쉬워할 것인가**다 */}
              {/* 스폰서를 여기 둔 이유: 자동차보험 브랜드와 주차 안내는 맥락이 맞는다.
                  팬이 "지금 어디에 댈까"를 묻는 자리에 자동차 관련 브랜드가 있으면
                  광고가 아니라 후원으로 읽힌다. 맥락이 안 맞는 지면에 붙이면 그때부터 소음이다. */}
              <SectionTitle title="주차" presenter="한화손해보험" />
              <Card style={{ gap: spacing.md }}>
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
              </Card>

              <GroupCard style={{ marginTop: spacing.md }}>
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
              </GroupCard>

              {/* ── 가기 전에 ─────────────────────────────────
                  게이트 · 반입 · 교통은 필요한 정보지만 **매번 읽는 것은 아니다.**
                  펼쳐 두면 이 화면이 실제로 답해야 하는 것(어디 대나)이 그만큼
                  아래로 밀린다. 한 줄로 접고 눌러서 연다 */}
              <SectionTitle title="가기 전에" />
              <GroupCard>
                {(['gate', 'bring', 'transit'] as InfoKey[]).map((k, i, arr) => (
                  <Row
                    key={k}
                    last={i === arr.length - 1}
                    style={st.lotRow}
                    onPress={() => setInfo(k)}
                  >
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={st.lotName}>{INFO_META[k].title}</Text>
                      {/* 눌러서 무엇이 나오는지 미리 적는다 - 제목만 있으면
                          누를지 말지를 누른 뒤에야 알게 된다 */}
                      <Text style={st.infoHint}>{INFO_META[k].hint}</Text>
                    </View>
                    <Text style={st.chevron}>›</Text>
                  </Row>
                ))}
              </GroupCard>
            </>
          ) : (
            <>
              {/* ── 오늘 열리는 혜택 ─────────────────────────── */}
              <SectionTitle title="오늘 열리는 혜택" />
              <View style={st.chipRow}>
                <Chip label="승리한 날" selected={won} onPress={() => setWon(true)} />
                <Chip label="평소" selected={!won} onPress={() => setWon(false)} />
              </View>

              <GroupCard style={{ marginTop: spacing.md }}>
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
              </GroupCard>
              <Text style={st.footNote}>{won ? '승리한 날 열리는 혜택' : '당일 티켓 인증 시'}</Text>

              {/* ── 제휴 가게 ───────────────────────────────────
                  설명은 지면을 차지하지 않고 물음표 뒤에 있다 - 묻는 사람에게만 답한다 */}
              <SectionTitle
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
              />
              <GroupCard>
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
              </GroupCard>

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
