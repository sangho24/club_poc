// 중계 합치기 - 두 소스를 하나의 문자중계로 잇는다
//
// ── 왜 이 파일이 필요한가 ────────────────────────────────────
// 경기 기록이 두 곳에 나뉘어 있다. 그럴 만한 이유가 각각 있다.
//   · `game.ts` 의 `PLATE_SEQUENCE`  8회말~9회말. 아웃카운트·주자·볼카운트를 다 들고 있어야
//     `liveEngine` 이 확률과 레버리지를 계산한다. 시연이 앞뒤로 넘기는 구간이다
//   · `gameLog.ts` 의 `GAME_LOG`      1회초~9회초. 계산에 쓰이지 않고 읽히기만 하는 중계 원문
//
// 화면은 그 사정을 알 필요가 없다. **"지금까지 벌어진 일"** 하나만 있으면 된다.
// 두 소스를 화면에서 각각 훑으면 이닝 순서·진행 중 표시·라인스코어 합산이 화면마다
// 다시 구현되고, 그러면 같은 경기가 카드마다 다르게 보인다.
//
// ── 라인스코어도 여기서 나온다 ──────────────────────────────
// 전에는 `game.ts` 에 `LINESCORE` 상수가 손으로 적혀 있었다. 두 가지가 틀렸다.
//   ① **타석을 넘겨도 값이 그대로였다.** 9회말로 가도 8회말 칸이 비어 있었고(치른 이닝인데
//      '·' 로 남았다), 8회말 첫 타석인데 안타는 이미 7개였다
//   ② 중계를 화면에 펼치는 순간 **표와 중계가 서로를 반박할 수 있게 됐다.** 3회말에 2점이
//      찍혀 있는데 그 이닝 중계에 득점이 없으면 앱이 자기 말을 뒤집는다
// 세는 값은 중계 한 곳에만 두고 표는 거기서 합산한다.
//
// ⚠ `PLATE_SEQUENCE` 구간(8회말·9회말)에는 득점이 없다고 본다. 실제로 그 열두 타석에
//    득점 타석이 없어서인데, **나중에 득점하는 타석을 넣으면 이 가정이 조용히 깨진다.**
//    `tools/verify-stats.ts` 가 합산 결과를 `TODAY_GAME` 의 점수와 대조해 그때 멈춘다.
import { PLATE_SEQUENCE, TODAY_GAME } from './game';
import { GAME_LOG, HalfInning } from './gameLog';
import { BATTERS, OPPONENT_PITCHERS } from './roster';

export type Half = 'top' | 'bottom';

/** 문자중계 한 행 */
export interface FeedRow {
  name: string;
  text: string;
  runs?: number;
  /** 타석이 아닌 행(투수 교체) - 이름 칸을 비우고 가운데로 눕힌다 */
  kind?: 'sub';
  /** 지금 진행 중인 타석 */
  live?: boolean;
  /** `PLATE_SEQUENCE` 의 인덱스. 화면이 레버리지를 되짚을 때 쓴다 */
  paIndex?: number;
}

export interface FeedInning {
  /** 렌더 키이자 펼침 상태의 열쇠 */
  key: string;
  inning: number;
  half: Half;
  /** 우리 공격인가. 홈이 말이다 */
  ours: boolean;
  runs: number;
  /** 아직 끝나지 않은 이닝 */
  live: boolean;
  rows: FeedRow[];
}

export interface LineScore {
  /** 이닝별 득점. null 이면 **아직 치르지 않은 이닝** */
  innings: (number | null)[];
  hits: number;
  errors: number;
}

const INNINGS = 9;

const keyOf = (inning: number, half: Half) => `${inning}-${half}`;

/** (a) 가 (b) 보다 앞선 하프이닝인가. 같은 이닝이면 초가 말보다 앞이다 */
function isBefore(a: { inning: number; half: Half }, b: { inning: number; half: Half }): boolean {
  if (a.inning !== b.inning) return a.inning < b.inning;
  return a.half === 'top' && b.half === 'bottom';
}

/** 지금 어느 하프이닝인가 */
function currentHalf(step: number) {
  const s = PLATE_SEQUENCE[Math.min(step, PLATE_SEQUENCE.length - 1)].situation;
  return { inning: s.inning, half: s.half as Half };
}

/**
 * `PLATE_SEQUENCE` 를 하프이닝 단위로 묶는다.
 *
 * `step` 까지만 벌어진 일이다. 시연이 타석을 앞으로 넘기면 이 목록이 늘어난다.
 * 투수가 바뀐 자리에는 교체 행을 끼워 넣는다 - 9회말에 마무리가 올라온 것이 중계에
 * 안 적히면 **팬은 상대 투수가 언제 바뀌었는지 알 수 없다.**
 */
function sequenceInnings(step: number): FeedInning[] {
  const out: FeedInning[] = [];

  for (let i = 0; i <= step; i++) {
    const pa = PLATE_SEQUENCE[i];
    const { inning, half } = { inning: pa.situation.inning, half: pa.situation.half as Half };
    let group = out.find((g) => g.inning === inning && g.half === half);
    if (!group) {
      group = {
        key: keyOf(inning, half),
        inning,
        half,
        ours: half === 'bottom',
        runs: 0,
        live: false,
        rows: [],
      };
      out.push(group);
    }

    if (i > 0 && PLATE_SEQUENCE[i - 1].pitcherId !== pa.pitcherId) {
      const p = OPPONENT_PITCHERS.find((x) => x.id === pa.pitcherId);
      if (p) group.rows.push({ name: '', text: `투수 교체 · ${p.name}`, kind: 'sub' });
    }

    group.rows.push({
      name: BATTERS.find((b) => b.id === pa.batterId)?.name ?? '',
      // ⚠ 진행 중인 타석은 `logLine` 을 쓰지 않는다. 그건 **아직 일어나지 않은 결과**다.
      //    그대로 그렸더니 지금 예측 중인 타석 옆에 '고의4구'라고 적혀 있었다 -
      //    바로 위 카드가 출루 확률을 계산하는 동안 중계는 답을 먼저 말하고 있었다.
      text: i === step ? '타석 진행 중' : pa.logLine,
      live: i === step,
      paIndex: i,
    });
  }

  // 마지막 묶음이 지금 진행 중인 이닝이다
  if (out.length > 0) out[out.length - 1].live = true;
  return out;
}

function fromLog(h: HalfInning): FeedInning {
  return {
    key: keyOf(h.inning, h.half),
    inning: h.inning,
    half: h.half,
    ours: h.half === 'bottom',
    runs: h.runs,
    live: false,
    rows: h.rows.map((r) => ({ name: r.name, text: r.text, runs: r.runs, kind: r.kind })),
  };
}

/**
 * 지금까지의 중계. **최신 이닝이 앞**이다.
 *
 * ── 왜 이닝은 역순인데 이닝 안은 시간순인가 ─────────────────
 * 두 질문이 다르다. 화면을 열었을 때의 질문은 "지금 무슨 일이 났나"라 최신이 위여야 하고,
 * 지난 이닝을 **펼쳤을 때**의 질문은 "그 이닝이 어떻게 흘렀나"로 바뀐다. 흐름을 거꾸로
 * 읽으면 안타 뒤에 그 주자를 불러들인 적시타가 먼저 나온다.
 */
export function buildFeed(step: number): FeedInning[] {
  const cur = currentHalf(step);
  const past = GAME_LOG.filter((h) => isBefore(h, cur)).map(fromLog);
  const seq = sequenceInnings(step);

  // 두 소스를 시간순으로 합친 뒤 뒤집는다. seq 가 항상 뒤라 정렬 대신 이어 붙이면 된다
  return [...past, ...seq].reverse();
}

/**
 * `step` 시점의 라인스코어.
 *
 * 아직 치르지 않은 이닝은 `null` 이다. 진행 중인 이닝에 0 을 적으면 **'0점으로 끝난 이닝'**이
 * 되어 지금 벌어지는 공격이 표에서 사라진다.
 *
 * ⚠ 실책은 **수비 팀**에 쌓인다. 초(LG 공격)에 난 실책은 한화 수비의 것이다.
 */
export function lineScoreAt(step: number): { away: LineScore; home: LineScore } {
  const cur = currentHalf(step);
  const away: LineScore = { innings: Array(INNINGS).fill(null), hits: 0, errors: 0 };
  const home: LineScore = { innings: Array(INNINGS).fill(null), hits: 0, errors: 0 };

  for (const h of GAME_LOG) {
    if (!isBefore(h, cur)) continue;
    const bat = h.half === 'top' ? away : home;
    const field = h.half === 'top' ? home : away;
    bat.innings[h.inning - 1] = h.runs;
    bat.hits += h.hits;
    field.errors += h.errors;
  }

  for (const g of sequenceInnings(step)) {
    const bat = g.half === 'top' ? away : home;
    // 진행 중인 이닝은 칸을 비운다. 안타는 이미 친 것이므로 지금까지 것을 센다
    if (!g.live) bat.innings[g.inning - 1] = g.runs;
    bat.hits += g.rows.filter(
      (r) => r.paIndex !== undefined && PLATE_SEQUENCE[r.paIndex].hit,
    ).length;
  }

  return { away, home };
}

/** 지금까지의 총득점 - 검증용. 화면은 `TODAY_GAME` 의 점수를 쓴다 */
export function scoreAt(step: number): { away: number; home: number } {
  const ls = lineScoreAt(step);
  const sum = (v: (number | null)[]) => v.reduce<number>((a, b) => a + (b ?? 0), 0);
  return { away: sum(ls.away.innings), home: sum(ls.home.innings) };
}

/** 화면에 적힌 총점과 중계 합산이 같은지 - `tools/verify-stats.ts` 가 부른다 */
export const FINAL_STEP = PLATE_SEQUENCE.length - 1;
export const EXPECTED_SCORE = { away: TODAY_GAME.theirScore, home: TODAY_GAME.ourScore };
