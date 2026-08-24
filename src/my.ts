// MY 탭 - 나의 직관 기록 (kbo_poc S2 정체성 원장의 구단 앱 라이트판)
//
// kbo_poc 에서 그대로 가져온 원칙: **승률·횟수는 저장하지 않고 기록에서 매번 집계한다.**
// 집계값을 따로 저장하면 기록과 어긋날 여지가 생긴다.
//
// 기록 자체는 시연용 샘플이다. 실제 앱에서는 직관 인증(QR·위치)이 이 배열을 채운다.

export interface AttendanceRecord {
  date: string; // 'MM.DD'
  opponent: string;
  /** 우리 팀 기준 결과 */
  result: 'W' | 'L';
  /** 우리 점수:상대 점수 */
  score: string;
  /** 앉은 자리 - 팬의 기억은 좌석 단위로 남는다 */
  seat: string;
}

export const ATTENDANCE: AttendanceRecord[] = [
  { date: '08.09', opponent: 'LG', result: 'L', score: '2:5', seat: '1루 내야지정석 213블록' },
  { date: '07.26', opponent: '삼성', result: 'W', score: '7:4', seat: '외야지정석 101블록' },
  { date: '07.12', opponent: 'KT', result: 'W', score: '5:3', seat: '중앙 테이블석 F12' },
  { date: '06.28', opponent: '롯데', result: 'L', score: '1:6', seat: '1루 내야지정석 214블록' },
  { date: '06.14', opponent: 'NC', result: 'W', score: '8:2', seat: '잔디석' },
];

export function attendanceSummary(records: AttendanceRecord[]) {
  const games = records.length;
  const wins = records.filter((r) => r.result === 'W').length;
  const losses = games - wins;
  const winRate = games === 0 ? 0 : wins / games;
  return { games, wins, losses, winRate };
}
