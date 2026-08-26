# 이미지 자산 출처 및 라이선스

구단 앱 PoC 시연용으로 수집한 사진 자산의 출처 기록이다.
파트너 보고 자리에서 "이 사진 어디서 났느냐"는 질문에 답할 수 있어야 하므로 파일 단위로 출처와 라이선스를 남긴다.

- **수집일**: 2026-08-11 (구장·엠블럼은 `kbo_poc` 에서 이관, 선수 사진은 이날 신규 수집)
- **수집처**: 위키미디어 커먼즈 (Wikimedia Commons) API
- **용도**: 사내 PoC 시연용. 상용 배포 시에는 아래 "재사용 시 주의"를 반드시 확인할 것

## 수집 규칙

**자유 라이선스만 받았다.**

| 받은 것 | 받지 않은 것 |
|---|---|
| CC0 · 퍼블릭도메인 | 구단·언론사 보도사진 (저작권 불명확) |
| CC BY · CC BY-SA | **ND**(변경 금지) - 크롭이 필요하다 |
| | **NC**(비영리) - 상업 제안 자료에 들어갈 수 있다 |

> **CC BY-SA 는 "무료"가 아니라 "조건부"다.** 화면에 크게 쓰는 사진은 앱 안 어딘가(설정 > 저작권 고지)에 저작자와 라이선스를 표기해야 한다. 이 문서가 그 고지의 원본 데이터가 된다.

---

## 선수 사진 (`player/`)

키는 `src/roster.ts` 의 선수 id 다. **화면에 실제로 쓰이는 것은 아래 세 장뿐이고, 셋 다 한화 유니폼이다.**

| 파일 | 선수 | 출처 | 저작자 | 라이선스 | 촬영 시점 |
|---|---|---|---|---|---|
| `ryu.jpg` | 류현진 | [Ryu Hyun-jin 2025.jpg](https://commons.wikimedia.org/wiki/File:Ryu_Hyun-jin_2025.jpg) | Trainholic | CC BY-SA 4.0 | **한화 신 CI(2025-04-11)** - 3002x3002 → 상반신 크롭 후 500x556 |
| `mdj.jpg` | 문동주 | `kbo_poc` 에서 이관 (원 출처는 `SOURCES-kbo.md`) | 커먼즈 기재 | CC BY-SA 4.0 | 한화 |
| `cjh.jpg` | 최재훈 | [Choi Jaehoon 2025.jpg](https://commons.wikimedia.org/wiki/File:Choi_Jaehoon_2025.jpg) | Seohae1999 | CC BY-SA 4.0 | **한화 신 CI(2025)** - 2700x3600 → 상반신 크롭 후 500x560 |

> **류현진 사진을 2026-08-26 에 바꿨다.** 원래는 커먼즈에서 가장 화질이 좋은 [다저스 시절(2013)](https://commons.wikimedia.org/wiki/File:Hyun_jin_Ryu_2013_NLDS.jpg) 사진이었는데,
> 구단 앱에서 **자기 팀 선수가 남의 유니폼을 입고 있는 것**은 화질로 갚아지지 않는다.
> 커먼즈의 한화 시절 후보는 셋뿐이었다 - 2008년 사진은 그물망 너머로 찍혀 쓸 수 없고,
> 2024년 사진은 촬영자 워터마크가 박혀 있다. 남은 2025년 사진이 해상도·신 CI·
> 투구 직후 자세 세 가지를 다 만족한다.

### 파일은 있으나 쓰지 않는 것

`pon.jpg`(폰세) · `wei.jpg`(와이스) · `flo.jpg`(플로리얼) 은 남아 있지만 `PLAYER_PHOTOS` 에서 뺐다.

- 폰세·와이스는 **2026 로스터에 없다.** 언제든 돌아올 수 있어 파일은 두되 지도에서만 뺐다.
- 플로리얼은 애초에 **양키스 마이너리그(2019) 사진**이었다. 로스터에서도 빠졌고, 남았더라도
  류현진을 다저스 사진에서 바꾼 것과 같은 이유로 쓸 수 없다.

`require` 가 없으면 Metro 번들에도 들어가지 않으므로 파일만 남는 값은 0 이다.

### 확보하지 못한 선수 - 35명 중 32명

2026-08-26 에 **한화 로스터 35명(타자 11 · 투수 24) 전원을 전수 조사**했다. 커먼즈에서 나온 것은
위 세 장이 전부다. 조사 범위는 이렇다.

- `Category:Hanwha Eagles` 하위 트리 전부, `Category:2024/2025/2026 in KBO League`
- 35명 각각을 **한글 이름 + 로마자 표기**로 파일 네임스페이스 검색
- 한국어 위키백과 35개 문서의 대표사진(`pageimages`)
- 파일명에 `Hanwha` 가 들어간 커먼즈 파일 전수

**한화 선수를 자유 라이선스로 올리는 사람은 사실상 한 명이다** - [User:Seohae1999](https://commons.wikimedia.org/wiki/User:Seohae1999)
가 대전 한화생명 볼파크에서 직접 찍어 CC BY-SA 로 올린다(이 문서의 `HH.jpg` 구장 사진도 같은 사람이다).
그 사람의 업로드 26장 중 현 로스터와 겹치는 것이 문동주·최재훈뿐이다.
나머지 32명은 국내 선수든 외국인 선수든 **구단·언론사 보도사진밖에 없어 받지 않았다.**

**이 32명은 등번호가 박힌 한화 홈 유니폼 아바타로 표시된다** (`JerseyAvatar`, `src/components/photos.tsx`).
얼굴은 지어낼 수 없지만 등번호는 로스터가 가진 사실이고 색은 구단 CI 다.

> **구단 공식 프로필 사진을 받으면** `node tools/ingest-player-photos.js` 로 한 번에 넣는다.
> 크롭·리사이즈·지도 갱신까지 도구가 하고, 이 표에 출처 줄을 채우는 것만 사람이 한다.
> ⚠ 구단 촬영본은 **저작권이 구단에 있다.** 사내 시연 범위를 벗어나려면 승인이 필요하다.

### 수집 중 걸러 낸 것

- **주현상**: 검색어 `Ju Hyun-sang` 이 가수 서현(Seohyun) 사진에 오매칭됐다. 눈으로 확인해 삭제했다. **자동 수집한 이미지는 반드시 육안 검수가 필요하다.**
- **강백호**: 자유 라이선스 사진이 [한 장 있으나](https://commons.wikimedia.org/wiki/File:Kang_Baek-Ho_2019_Premier_12.jpg) **2019 프리미어12 국가대표 유니폼**이라 뺐다. 같은 검색어가 가수 백호(NU'EST)에도 대량으로 걸린다.
- **이상규**: `이상규` 검색이 LG전자 임원 사진에 오매칭됐다.
- **함덕주**: 자유 라이선스 사진이 있었으나 **두산 시절 유니폼**이라 뺐다. 이 앱에서 함덕주는 LG 불펜으로 설정돼 있어 소속팀이 어긋난다.

---

## 굿즈 사진 (`goods/`) - **데모 대체 이미지**

키는 `src/goods.ts` 의 굿즈 id 다. 파일 이름만 맞으면 붙는다(`GOODS_PHOTOS`, `src/components/photos.tsx`).

> ### ⚠ 이 사진들은 한화 굿즈가 아니다
>
> **전부 같은 종류의 일반 상품 사진이다.** 한화 굿즈의 자유 라이선스 촬영본은 커먼즈에 없고,
> 구단 상품 컷은 저작권이 구단에 있어 받지 않았다(이 문서 맨 위의 수집 규칙).
>
> 이 사진들이 증명하는 것은 **상품이 아니라 자리**다 - 격자에 사진이 들어갔을 때의 리듬과
> 크기, 상세 시트의 전시 자리. 시연에서 "이게 실제 굿즈냐"는 질문이 나오면 아니라고 답해야 한다.
>
> 실서비스에서는 구단 촬영본으로 **파일만 갈아 끼운다** - 코드는 고치지 않는다.

수집·크롭은 [`tools/ingest-goods-photos.js`](../../tools/ingest-goods-photos.js) 가 한다.
검색 1등을 그대로 쓰지 않고 **사람이 지목한 파일**을 받는다(도구의 `PICKS`) - 커먼즈 검색은
"towel" 에 두루마리 화장지를, "orange cap" 에 주황색 버섯 갓과 동명이인의 초상을 물어 왔다.
가운데 기준으로 정사각 크롭 후 420x420, 품질 82.

| 파일 | 굿즈 | 무엇이 찍혔나 | 출처 | 저작자 | 라이선스 |
|---|---|---|---|---|---|
| `m-balloon.jpg` | 응원 막대풍선 | 일본 야구장의 제트풍선 - KBO 막대풍선과 같은 물건 | [ジェット風船 待機中 (27456227231).jpg](https://commons.wikimedia.org/wiki/File:%E3%82%B8%E3%82%A7%E3%83%83%E3%83%88%E9%A2%A8%E8%88%B9_%E5%BE%85%E6%A9%9F%E4%B8%AD_(27456227231).jpg) | Masahiro TAKAGI | CC BY 2.0 |
| `m-towel.jpg` | 응원 타월 | 개어 놓은 수건 | [Good morning towels.jpg](https://commons.wikimedia.org/wiki/File:Good_morning_towels.jpg) | ProjectManhattan | CC BY-SA 3.0 |
| `m-clapper.jpg` | 클래퍼 | 응원 도구 모음 (호루라기·마라카스) | [Noisemakers.jpg](https://commons.wikimedia.org/wiki/File:Noisemakers.jpg) | Hyaya | CC BY-SA 4.0 |
| `m-cap-home.jpg` | 2026 정모 (홈) | 무지 야구모자 | [Baseball cap.jpg](https://commons.wikimedia.org/wiki/File:Baseball_cap.jpg) | TexasRebel | Public domain |
| `m-cap-orange.jpg` | 볼캡 (오렌지) | 붉은 계열 야구모자 | [Baseball-Cap-c.jpg](https://commons.wikimedia.org/wiki/File:Baseball-Cap-c.jpg) | Me | CC0 |
| `m-bucket.jpg` | 버킷햇 | 버킷햇 | [Bucket Hat.jpg](https://commons.wikimedia.org/wiki/File:Bucket_Hat.jpg) | Motoguo20 | CC BY-SA 4.0 |
| `m-keyring.jpg` | 아크릴 키링 | 아크릴 키링 | [Key ring 1.jpg](https://commons.wikimedia.org/wiki/File:Key_ring_1.jpg) | NNU-11-Zaclee | CC BY-SA 3.0 |
| `m-badge.jpg` | 핀 뱃지 | 에나멜 핀 뱃지 | [CCS Pin Badge.jpg](https://commons.wikimedia.org/wiki/File:CCS_Pin_Badge.jpg) | Barry rimmer | CC BY-SA 3.0 |
| `m-pcpack.jpg` | 포토카드 랜덤팩 | 1909년 야구 카드 (Honus Wagner) | [HonusWagnerCard.jpg](https://commons.wikimedia.org/wiki/File:HonusWagnerCard.jpg) | Published by the American Tobacco Compan… | Public domain |
| `m-tumbler.jpg` | 보온 텀블러 | 보온병 | [Thermos closed - Thermos fermé.JPG](https://commons.wikimedia.org/wiki/File:Thermos_closed_-_Thermos_ferm%C3%A9.JPG) | Migmoug | CC BY-SA 4.0 |
| `m-mug.jpg` | 머그컵 | 도자 머그컵 | [Ceramic mug antisky ceramic.jpg](https://commons.wikimedia.org/wiki/File:Ceramic_mug_antisky_ceramic.jpg) | Ethan8808 | CC BY-SA 4.0 |
| `m-blanket.jpg` | 무릎담요 | 니트 담요 | [Grey knitted blanket.jpg](https://commons.wikimedia.org/wiki/File:Grey_knitted_blanket.jpg) | Hannah Clover | CC BY-SA 4.0 |
| `m-hoodie.jpg` | 후드 집업 | 매장에 걸린 후드 | [Bookstore - Hoodies for sale - Tulane University 2008.jpg](https://commons.wikimedia.org/wiki/File:Bookstore_-_Hoodies_for_sale_-_Tulane_University_2008.jpg) | Tulane Public Relations | CC BY 2.0 |
| `m-tee.jpg` | 반팔 티셔츠 | 흰 반팔 티셔츠 | [White simple T-shirt made by COQ manufacture.jpg](https://commons.wikimedia.org/wiki/File:White_simple_T-shirt_made_by_COQ_manufacture.jpg) | COQ Brand | CC BY-SA 4.0 |
| `m-sticker.jpg` | 스티커 팩 | 스티커 시트 | [3D-Aufkleber Gel-Aufkleber.jpg](https://commons.wikimedia.org/wiki/File:3D-Aufkleber_Gel-Aufkleber.jpg) | PhilipposZ | CC0 |

기계가 읽을 원본은 [`goods/_sources.json`](goods/_sources.json) 이다. 도구가 돌 때마다 다시 쓴다.

### 눈으로 걸러 낸 것

- **오렌지 볼캡**: 자유 라이선스 오렌지 모자 상품 컷이 커먼즈에 없다. 가장 가까운 붉은 계열로
  자리만 채웠다 - **색이 상품명과 어긋난다.** 실제 촬영본이 들어오면 가장 먼저 갈아야 할 한 장이다.
- **클래퍼**: 처음 고른 썬더스틱 사진은 농구장 관중석이 화면의 9할이라 물건이 아니라 장면으로
  읽혔다. 격자 타일에서는 상품 컷이어야 한다.
- **모자·후드·티셔츠**: 다른 학교·브랜드의 마크가 찍혀 있다. 데모로는 넘어가지만
  **외부 공개 자료에는 쓰지 않는다.**

## 구장 사진 (`stadium/`)

`kbo_poc` 에서 이관했다. 원 출처 기록은 [`SOURCES-kbo.md`](SOURCES-kbo.md) 에 있다.

| 파일 | 구장 | 저작자 | 라이선스 | 비고 |
|---|---|---|---|---|
| `HH.jpg` | 대전 한화생명 볼파크 | Seohae1999 | CC BY-SA 4.0 | 2025년 개장 신구장 - **현행과 일치** |
| `LG.jpg` | 잠실야구장 | Christophe95 | CC BY-SA 4.0 | 원정 경기용 |

---

## 구단 워드마크 (`../logo/`)

상단 브랜드 바의 로고다. 임시 표식(오렌지 사각형 + 'H')을 대체했다 - 앱을 열자마자 처음 보는 것이 임시 표식이면 그 아래를 아무리 다듬어도 시제품 인상이 남는다.

| 파일 | 출처 | 저작자 | 라이선스 | 가공 |
|---|---|---|---|---|
| `eagles-wordmark.png` | [Hanwha Eagles text logo.png](https://commons.wikimedia.org/wiki/File:Hanwha_Eagles_text_logo.png) | Hanwha Eagles | **퍼블릭도메인** (저작권 문턱 미달) | 흰 여백 크롭 (392x272 → 318x144) |
| `wordmark.png` | [Hanwha Eagles logo alt 3.png](https://commons.wikimedia.org/wiki/File:Hanwha_Eagles_logo_alt_3.png) | Matthew Wolff | **퍼블릭도메인** | 미사용 - 흰 글자라 어두운 면 전용 |

⚠ **퍼블릭도메인은 저작권 이야기이고 상표권은 별개다.** 시연·내부 검토를 넘어 배포하려면 구단 승인이 필요하다.

## 구단 엠블럼 (`emblem/`)

`kbo_poc` 에서 10개 전부 이관했다(48KB). 이 앱은 한화·LG 두 개만 쓰지만, 다른 구단으로 확장할 때 파일을 다시 모으지 않도록 전부 가져왔다.

⚠ **엠블럼은 구단 등록상표다.** 시연·내부 검토 범위를 벗어나 배포하려면 구단 승인이 필요하다.

---

## 재사용 시 주의

1. **상용 배포 전 라이선스 재검증** - 커먼즈의 라이선스 표기는 업로더 신고에 기반하므로 원본 권리관계가 다를 수 있다
2. **CC BY-SA 저작자 표시** - 앱 안에 고지 화면이 필요하다
3. **소속팀·시점 불일치** - `flo.jpg`(마이너) 는 한화 유니폼이 아니다. 시연에서 확대하지 않는 편이 좋다
4. **엠블럼·CI** - 구단 승인 대상
