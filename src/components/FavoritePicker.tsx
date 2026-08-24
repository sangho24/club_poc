// 최애 선수 선택 시트 - 홈 카드의 "변경"과 MY 탭이 같은 것을 쓴다
//
// 온보딩 STEP 2 와 같은 문법: 타자/투수 섹션으로 가르고, 같은 선수를 다시 누르면
// 해제한다. 그 규칙은 화면에 적지 않는다 - 상호작용으로 발견되는 것은 글로 적지 않는다.
import { StyleSheet, Text, View } from 'react-native';

import { DetailSheet, GroupCard, Row, SectionTitle } from './common';
import { PlayerAvatar } from './photos';
import { BATTERS, PITCHERS } from '../roster';
import { colors, spacing, typography } from '../theme';

const GROUPS = [
  ['타자', BATTERS.map((b) => ({ id: b.id, name: b.name, sub: `${b.back} · ${b.pos}` }))],
  ['투수', PITCHERS.map((p) => ({ id: p.id, name: p.name, sub: `${p.back} · ${p.role}` }))],
] as const;

export function FavoritePicker({
  visible,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current?: string;
  /** 같은 선수를 다시 고르면 undefined 로 해제된다 */
  onSelect: (id?: string) => void;
  onClose: () => void;
}) {
  return (
    <DetailSheet visible={visible} title="최애 선수" onClose={onClose}>
      {GROUPS.map(([group, options]) => (
        <View key={group}>
          <SectionTitle title={group} />
          <GroupCard style={{ paddingHorizontal: spacing.cardPad }}>
            {options.map((p, i) => {
              const on = current === p.id;
              return (
                <Row
                  key={p.id}
                  last={i === options.length - 1}
                  onPress={() => {
                    onSelect(on ? undefined : p.id);
                    onClose();
                  }}
                  style={st.row}
                >
                  <PlayerAvatar playerId={p.id} size={32} />
                  <Text style={[st.name, on && { color: colors.brandText }]}>{p.name}</Text>
                  <Text style={st.sub}>{p.sub}</Text>
                </Row>
              );
            })}
          </GroupCard>
        </View>
      ))}
    </DetailSheet>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 8 },
  name: { ...typography.bodyStrong, fontSize: 15, flex: 1 },
  sub: typography.micro,
});
