// 표 - 이 앱의 모든 표가 지나는 한 부품
//
// ── 왜 HeroUI 가 아니라 이걸 만들었나 ────────────────────────
// HeroUI 의 Table 을 쓰자는 요구였는데 올릴 수가 없었다. HeroUI 는 **DOM React +
// Tailwind** 라이브러리라 `<table>/<thead>/<tr>` 을 그린다. 이 앱은 react-native 라
// 그런 요소가 없고(View·Text 뿐), 웹 번들도 react-native-web 이 자기 트리를 그린다.
// 네이티브 빌드(EAS preview 폰 시연)에서는 아예 렌더되지 않고, 웹만 놓고 봐도 Expo
// Metro 에 Tailwind/PostCSS 단계가 없어 tailwindcss·framer-motion·@react-aria 를
// 새로 들여야 한다 - storage.ts 에 적힌 '외부 패키지 추가 금지'와도 정면으로 부딪친다.
//
// 그래서 **문법을 가져왔다.** props 이름과 기본 동작을 HeroUI Table 에 맞춰 두면
// 나중에 화면을 DOM 으로 옮길 때 이 자리를 그대로 갈아 끼울 수 있고, 지금 읽는 사람도
// 그 문서를 그대로 참고할 수 있다.
//
//   HeroUI                        여기
//   ─────────────────────────     ─────────────────────────
//   <TableColumn allowsSorting>   columns[].allowsSorting
//   sortDescriptor / onSortChange 같음 (제어 · 비제어 둘 다)
//   isStriped                     같음
//   emptyContent                  같음
//   topContent / bottomContent    같음
//   removeWrapper                 같음
//   onRowAction                   같음
//   align="start|center|end"      columns[].align
//
// ── HeroUI 에 없는 것 하나 - stickyColumn ───────────────────
// 폭 390px 에 열 스무 개를 우겨넣으면 글자가 뭉개진다. 그렇다고 통째로 가로 스크롤하면
// **오른쪽 끝 열을 볼 때 그게 누구 기록인지 알 수 없다.** 그래서 첫 열만 붙박이로 두고
// 나머지를 흐르게 한다. 데스크톱 폭을 전제하는 HeroUI 에는 없는 문제라 여기서 더한다.
import { ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, states, tabularFigures, typography } from '../theme';

export type SortDirection = 'ascending' | 'descending';

export interface SortDescriptor {
  /** 정렬 기준 열의 key */
  column: string;
  direction: SortDirection;
}

export interface TableColumn<T> {
  key: string;
  label: string;
  /** 기본 center - 수치 열은 폭이 고정이라 가운데가 줄을 가장 잘 맞춘다 */
  align?: 'start' | 'center' | 'end';
  width?: number;
  allowsSorting?: boolean;
  /** 정렬에 쓰는 값. allowsSorting 이면 있어야 한다 */
  sortValue?: (item: T) => number | string;
  /**
   * 처음 눌렀을 때 오름차순으로 열지.
   *
   * 낮을수록 좋은 지표(ERA·삼진·병살)가 여기 해당한다 - 누르는 사람이 원하는 것은
   * 1위이지 꼴찌가 아니다.
   */
  ascendingFirst?: boolean;
  /** 문자열을 돌려주면 표 기본 서식이 붙고, 노드를 돌려주면 그대로 그린다 */
  render: (item: T) => ReactNode;
}

/** 붙박이 첫 열 - 표가 가로로 흘러도 '누구의 줄인지'는 안 흐른다 */
export interface StickyColumn<T> {
  label: string;
  width?: number;
  render: (item: T) => ReactNode;
}

const ROW_H = 44;
const CELL_W = 52;
const STICKY_W = 92;

export function DataTable<T>({
  columns,
  items,
  getKey,
  stickyColumn,
  sortDescriptor,
  defaultSortDescriptor,
  onSortChange,
  onRowAction,
  rowMuted,
  isStriped,
  removeWrapper,
  emptyContent = '표시할 내용이 없습니다',
  topContent,
  bottomContent,
  rowHeight = ROW_H,
  label,
}: {
  columns: TableColumn<T>[];
  items: T[];
  getKey: (item: T) => string;
  stickyColumn?: StickyColumn<T>;
  /** 넘기면 제어 컴포넌트가 된다 (HeroUI 와 같다) */
  sortDescriptor?: SortDescriptor;
  defaultSortDescriptor?: SortDescriptor;
  onSortChange?: (d: SortDescriptor) => void;
  onRowAction?: (key: string, item: T) => void;
  /** 이 줄의 값을 곧이곧대로 읽으면 안 될 때 - 규정 미달처럼 */
  rowMuted?: (item: T) => boolean;
  isStriped?: boolean;
  removeWrapper?: boolean;
  emptyContent?: ReactNode;
  topContent?: ReactNode;
  bottomContent?: ReactNode;
  rowHeight?: number;
  /** 스크린리더용 표 이름 */
  label?: string;
}) {
  const firstSortable = columns.find((c) => c.allowsSorting);
  const [inner, setInner] = useState<SortDescriptor>(
    defaultSortDescriptor ?? {
      column: firstSortable?.key ?? columns[0]?.key ?? '',
      direction: firstSortable?.ascendingFirst ? 'ascending' : 'descending',
    },
  );
  // 제어·비제어를 둘 다 받는다. sortDescriptor 를 넘기면 그쪽이 진실이 된다
  const sort = sortDescriptor ?? inner;

  const setSort = (d: SortDescriptor) => {
    if (!sortDescriptor) setInner(d);
    onSortChange?.(d);
  };

  const pressHeader = (c: TableColumn<T>) => {
    if (!c.allowsSorting) return;
    if (c.key === sort.column) {
      setSort({
        column: c.key,
        direction: sort.direction === 'ascending' ? 'descending' : 'ascending',
      });
      return;
    }
    setSort({ column: c.key, direction: c.ascendingFirst ? 'ascending' : 'descending' });
  };

  const sortCol = columns.find((c) => c.key === sort.column);
  const sortValue = sortCol?.sortValue;
  const rows =
    sortValue === undefined
      ? items
      : items.slice().sort((a, b) => {
          const va = sortValue(a);
          const vb = sortValue(b);
          const cmp =
            typeof va === 'number' && typeof vb === 'number'
              ? va - vb
              : String(va).localeCompare(String(vb), 'ko');
          return sort.direction === 'ascending' ? cmp : -cmp;
        });

  const body =
    rows.length === 0 ? (
      <View style={s.empty}>
        {typeof emptyContent === 'string' ? (
          <Text style={s.emptyText}>{emptyContent}</Text>
        ) : (
          emptyContent
        )}
      </View>
    ) : (
      <View style={{ flexDirection: 'row' }}>
        {stickyColumn ? (
          <View style={s.stickyCol}>
            <View
              style={[s.headCell, { width: stickyColumn.width ?? STICKY_W, height: rowHeight }]}
            >
              <Text style={s.head} numberOfLines={1}>
                {stickyColumn.label}
              </Text>
            </View>
            {rows.map((item, i) => {
              const key = getKey(item);
              const cell = (
                <View
                  style={[
                    s.stickyCell,
                    { width: stickyColumn.width ?? STICKY_W, height: rowHeight },
                    // 줄무늬는 붙박이 열과 흐르는 열이 **같은 규칙**을 써야 한 줄로 이어진다
                    isStriped && i % 2 === 1 && s.striped,
                    i < rows.length - 1 && s.rowLine,
                  ]}
                >
                  {stickyColumn.render(item)}
                </View>
              );
              if (!onRowAction) return <View key={key}>{cell}</View>;
              return (
                <Pressable
                  key={key}
                  onPress={() => onRowAction(key, item)}
                  style={({ pressed }) => (pressed ? states.pressed : undefined)}
                >
                  {cell}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={{ flexDirection: 'row' }}>
              {columns.map((c) => {
                const on = c.key === sort.column;
                const w = c.width ?? CELL_W;
                if (!c.allowsSorting) {
                  return (
                    <View key={c.key} style={[s.headCell, { width: w, height: rowHeight }]}>
                      <Text style={[s.head, alignOf(c.align)]} numberOfLines={1}>
                        {c.label}
                      </Text>
                    </View>
                  );
                }
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => pressHeader(c)}
                    style={({ pressed }) => [
                      s.headCell,
                      { width: w, height: rowHeight },
                      pressed && states.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${c.label} 로 정렬`}
                    accessibilityState={{ selected: on }}
                  >
                    <Text
                      style={[s.head, alignOf(c.align), on && { color: colors.brandText }]}
                      numberOfLines={1}
                    >
                      {c.label}
                    </Text>
                    {/* 정렬 가능한 열에는 언제나 표시를 둔다. 눌러야 나타나면 '누를 수
                        있다'는 사실을 아무도 모른 채 스크롤로만 찾는다 */}
                    <Text style={[s.sortMark, on && { color: colors.brandText }]}>
                      {on ? (sort.direction === 'ascending' ? '▲' : '▼') : '⌄'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {rows.map((item, i) => {
              const muted = rowMuted?.(item) ?? false;
              return (
                <View
                  key={getKey(item)}
                  style={[
                    { flexDirection: 'row', alignItems: 'center', height: rowHeight },
                    isStriped && i % 2 === 1 && s.striped,
                    i < rows.length - 1 && s.rowLine,
                  ]}
                >
                  {columns.map((c) => {
                    const node = c.render(item);
                    const w = c.width ?? CELL_W;
                    if (typeof node !== 'string') {
                      return (
                        <View key={c.key} style={{ width: w }}>
                          {node}
                        </View>
                      );
                    }
                    return (
                      <Text
                        key={c.key}
                        style={[
                          s.cell,
                          { width: w },
                          alignOf(c.align),
                          muted && s.cellMuted,
                          // 지금 정렬 기준인 열을 눈에 띄게 둔다 - 무엇으로 줄 세웠는지가
                          // 머리글에만 있으면 가로로 흘렀을 때 화면 밖으로 나간다
                          c.key === sort.column && !muted && { color: colors.brandText },
                        ]}
                        numberOfLines={1}
                      >
                        {node}
                      </Text>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );

  const content = (
    <>
      {topContent}
      {body}
      {bottomContent}
    </>
  );

  if (removeWrapper) return <View accessibilityLabel={label}>{content}</View>;
  return (
    <View style={s.wrap} accessibilityLabel={label}>
      {content}
    </View>
  );
}

const alignOf = (a?: 'start' | 'center' | 'end') =>
  ({ start: s.alignStart, center: s.alignCenter, end: s.alignEnd })[a ?? 'center'];

const s = StyleSheet.create({
  // GroupCard 와 같은 면. 표는 카드 하나가 통째로 표라서 안쪽 여백을 두지 않는다
  wrap: { backgroundColor: colors.card, borderRadius: radius.card, overflow: 'hidden' },

  stickyCol: { borderRightWidth: 1, borderRightColor: colors.border },
  stickyCell: { justifyContent: 'center', paddingLeft: spacing.cardPad, paddingRight: spacing.sm },

  headCell: { justifyContent: 'center', backgroundColor: colors.surface },
  head: { ...typography.micro, fontSize: 10, fontWeight: '700' },
  sortMark: { fontSize: 8, color: colors.dim, textAlign: 'center', marginTop: 1 },

  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.border },
  // 줄무늬는 지면보다 아주 조금만 낮춘다. 뚜렷하면 줄무늬가 값보다 먼저 읽힌다
  striped: { backgroundColor: colors.surface },

  cell: { ...typography.caption, ...tabularFigures, fontWeight: '700', color: colors.text },
  cellMuted: { color: colors.mutedText, fontWeight: '500' },

  alignStart: { textAlign: 'left' },
  alignCenter: { textAlign: 'center' },
  alignEnd: { textAlign: 'right' },

  empty: { padding: spacing.xxl, alignItems: 'center' },
  emptyText: { ...typography.caption, color: colors.mutedText },
});
