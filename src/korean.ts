// 한국어 조사 처리
//
// 이 앱은 선수 이름을 문장에 끼워 넣어 해설을 만든다. 그런데 한국어 조사는 앞 글자의
// 받침 유무에 따라 갈린다.
//
//   노시환 + 이 → "노시환이"   (받침 ㄴ)
//   폰세   + 가 → "폰세가"     (받침 없음)
//   함덕주 + 로 → "함덕주로"   (받침 없음 - "함덕주으로"는 틀렸다)
//
// 조사를 하드코딩하면 외국인 선수 이름에서 즉시 어색해진다("폰세이 유리합니다").
// 해설을 문장으로 파는 앱에서 이건 사소한 문제가 아니다 - 문장이 어색한 순간
// 그 안의 수치까지 대충 만든 것처럼 읽힌다.

/** 마지막 글자에 받침이 있는가. 한글이 아니면 받침 없음으로 본다 */
function hasFinalConsonant(word: string): boolean {
  if (!word) return false;
  const code = word.charCodeAt(word.length - 1);
  // 한글 음절 영역: 가(0xAC00) ~ 힣(0xD7A3)
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

/** 받침이 ㄹ인가 - '으로/로'는 ㄹ 받침을 받침 없음처럼 취급한다 */
function endsWithRieul(word: string): boolean {
  if (!word) return false;
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 === 8; // 8 = ㄹ
}

export type JosaKind = '이/가' | '은/는' | '을/를' | '와/과' | '으로/로' | '이다/다';

/**
 * 단어에 맞는 조사를 붙여 돌려준다.
 *
 * @example josa('노시환', '이/가') // '노시환이'
 * @example josa('폰세', '이/가')   // '폰세가'
 * @example josa('함덕주', '으로/로') // '함덕주로'
 */
export function josa(word: string, kind: JosaKind): string {
  const has = hasFinalConsonant(word);

  switch (kind) {
    case '이/가':
      return word + (has ? '이' : '가');
    case '은/는':
      return word + (has ? '은' : '는');
    case '을/를':
      return word + (has ? '을' : '를');
    case '와/과':
      return word + (has ? '과' : '와');
    case '으로/로':
      // ㄹ 받침은 '로'를 쓴다 ('서울로', '함덕주로')
      return word + (has && !endsWithRieul(word) ? '으로' : '로');
    case '이다/다':
      return word + (has ? '이다' : '다');
  }
}
