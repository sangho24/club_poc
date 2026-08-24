# 이미지 자산 출처 및 라이선스

KBO 앱 PoC 시연용으로 웹에서 수집한 사진 자산의 출처 기록이다.
파트너 보고 자리에서 "이 사진 어디서 났느냐"는 질문에 답할 수 있어야 하므로 파일 단위로 출처 URL과 라이선스를 남긴다.

- **수집일**: 2026-08-05
- **수집처**: 위키미디어 커먼즈 (Wikimedia Commons) API
- **용도**: 사내 PoC 시연용. 상용 배포 시에는 아래 "재사용 시 주의" 항목을 반드시 확인할 것

## 라이선스 분류 요약

전체 28개 파일(구장 10 · 선수 13 · 미디어 5)이며, **라이선스가 불명확하거나 위험한 파일은 하나도 없다** (수집 단계에서 걸러 냈다).

| 분류 | 의미 | 해당 파일 | 개수 |
|---|---|---|---|
| **안전** | CC0 / 퍼블릭도메인. 조건 없이 사용 가능 | `stadium/LT.jpg`, `player/b3.jpg`, `media/m2.jpg` | 3 |
| **안전(조건부)** | CC BY / CC BY-SA. **저작자 표시 필수**, SA는 2차 저작물도 동일 조건 | 나머지 전부 | 25 |
| **불명확** | 라이선스 표기가 없거나 확인 불가 | (없음) | 0 |
| **위험** | 구단·언론사 보도사진 등 무단 사용 시 문제 | (없음 - 수집하지 않음) | 0 |

다만 **선수 사진 5장은 언론사·구단 유튜브 채널이 CC BY 로 공개한 영상의 캡처**라, 라이선스 자체는 유효하지만 재검증 우선순위가 높다. 아래 "선수 사진 관련 주의" 참조.

**CC BY-SA 는 "무료"가 아니라 "조건부"다.** 화면에 크게 쓰는 사진은 앱 안 어딘가(설정 > 오픈소스/저작권 고지 등)에 저작자와 라이선스를 표기해야 한다. 이 문서가 그 고지의 원본 데이터가 된다.

## 구장 사진 (`stadium/`)

파일명은 `src/data.ts` 의 `TeamId` 를 따른다. **구장은 9개, 파일은 10개다** - 잠실야구장을 LG·두산이 함께 쓰므로 `LG.jpg` 와 `OB.jpg` 는 같은 사진이다.

| 파일 | 구장 | 출처 (위키미디어 커먼즈) | 저작자 | 라이선스 | 크기 |
|---|---|---|---|---|---|
| `KIA.jpg` | 광주-기아 챔피언스 필드 | [Gwangju Kia Champions Field View 02.jpg](https://commons.wikimedia.org/wiki/File:Gwangju_Kia_Champions_Field_View_02.jpg) | Kastrot | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 259 KB |
| `SS.jpg` | 대구 삼성라이온즈파크 | [Daegu Samsung Lions Park on June 10th, 2018.jpg](https://commons.wikimedia.org/wiki/File:Daegu_Samsung_Lions_Park_on_June_10th,_2018.jpg) | Choi2451 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 292 KB |
| `LG.jpg` | 잠실야구장 | [Doosan Bears vs LG Twins (1).jpg](https://commons.wikimedia.org/wiki/File:Doosan_Bears_vs_LG_Twins_(1).jpg) | Christophe95 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 351 KB |
| `OB.jpg` | 잠실야구장 (LG.jpg 와 동일) | [Doosan Bears vs LG Twins (1).jpg](https://commons.wikimedia.org/wiki/File:Doosan_Bears_vs_LG_Twins_(1).jpg) | Christophe95 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 351 KB |
| `KT.jpg` | 수원 KT위즈파크 | [Suwon Sports Complex Baseball Stadium.jpg](https://commons.wikimedia.org/wiki/File:Suwon_Sports_Complex_Baseball_Stadium.jpg) | Jpbarrass | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 309 KB |
| `SSG.jpg` | 인천 SSG랜더스필드 | [Incheon SK Happy Dream Park 201809.jpg](https://commons.wikimedia.org/wiki/File:Incheon_SK_Happy_Dream_Park_201809.jpg) | Kp deri | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 254 KB |
| `LT.jpg` | 사직야구장 | [釜山社稷野球場.jpg](https://commons.wikimedia.org/wiki/File:%E9%87%9C%E5%B1%B1%E7%A4%BE%E7%A8%B7%E9%87%8E%E7%90%83%E5%A0%B4.jpg) | Rienzi | [CC0 (퍼블릭도메인)](http://creativecommons.org/publicdomain/zero/1.0/deed.en) | 389 KB |
| `HH.jpg` | 대전 한화생명 볼파크 | [Daejeon hanwha Life Ballpark 2025.jpg](https://commons.wikimedia.org/wiki/File:Daejeon_hanwha_Life_Ballpark_2025.jpg) | Seohae1999 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 296 KB |
| `NC.jpg` | 창원 NC파크 | [Chanwon NC Park.jpg](https://commons.wikimedia.org/wiki/File:Chanwon_NC_Park.jpg) | Rienzi | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 284 KB |
| `WO.jpg` | 고척 스카이돔 | [Gocheok Sky Dome (36530170325).jpg](https://commons.wikimedia.org/wiki/File:Gocheok_Sky_Dome_(36530170325).jpg) | redlegsfan21 (Vandalia, OH, USA) | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) | 410 KB |

### 구장 사진 관련 주의

- **`SSG.jpg` 는 SK 와이번스 시절(2018) 사진이다.** 전광판에 'SK 와이번스'·'인천 SK 행복드림구장' 표기가 보인다. 구장 자체는 같은 문학야구장이지만 시연에서 확대해 보면 구 구단명이 읽힌다. 커먼즈에 SSG 랜더스 개명(2021) 이후 사진이 아직 없어 대체하지 못했다
- **`KIA.jpg`·`SS.jpg`·`LG.jpg`·`LT.jpg`·`NC.jpg`·`WO.jpg` 는 촬영 시점이 제각각이다.** 광고판·전광판 내용이 현재와 다르다
- `WO.jpg` 는 2017 WBC(월드 베이스볼 클래식) 경기 장면이라 그라운드에 WBC 로고가 그려져 있다. 고척돔 내부를 가장 잘 보여 주는 사진이라 채택했다
- `HH.jpg` 는 2025년 개장한 신구장(대전 한화생명 볼파크) 사진이라 현행과 일치한다

## 선수 사진 (`player/`)

파일명은 `src/recordsData.ts` 의 `BATTER_SEEDS`·`PITCHER_SEEDS` **선수 id** 를 따른다 (`b1`~`b10` 타자, `p1`~`p12` 투수). `src/data.ts` 의 `UserProfile.favPlayers` 가 같은 id 를 저장하므로 id 하나로 찜 선수 → 사진이 바로 연결된다.

**22명 중 13명 확보, 9명은 커먼즈에 없어 실패했다.** 전부 500KB 이하, 폭 448~500px 인물 사진이다.

| 파일 | 선수 | 소속 | 출처 (위키미디어 커먼즈) | 저작자 | 라이선스 | 크기 |
|---|---|---|---|---|---|---|
| `b2.jpg` | 구자욱 | 삼성 | [2017 09 01 삼성 vs SK 굿바이 라이온킹 1 (4).jpg](https://commons.wikimedia.org/wiki/File:2017_09_01_%EC%82%BC%EC%84%B1_vs_SK_%EA%B5%BF%EB%B0%94%EC%9D%B4_%EB%9D%BC%EC%9D%B4%EC%98%A8%ED%82%B9_1_(4).jpg) | WiiWii | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | 34 KB |
| `b3.jpg` | 에레디아 | SSG | [Guillermo Heredia during warmups, Aug 05 2022 (cropped).jpg](https://commons.wikimedia.org/wiki/File:Guillermo_Heredia_during_warmups,_Aug_05_2022_(cropped).jpg) | D. Benjamin Miller | [CC0 (퍼블릭도메인)](http://creativecommons.org/publicdomain/zero/1.0/deed.en) | 84 KB |
| `b4.jpg` | 양의지 | 두산 | [151208. 2015 KBO 골든 글러브 시상식. 62.jpg](https://commons.wikimedia.org/wiki/File:151208._2015_KBO_%EA%B3%A8%EB%93%A0_%EA%B8%80%EB%9F%AC%EB%B8%8C_%EC%8B%9C%EC%83%81%EC%8B%9D._62.jpg) | MFDICE의 이것저것 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | 47 KB |
| `b6.jpg` | 강백호 | KT | [Kang Baek-Ho 2019 Premier 12.jpg](https://commons.wikimedia.org/wiki/File:Kang_Baek-Ho_2019_Premier_12.jpg) | Trainholic | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 87 KB |
| `b8.jpg` | 윤동희 | 롯데 | [윤동희 선수.jpg](https://commons.wikimedia.org/wiki/File:%EC%9C%A4%EB%8F%99%ED%9D%AC_%EC%84%A0%EC%88%98.jpg) | OSEN SPORTS | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | 51 KB |
| `b9.jpg` | 데이비슨 | NC | [Matt Davidson Nashville 2019.jpg](https://commons.wikimedia.org/wiki/File:Matt_Davidson_Nashville_2019.jpg) | Minda Haas Kuhlmann (Omaha) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | 92 KB |
| `b10.jpg` | 송성문 | 키움 | [송성문 선수.jpg](https://commons.wikimedia.org/wiki/File:%EC%86%A1%EC%84%B1%EB%AC%B8_%EC%84%A0%EC%88%98.jpg) | OSEN SPORTS | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | 49 KB |
| `p3.jpg` | 원태인 | 삼성 | [원태인 선수.jpg](https://commons.wikimedia.org/wiki/File:%EC%9B%90%ED%83%9C%EC%9D%B8_%EC%84%A0%EC%88%98.jpg) | LionsTV | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | 32 KB |
| `p4.jpg` | 문동주 | 한화 | [Moon Dong-ju 2023.jpg](https://commons.wikimedia.org/wiki/File:Moon_Dong-ju_2023.jpg) | Seohae1999 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | 50 KB |
| `p5.jpg` | 김광현 | SSG | [Kim Kwang-hyun 2019 Premier 12.jpg](https://commons.wikimedia.org/wiki/File:Kim_Kwang-hyun_2019_Premier_12.jpg) | Trainholic | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 66 KB |
| `p7.jpg` | 고영표 | KT | [고영표 야구 선수.jpg](https://commons.wikimedia.org/wiki/File:%EA%B3%A0%EC%98%81%ED%91%9C_%EC%95%BC%EA%B5%AC_%EC%84%A0%EC%88%98.jpg) | OSEN SPORTS | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | 54 KB |
| `p8.jpg` | 곽빈 | 두산 | [Gwak Been 2023.jpg](https://commons.wikimedia.org/wiki/File:Gwak_Been_2023.jpg) | Seohae1999 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | 64 KB |
| `p12.jpg` | 김택연 | 두산 | [김택연 선수.jpg](https://commons.wikimedia.org/wiki/File:%EA%B9%80%ED%83%9D%EC%97%B0_%EC%84%A0%EC%88%98.jpg) | BEARS TV | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | 69 KB |

### 확보 실패 (9명)

`b1` 김도영(KIA) · `b5` 문보경(LG) · `b7` 노시환(한화) · `p1` 안우진(키움) · `p2` 네일(KIA) · `p6` 임찬규(LG) · `p9` 박세웅(롯데) · `p10` 신민혁(NC) · `p11` 정해영(KIA)

커먼즈에 자유 라이선스 사진이 없다. **구단 공식 사이트·언론사 보도사진은 저작권이 불명확해 의도적으로 받지 않았다.** 화면에서는 사진이 없는 선수를 대비해 **이니셜·엠블럼 기반 플레이스홀더로 폴백**하도록 만들어야 한다 (13/22 만 있으므로 폴백은 예외가 아니라 기본 경로다).

### 선수 사진 관련 주의

- **소속팀이 현재와 다른 사진이 섞여 있다.** 시연에서 확대하면 유니폼이 읽히므로 미리 알고 있어야 한다
  - `b3.jpg` 에레디아 - **애틀랜타 브레이브스(MLB) 시절**. SSG 유니폼이 아니다
  - `b9.jpg` 데이비슨 - **내슈빌 사운즈(MiLB) 시절**. NC 유니폼이 아니다
  - `b6.jpg` 강백호 · `p5.jpg` 김광현 - **국가대표(2019 프리미어12)** 유니폼. 소속 구단 유니폼이 아니다
  - `b4.jpg` 양의지 · `p12.jpg` 김택연 - **시상식 정장** 차림
  - `p3.jpg` 원태인 - 정장 차림 + 영상 캡처라 **해상도가 가장 낮다**(13장 중 최하)
- **`b2`(구자욱)·`p4`(문동주)·`p8`(곽빈) 3장은 원본에서 인물 부분만 잘라낸 크롭본이다.** 원본이 전신샷·가로 사진이라 폭 500px 로 줄이면 얼굴이 40px 수준이라 알아볼 수 없었다. CC 라이선스가 2차적 저작물을 허용하므로 크롭 자체는 문제없지만, **CC BY-SA 는 2차 저작물도 동일 라이선스로 배포해야 하고 "원본을 변형했다"는 사실을 밝혀야 한다.** 이 문서가 그 고지에 해당한다 (구장·미디어 사진은 크롭 없이 축소만 했다)
- **`b8`·`b10`·`p3`·`p7`·`p12` 5장은 언론사·구단 유튜브 채널 영상의 캡처다** (OSEN SPORTS · LionsTV · BEARS TV). 유튜브 표준 CC BY 3.0 라이선스로 공개된 영상이라 커먼즈 업로드 자체는 적법하지만, **원 저작자가 언론사·구단이라는 점에서 다른 사진들보다 재검증 필요도가 높다.** 상용 전환 시 이 5장은 우선 교체 대상으로 본다

## 미디어 썸네일 (`media/`)

파일명은 `src/data.ts` 의 `MEDIA_FEED` 항목 id 를 따른다. **실제 그 영상의 썸네일이 아니라 태그·주제에 맞춘 시연용 대체 이미지다.**

| 파일 | 태그 | 장면 | 출처 (위키미디어 커먼즈) | 저작자 | 라이선스 | 크기 |
|---|---|---|---|---|---|---|
| `m1.jpg` | 하이라이트 | 잠실 야간 경기, 응원하는 관중석 너머 그라운드 | [Doosan Bears vs LG Twins (3).jpg](https://commons.wikimedia.org/wiki/File:Doosan_Bears_vs_LG_Twins_(3).jpg) | Christophe95 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 330 KB |
| `m2.jpg` | 숏폼 | 투수 릴리스 순간 (타자·주심 포함) | [Air Force vs. Fresno State, throwing heat.jpg](https://commons.wikimedia.org/wiki/File:Air_Force_vs._Fresno_State,_throwing_heat.jpg) | Justin R. Pacheco | 퍼블릭도메인 (미 공군 촬영물) | 318 KB |
| `m3.jpg` | 인터뷰 | KBO 프로야구 미디어데이 무대 인터뷰 | [2017 03 27 프로야구 미디어데이 2 (3).jpg](https://commons.wikimedia.org/wiki/File:2017_03_27_%ED%94%84%EB%A1%9C%EC%95%BC%EA%B5%AC_%EB%AF%B8%EB%94%94%EC%96%B4%EB%8D%B0%EC%9D%B4_2_(3).jpg) | WiiWii | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | 285 KB |
| `m4.jpg` | 스케치 | 고척스카이돔 응원단·치어리더·마스코트 | [Cheer Nexen Heroes in Gocheok Dome 2018.jpg](https://commons.wikimedia.org/wiki/File:Cheer_Nexen_Heroes_in_Gocheok_Dome_2018.jpg) | Trainholic | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 296 KB |
| `m5.jpg` | 하이라이트 | 2루 병살 수비, 슬라이딩 주자 위로 송구 | [Max Moroff in 2017 (34361189243).jpg](https://commons.wikimedia.org/wiki/File:Max_Moroff_in_2017_(34361189243).jpg) | Keith Allison (Hanover, MD, USA) | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) | 291 KB |

### 미디어 썸네일 관련 주의

- **`m2.jpg`·`m5.jpg` 는 KBO 가 아니다.** m2 는 미국 대학야구(공군사관학교 vs 프레즈노주립대), m5 는 MLB(피츠버그 파이리츠 vs 볼티모어 오리올스)다. 커먼즈의 KBO 카테고리에는 **경기 중 투구·수비 액션 사진이 사실상 없어**(대부분 인물 정면사진·구장 외관·시구 사진) 일반 야구 사진으로 대체했다. 유니폼을 보면 KBO 가 아님이 드러나므로 시연에서 이 두 장을 확대하지 않는 편이 좋다
- **`m1.jpg` 과 `stadium/LG.jpg`·`stadium/OB.jpg` 는 같은 촬영자(Christophe95)의 같은 잠실 경기 사진 세트다.** 서로 다른 컷을 골라 화면에서 겹쳐 보이지 않게 했지만, 나란히 놓으면 같은 장소임이 보인다
- `m4.jpg` 는 **넥센 히어로즈 시절(2018)** 응원 장면이다. 현재 구단명은 키움 히어로즈다

## 재사용 시 주의

1. **CC BY-SA 는 저작자 표시가 의무다.** 앱에 실을 때 설정 화면 등에 이 문서 기준의 저작자·라이선스 고지를 넣어야 한다
2. **CC BY-SA 는 "동일조건변경허락"이다.** 사진을 잘라 쓰거나 필터를 입힌 2차 저작물도 같은 라이선스로 배포해야 한다. 단순히 앱 화면에 표시하는 것은 2차 저작물 생성이 아니므로 표시 의무만 지키면 되지만, **`player/b2.jpg`·`p4.jpg`·`p8.jpg` 3장은 실제로 크롭한 2차 저작물이다** (위 "선수 사진 관련 주의" 참조). 이 중 `p4`·`p8` 은 CC BY-SA 3.0 이라 동일 라이선스 조건이 따라붙는다
3. **상용 서비스로 갈 때는 구단·KBO 와 사진 사용 협의가 필요하다.** 위 사진들은 일반 관중이 촬영해 커먼즈에 올린 것이라 저작권은 해결되지만, 구장 내 상표·구단 아이덴티티가 함께 찍혀 있다
4. 파일 크기는 번들 용량을 고려해 전부 500KB 이하로 맞췄다 (원본 대신 커먼즈 썸네일 API 로 폭 800~1200px 축소본을 받았다)
