// MY - 프로필 · 알림 · 나의 직관 (kbo_poc MY 탭의 구단 앱 이식판)
//
// kbo_poc MY 는 응원 구단 / 알림 / 프로필 / 내 선수 / 직관 인증 / 원장 / 앱 정보의
// 7개 계단식(Disclosure) 섹션이다. 구단 앱은 응원 구단이 정해져 있고 최애도 한 명이라
// 접을 만큼 길지 않다 - 아코디언 없이 이 앱의 기본 문법(작은 회색 머리글 + 그룹 리스트)로
// 전부 펼쳐 둔다.
//
//   내 티켓     예매한 홈경기 · 게이트 · 당일 알림 · 조기 예매 쿠폰
//   프로필      최애 선수(홈과 같은 픽커) · 설명 깊이 · 온보딩 다시 하기
//   알림        온보딩 STEP 3 와 같은 세 스위치 - 온보딩 이후의 유일한 변경 지점
//   나의 직관   직관 기록과 집계 (kbo_poc 정체성 원장의 라이트판)
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  AlertToggle,
  DetailSheet,
  Divider,
  ExternalButton,
  GroupCard,
  Row,
  SectionCard,
  Segmented,
  StatTile,
} from '../components/common';
import { FavoritePicker } from '../components/FavoritePicker';
import { PlayerAvatar } from '../components/photos';
import { SEAT_GRADES } from '../gameday';
import { DEMO_NOW, STANDING, shortDate, weekdayOf } from '../game';
import {
  MyTicket,
  bookedDaysAhead,
  ddayLabel,
  earlyBirdHint,
  earlyBirdOf,
  gameOf,
  gateOf,
  gradeOf,
  upcomingTickets,
} from '../tickets';
import { couponCode } from '../partners';
import { ATTENDANCE, attendanceEdge, attendanceSummary, membershipOf, seatHabit } from '../my';
import { SEAT_VIEWS, seatViewUrl } from '../seatView';
import { KNOWLEDGE_OPTIONS, KnowledgeLevel, UserProfile } from '../profile';
import { BATTERS, PITCHERS } from '../roster';
import { colors, radius, spacing, states, tabularFigures, typography } from '../theme';

/**
 * 모바일 티켓의 바코드.
 *
 * 진짜 코드를 그리지 않는다 - 이 앱은 표를 발권하지 않고, 그럴듯한 코드를 그리면
 * **게이트에서 찍힐 것처럼 보인다.** 예약번호에서 나온 결정적인 막대 패턴이라
 * 같은 티켓은 언제나 같은 모양이고(렌더마다 흔들리지 않는다), 실물이 아니라는 것은
 * 아래 한 줄이 말한다.
 */
function TicketBars({ seed }: { seed: string }) {
  const bars: number[] = [];
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 100000;
  for (let i = 0; i < 44; i += 1) {
    h = (h * 1103515245 + 12345) % 2147483648;
    bars.push(1 + (h % 3));
  }
  return (
    <View style={st.barcode}>
      {bars.map((w, i) => (
        <View key={i} style={[st.bar, { width: w, opacity: i % 2 === 0 ? 1 : 0.12 }]} />
      ))}
    </View>
  );
}

/**
 * 내 티켓.
 *
 * ── 왜 MY 의 맨 위인가 ──────────────────────────────────────
 * MY 의 다른 카드는 **나에 대한 것**이고(프로필·등급·기록) 급할 것이 없다. 표는 다르다 -
 * 경기 당일에 앱을 여는 이유가 이것 하나다. 급한 것이 위에 온다.
 *
 * ── 표 하나에 세 가지를 얹는다 ──────────────────────────────
 * 예매 내역만 다시 보여 주는 것은 문자 메시지가 이미 하고 있다. 앱이 더 할 수 있는 것은
 * **그 표에 딸린 결정**이다 - 몇 시에 나갈지(알림), 어느 문으로 들어갈지(게이트),
 * 경기 전후에 어디서 먹을지(조기 예매 쿠폰).
 */
function TicketCard({
  ticket,
  nowMs,
  alertOn,
  onAlert,
  onCoupon,
}: {
  ticket: MyTicket;
  nowMs: number;
  alertOn: boolean;
  onAlert: () => void;
  onCoupon: () => void;
}) {
  const game = gameOf(ticket);
  const grade = gradeOf(ticket);
  const gate = gateOf(ticket);
  const bonus = earlyBirdOf(ticket);
  const hint = earlyBirdHint(ticket);
  if (!game || !grade) return null;

  return (
    <SectionCard
      title={`${shortDate(ticket.date)} (${weekdayOf(ticket.date)}) ${game.opponent}전`}
      right={<Text style={st.dday}>{ddayLabel(ticket.date, nowMs)}</Text>}
      padded
    >
      <View style={st.ticketHead}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={st.ticketSeat}>{grade.name}</Text>
          <Text style={st.ticketSub}>
            {ticket.seat} · {ticket.count}매
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text style={st.ticketTimeLabel}>경기 시작</Text>
          <Text style={st.ticketTime}>{game.startTime}</Text>
        </View>
      </View>

      <TicketBars seed={ticket.bookingNo} />
      {/* ⚠ 발권하지 않는다는 사실을 감추지 않는다. 팬이 이 화면만 들고 게이트에 서면
          그때가 가장 나쁜 순간이다 */}
      <Text style={st.ticketNote}>
        {ticket.bookingNo} · 실물 입장권은 티켓링크 앱 또는 현장 발권기에서 받습니다
      </Text>

      <Divider />

      {gate ? (
        <View style={st.gateRow}>
          <Text style={st.gateName}>{gate.name}</Text>
          <Text style={st.gateNote}>
            {gate.serves} · {gate.note}
          </Text>
        </View>
      ) : null}

      {/* 알림은 표마다 켠다. 스위치 하나로 두면 8월 12일만 가려던 사람에게 15일 안내도 간다 */}
      <AlertToggle
        on={alertOn}
        onPress={onAlert}
        label="경기 당일 안내"
        caption="출발 시각 · 주차 혼잡 · 우천 여부를 경기 3시간 전에"
      />

      {bonus ? (
        <Pressable
          onPress={onCoupon}
          style={({ pressed }) => [st.couponBox, pressed && states.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`${bonus.label} 쿠폰 자세히 보기`}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={st.couponLabel}>{bonus.label} 쿠폰</Text>
            <Text style={st.couponBody}>
              경기 {bookedDaysAhead(ticket)}일 전에 예매했습니다 · 후원의 집 {bonus.rate}% 할인
            </Text>
          </View>
          <Text style={st.chevron}>›</Text>
        </Pressable>
      ) : hint ? (
        <Text style={st.couponHint}>{hint}</Text>
      ) : null}
    </SectionCard>
  );
}

export function MyScreen({
  profile,
  onLevel,
  onFavorite,
  onAlert,
  onResetOnboarding,
  onGoPartners,
}: {
  profile: UserProfile;
  onLevel: (l: KnowledgeLevel) => void;
  onFavorite: (id?: string) => void;
  onAlert: (key: keyof UserProfile['alerts'], value: boolean) => void;
  onResetOnboarding: () => void;
  /** 쿠폰에서 후원의 집으로 - 쿠폰만 보여 주고 쓸 자리로 못 가면 지갑 속 종이와 같다 */
  onGoPartners: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  // 표마다 켠다 - 8월 12일만 가려던 사람에게 15일 안내까지 가면 그 다음부터 알림을 끈다
  const [gameAlert, setGameAlert] = useState<Record<string, boolean>>({});
  const [coupon, setCoupon] = useState<MyTicket | null>(null);
  const tickets = upcomingTickets(DEMO_NOW);

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
  const seat = seatHabit(ATTENDANCE, SEAT_GRADES);

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.screenX,
          paddingBottom: spacing.scrollBottom,
        }}
      >
        {/* ── 내 티켓 ────────────────────────────────────────────
            직관 탭은 **예매하기 전**까지를 맡는다. 예매를 마치고 나면 앱 안에 그 사실이
            아무 데도 남지 않아서, 팬은 그때부터 문자함을 뒤진다.

            MY 의 다른 카드는 나에 대한 것이고 급할 것이 없다. 표는 경기 당일에 앱을
            여는 이유 그 자체라 맨 위에 온다 ── */}
        {tickets.map((t) => (
          <TicketCard
            key={t.date}
            ticket={t}
            nowMs={DEMO_NOW}
            alertOn={gameAlert[t.date] ?? true}
            onAlert={() => setGameAlert((v) => ({ ...v, [t.date]: !(v[t.date] ?? true) }))}
            onCoupon={() => setCoupon(t)}
          />
        ))}

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

          <Divider />

          {/* ⚠ 등급이 가르는 것은 "무엇을 볼 수 있나"가 아니라 **"무엇을 먼저·싸게
              할 수 있나"**다. 심화 지표와 승부 예측은 등급과 무관하게 전부 열려 있다 -
              그건 이 앱을 여는 이유이고, 잠그는 순간 팬이 앱을 안 쓴다.
              잠긴 것을 회색으로 **보여준다** - 감추면 다음 등급을 왜 올리는지 모른다 */}
          <View style={{ gap: 6 }}>
            {member.tier.perks.map((p) => (
              <Text key={p} style={st.perkOn}>
                ✓ {p}
              </Text>
            ))}
          </View>

          {member.next ? (
            <View style={st.lockBox}>
              <Text style={st.lockHead}>{member.next.label} 에서 열립니다</Text>
              {member.next.unlocks.map((p) => (
                <Text key={p} style={st.perkOff}>
                  · {p}
                </Text>
              ))}
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

          {/* 기록에 좌석이 남아 있는데 아무 데도 쓰지 않고 있었다. 내가 앉았던 자리를
              **구단 공식 VR 로 다시 볼 수 있다** - 예매 화면의 시야 링크와 같은 리소스지만,
              거기서는 '고르는 중'이고 여기서는 '내가 앉았던 곳'이라 성격이 다르다 */}
          {seat ? (
            <Pressable
              onPress={() => Linking.openURL(seatViewUrl(SEAT_VIEWS[seat.grade.id].scene))}
              hitSlop={8}
              accessibilityRole="link"
              accessibilityLabel={`${seat.grade.name} 대표 구역 360도 시야 보기`}
              style={({ pressed }) => pressed && states.pressed}
            >
              <Text style={st.seatHabit}>
                가장 자주 앉은 자리 <Text style={st.edgeStrong}>{seat.grade.name}</Text> ·{' '}
                {seat.times}회<Text style={st.edgeStrong}> · 시야 ›</Text>
              </Text>
            </Pressable>
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

      {/* ── 조기 예매 쿠폰 ────────────────────────────────────
          쿠폰만 보여 주고 쓸 자리로 못 가면 지갑에 든 종이와 같다. 코드와 조건을 여기서
          끝내고 **후원의 집으로 넘긴다** - 어느 가게가 받는지는 그 화면이 이미 안다.

          코드는 partners.couponCode 가 만든다. 티켓 인증 쿠폰과 같은 규칙을 써야
          가게 입장에서 확인 절차가 하나다 ── */}
      <DetailSheet
        visible={coupon !== null}
        title="조기 예매 쿠폰"
        subtitle={
          coupon
            ? `${shortDate(coupon.date)} ${gameOf(coupon)?.opponent}전 · ${earlyBirdOf(coupon)?.rate}% 할인`
            : undefined
        }
        onClose={() => setCoupon(null)}
      >
        {coupon ? (
          <>
            <View style={st.codeBox}>
              <Text style={st.codeLabel}>쿠폰 번호</Text>
              <Text style={st.codeValue}>{couponCode('early', coupon.bookingNo)}</Text>
            </View>

            <SectionCard title="쓰는 법" padded>
              <Text style={st.sheetLine}>
                경기 당일 후원의 집에서 이 번호를 보여 주면 됩니다. 경기 시작 3시간 전부터 종료 후
                2시간까지 쓸 수 있고, 1회만 사용됩니다.
              </Text>
              <Divider />
              {/* ⚠ 이건 선예매권이 아니다. 한화는 암표 대응으로 등급별 선예매를 폐지했고,
                  이 쿠폰은 판매 순서를 건드리지 않는다 - 이미 열린 표를 일찍 정한 사람에게
                  주는 동네 혜택이다. 그 구분이 흐려지면 폐지한 제도를 다시 들이는 제안이 된다 */}
              <Text style={st.sheetNote}>
                먼저 살 권리를 주는 것이 아니라, 일찍 정한 팬에게 동네 혜택을 얹는 방식입니다.
                구단은 좌석을 일찍 채우고 후원의 집은 확정된 손님을 받습니다.
              </Text>
            </SectionCard>

            <ExternalButton
              label="후원의 집에서 쓰기"
              onPress={() => {
                setCoupon(null);
                onGoPartners();
              }}
            />
          </>
        ) : null}
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

  // ── 내 티켓 ──────────────────────────────────────────────
  dday: { ...typography.micro, ...tabularFigures, color: colors.brandText, fontWeight: '600' },
  ticketHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  ticketSeat: { ...typography.cardTitle, fontSize: 16 },
  ticketSub: typography.caption,
  ticketTimeLabel: typography.micro,
  ticketTime: { ...typography.metric, ...tabularFigures, fontSize: 20 },
  // 실물 발권이 아니라는 것을 형태로도 말한다 - 막대가 옅고 좌우로 잘리지 않는다
  barcode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 40,
    marginTop: spacing.md,
  },
  bar: { height: '100%', backgroundColor: colors.text, borderRadius: 1 },
  ticketNote: { ...typography.micro, ...tabularFigures, marginTop: 6 },
  gateRow: { gap: 2, marginBottom: spacing.md },
  gateName: { ...typography.bodyStrong, fontSize: 14, color: colors.brandText },
  gateNote: typography.micro,
  // 틴트 면은 흰 카드 안에서만 (theme.soft 참고)
  couponBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.tile,
    backgroundColor: colors.brandSoft,
  },
  couponLabel: { ...typography.bodyStrong, fontSize: 14, color: colors.brandText },
  couponBody: typography.micro,
  couponHint: { ...typography.micro, marginTop: spacing.md, lineHeight: 18 },

  codeBox: { alignItems: 'center', gap: 4, paddingVertical: spacing.lg },
  codeLabel: typography.micro,
  codeValue: { ...typography.metric, ...tabularFigures, fontSize: 26, letterSpacing: 1 },
  sheetLine: { ...typography.body, fontSize: 13.5, lineHeight: 21 },
  sheetNote: { ...typography.caption, lineHeight: 19 },
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

  // 열린 혜택과 잠긴 혜택. 잠긴 쪽은 감추지 않고 회색으로 둔다 - 감추면 올릴 이유를 모른다
  perkOn: { ...typography.body, color: colors.text, lineHeight: 20 },
  lockBox: {
    gap: 5,
    padding: spacing.md,
    borderRadius: radius.tile,
    backgroundColor: colors.surface,
  },
  lockHead: { ...typography.micro, color: colors.subText },
  perkOff: { ...typography.caption, lineHeight: 19 },

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
