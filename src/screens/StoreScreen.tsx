// 굿즈 - 네 갈래 (1차 리뷰 7번)
//
// ── 왜 하나의 목록이 아니라 네 갈래인가 ──────────────────────
// 처음에는 발매 소식 한 줄기였다. 사건마다 드롭 카드를 세워 시간순으로 늘어놓았는데,
// 성격이 전혀 다른 네 가지가 같은 카드 모양으로 섞여 있었다. 팬이 굿즈 탭을 여는 이유는
// 하나가 아니다 - 오늘 구장에서만 살 수 있는 것을 찾는 사람과, 응원 타월 하나 사려는
// 사람은 **같은 화면을 볼 이유가 없다.** 그래서 자료 구조를 넷으로 나누고(src/goods.ts)
// 화면도 그대로 넷으로 갈랐다.
//
// ── 갈래마다 앱이 하는 일의 깊이가 다르다 ────────────────────
//   오프라인 한정  자격 판정까지 - 그날 그 자리에 있었는지를 앱이 안다
//   특별 MD       예측까지     - 기록이 언제 달성될지, 언제 예약이 열리는지
//   유니폼        고르기까지    - 내 사이즈가 남아 있는지
//   기타 굿즈      보여주기까지  - 얹을 판단이 없으므로 바로 공식몰로
//
// 앞의 둘은 앱이 아니면 못 한다. 뒤의 둘은 공식몰이 더 잘한다. **깊이를 균등하게 맞추면
// 앱이 잘하는 것과 못하는 것이 같은 무게로 보인다.** 격자 순서가 그 깊이 순이자 희소성 순.
//
// ── 왜 나란한 탭이 아니라 2×2 격자인가 (2026-08-26) ──────────
// 초판은 상단 서브탭 네 칸이었다. 두 가지가 어긋났다.
//   ① **한 칸이 90px 언저리**라 "오프라인 한정"이 들어가지 않는다. 이름을 "오프라인"
//      으로 줄여 넣었는데, 그러면 탭이 자기가 무엇을 담는 곳인지 말하지 못한다
//   ② 나란한 탭은 **같은 것을 걸러 보는 자리**다. 여기 넷은 걸러 보는 종류가 아니라
//      각자 다른 화면이다 - 자격 판정과 카탈로그를 같은 트랙 안에 두면 형태가 거짓말을 한다
//
// 지금은 격자 넷을 눌러 **들어간다.** 이름을 온전히 쓸 자리가 생기고, 아이콘이 갈래를
// 글자보다 먼저 가른다.
//
// 격자에는 **이름 하나만** 둔다. 타일마다 현황 한 줄("오늘 경기 카드 발행 중")을 달아
// 봤는데, 네 칸에 각각 다른 색 글이 붙으니 **격자가 목록처럼 읽혔다** - 무엇을 고르는
// 자리인지가 흐려진다. 급한 소식은 바로 위 '놓치기 전에'가 이미 맡고 있어서, 격자는
// 갈림길로만 남기고 현황은 그쪽에 몰아 준다.
//
// ⚠ 결제는 앱에서 하지 않는다 - 공식몰로 리다이렉트한다 (5번 티켓과 같은 원칙).
import { FC, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import GridIcon from '../../assets/icons/goods-grid.svg';
import JerseyIcon from '../../assets/icons/goods-jersey.svg';
import PhotocardIcon from '../../assets/icons/goods-photocard.svg';
import TrophyIcon from '../../assets/icons/goods-trophy.svg';
import {
  AlertToggle,
  Badge,
  Button,
  Card,
  CardHeading,
  Chip,
  DetailSheet,
  Divider,
  ExternalButton,
  GroupCard,
  SectionCard,
  InfoRow,
  Label,
  Row,
  SectionTitle,
} from '../components/common';
import {
  GoodsShowcase,
  JerseyArt,
  PhotoHeader,
  PlayerAvatar,
  PlayerShot,
  TeamEmblem,
  stadiumPhoto,
} from '../components/photos';
import {
  CATEGORIES,
  CardGate,
  GoodsAlert,
  GoodsCategory,
  MERCH,
  MERCH_GROUPS,
  MILESTONES,
  Merch,
  Milestone,
  MilestoneProgress,
  OFFICIAL_SHOP,
  OFFICIAL_SHOP_NAME,
  PHOTOCARDS,
  PHOTOCARD_WINDOW_DAYS,
  PhotoCard,
  Uniform,
  UNIFORMS,
  countdown,
  firstAvailableSize,
  formatDate,
  formatDateTime,
  formatKstDate,
  gameKey,
  gateBadge,
  gateReason,
  goodsAlerts,
  milestoneProgress,
  photocardCloseAt,
  photocardGate,
  sizeSoldOut,
  stockLabel,
  stockTone,
} from '../goods';
import { ATTENDANCE, attendanceSummary, membershipOf } from '../my';
import { UserProfile } from '../profile';
import { colors, keepAll, radius, spacing, tabularFigures, typography } from '../theme';

/** 시연 기준 시각 - Date.now() 를 쓰면 실행할 때마다 카운트다운이 달라진다 */
const DEMO_NOW = Date.parse('2026-08-11T15:00:00+09:00');

const shop = () => void Linking.openURL(OFFICIAL_SHOP);

/** 어떤 갈래의 무엇을 펼쳐 놓았는가. 상세가 셋이라 열쇠를 하나로 묶는다 */
type Sheet =
  | { kind: 'card'; id: string }
  | { kind: 'milestone'; id: string }
  | { kind: 'uniform'; id: string };

/** 격자 타일의 픽토그램. TabBar 와 같은 규칙 - 24 격자 · 굵기 1.75 · 색은 밖에서 온다 */
const SECTION_ICONS: Record<GoodsCategory, FC<SvgProps>> = {
  venue: PhotocardIcon,
  milestone: TrophyIcon,
  uniform: JerseyIcon,
  merch: GridIcon,
};

export function StoreScreen({ profile }: { profile: UserProfile }) {
  /** null 이면 격자(굿즈 홈), 값이 있으면 그 갈래 안이다 */
  const [section, setSection] = useState<GoodsCategory | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  /**
   * 구장 입장 인증.
   *
   * 실서비스에서는 티켓 QR 과 구장 위치가 이 값을 세운다. 시연에서는 버튼 하나로
   * 대신하되, **인증 전 화면을 먼저 보여준다** - 잠긴 상태가 이 갈래의 규칙이다.
   */
  const [checkedIn, setCheckedIn] = useState(false);
  const [bought, setBought] = useState<Record<string, boolean>>({});
  const [reserved, setReserved] = useState<Record<string, boolean>>({});
  const [alerts, setAlerts] = useState<Record<string, boolean>>({});
  const [size, setSize] = useState<string | null>(null);

  const notices = useMemo(
    () => goodsAlerts(DEMO_NOW, profile.favoritePlayerId),
    [profile.favoritePlayerId],
  );

  const openUniform = (u: Uniform) => {
    setSize(firstAvailableSize(u));
    setSheet({ kind: 'uniform', id: u.id });
  };

  /** 알림 → 해당 갈래로 들어가고 그 항목을 펼친다. 갈래만 열면 다시 찾게 만든다 */
  const jump = (a: GoodsAlert) => {
    setSection(a.category);
    if (a.category === 'venue') setSheet({ kind: 'card', id: a.targetId });
    else if (a.category === 'milestone') setSheet({ kind: 'milestone', id: a.targetId });
    else if (a.category === 'uniform') {
      const u = UNIFORMS.find((x) => x.id === a.targetId);
      if (u) openUniform(u);
    }
  };

  const here = section ? (CATEGORIES.find((c) => c.key === section) ?? null) : null;

  return (
    <>
      {/* 나가는 길은 스크롤 밖에 - 목록을 끝까지 훑고도 같은 자리에 있어야 한다 */}
      {here ? <SubNav label={here.label} onBack={() => setSection(null)} /> : null}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.screenX,
          paddingBottom: spacing.scrollBottom,
        }}
      >
        {here ? (
          <Text style={st.subBlurb}>{here.blurb}</Text>
        ) : (
          <>
            {/* 알림은 격자 위에 둔다. 갈래 안으로 들어가면 그 갈래 이야기만 남는다 */}
            {profile.alerts.goodsDrop && notices.length > 0 ? (
              <>
                <SectionTitle title="놓치기 전에" />
                <GroupCard>
                  {notices.map((a, i) => (
                    <Row
                      key={a.id}
                      last={i === notices.length - 1}
                      style={st.alertRow}
                      onPress={() => jump(a)}
                    >
                      <View style={{ flex: 1, gap: 5 }}>
                        <Badge text={a.badge} tone={a.tone} />
                        <Text style={st.alertText}>{a.message}</Text>
                        <Text style={st.alertNote}>{a.note}</Text>
                      </View>
                      <Text style={st.chevron}>›</Text>
                    </Row>
                  ))}
                </GroupCard>
              </>
            ) : null}

            {/* 머리글을 달지 않는다. 여기는 굿즈 탭이고 타일마다 이름이 붙어 있으니
                "굿즈"라고 한 번 더 쓰면 그 줄이 통째로 되풀이가 된다 */}
            <SectionGrid onEnter={setSection} />
          </>
        )}

        {section === 'venue' ? (
          <VenueTab
            checkedIn={checkedIn}
            bought={bought}
            onCheckIn={() => setCheckedIn(true)}
            onOpen={(c) => setSheet({ kind: 'card', id: c.id })}
          />
        ) : null}
        {section === 'milestone' ? (
          <MilestoneTab
            reserved={reserved}
            onOpen={(m) => setSheet({ kind: 'milestone', id: m.id })}
          />
        ) : null}
        {section === 'uniform' ? <UniformTab onOpen={openUniform} /> : null}
        {section === 'merch' ? <MerchTab /> : null}
      </ScrollView>

      <CardSheet
        card={sheet?.kind === 'card' ? (PHOTOCARDS.find((c) => c.id === sheet.id) ?? null) : null}
        checkedIn={checkedIn}
        bought={bought}
        onCheckIn={() => setCheckedIn(true)}
        onBuy={(id) => setBought((b) => ({ ...b, [id]: true }))}
        onClose={() => setSheet(null)}
      />

      <MilestoneSheet
        milestone={
          sheet?.kind === 'milestone' ? (MILESTONES.find((m) => m.id === sheet.id) ?? null) : null
        }
        reserved={reserved}
        alerted={alerts}
        onReserve={(id) => setReserved((r) => ({ ...r, [id]: true }))}
        onToggleAlert={(id) => setAlerts((a) => ({ ...a, [id]: !a[id] }))}
        onClose={() => setSheet(null)}
      />

      <UniformSheet
        uniform={
          sheet?.kind === 'uniform' ? (UNIFORMS.find((u) => u.id === sheet.id) ?? null) : null
        }
        size={size}
        alerted={alerts}
        onSize={setSize}
        onToggleAlert={(id) => setAlerts((a) => ({ ...a, [id]: !a[id] }))}
        onClose={() => setSheet(null)}
      />
    </>
  );
}

// ═════════════════════════════════════════════════════════════
// 굿즈 홈 - 2×2 격자
// ═════════════════════════════════════════════════════════════

/**
 * 갈래로 들어가는 격자.
 *
 * 한 줄에 둘씩 두 줄. 타일 안은 **왼쪽에 아이콘, 오른쪽에 이름**이다 - 세로로 쌓으면
 * 아이콘이 주인공이 되는데, 정작 눌러야 할 것은 이름이다. 아이콘은 갈래를 글자보다
 * 먼저 가르는 이름표지 그림이 아니므로, 틴트 면에 앉히지 않고 획만 남긴다.
 *
 * ⚠ **타일에는 이름 말고 아무것도 두지 않는다.** 현황 한 줄("오늘 경기 카드 발행 중")을
 * 달아 봤더니 네 칸에 각각 다른 색 글이 붙어 **격자가 목록처럼 읽혔다.** 이 격자는 읽는
 * 자리가 아니라 고르는 자리다. 급한 소식은 바로 위 '놓치기 전에'가 이미 맡고 있다.
 */
function SectionGrid({ onEnter }: { onEnter: (c: GoodsCategory) => void }) {
  return (
    <View style={st.sectionGrid}>
      {CATEGORIES.map((c) => {
        const Icon = SECTION_ICONS[c.key];
        return (
          <Pressable
            key={c.key}
            onPress={() => onEnter(c.key)}
            style={({ pressed }) => [st.sectionSlot, pressed && st.sectionPressed]}
            accessibilityRole="button"
            accessibilityLabel={c.label}
          >
            <View style={st.sectionTile}>
              <Icon width={26} height={26} color={colors.brandText} />
              <Text style={[st.sectionName, keepAll]} numberOfLines={2}>
                {c.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * 갈래 안의 내비게이션 바.
 *
 * 격자에서 눌러 들어온 자리라 **돌아갈 길**이 반드시 보여야 한다. 하단 탭을 다시 눌러도
 * 여기서 빠져나가지 못한다 - 같은 탭 안이기 때문이다.
 *
 * ⚠ **스크롤 밖에 둔다.** 안에 넣으면 기타 굿즈 열다섯 칸을 훑어 내려간 팬이 돌아가려고
 * 다시 맨 위까지 올려야 한다. 나가는 길은 늘 같은 자리에 있어야 한다.
 *
 * 밑줄(헤어라인)을 긋지 않는다. 바로 위 브랜드 바가 이미 하나를 갖고 있어서, 여기에
 * 하나를 더 그으면 헤더가 두 겹으로 보이고 크롬이 어디서 끝나는지가 흐려진다.
 */
function SubNav({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <View style={st.navBar}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [st.backBtn, pressed && st.sectionPressed]}
        accessibilityRole="button"
        accessibilityLabel="굿즈 전체로 돌아가기"
      >
        <Text style={st.backChevron}>‹</Text>
      </Pressable>
      <Text style={st.navTitle} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════
// ① 오프라인 한정
// ═════════════════════════════════════════════════════════════

function VenueTab({
  checkedIn,
  bought,
  onCheckIn,
  onOpen,
}: {
  checkedIn: boolean;
  bought: Record<string, boolean>;
  onCheckIn: () => void;
  onOpen: (c: PhotoCard) => void;
}) {
  const gated = PHOTOCARDS.map((c) => ({ card: c, gate: photocardGate(c, DEMO_NOW) }));
  const today = gated.filter((g) => g.gate === 'pending');
  const buyable = gated.filter((g) => g.gate === 'open');
  const past = gated.filter((g) => g.gate !== 'pending' && g.gate !== 'open');

  return (
    <View style={{ gap: spacing.sm }}>
      {/* 인증 - 이 갈래의 자물쇠. 화면 맨 위에 있어야 아래 카드들이 왜 그런지 설명된다 */}
      <Card>
        <CardHeading
          label="오늘 경기"
          title="대전 한화생명 볼파크"
          right={
            checkedIn ? (
              <Badge text="입장 확인됨" tone="win" />
            ) : (
              <Badge text="미인증" tone="muted" />
            )
          }
        />
        <Text style={st.body}>
          {checkedIn
            ? '오늘 경기 입장이 확인되었습니다. 오늘의 카드를 선점할 수 있습니다.'
            : '오늘의 카드는 경기장에 온 분만 살 수 있습니다. 입장 게이트에서 찍은 티켓과 현재 위치로 확인합니다.'}
        </Text>
        {checkedIn ? null : <Button label="구장에서 입장 인증" onPress={onCheckIn} full />}
        <Text style={st.footNote}>
          지난 경기 카드는 인증이 필요 없습니다 - MY 탭의 직관 기록이 그날 자리를 대신 증명합니다.
        </Text>
      </Card>

      {today.length > 0 ? (
        <>
          <SectionTitle title="오늘의 카드" />
          <View style={{ gap: spacing.cardGap }}>
            {today.map((g) => (
              <PhotoCardItem
                key={g.card.id}
                card={g.card}
                gate={g.gate}
                checkedIn={checkedIn}
                bought={!!bought[g.card.id]}
                onPress={() => onOpen(g.card)}
              />
            ))}
          </View>
        </>
      ) : null}

      {buyable.length > 0 ? (
        <>
          <SectionTitle
            title="내가 간 경기"
            right={<Text style={st.countHint}>{buyable.length}경기</Text>}
          />
          {/* 지난 카드는 **장면으로 고른다.** 날짜만 적힌 목록에서는 어느 날이 어느
              날인지 팬도 기억하지 못한다 - 얼굴이 보이면 그날이 바로 떠오른다.
              서식은 유니폼 격자와 같다(gridStage 주석 참조) */}
          <View style={st.grid}>
            {buyable.map((g) => (
              <PhotoCardTile
                key={g.card.id}
                card={g.card}
                gate={g.gate}
                bought={!!bought[g.card.id]}
                onPress={() => onOpen(g.card)}
              />
            ))}
          </View>
        </>
      ) : null}

      {/* 살 수 없는 것도 지우지 않는다. 없으면 팬은 카드가 발행되지 않은 줄 안다 */}
      {past.length > 0 ? (
        <>
          <SectionTitle title="살 수 없는 카드" />
          <GroupCard>
            {past.map((g, i) => (
              <Row key={g.card.id} last={i === past.length - 1} onPress={() => onOpen(g.card)}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={st.lockedTitle}>
                    {gameKey(g.card)} {g.card.opponent}전
                  </Text>
                  <Text style={st.lockedWhy} numberOfLines={2}>
                    {gateReason(g.gate, g.card)}
                  </Text>
                </View>
                <Text style={st.chevron}>›</Text>
              </Row>
            ))}
          </GroupCard>
        </>
      ) : null}
    </View>
  );
}

function PhotoCardItem({
  card,
  gate,
  checkedIn,
  bought,
  onPress,
}: {
  card: PhotoCard;
  gate: CardGate;
  checkedIn: boolean;
  bought: boolean;
  onPress: () => void;
}) {
  const badge = bought
    ? { text: gate === 'pending' ? '선점 완료' : '구매 완료', tone: 'brand' as const }
    : gate === 'pending' && !checkedIn
      ? { text: '인증 필요', tone: 'warn' as const }
      : gateBadge(gate);
  const days = (photocardCloseAt(card) - DEMO_NOW) / 86400000;

  // 장면이 정해졌으면 그 선수를, 아직이면 그날의 구장을 띄운다.
  //
  // '오늘의 카드'는 이 갈래에서 유일하게 **아직 물건이 아닌 것**을 파는 자리다(경기가
  // 끝나야 도안이 확정된다). 그림이 없으면 그 사실이 글자로만 남아 카드가 통째로
  // 공지문처럼 읽혔다 - 구장 사진 한 장이 "오늘, 여기"를 글자보다 먼저 말한다.
  const shot = card.moment ? null : stadiumPhoto('대전');

  return (
    <Card onPress={onPress}>
      {card.moment ? (
        <View style={st.todayShot}>
          <PlayerShot playerId={card.moment.playerId} height={150} />
        </View>
      ) : shot ? (
        <View style={st.todayShot}>
          <PhotoHeader source={shot} height={150}>
            <Text style={st.todayShotText}>장면은 경기가 끝나면 정해집니다</Text>
          </PhotoHeader>
        </View>
      ) : null}

      <View style={st.cardHead}>
        {card.moment ? (
          <PlayerAvatar playerId={card.moment.playerId} team="HH" size={46} />
        ) : (
          <View style={st.emblemThumb}>
            <TeamEmblem team="HH" size={30} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <CardHeading
            label={
              card.result
                ? (card.result.win ? '승' : '패') + ` ${card.result.ours}:${card.result.theirs}`
                : '경기 중'
            }
            title={`${gameKey(card)} ${card.opponent}전`}
            right={<Badge text={badge.text} tone={badge.tone} />}
          />
        </View>
      </View>

      {card.moment ? (
        <View style={st.momentBox}>
          <Text style={st.momentName}>{card.moment.playerName}</Text>
          <Text style={st.momentLine}>{card.moment.line}</Text>
        </View>
      ) : (
        <Text style={st.body}>
          경기가 끝나면 그날의 장면으로 도안이 확정됩니다. 지금은 수량만 선점합니다.
        </Text>
      )}

      <Divider />

      <View style={st.cardFoot}>
        <Text style={st.price}>{card.price.toLocaleString()}원</Text>
        <Text style={st.footMeta}>
          {gate === 'pending'
            ? '경기 종료 후 발행'
            : gate === 'open'
              ? `${card.remain?.toLocaleString()}장 남음 · 마감 ${days < 1 ? `${Math.max(1, Math.round(days * 24))}시간` : `${Math.ceil(days)}일`} 전`
              : stockLabel('soldout')}
        </Text>
      </View>
    </Card>
  );
}

/**
 * 포토카드 타일 - '내가 간 경기' 격자 한 칸.
 *
 * 서식은 유니폼 타일과 같다. 굿즈 탭 안에서 갈래마다 타일 생김새가 다르면 팬은 그
 * 차이를 '무슨 뜻이 있나' 하고 읽는데, 여기엔 뜻이 없다.
 *
 * 그림 자리에는 **그날의 장면에 박힌 선수**를 둔다. 포토카드가 파는 것이 정확히
 * 그것이고, 사진이 없는 선수는 등번호 아바타로 떨어진다(PlayerShot).
 */
function PhotoCardTile({
  card,
  gate,
  bought,
  onPress,
}: {
  card: PhotoCard;
  gate: CardGate;
  bought: boolean;
  onPress: () => void;
}) {
  const days = (photocardCloseAt(card) - DEMO_NOW) / 86400000;
  const badge = bought ? { text: '구매 완료', tone: 'brand' as const } : null;
  const score = card.result
    ? `${card.result.win ? '승' : '패'} ${card.result.ours}:${card.result.theirs}`
    : '경기 중';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [st.tileSlot, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={`${gameKey(card)} ${card.opponent}전 포토카드 ${card.price.toLocaleString()}원`}
    >
      <View style={st.gridStage}>
        {card.moment ? (
          <PlayerShot playerId={card.moment.playerId} height={132} />
        ) : (
          <TeamEmblem team="HH" size={54} />
        )}
        {badge ? (
          <View style={st.gridBadge}>
            <Badge text={badge.text} tone={badge.tone} />
          </View>
        ) : null}
      </View>
      <Text style={st.gridKind} numberOfLines={1}>
        {gameKey(card)} {card.opponent}전 · {score}
      </Text>
      <Text style={st.gridName} numberOfLines={2}>
        {card.moment ? `${card.moment.playerName} · ${card.moment.line}` : '장면 확정 전'}
      </Text>
      <Text style={st.gridPrice}>{card.price.toLocaleString()}원</Text>
      <Text style={st.gridMeta} numberOfLines={1}>
        {gate === 'open'
          ? `${card.remain?.toLocaleString()}장 남음 · 마감 ${days < 1 ? `${Math.max(1, Math.round(days * 24))}시간` : `${Math.ceil(days)}일`} 전`
          : stockLabel('soldout')}
      </Text>
    </Pressable>
  );
}

function CardSheet({
  card,
  checkedIn,
  bought,
  onCheckIn,
  onBuy,
  onClose,
}: {
  card: PhotoCard | null;
  checkedIn: boolean;
  bought: Record<string, boolean>;
  onCheckIn: () => void;
  onBuy: (id: string) => void;
  onClose: () => void;
}) {
  const gate = card ? photocardGate(card, DEMO_NOW) : null;
  const done = !!card && !!bought[card.id];
  const days = card ? (photocardCloseAt(card) - DEMO_NOW) / 86400000 : 0;

  return (
    <DetailSheet
      visible={!!card}
      title={card ? `${gameKey(card)} ${card.opponent}전 포토카드` : ''}
      subtitle={card?.stadium}
      onClose={onClose}
      actions={
        card && gate ? (
          done ? (
            <View style={{ flex: 1 }}>
              <Text style={st.doneNote}>
                {gate === 'pending'
                  ? '수량을 선점했습니다. 경기 종료 후 구장 MD샵에서 받으세요.'
                  : '구매가 접수되었습니다. 3~5일 안에 배송됩니다.'}
              </Text>
            </View>
          ) : gate === 'pending' ? (
            <View style={{ flex: 1 }}>
              <Button
                label={checkedIn ? '오늘 수량 선점' : '구장에서 입장 인증'}
                onPress={checkedIn ? () => onBuy(card.id) : onCheckIn}
                full
              />
            </View>
          ) : gate === 'open' ? (
            <View style={{ flex: 1 }}>
              <Button
                label={`${card.price.toLocaleString()}원 구매`}
                onPress={() => onBuy(card.id)}
                full
              />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <Text style={st.doneNote}>{gateReason(gate, card)}</Text>
            </View>
          )
        ) : null
      }
    >
      {card && gate ? (
        <>
          {/* 카드가 어떻게 생겼는지 - 물건이 안 보이면 팬은 사진을 찾으러 앱을 나간다 */}
          <PhotoCardPreview card={card} />

          <View style={{ marginTop: spacing.cardGap }}>
            <Card>
              <View style={st.gateHead}>
                <Badge text={gateBadge(gate).text} tone={gateBadge(gate).tone} />
              </View>
              <Text style={st.body}>{gateReason(gate, card)}</Text>
              {gate === 'pending' && !checkedIn ? (
                <Text style={st.footNote}>입장 인증은 게이트를 지날 때 자동으로 됩니다.</Text>
              ) : null}
            </Card>
          </View>

          <View style={{ marginTop: spacing.cardGap }}>
            <GroupCard style={{ paddingHorizontal: spacing.cardPad }}>
              <InfoRow label="경기" value={`${formatDate(card.gameAt)} · ${card.opponent}전`} />
              {card.result ? (
                <InfoRow
                  label="결과"
                  value={`${card.result.ours}:${card.result.theirs} ${card.result.win ? '승' : '패'}`}
                />
              ) : null}
              <InfoRow label="가격" value={`${card.price.toLocaleString()}원`} />
              {card.issued ? (
                <InfoRow
                  label="발행"
                  value={`${card.issued.toLocaleString()}장 · ${(card.remain ?? 0).toLocaleString()}장 남음`}
                />
              ) : (
                <InfoRow label="발행" value="경기 종료 후 확정" />
              )}
              <InfoRow
                label="판매 마감"
                value={
                  gate === 'closed'
                    ? `${formatKstDate(photocardCloseAt(card))} · 종료`
                    : `${formatKstDate(photocardCloseAt(card))} (D-${Math.max(0, Math.ceil(days))})`
                }
              />
              <InfoRow
                label="수령"
                value={gate === 'pending' ? '경기 종료 후 구장 MD샵' : '택배 배송 (3~5일)'}
                last
              />
            </GroupCard>
          </View>

          <Text style={st.footNote}>
            그날 경기장에 있었던 분만 살 수 있습니다. 판매는 경기 후 {PHOTOCARD_WINDOW_DAYS}일
            동안만 열립니다.
          </Text>
        </>
      ) : null}
    </DetailSheet>
  );
}

/**
 * 포토카드 미리보기.
 *
 * 회전 전시(GoodsShowcase)를 쓰지 않는다 - 저건 입체물을 돌려 보는 장치고 카드는 평면이다.
 * 카드의 형태(세로 비율 · 오렌지 머리띠 · 아래쪽 장면 글자)를 그대로 세워 두는 편이
 * 실물을 더 정확히 말한다.
 */
function PhotoCardPreview({ card }: { card: PhotoCard }) {
  return (
    <View style={st.preview}>
      <View style={st.previewCard}>
        <View style={st.previewTop}>
          <Text style={st.previewDate}>
            {gameKey(card)} vs {card.opponent}
          </Text>
        </View>
        <View style={st.previewBody}>
          {card.moment ? (
            <PlayerAvatar playerId={card.moment.playerId} team="HH" size={76} />
          ) : (
            <TeamEmblem team="HH" size={54} />
          )}
          <Text style={st.previewName}>{card.moment?.playerName ?? '도안 확정 전'}</Text>
          <Text style={st.previewLine} numberOfLines={2}>
            {card.moment?.line ?? '경기 종료 후 그날의 장면이 들어갑니다'}
          </Text>
        </View>
      </View>
      <Text style={st.previewHint}>실물 카드 시안</Text>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════
// ② 특별 MD
// ═════════════════════════════════════════════════════════════

function MilestoneTab({
  reserved,
  onOpen,
}: {
  reserved: Record<string, boolean>;
  onOpen: (m: Milestone) => void;
}) {
  return (
    <View style={{ gap: spacing.cardGap }}>
      {MILESTONES.map((m) => {
        const p = milestoneProgress(m, DEMO_NOW);
        const mine = !!reserved[m.id];
        const badge = mine
          ? { text: '예약함', tone: 'brand' as const }
          : p.reserveOpen
            ? p.reserveRatio >= 0.9
              ? { text: '예약 마감 임박', tone: 'warn' as const }
              : { text: '예약 중', tone: 'win' as const }
            : { text: '예약 대기', tone: 'muted' as const };

        return (
          <Card key={m.id} onPress={() => onOpen(m)}>
            <View style={st.cardHead}>
              <PlayerAvatar playerId={m.playerId} team="HH" size={46} />
              <View style={{ flex: 1 }}>
                <CardHeading
                  label={m.playerName}
                  title={m.title}
                  right={<Badge text={badge.text} tone={badge.tone} />}
                />
              </View>
            </View>

            {/* 목록에서는 '얼마나 왔나'만. '언제 열리나'는 상세의 확대 막대가 맡는다 */}
            <View style={{ gap: 6 }}>
              <View style={st.progressHead}>
                <Text style={st.progressNow}>
                  {m.current.toLocaleString()}
                  <Text style={st.progressTarget}> / {m.target.toLocaleString()}</Text>
                </Text>
                <Text style={st.progressPct}>{Math.round(p.ratio * 100)}%</Text>
              </View>
              <View style={st.track}>
                <View style={[st.fill, { width: `${p.ratio * 100}%` }]} />
              </View>
            </View>

            <Divider />

            <View style={st.cardFoot}>
              <Text style={st.remainText}>
                {p.remain}
                {m.unit} 남음
              </Text>
              <Text style={st.footMeta}>{p.eta}</Text>
            </View>
          </Card>
        );
      })}

      <Text style={st.footNote}>
        기록은 날짜로 오지 않습니다. 그래서 예약도 날짜가 아니라 남은 개수로 엽니다 - 기준은
        지표마다 다릅니다.
      </Text>
    </View>
  );
}

function MilestoneSheet({
  milestone: m,
  reserved,
  alerted,
  onReserve,
  onToggleAlert,
  onClose,
}: {
  milestone: Milestone | null;
  reserved: Record<string, boolean>;
  alerted: Record<string, boolean>;
  onReserve: (id: string) => void;
  onToggleAlert: (id: string) => void;
  onClose: () => void;
}) {
  const p = m ? milestoneProgress(m, DEMO_NOW) : null;
  const mine = !!m && !!reserved[m.id];

  return (
    <DetailSheet
      visible={!!m}
      title={m ? `${m.playerName} ${m.title}` : ''}
      subtitle={m ? `기념 MD · ${p?.reserveOpen ? '예약 중' : '예약 대기'}` : ''}
      onClose={onClose}
      actions={
        m && p ? (
          mine ? (
            <View style={{ flex: 1 }}>
              <Text style={st.doneNote}>
                예약되었습니다. 달성 순간 알림이 가고, 다음 날부터 순차 발송됩니다.
              </Text>
            </View>
          ) : (
            <>
              <AlertToggle
                compact
                on={!!alerted[m.id]}
                onPress={() => onToggleAlert(m.id)}
                label="달성 알림"
              />
              <View style={{ flex: 1.4 }}>
                <Button
                  label={p.reserveOpen ? '예약 구매' : `${p.toReserve}${m.unit} 뒤 예약`}
                  onPress={() => onReserve(m.id)}
                  disabled={!p.reserveOpen}
                  full
                />
              </View>
            </>
          )
        ) : null
      }
    >
      {m && p ? (
        <>
          <Card>
            <View style={st.sheetHeadRow}>
              <PlayerAvatar playerId={m.playerId} team="HH" size={54} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={st.etaLine}>
                  {p.remain}
                  {m.unit} 남음 · {p.eta}
                </Text>
                <Text style={st.body}>{m.story}</Text>
              </View>
            </View>
          </Card>

          <View style={{ marginTop: spacing.cardGap }}>
            <SectionTitle title="진행" />
            <Card>
              <MilestoneChart m={m} p={p} />
            </Card>
          </View>

          <View style={{ marginTop: spacing.cardGap }}>
            <SectionTitle title="예약" />
            <Card>
              {p.reserveOpen ? (
                <>
                  <View style={st.progressHead}>
                    <Label>예약 접수</Label>
                    <Text style={st.reserveCount}>
                      {m.reserved.toLocaleString()}
                      <Text style={st.progressTarget}> / {m.reserveLimit.toLocaleString()}</Text>
                    </Text>
                  </View>
                  <View style={st.track}>
                    <View
                      style={[
                        st.fill,
                        { width: `${p.reserveRatio * 100}%` },
                        p.reserveRatio >= 0.9 && { backgroundColor: colors.warn },
                      ]}
                    />
                  </View>
                  <Text style={st.body}>
                    {p.reserveRatio >= 0.9
                      ? `예약 수량이 ${(m.reserveLimit - m.reserved).toLocaleString()}개 남았습니다. 달성 전에 마감될 수 있습니다.`
                      : '달성 순간 발매되며, 예약분이 먼저 나갑니다. 미달성 시 전액 환불됩니다.'}
                  </Text>
                </>
              ) : (
                <>
                  <Label>아직 열리지 않았습니다</Label>
                  <Text style={st.body}>
                    {`${m.target - m.reserveFrom}${m.unit}(앞으로 ${p.toReserve}${m.unit})을 넘기면 예약이 열립니다. ` +
                      '너무 일찍 받으면 구단이 재고를 떠안고, 너무 늦게 열면 팬이 놓칩니다.'}
                  </Text>
                  <AlertToggle
                    on={!!alerted[m.id]}
                    onPress={() => onToggleAlert(m.id)}
                    label="예약 열리면 알림"
                    caption={`${p.toReserve}${m.unit}을 더 기록하는 순간 알려 드립니다`}
                  />
                </>
              )}
            </Card>
          </View>

          {m.items.length > 0 ? (
            <View style={{ marginTop: spacing.cardGap }}>
              <SectionTitle title="구성" />
              <GroupCard style={{ paddingHorizontal: spacing.cardPad }}>
                {m.items.map((it, i) => (
                  <View key={it.name} style={[st.itemRow, i < m.items.length - 1 && st.divider]}>
                    <View style={{ flex: 1 }}>
                      <Text style={st.itemName}>{it.name}</Text>
                      {it.limit ? (
                        <Text style={st.itemLimit}>한정 {it.limit.toLocaleString()}개</Text>
                      ) : null}
                    </View>
                    <Text style={st.itemPrice}>{it.price.toLocaleString()}원</Text>
                  </View>
                ))}
              </GroupCard>
            </View>
          ) : (
            <View style={{ marginTop: spacing.cardGap }}>
              <Card>
                <Label>구성</Label>
                <Text style={st.body}>달성이 가까워지면 공개합니다.</Text>
              </Card>
            </View>
          )}

          <Text style={st.footNote}>
            결제는 {OFFICIAL_SHOP_NAME}에서 이루어집니다. 앱은 예약 접수까지만 맡습니다.
          </Text>
        </>
      ) : null}
    </DetailSheet>
  );
}

/**
 * 기록 진행 그래프.
 *
 * ── 왜 전체 막대로는 안 되는가 ───────────────────────────────
 * 통산 기록은 진행률이 늘 95% 를 넘는다. 1487/1500 은 99.1%, 1490/1500 은 99.3% 라
 * 화면에서 **같은 그림**이 된다. 목록 카드의 전체 막대는 "거의 다 왔다"까지만 말하고,
 * 정작 이 화면이 답해야 할 "예약이 열렸나"는 아무 말도 못 한다.
 *
 * 그래서 상세에서는 **목표 직전 구간만 잘라 그린다.** 구간 폭은 남은 개수와 예약
 * 임계값에서 나오므로(goods.ts 의 zoom), 6홈런 남은 사람과 58안타 남은 사람이 각자
 * 자기 눈금으로 읽힌다. 임계선을 같은 막대 위에 세우면 **예약이 열렸는지가 위치로**
 * 읽힌다 - 숫자를 비교하지 않아도 된다.
 */
function MilestoneChart({ m, p }: { m: Milestone; p: MilestoneProgress }) {
  const zoomStart = Math.round(m.target - p.zoom);
  const threshold = m.target - m.reserveFrom;
  const maxSeason = Math.max(...m.recentSeasons.map((s) => s.count), 1);

  return (
    <View style={{ gap: spacing.lg }}>
      {/* 큰 수치 - 그래프가 아니라 이게 먼저 읽혀야 한다 */}
      <View style={st.chartHead}>
        <View>
          <Label>통산</Label>
          <Text style={st.chartValue}>
            {m.current.toLocaleString()}
            <Text style={st.chartUnit}> {m.unit}</Text>
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Label>목표까지</Label>
          <Text style={[st.chartValue, { color: colors.brandText }]}>
            {p.remain}
            <Text style={st.chartUnit}> {m.unit}</Text>
          </Text>
        </View>
      </View>

      {/* 확대 막대 - 목표 직전 구간만 */}
      <View style={{ gap: 6 }}>
        <View style={st.axisRow}>
          <Text style={st.axisText}>{zoomStart.toLocaleString()}</Text>
          <Text style={st.axisText}>목표 {m.target.toLocaleString()}</Text>
        </View>
        <View style={st.zoomTrack}>
          <View style={[st.zoomFill, { width: `${p.zoomPos * 100}%` }]} />
          <View style={[st.threshold, { left: `${p.zoomThreshold * 100}%` }]} />
        </View>
        <View style={st.legendRow}>
          <View style={st.legendMark} />
          <Text style={st.legendText}>
            {threshold.toLocaleString()}
            {m.unit}부터 예약{' '}
            {p.reserveOpen ? '· 지금 열려 있습니다' : `· ${p.toReserve}${m.unit} 남음`}
          </Text>
        </View>
      </View>

      {/* 남은 개수를 셀 수 있게. 6개는 세어지고 58개는 세어지지 않으므로 조건부다 */}
      {p.remain <= 15 ? (
        <View style={{ gap: 6 }}>
          <Label>앞으로</Label>
          <View style={st.dotRow}>
            {Array.from({ length: p.remain }, (_, i) => (
              <View key={i} style={st.dot} />
            ))}
          </View>
        </View>
      ) : null}

      {/* 페이스 - '언제 달성'이라는 예측의 근거. 근거 없이 날짜만 말하면 점집이다 */}
      <View style={{ gap: spacing.sm }}>
        <Label>최근 시즌 {m.unit}</Label>
        <View style={st.seasonRow}>
          {m.recentSeasons.map((s, i) => {
            const last = i === m.recentSeasons.length - 1;
            return (
              <View key={s.year} style={st.seasonCol}>
                <Text style={[st.seasonCount, last && st.seasonCountOn]}>{s.count}</Text>
                <View style={st.seasonBarBox}>
                  <View
                    style={[
                      st.seasonBar,
                      { height: Math.max(3, (s.count / maxSeason) * 56) },
                      last && st.seasonBarOn,
                    ]}
                  />
                </View>
                <Text style={st.seasonYear}>{`'${String(s.year).slice(2)}`}</Text>
              </View>
            );
          })}
        </View>
        <Text style={st.footNote}>
          올 시즌 {m.seasonApps}
          {m.appUnit} {m.seasonCount}
          {m.unit} 페이스. 남은 {p.remain}
          {m.unit}에 {p.appsNeeded === Infinity ? '—' : p.appsNeeded}
          {m.appUnit}가 필요하고, 잔여 {m.appsLeft}
          {m.appUnit}
          {p.withinSeason ? ' 안에 들어옵니다.' : ' 로는 모자랍니다.'}
        </Text>
      </View>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════
// ③ 유니폼
// ═════════════════════════════════════════════════════════════

/**
 * 유니폼 카탈로그.
 *
 * ── 왜 카드 목록이 아니라 타일 격자인가 ─────────────────────
 * 전에는 세로로 긴 카드 여섯 장이었다. 카드마다 사양(어센틱·홈 경기)·설명 두 줄·
 * 가격·재고가 다 들어 있어 **한 화면에 한 벌 반**밖에 안 보였다. 그런데 유니폼을
 * 고르는 일은 읽는 일이 아니라 **비교하는 일**이다. 홈과 원정과 얼트를 나란히 놓고
 * 색을 견주는 것이 첫 단계인데, 세로 카드는 그 나란히를 못 만든다.
 *
 * 그래서 커머스의 기본형으로 돌아간다 - 두 칸 격자, 그림이 위, 글자는 그림 아래
 * 최소한만. 한 화면에 네 벌이 들어오고 색이 곧바로 비교된다.
 *
 * 격자에 남기는 글자는 **사양 · 이름 · 가격** 셋뿐이다. 설명 문장과 사이즈 재고는
 * 상세로 내렸다 - 고르기 전에는 필요 없고, 타일에 들어가면 그림을 밀어낸다.
 */
function UniformTab({ onOpen }: { onOpen: (u: Uniform) => void }) {
  return (
    <View style={{ gap: spacing.cardGap }}>
      <View style={st.grid}>
        {UNIFORMS.map((u) => (
          <UniformTile key={u.id} u={u} onOpen={onOpen} />
        ))}
      </View>

      <ExternalButton
        label={`${OFFICIAL_SHOP_NAME}에서 전체 보기`}
        sub="결제는 공식몰에서 이루어집니다."
        onPress={shop}
      />
    </View>
  );
}

/**
 * 유니폼 타일.
 *
 * 배지는 **판매 중이 아닐 때만** 붙는다(MerchTile 과 같은 규칙). 전부에 붙이면 그
 * 줄이 상품보다 먼저 읽혀 카탈로그가 상태 목록이 된다.
 */
function UniformTile({ u, onOpen }: { u: Uniform; onOpen: (u: Uniform) => void }) {
  const out = u.soldOutSizes ?? [];
  const badge = u.status !== 'onsale' ? stockLabel(u.status) : null;
  // 발매 전이면 남은 시간이, 판매 중이면 사이즈 사정이 팬이 다음에 물을 것이다
  const meta =
    u.status === 'upcoming'
      ? (countdown(u.openAt ?? '', DEMO_NOW) ?? '곧 발매')
      : out.length > 0
        ? `${out.join('·')} 품절`
        : '전 사이즈 보유';

  return (
    <Pressable
      onPress={() => onOpen(u)}
      style={({ pressed }) => [st.tileSlot, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={`${u.name} ${u.price.toLocaleString()}원`}
    >
      {/* 그림 자리 - 타일 높이의 대부분을 여기에 준다. 커머스에서 글자가 그림보다
          많아지는 순간 그 화면은 카탈로그가 아니라 목록이 된다 */}
      <View style={st.gridStage}>
        <JerseyArt colorway={u.colorway} height={116} />
        {badge ? (
          <View style={st.gridBadge}>
            <Badge text={badge} tone={stockTone(u.status)} />
          </View>
        ) : null}
      </View>
      <Text style={st.gridKind} numberOfLines={1}>
        {u.kind} · {u.wear}
      </Text>
      <Text style={st.gridName} numberOfLines={2}>
        {u.name}
      </Text>
      <Text style={st.gridPrice}>{u.price.toLocaleString()}원</Text>
      <Text style={st.gridMeta} numberOfLines={1}>
        {meta}
      </Text>
    </Pressable>
  );
}

function UniformSheet({
  uniform: u,
  size,
  alerted,
  onSize,
  onToggleAlert,
  onClose,
}: {
  uniform: Uniform | null;
  size: string | null;
  alerted: Record<string, boolean>;
  onSize: (s: string) => void;
  onToggleAlert: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <DetailSheet
      visible={!!u}
      title={u?.name ?? ''}
      subtitle={u ? `${u.kind} · ${stockLabel(u.status)}` : ''}
      onClose={onClose}
      actions={
        u ? (
          u.status === 'upcoming' ? (
            <>
              <AlertToggle compact on={!!alerted[u.id]} onPress={() => onToggleAlert(u.id)} />
              <View style={{ flex: 1.4 }}>
                <ExternalButton label="공식몰 보기" onPress={shop} />
              </View>
            </>
          ) : (
            <View style={{ flex: 1 }}>
              <ExternalButton label="공식몰에서 구매" onPress={shop} />
            </View>
          )
        ) : null
      }
    >
      {u ? (
        <>
          <GoodsShowcase kind="emblem" />

          <View style={{ marginTop: spacing.cardGap }}>
            <Card>
              {u.status === 'upcoming' && u.openAt ? (
                <Text style={st.etaLine}>{countdown(u.openAt, DEMO_NOW) ?? '발매되었습니다'}</Text>
              ) : null}
              <Text style={st.body}>{u.note}</Text>
            </Card>
          </View>

          {/* 사이즈 - 공식몰에 가서야 품절을 알게 되면 앱이 헛걸음시킨 것이다 */}
          <View style={{ marginTop: spacing.cardGap }}>
            <SectionTitle title="사이즈" />
            <View style={st.sizeRow}>
              {u.sizes.map((sz) => (
                <Chip
                  key={sz}
                  label={sz}
                  selected={size === sz}
                  disabled={sizeSoldOut(u, sz)}
                  onPress={() => onSize(sz)}
                />
              ))}
            </View>
            <Text style={st.footNote}>
              {(u.soldOutSizes ?? []).length > 0
                ? `${(u.soldOutSizes ?? []).join('·')} 는 품절입니다. 선택한 사이즈는 공식몰로 넘어갈 때 함께 전달됩니다.`
                : '선택한 사이즈는 공식몰로 넘어갈 때 함께 전달됩니다.'}
            </Text>
          </View>

          <View style={{ marginTop: spacing.cardGap }}>
            <GroupCard style={{ paddingHorizontal: spacing.cardPad }}>
              <InfoRow label="종류" value={u.kind} />
              <InfoRow label="착용" value={u.wear} />
              <InfoRow label="가격" value={`${u.price.toLocaleString()}원`} />
              {u.marking ? <InfoRow label="마킹" value={u.marking} /> : null}
              {u.openAt ? <InfoRow label="발매" value={formatDateTime(u.openAt)} /> : null}
              <InfoRow label="판매처" value={OFFICIAL_SHOP_NAME} last />
            </GroupCard>
          </View>
        </>
      ) : null}
    </DetailSheet>
  );
}

// ═════════════════════════════════════════════════════════════
// ④ 기타 굿즈
// ═════════════════════════════════════════════════════════════

function MerchTab() {
  return (
    <View>
      {MERCH_GROUPS.map((g) => {
        const items = MERCH.filter((m) => m.group === g);
        if (items.length === 0) return null;
        return (
          <View key={g}>
            <SectionTitle title={g} />
            <View style={st.grid}>
              {items.map((m) => (
                <MerchTile key={m.id} item={m} />
              ))}
            </View>
          </View>
        );
      })}

      <View style={{ marginTop: spacing.xl }}>
        <ExternalButton
          label={`${OFFICIAL_SHOP_NAME}에서 전체 보기`}
          sub="상품을 누르면 공식몰의 해당 상품으로 이동합니다."
          onPress={shop}
        />
      </View>
    </View>
  );
}

/**
 * 상품 타일.
 *
 * 배지는 **판매 중이 아닐 때만** 붙는다. 전부에 붙이면 그 줄이 상품 이름보다 먼저 읽혀
 * 카탈로그가 상태 목록이 된다. 구장 한정 상품은 누를 곳이 없다 - 공식몰에 가도 없는
 * 물건을 링크로 걸면 그게 헛걸음이다.
 */
function MerchTile({ item }: { item: Merch }) {
  const badge = item.venueOnly
    ? { text: '구장 MD샵 한정', tone: 'brand' as const }
    : item.status !== 'onsale'
      ? { text: stockLabel(item.status), tone: stockTone(item.status) }
      : null;

  const body = (
    <View style={st.tile}>
      <View style={st.tileTop}>{badge ? <Badge text={badge.text} tone={badge.tone} /> : null}</View>
      <Text style={st.tileName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={st.tilePrice}>{item.price.toLocaleString()}원</Text>
    </View>
  );

  if (item.venueOnly) return <View style={st.tileSlot}>{body}</View>;
  return (
    <Pressable
      onPress={shop}
      style={({ pressed }) => [st.tileSlot, pressed && { opacity: 0.6 }]}
      accessibilityRole="link"
      accessibilityLabel={`${item.name} - 공식몰에서 보기`}
    >
      {body}
    </Pressable>
  );
}

const st = StyleSheet.create({
  alertRow: { alignItems: 'flex-start', paddingVertical: spacing.lg },
  alertText: { ...typography.bodyStrong, lineHeight: 21 },
  alertNote: typography.caption,
  chevron: { fontSize: 18, color: colors.mutedText },

  // ── 굿즈 홈 격자 ───────────────────────────────────────────
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.cardGap,
    // 머리글이 없으므로 그 머리글이 만들던 간격을 여기서 낸다
    marginTop: spacing.sectionTop,
  },
  // 두 칸 고정. 늘어나게 두면 홀수로 남은 타일만 폭이 두 배가 된다
  sectionSlot: { flexBasis: '48%', maxWidth: '48%' },
  sectionPressed: { opacity: 0.6 },
  sectionTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 76,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.card,
  },
  /**
   * 이름이 타일의 전부다.
   *
   * ⚠ **두 줄까지 접힌다.** "오프라인 한정"은 17pt 에서 104px 인데 좁은 기기(360)에서는
   *   쓸 폭이 100px 이 안 된다. 말줄임으로 자르면 갈래 이름이 반쪽이 되므로 접는 쪽을 택했다
   *   (`keepAll` 이 붙어 있어 웹에서도 낱글자가 아니라 띄어쓰기에서 꺾인다).
   */
  sectionName: { ...typography.cardTitle, flex: 1, lineHeight: 22 },

  // ── 갈래 안의 내비게이션 바 ────────────────────────────────
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: spacing.touchMin,
    // 44 짜리 터치 상자 안에서 글리프가 가운데 서므로, 상자를 4 에서 시작해야
    // 꺾쇠의 왼쪽 끝이 아래 본문의 좌측 정렬선(screenX = 18)과 맞는다
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  // 손가락 최소 터치(44)를 정사각으로 확보한다. 글리프 하나만 두면 누를 데가 없다
  backBtn: {
    width: spacing.touchMin,
    height: spacing.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: { fontSize: 26, lineHeight: 30, color: colors.brandText, fontWeight: '600' },
  navTitle: { ...typography.cardTitle, flex: 1 },
  subBlurb: {
    ...typography.caption,
    lineHeight: 19,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.lg,
  },

  countHint: typography.micro,

  body: { ...typography.body, fontSize: 13.5, lineHeight: 21 },
  footNote: {
    ...typography.micro,
    fontWeight: '400',
    lineHeight: 17,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },

  cardHead: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  emblemThumb: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFoot: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  price: { ...typography.bodyStrong, ...tabularFigures, fontSize: 15 },
  footMeta: { ...typography.micro, ...tabularFigures, fontWeight: '600' },

  // ── 포토카드 ───────────────────────────────────────────────
  momentBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    padding: spacing.md,
    gap: 2,
  },
  momentName: { ...typography.bodyStrong, fontSize: 13.5 },
  momentLine: { ...typography.caption, lineHeight: 18 },

  lockedTitle: { ...typography.bodyStrong, fontSize: 13.5, color: colors.subText },
  lockedWhy: { ...typography.caption, lineHeight: 17 },

  gateHead: { flexDirection: 'row' },
  doneNote: { ...typography.caption, textAlign: 'center', lineHeight: 18 },

  preview: { alignItems: 'center', gap: spacing.sm },
  previewCard: {
    width: 168,
    borderRadius: radius.tile,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  previewTop: {
    backgroundColor: colors.brand,
    paddingVertical: 7,
    alignItems: 'center',
  },
  previewDate: { ...typography.micro, ...tabularFigures, color: colors.onBrand, fontWeight: '700' },
  previewBody: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  previewName: { ...typography.cardTitle, fontSize: 15 },
  previewLine: { ...typography.caption, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  previewHint: typography.micro,

  // ── 마일스톤 ───────────────────────────────────────────────
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  progressNow: { ...typography.bodyStrong, ...tabularFigures, fontSize: 16 },
  progressTarget: { ...typography.micro, color: colors.mutedText },
  progressPct: { ...typography.micro, ...tabularFigures, color: colors.brandText },
  reserveCount: { ...typography.bodyStrong, ...tabularFigures, fontSize: 15 },
  track: { height: 6, borderRadius: radius.bar, backgroundColor: colors.dim, overflow: 'hidden' },
  fill: { height: 6, borderRadius: radius.bar, backgroundColor: colors.brand },
  remainText: {
    ...typography.bodyStrong,
    ...tabularFigures,
    fontSize: 14,
    color: colors.brandText,
  },

  sheetHeadRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  etaLine: { ...typography.bodyStrong, color: colors.brandText, fontSize: 14 },

  chartHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  chartValue: { ...typography.metric, ...tabularFigures, fontSize: 28 },
  chartUnit: { ...typography.micro, color: colors.mutedText },

  axisRow: { flexDirection: 'row', justifyContent: 'space-between' },
  axisText: { ...typography.micro, ...tabularFigures, fontWeight: '400' },
  // 확대 막대는 목록의 전체 막대보다 두껍다 - 임계선을 얹어야 하고, 이 화면의 주인공이다
  zoomTrack: {
    height: 14,
    borderRadius: radius.bar,
    backgroundColor: colors.dim,
    overflow: 'hidden',
  },
  zoomFill: { height: 14, borderRadius: radius.bar, backgroundColor: colors.brand },
  threshold: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: colors.text },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendMark: { width: 2, height: 11, backgroundColor: colors.text },
  legendText: { ...typography.micro, fontWeight: '400' },

  dotRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.brand,
  },

  seasonRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  seasonCol: { flex: 1, alignItems: 'center', gap: 4 },
  seasonCount: { ...typography.micro, ...tabularFigures, fontWeight: '400' },
  seasonCountOn: { color: colors.brandText, fontWeight: '700' },
  seasonBarBox: { height: 56, justifyContent: 'flex-end' },
  seasonBar: {
    width: 18,
    borderRadius: 3,
    backgroundColor: colors.neutralFill,
  },
  seasonBarOn: { backgroundColor: colors.brand },
  seasonYear: { ...typography.micro, ...tabularFigures, fontWeight: '400', fontSize: 10 },

  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  // 등급 안내 - 카드가 아니라 지면 위 한 줄. 카드로 세우면 굿즈보다 먼저 읽힌다
  tierNote: { marginTop: spacing.cardGap },
  tierNoteText: { ...typography.caption, lineHeight: 18 },
  tierNoteStrong: { color: colors.brandText, fontWeight: '700' },

  itemName: { ...typography.caption, color: colors.text },
  itemLimit: { ...typography.micro, ...tabularFigures, fontWeight: '400', marginTop: 2 },
  itemPrice: { ...typography.bodyStrong, ...tabularFigures, fontSize: 13.5 },
  // 정가는 취소선으로 남긴다 - 지우면 얼마를 아꼈는지가 사라져 할인이 할인으로 안 읽힌다
  itemPriceWas: {
    ...typography.micro,
    ...tabularFigures,
    fontWeight: '400',
    textDecorationLine: 'line-through',
  },

  // ── 유니폼·기타 ────────────────────────────────────────────
  sizeRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.cardGap },
  // 두 칸 고정 - 늘어나게 두면 홀수로 남은 마지막 타일만 폭이 두 배가 된다
  tileSlot: { flexBasis: '48%', maxWidth: '48%' },
  tile: {
    flex: 1,
    // 배지가 없는 타일이 대부분이라, 104 로 두면 이름 위가 통째로 빈 칸이 된다
    minHeight: 84,
    backgroundColor: colors.card,
    borderRadius: radius.tile,
    padding: spacing.lg,
    gap: 4,
    justifyContent: 'flex-end',
  },
  tileTop: { flex: 1 },
  tileName: { ...typography.bodyStrong, fontSize: 13.5, lineHeight: 19 },
  tilePrice: { ...typography.micro, ...tabularFigures, color: colors.brandText },

  // '오늘의 카드' 그림 자리 - 격자 타일보다 크다. 한 장뿐이라 폭을 다 쓴다
  todayShot: { borderRadius: radius.tile, overflow: 'hidden', marginBottom: spacing.md },
  todayShotText: { ...typography.micro, color: '#FFFFFF' },

  // ── 격자 타일 공용 서식 ────────────────────────────────────
  // 유니폼과 포토카드가 같은 서식을 쓴다. 굿즈 탭 안에서 갈래마다 타일 생김새가
  // 다르면 팬은 그 차이를 '무슨 뜻이 있나' 하고 읽는다 - 뜻이 없으면 서식은 같아야 한다.
  //
  // 그림 자리. 흰 유니폼이 흰 카드에 묻히지 않게 한 단계 낮은 면을 깐다
  gridStage: {
    height: 132,
    borderRadius: radius.tile,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  gridBadge: { position: 'absolute', top: spacing.sm, left: spacing.sm },
  gridKind: { ...typography.micro, fontWeight: '400', color: colors.mutedText },
  gridName: { ...typography.bodyStrong, fontSize: 13.5, lineHeight: 19, marginTop: 2 },
  gridPrice: { ...typography.bodyStrong, ...tabularFigures, fontSize: 14, marginTop: 3 },
  gridMeta: { ...typography.micro, fontWeight: '400', color: colors.mutedText, marginTop: 1 },
});
