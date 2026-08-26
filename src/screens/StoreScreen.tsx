// 굿즈 - 기념 유니폼·한정 MD 발매 소식 (1차 리뷰 7번)
//
// ── 단위는 상품이 아니라 사건이다 ────────────────────────────
// 공유받은 사례(키움 박병호 은퇴 MD)는 타월 하나가 아니라 티셔츠+키링+응원타월 세트였다.
// 기념 굿즈는 은퇴·기록 달성·헤리티지 데이 같은 사건에 붙어서 나온다. 그래서 카드 하나가
// 상품 하나가 아니라 드롭 하나이고, 맨 위에 가격이 아니라 **왜 이게 나오는지**가 온다.
//
// ── 백링크 직전까지 앱이 하는 일 ─────────────────────────────
// 결제는 공식몰로 넘긴다. 대신 그 전에 필요한 것은 앱이 끝낸다.
//   발매까지 남은 시간 · 구성품과 사이즈 · 남은 재고 · 수령 방법 · 1인 구매 제한 · 알림 신청
// 특히 **알림 신청**이 이 화면을 공지사항에서 도구로 바꾼다. 한정 굿즈에서 팬이 가장 크게
// 실망하는 것은 비싼 것이 아니라 몰라서 못 산 것이다.
import { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

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
  Label,
  Row,
  SectionTitle,
} from '../components/common';
import { GoodsShowcase, PlayerAvatar, TeamEmblem } from '../components/photos';
import {
  DROPS,
  GoodsDrop,
  countdown,
  dropAlerts,
  statusLabel,
  stockLeft,
  stockRatio,
} from '../goods';
import { UserProfile } from '../profile';
import { BATTERS, PITCHERS } from '../roster';
import { colors, radius, spacing, tabularFigures, typography } from '../theme';

/** 시연 기준 시각 - Date.now() 를 쓰면 실행할 때마다 카운트다운이 달라진다 */
const DEMO_NOW = Date.parse('2026-08-11T15:00:00+09:00');

const FILTERS: { key: 'all' | 'onsale' | 'upcoming'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'onsale', label: '판매 중' },
  { key: 'upcoming', label: '발매 예정' },
];

export function StoreScreen({ profile }: { profile: UserProfile }) {
  const [filter, setFilter] = useState<'all' | 'onsale' | 'upcoming'>('all');
  const [open, setOpen] = useState<GoodsDrop | null>(null);
  const [alerts, setAlerts] = useState<Record<string, boolean>>({ d1: true });
  const [size, setSize] = useState<string | null>(null);

  const notices = useMemo(
    () => dropAlerts(DEMO_NOW, profile.favoritePlayerId),
    [profile.favoritePlayerId],
  );

  const list = DROPS.filter((d) => {
    if (filter === 'onsale') return d.status === 'onsale';
    if (filter === 'upcoming') return d.status === 'upcoming' || d.status === 'teaser';
    return true;
  });

  const openDrop = (d: GoodsDrop) => {
    setSize(d.items.find((i) => i.sizes)?.sizes?.[1] ?? null);
    setOpen(d);
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.screenX,
          paddingBottom: spacing.scrollBottom,
        }}
      >
        {/* '놓치기 전에'는 **묶음**이다 - 지금 급한 것만 모아 놓은 독립된 덩어리라
            아래 '발매 소식' 목록과 섞이면 안 된다. 반대로 '발매 소식'은 필터 칩으로
            걸러 보는 **흐름**이라 머리글을 밖에 둔다 */}
        {profile.alerts.goodsDrop && notices.length > 0 ? (
          <SectionCard title="놓치기 전에">
            {notices.map((a, i) => (
              <Row
                key={i}
                last={i === notices.length - 1}
                style={st.alertRow}
                onPress={() => openDrop(a.drop)}
              >
                <View style={{ flex: 1, gap: 5 }}>
                  <Badge
                    text={
                      a.urgency >= 90 ? '품절 임박' : a.urgency >= 80 ? '발매 임박' : '최애 선수'
                    }
                    tone={a.urgency >= 90 ? 'live' : a.urgency >= 80 ? 'warn' : 'brand'}
                  />
                  <Text style={st.alertText}>{a.message}</Text>
                  <Text style={st.alertNote}>{a.note}</Text>
                </View>
                <Text style={st.chevron}>›</Text>
              </Row>
            ))}
          </SectionCard>
        ) : null}

        <SectionTitle title="발매 소식" />
        <View style={st.filterRow}>
          {FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              selected={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </View>

        <View style={{ gap: spacing.cardGap, marginTop: spacing.md }}>
          {list.map((d) => (
            <DropCard key={d.id} drop={d} alerted={!!alerts[d.id]} onPress={() => openDrop(d)} />
          ))}
        </View>
      </ScrollView>

      {/* ── 드롭 상세 ──────────────────────────────────────── */}
      <DetailSheet
        visible={!!open}
        title={open?.title ?? ''}
        subtitle={open ? `${open.occasion} · ${statusLabel(open.status)}` : ''}
        onClose={() => setOpen(null)}
        actions={
          open ? (
            open.status === 'ended' ? (
              <View style={{ flex: 1 }}>
                <Text style={st.endedNote}>판매가 종료된 상품입니다</Text>
              </View>
            ) : (
              <>
                <AlertToggle
                  compact
                  on={!!alerts[open.id]}
                  onPress={() => setAlerts((a) => ({ ...a, [open.id]: !a[open.id] }))}
                />
                <View style={{ flex: 1.4 }}>
                  <ExternalButton
                    label={open.status === 'onsale' ? '공식몰에서 구매' : '공식몰 보기'}
                    onPress={() => Linking.openURL(open.shopUrl)}
                  />
                </View>
              </>
            )
          ) : null
        }
      >
        {open ? (
          <>
            <Card>
              <View style={st.sheetHeadRow}>
                {open.playerId ? (
                  <PlayerAvatar playerId={open.playerId} team="HH" size={54} />
                ) : (
                  <View style={st.emblemThumb}>
                    <TeamEmblem team="HH" size={34} />
                  </View>
                )}
                <View style={{ flex: 1, gap: 4 }}>
                  {countdown(open.openAt, DEMO_NOW) ? (
                    <Text style={st.countdown}>{countdown(open.openAt, DEMO_NOW)}</Text>
                  ) : null}
                  <Text style={st.sheetBody}>{open.story}</Text>
                </View>
              </View>
            </Card>

            {/* 재고 */}
            {stockRatio(open) !== null && open.status === 'onsale' ? (
              <View style={{ marginTop: spacing.cardGap }}>
                <Card>
                  <View style={st.stockHead}>
                    <Label>남은 수량</Label>
                    <Text
                      style={[st.stockValue, stockRatio(open)! <= 0.2 && { color: colors.live }]}
                    >
                      {stockLeft(open)?.toLocaleString()}개
                    </Text>
                  </View>
                </Card>
              </View>
            ) : null}

            {/* 물건이 보여야 커머스다. 사이즈 표만 있으면 팬은 사진을 찾으러 앱을 나간다 */}
            <View style={{ marginTop: spacing.cardGap }}>
              <GoodsShowcase kind={/모자|캡|CAP/i.test(open.title) ? 'cap' : 'emblem'} />
            </View>

            {/* 구성 */}
            {open.items.length > 0 ? (
              <View style={{ marginTop: spacing.cardGap }}>
                <SectionTitle title="구성" />
                <GroupCard style={{ paddingHorizontal: spacing.cardPad }}>
                  {open.items.map((it, i) => (
                    <View
                      key={it.name}
                      style={[st.itemRow, i < open.items.length - 1 && st.divider]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={st.itemName}>{it.name}</Text>
                        {it.limit ? (
                          <Text style={st.itemLimit}>
                            한정 {it.limit.toLocaleString()}개
                            {it.remain !== undefined
                              ? ` · ${it.remain.toLocaleString()}개 남음`
                              : ''}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={st.itemPrice}>{it.price.toLocaleString()}원</Text>
                    </View>
                  ))}
                </GroupCard>
              </View>
            ) : null}

            {/* 사이즈 - 고르는 것까지가 앱의 일이다 */}
            {open.items.some((i) => i.sizes) ? (
              <View style={{ marginTop: spacing.cardGap }}>
                <SectionTitle title="사이즈" />
                <View style={st.sizeRow}>
                  {open.items
                    .find((i) => i.sizes)!
                    .sizes!.map((sz) => (
                      <Chip
                        key={sz}
                        label={sz}
                        selected={size === sz}
                        onPress={() => setSize(sz)}
                      />
                    ))}
                </View>
                <Text style={st.footNote}>선택한 사이즈는 공식몰로 넘어갈 때 함께 전달됩니다.</Text>
              </View>
            ) : null}

            {/* 구매 정보 */}
            <View style={{ marginTop: spacing.cardGap }}>
              <GroupCard style={{ paddingHorizontal: spacing.cardPad }}>
                <InfoRow label="발매" value={formatDate(open.openAt)} />
                {open.closeAt ? <InfoRow label="마감" value={formatDate(open.closeAt)} /> : null}
                <InfoRow label="수령" value={open.delivery} />
                {open.buyLimit ? <InfoRow label="구매 제한" value={open.buyLimit} /> : null}
                <InfoRow label="판매처" value={open.shopName} last />
              </GroupCard>
            </View>

            {open.venueOnly ? (
              <View style={{ marginTop: spacing.cardGap }}>
                <Card>
                  <Label>현장 한정</Label>
                  <Text style={st.sheetBody}>
                    구장 MD샵에서만 판매합니다. 온라인 배송은 하지 않습니다.
                  </Text>
                </Card>
              </View>
            ) : null}
          </>
        ) : null}
      </DetailSheet>
    </>
  );
}

function formatDate(iso: string): string {
  const d = new Date(Date.parse(iso));
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours()}시`;
}

function DropCard({
  drop,
  alerted,
  onPress,
}: {
  drop: GoodsDrop;
  alerted: boolean;
  onPress: () => void;
}) {
  const ratio = stockRatio(drop);
  const player = [...BATTERS, ...PITCHERS].find((p) => p.id === drop.playerId)?.name ?? null;
  const left = countdown(drop.openAt, DEMO_NOW);

  const thumb = drop.playerId ? (
    <PlayerAvatar playerId={drop.playerId} team="HH" size={46} />
  ) : (
    <View style={st.emblemThumb}>
      <TeamEmblem team="HH" size={30} />
    </View>
  );

  const tone: 'brand' | 'live' | 'muted' | 'win' =
    drop.status === 'onsale' ? 'win' : drop.status === 'upcoming' ? 'brand' : 'muted';

  const meta = [drop.occasion, player, drop.venueOnly ? '현장 한정' : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card onPress={onPress}>
      <View style={st.dropHead}>
        {thumb}
        <View style={{ flex: 1 }}>
          <CardHeading
            label={meta}
            title={drop.title}
            right={<Badge text={statusLabel(drop.status)} tone={tone} />}
          />
        </View>
      </View>

      <Text style={st.story} numberOfLines={2}>
        {drop.story}
      </Text>

      {ratio !== null && drop.status === 'onsale' ? (
        <View style={st.stockHead}>
          <Text style={st.stockLabel}>남은 수량</Text>
          <Text style={[st.stockValueSm, ratio <= 0.2 && { color: colors.live }]}>
            {stockLeft(drop)?.toLocaleString()}개
          </Text>
        </View>
      ) : null}

      <Divider />

      <View style={st.dropFoot}>
        <Text style={st.dropFootText}>
          {drop.status === 'ended' ? '판매 종료' : left ? left : formatDate(drop.openAt)}
        </Text>
        {alerted ? <Badge text="알림 신청됨" tone="brand" /> : <Text style={st.chevron}>›</Text>}
      </View>
    </Card>
  );
}

const st = StyleSheet.create({
  alertRow: { alignItems: 'flex-start', paddingVertical: spacing.lg },
  alertText: { ...typography.bodyStrong, lineHeight: 21 },
  alertNote: typography.caption,
  chevron: { fontSize: 18, color: colors.mutedText },

  filterRow: { flexDirection: 'row', gap: spacing.sm },

  dropHead: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  emblemThumb: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  story: { ...typography.caption, lineHeight: 20 },

  stockHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  stockLabel: typography.micro,
  stockValue: { ...typography.metric, ...tabularFigures, fontSize: 22, color: colors.text },
  stockValueSm: { ...typography.micro, ...tabularFigures, fontWeight: '700', color: colors.text },
  stockTrack: {
    height: 6,
    borderRadius: radius.bar,
    backgroundColor: colors.dim,
    overflow: 'hidden',
  },
  stockFill: { height: 6, borderRadius: radius.bar },

  dropFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropFootText: {
    ...typography.micro,
    ...tabularFigures,
    color: colors.brandText,
    fontWeight: '700',
  },

  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  itemName: { ...typography.caption, color: colors.text },
  itemLimit: { ...typography.micro, ...tabularFigures, fontWeight: '400', marginTop: 2 },
  itemPrice: { ...typography.bodyStrong, ...tabularFigures, fontSize: 13.5 },

  sheetHeadRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  sheetBody: { ...typography.body, fontSize: 13.5, lineHeight: 21 },
  countdown: { ...typography.bodyStrong, color: colors.brandText, fontSize: 14 },

  sizeRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },

  endedNote: { ...typography.caption, textAlign: 'center', paddingVertical: spacing.md },

  footNote: { ...typography.micro, marginTop: spacing.sm, paddingHorizontal: spacing.xs },
});
