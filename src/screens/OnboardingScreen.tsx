// 온보딩 3단계 - kbo_poc S1 온보딩(6단계)의 구단 앱 이식판
//
// 리그 앱은 "어느 구단을 응원하세요?"부터 물어야 하지만, 구단 앱은 그 답을 이미
// 알고 들어온다. 그래서 6단계 중 구단·지역·관심사를 걷어내고 셋만 남았다.
//   ① 지식 수준 - 같은 데이터를 어떤 문장으로 줄지 (라이브·선수 탭의 해설 깊이)
//   ② 최애 선수 - 홈 카드·굿즈 알림의 기준
//   ③ 알림      - 결정적 순간·굿즈 발매·예매 오픈
//
// ── 디자인 푸팅 (2026-08-21 재정비) ──────────────────────────
//  · 크롬 상단은 워드마크가 갖는다. 구단 앱의 첫 화면인데 브랜드 없이 "STEP 1"부터
//    시작하면 어느 앱의 온보딩인지 화면이 말하지 못한다
//  · 단계 표시는 진행 바 하나만. "STEP n" 라벨·"n / 3" 카운터·진행 바가 같은 말을
//    세 번 하면 그게 곧 템플릿 티다
//  · 선수 목록은 타자/투수로 가른다 - 22명을 한 덩어리로 쌓으면 목록이 아니라 벽이다
//
// kbo_poc 에서 그대로 가져온 설계 판단
//  · 모든 단계를 건너뛸 수 있다. 온보딩은 이탈 지점이지 관문이 아니다
//  · 마지막 단계의 '건너뛰기'는 스위치를 되돌리지 않고 현재 상태로 끝낸다 -
//    재온보딩에서 기존 동의가 조용히 취소되면 안 되기 때문이다
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AlertToggle, GroupCard, Row, SectionTitle } from '../components/common';
import { ClubWordmark, PlayerAvatar } from '../components/photos';
import { KNOWLEDGE_OPTIONS, KnowledgeLevel, UserProfile } from '../profile';
import { BATTERS, PITCHERS } from '../roster';
import { colors, pressHighlight, radius, spacing, typography } from '../theme';

const TOTAL_STEPS = 3;

const STEPS: { label: string; title: string; desc: string }[] = [
  { label: '지식 수준', title: '야구는 얼마나 보셨나요?', desc: '해설의 깊이가 이 값을 따릅니다' },
  { label: '최애 선수', title: '최애 선수가 있나요?', desc: '홈 카드와 굿즈 알림의 기준' },
  { label: '알림', title: '알림을 받으시겠어요?', desc: '끄면 앱 안의 해당 소식 지면도 접힙니다' },
];

const BATTER_OPTIONS = BATTERS.map((b) => ({
  id: b.id,
  name: b.name,
  sub: `${b.back} · ${b.pos}`,
}));
const PITCHER_OPTIONS = PITCHERS.map((p) => ({
  id: p.id,
  name: p.name,
  sub: `${p.back} · ${p.role}`,
}));

export function OnboardingScreen({
  initialProfile,
  onDone,
}: {
  initialProfile: UserProfile;
  onDone: (profile: UserProfile) => void;
}) {
  const [step, setStep] = useState(1);
  const [level, setLevel] = useState<KnowledgeLevel>(initialProfile.level);
  const [favorite, setFavorite] = useState<string | undefined>(initialProfile.favoritePlayerId);
  const [alerts, setAlerts] = useState(initialProfile.alerts);

  const meta = STEPS[step - 1];

  const finish = () => onDone({ level, favoritePlayerId: favorite, alerts });
  const goNext = () => (step === TOTAL_STEPS ? finish() : setStep(step + 1));

  const playerGroup = (title: string, options: { id: string; name: string; sub: string }[]) => (
    <>
      <SectionTitle title={title} />
      <GroupCard>
        {options.map((p, i) => {
          const on = favorite === p.id;
          return (
            <Row
              key={p.id}
              last={i === options.length - 1}
              // 같은 선수를 다시 누르면 해제 - "없어요"를 위한 별도 버튼을 두지 않는다
              onPress={() => setFavorite(on ? undefined : p.id)}
              style={st.playerRow}
            >
              <PlayerAvatar playerId={p.id} size={32} />
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={[st.playerName, on && { color: colors.brandText }]}>{p.name}</Text>
                <Text style={st.playerSub}>{p.sub}</Text>
              </View>
              <RadioDot on={on} />
            </Row>
          );
        })}
      </GroupCard>
    </>
  );

  return (
    <View style={st.root}>
      {/* ── 크롬: 브랜드 · 뒤로 · 건너뛰기 ───────────────────── */}
      <View style={st.header}>
        {step > 1 ? (
          <Pressable
            onPress={() => setStep(step - 1)}
            hitSlop={10}
            style={({ pressed }) => [st.headerSide, pressed && pressHighlight]}
            accessibilityRole="button"
            accessibilityLabel="이전 단계로"
          >
            <Text style={st.headerBack}>‹ 이전</Text>
          </Pressable>
        ) : (
          <View style={st.headerSide} />
        )}
        <ClubWordmark height={22} />
        <Pressable
          onPress={goNext}
          hitSlop={10}
          style={({ pressed }) => [
            st.headerSide,
            { alignItems: 'flex-end' },
            pressed && pressHighlight,
          ]}
          accessibilityRole="button"
          accessibilityLabel="이 단계 건너뛰기"
        >
          <Text style={st.headerSkip}>건너뛰기</Text>
        </Pressable>
      </View>

      {/* 단계 표시는 이 진행 바 하나뿐이다 */}
      <View style={st.progressBar} accessibilityLabel={`전체 ${TOTAL_STEPS}단계 중 ${step}단계`}>
        {STEPS.map((sMeta, i) => (
          <View key={sMeta.label} style={[st.progressCell, i < step && st.progressCellOn]} />
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={st.body}
        showsVerticalScrollIndicator={false}
      >
        <Text style={st.stepLabel}>{meta.label}</Text>
        <Text style={st.stepTitle}>{meta.title}</Text>
        <Text style={st.stepDesc}>{meta.desc}</Text>

        {step === 1 ? (
          <View style={st.stepBody}>
            <GroupCard>
              {KNOWLEDGE_OPTIONS.map((o, i) => {
                const on = level === o.key;
                return (
                  <Row
                    key={o.key}
                    last={i === KNOWLEDGE_OPTIONS.length - 1}
                    onPress={() => setLevel(o.key)}
                    style={st.optionRow}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[st.optionTitle, on && { color: colors.brandText }]}>
                        {o.label}
                      </Text>
                      <Text style={st.optionDesc}>{o.desc}</Text>
                    </View>
                    <RadioDot on={on} />
                  </Row>
                );
              })}
            </GroupCard>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={st.stepBodyTight}>
            {playerGroup('타자', BATTER_OPTIONS)}
            {playerGroup('투수', PITCHER_OPTIONS)}
          </View>
        ) : null}

        {step === 3 ? (
          <View style={st.stepBody}>
            <GroupCard style={{ paddingHorizontal: spacing.cardPad }}>
              <Row>
                <View style={{ flex: 1 }}>
                  <AlertToggle
                    on={alerts.clutch}
                    onPress={() => setAlerts((a) => ({ ...a, clutch: !a.clutch }))}
                    label="결정적 순간"
                    caption="레버리지가 치솟는 타석"
                  />
                </View>
              </Row>
              <Row>
                <View style={{ flex: 1 }}>
                  <AlertToggle
                    on={alerts.goodsDrop}
                    onPress={() => setAlerts((a) => ({ ...a, goodsDrop: !a.goodsDrop }))}
                    label="굿즈 발매"
                    caption="발매 시작 · 품절 임박 · 최애 선수 굿즈"
                  />
                </View>
              </Row>
              <Row last>
                <View style={{ flex: 1 }}>
                  <AlertToggle
                    on={alerts.ticketOpen}
                    onPress={() => setAlerts((a) => ({ ...a, ticketOpen: !a.ticketOpen }))}
                    label="예매 오픈"
                    caption="예매가 열리는 시각"
                  />
                </View>
              </Row>
            </GroupCard>
          </View>
        ) : null}
      </ScrollView>

      {/* ── 하단 고정 버튼 ───────────────────────────────────── */}
      <View style={st.footer}>
        <Pressable
          onPress={goNext}
          style={({ pressed }) => [st.nextBtn, pressed && pressHighlight]}
          accessibilityRole="button"
        >
          <Text style={st.nextLabel}>{step === TOTAL_STEPS ? '시작하기' : '다음'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** 단일 선택 표시 - 체크 아이콘 대신 채워지는 점 (이모지·아이콘 없이) */
function RadioDot({ on }: { on: boolean }) {
  return (
    <View style={[st.radio, on && st.radioOn]}>{on ? <View style={st.radioCore} /> : null}</View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX,
    height: 52,
  },
  headerSide: { width: 72, justifyContent: 'center' },
  headerBack: { ...typography.bodyStrong, fontSize: 14, color: colors.subText },
  headerSkip: { ...typography.bodyStrong, fontSize: 14, color: colors.mutedText },

  progressBar: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.screenX,
    marginBottom: spacing.sm,
  },
  progressCell: { flex: 1, height: 3, borderRadius: radius.bar, backgroundColor: colors.dim },
  progressCellOn: { backgroundColor: colors.brand },

  body: { paddingHorizontal: spacing.screenX, paddingTop: spacing.xl, paddingBottom: 120 },
  stepLabel: { ...typography.label, color: colors.brandText },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginTop: 6,
  },
  stepDesc: { ...typography.body, marginTop: 6 },
  stepBody: { marginTop: spacing.xl },
  // 선수 목록은 섹션 머리글(타자/투수)이 위 여백을 갖고 있어 얇게만 띄운다
  stepBodyTight: { marginTop: spacing.xs },

  optionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  optionTitle: { ...typography.bodyStrong, fontSize: 15 },
  optionDesc: typography.caption,

  playerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 8 },
  playerName: { ...typography.bodyStrong, fontSize: 15 },
  playerSub: typography.micro,

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.dim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.brand },
  radioCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.screenX,
    paddingBottom: spacing.xl,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  nextBtn: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.tile,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLabel: { fontSize: 16, fontWeight: '700', color: colors.brandText },
});
