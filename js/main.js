// ============================================================
//  main.js
//  게임 전체 상태 머신 & p5.js 진입점
//
//  [ 게임 흐름 ]
//
//  INTRO(타이틀)
//    → CUTSCENE(scene1)   (오프닝 컷신)
//    → PIXEL_EDITOR        (캐릭터 생성)
//    → CHARACTER_CONFIRM   (내 캐릭터 + 속성 확인 화면)
//    → PUZZLE_ROOM         (스테이지 1 퍼즐)
//    → CUTSCENE(scene2)   (의뢰 완료 컷신)
//    → STAGE1_CLEAR        (스테이지 1 클리어 화면 — 임시)
//    → CUTSCENE(scene3)   (새 의뢰 컷신)
//    → PIXEL_EDITOR        (스테이지 2 캐릭터 생성)
//    → CHARACTER_CONFIRM
//    → PUZZLE_ROOM         (스테이지 2 퍼즐)
//    → CUTSCENE(scene4)   (위기 컷신)
//
//  [ 상태(currentState) 목록 ]
//  'INTRO'              : 오프닝 타이틀 화면
//  'CUTSCENE'           : 컷신 (cutscene.js 의 CUTSCENE 모듈)
//  'PIXEL_EDITOR'       : 픽셀 그림판 — 캐릭터(백신) 디자인
//  'CHARACTER_CONFIRM'  : 캐릭터 + 속성 확인 화면 (클릭하면 게임 시작)
//  'PUZZLE_ROOM'        : 퍼즐 방 — 스테이지당 3개 순서대로 진행
//  'STAGE1_CLEAR'       : 스테이지 1 클리어 임시 화면 (클릭하면 다음으로)
//  'STAGE_CLEAR'        : 스테이지 클리어 (미래 확장용)
//
//  [ 추후 파일 분리 계획 ]
//  drawPuzzleRoom()  → puzzle.js
//  drawStageClear()  → story.js
// ============================================================


// ──────────────────────────────────────────────────────────
//  전역 게임 상태
// ──────────────────────────────────────────────────────────
let currentState = 'INTRO';

// ──────────────────────────────────────────────────────────
//  스테이지 / 방 진행 추적
//
//  currentStage : 현재 스테이지 번호 (1부터 시작)
//  currentRoom  : 현재 방 번호 (1 ~ ROOMS_PER_STAGE)
//
//  방을 클리어할 때마다 currentRoom++
//  currentRoom > ROOMS_PER_STAGE 이면 STAGE_CLEAR 로 전환
//  스테이지를 클리어할 때마다 currentStage++, currentRoom = 1 로 리셋
// ──────────────────────────────────────────────────────────
const ROOMS_PER_STAGE = 3;   // 스테이지당 퍼즐 방 수 (변경 시 여기만 수정)
let currentStage = 1;
let currentRoom  = 1;

// ──────────────────────────────────────────────────────────
//  플레이어 캐릭터 인스턴스
//
//  픽셀 에디터 완료 후 createCharacter() 로 생성됨 (character.js 참고)
//  이후 모든 화면에서 player 하나만 참조하면 됨.
//
//  [ 접근 예시 ]
//  player.attribute.name → '불' | '물' | '풀'
//  player.moveCount      → 남은 이동 횟수 (이동 시 player.moveCount--)
//  player.isAlive        → 이동 횟수 소진 시 false → 방 재시작
//  player.sprite         → p5.Image (렌더링용)
//  player.imageDataURL   → base64 PNG (저장/불러오기용)
//
//  [ 교수님 저장/불러오기 연결 방법 ]
//  저장: player.imageDataURL + player.attribute.name 을 DB에 보존
//  복원: loadImage(savedDataURL, img => { player = createCharacter(saved, img); })
// ──────────────────────────────────────────────────────────
let player = null;

// ──────────────────────────────────────────────────────────
//  16:9 고정 가상 해상도 / 레터박스 스케일링
//  모든 게임 화면은 1600×900 좌표계에서 그려지고,
//  실제 브라우저 창에는 비율을 유지한 채 중앙에 확대/축소됨.
// ──────────────────────────────────────────────────────────
const VIRTUAL_WIDTH  = 1600;
const VIRTUAL_HEIGHT = 900;
let viewScale = 1;
let viewOffsetX = 0;
let viewOffsetY = 0;

function updateViewport() {
  viewScale = Math.min(windowWidth / VIRTUAL_WIDTH, windowHeight / VIRTUAL_HEIGHT);
  viewOffsetX = (windowWidth  - VIRTUAL_WIDTH  * viewScale) / 2;
  viewOffsetY = (windowHeight - VIRTUAL_HEIGHT * viewScale) / 2;
}

function screenToGameX(x) { return (x - viewOffsetX) / viewScale; }
function screenToGameY(y) { return (y - viewOffsetY) / viewScale; }
function gameMouseX() { return screenToGameX(mouseX); }
function gameMouseY() { return screenToGameY(mouseY); }
function isMouseInsideGame() {
  const gx = gameMouseX();
  const gy = gameMouseY();
  return gx >= 0 && gx <= VIRTUAL_WIDTH && gy >= 0 && gy <= VIRTUAL_HEIGHT;
}

function beginGameView() {
  background(0); // 레터박스 영역은 항상 검은색
  push();
  translate(viewOffsetX, viewOffsetY);
  scale(viewScale);
}

function endGameView() {
  pop();
}

function gameBackground(...args) {
  push();
  noStroke();
  fill(...args);
  rect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  pop();
}


// ──────────────────────────────────────────────────────────
//  상태 전환 함수
//
//  사용법: transitionTo('PUZZLE_ROOM')
//  어느 파일에서도 호출 가능 (전역 함수)
//
//  새 상태를 추가할 때:
//  1. switch 에 case 추가 (초기화 코드 작성)
//  2. draw() 의 switch 에 렌더 함수 연결
//  3. mousePressed() / keyPressed() 에 입력 처리 추가
// ──────────────────────────────────────────────────────────
function transitionTo(newState) {
  console.log(`[STATE] ${currentState} → ${newState}`);
  currentState = newState;

  switch (newState) {

    // ── 컷신 진입 ───────────────────────────────────────
    // transitionTo('CUTSCENE') 를 직접 호출하지 말고
    // startCutscene(sceneId, callback) 헬퍼를 사용하세요.
    case 'CUTSCENE':
      // CUTSCENE.start() 는 startCutscene() 에서 호출됨
      break;

    // ── 스테이지 1 클리어 임시 화면 ──────────────────────
    case 'STAGE1_CLEAR':
      // 클릭 처리는 mousePressed 에서 담당
      break;

    // ── 픽셀 에디터 진입 ────────────────────────────────
    case 'PIXEL_EDITOR':
      // 에디터 초기화 + 완료 콜백 등록
      // 완료 버튼을 누르면 아래 콜백이 실행됨
      PE.init((result) => {

        // base64 PNG → p5.Image 변환 후 캐릭터 인스턴스 생성
        loadImage(result.imageDataURL, (sprite) => {

          player = createCharacter(result, sprite);

          console.log('[Character Created] attribute:', player.attribute?.name);

          // 에디터 완료 → 속성 확인 화면으로 이동
          transitionTo('CHARACTER_CONFIRM');
        });
      });
      break;

    // ── 캐릭터 확인 화면 진입 ───────────────────────────
    // 에디터 완료 직후 표시. 클릭하면 PUZZLE_ROOM 으로 이동.
    case 'CHARACTER_CONFIRM':
      // 별도 초기화 없음 — player 가 이미 채워져 있음
      break;

    // ── 퍼즐 방 진입 ────────────────────────────────────
    case 'PUZZLE_ROOM':
      PUZZLE.init({
        player:  player,
        room:    currentRoom,    // 방 번호 전달 → HUD 표시에 사용
        onClear: onRoomClear,
      });
      break;

    // ── 스테이지 클리어 진입 (미래 확장용) ─────────────
    case 'STAGE_CLEAR':
      break;

    case 'INTRO':
      break;

    default:
      console.warn('[STATE] 알 수 없는 상태:', newState);
      break;
  }
}

// ──────────────────────────────────────────────────────────
//  방 클리어 처리
//
//  puzzle.js 에서 방을 클리어하면 이 함수를 호출
//  예: onRoomClear()
//
//  방 3개를 모두 클리어하면 → STAGE_CLEAR
//  아직 남은 방이 있으면    → 다음 방으로 PUZZLE_ROOM 재진입
// ──────────────────────────────────────────────────────────
function onRoomClear() {
  console.log(`[CLEAR] 스테이지 ${currentStage} / 방 ${currentRoom} 클리어`);

  if (currentRoom >= ROOMS_PER_STAGE) {
    // 마지막 방 클리어
    if (currentStage === 1) {
      // 스테이지 1 종료 → 컷신2 (바이러스 제거 성공)
      startCutscene('scene2', () => {
        transitionTo('STAGE1_CLEAR');
      });
    } else {
      // 스테이지 2 이상 → 컷신4
      startCutscene('scene4', () => {
        // TODO: 이후 스테이지 추가 시 여기서 분기
        transitionTo('STAGE_CLEAR');
      });
    }
  } else {
    // 다음 방으로 이동
    currentRoom++;
    transitionTo('PUZZLE_ROOM');
  }
}

// ──────────────────────────────────────────────────────────
//  스테이지 클리어 종료 처리
//
//  story.js 에서 사연 컷신이 끝나면 이 함수를 호출
//  예: onStageClearEnd()
//
//  다음 스테이지로 진행하거나 게임 종료 처리를 여기에 작성
// ──────────────────────────────────────────────────────────
function onStageClearEnd() {
  console.log(`[CLEAR] 스테이지 ${currentStage} 종료`);

  currentStage++;
  currentRoom = 1;

  // 스테이지1 클리어 후 → 컷신3(새 의뢰) → 스테이지2 시작
  startCutscene('scene3', () => {
    transitionTo('PIXEL_EDITOR');
  });
}


// ──────────────────────────────────────────────────────────
//  p5.js preload() — 게임 시작 전 리소스 로드
//
//  폰트, 이미지 등 setup() 전에 반드시 준비돼야 하는 것들
// ──────────────────────────────────────────────────────────
let gameFont;   // 전역 — 모든 화면에서 textFont(gameFont) 로 사용 가능
let completeButtonUnPush;
let completeButtonPush;
let board;
let screen;
let whiteBoard;

// ── 컷신 에셋 (cutscene.js 에서 window[varName] 으로 참조) ──
// 컷신 1
let boy01, boy02, boy03;
let girl01, girl02, girl03;
// 컷신 2 추가 이미지
let girl04, girl05, girl06;
// 컷신 3 추가 이미지
let boy04, boy05, boy06;
// 공용 배경/UI
let backgrounds, comu, room;
// 효과음
let click, doorbell, doorOpen, bip, clank;

function preload() {
  // ── 폰트 ──────────────────────────────────────────────
  gameFont = loadFont('assets/x12y12pxMaruMinyaHangul.ttf');

  // ── 픽셀 에디터 UI ────────────────────────────────────
  whiteBoard            = loadImage('whiteboard.png');
  completeButtonUnPush  = loadImage('completeButtonUnPush.png');
  completeButtonPush    = loadImage('completeButtonPush.png');
  board                 = loadImage('board.png');
  screen                = loadImage('screen.png');

  // ── 컷신 배경 & 공용 UI ───────────────────────────────
  backgrounds = loadImage('assets/background.png');
  room        = loadImage('assets/room.png');
  comu        = loadImage('assets/communicate.png');

  // ── 컷신 캐릭터 이미지 ────────────────────────────────
  boy01 = loadImage('assets/boy01.png');
  boy02 = loadImage('assets/boy02.png');
  boy03 = loadImage('assets/boy03.png');
  boy04 = loadImage('assets/boy03_1.png');   // 싸이코
  boy05 = loadImage('assets/boy01_2.png');   // 말하는 중
  boy06 = loadImage('assets/boy04.png');     // 당황

  girl01 = loadImage('assets/girl01.png');   // 노트북
  girl02 = loadImage('assets/girl02.png');   // 땀
  girl03 = loadImage('assets/girl03.png');   // 인사
  girl04 = loadImage('assets/girl04.png');   // 안도
  girl05 = loadImage('assets/girl02_2.png'); // 따뜻한 눈빛
  girl06 = loadImage('assets/girl02_3.png'); // 능글

  // ── 효과음 ────────────────────────────────────────────
  click    = loadSound('assets/button-click.mp3');
  doorbell = loadSound('assets/door-bell.wav');
  doorOpen = loadSound('assets/door-opening.wav');
  bip      = loadSound('assets/bip.wav');
  clank    = loadSound('assets/clank.wav');
}

// ──────────────────────────────────────────────────────────
//  p5.js setup()
// ──────────────────────────────────────────────────────────
function setup() {
  createCanvas(windowWidth, windowHeight);
  updateViewport();
  textFont(gameFont);
  frameRate(60);

  // 게임 시작 → 타이틀 화면 (INTRO)
  // 타이틀에서 '게임 시작' 클릭 시 컷신1로 이동 (mousePressed 에서 처리)
  transitionTo('INTRO');
}

// 브라우저 창 크기 바뀔 때 캔버스도 같이 조정
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateViewport();
}

// ──────────────────────────────────────────────────────────
//  p5.js draw() — 상태별 렌더 함수 디스패치
//
//  새 상태 추가 시 여기에 case 한 줄 추가
// ──────────────────────────────────────────────────────────
function draw() {
  beginGameView();
  switch (currentState) {
    case 'INTRO':              drawIntro();            break;
    case 'CUTSCENE':           CUTSCENE.draw();        break;
    case 'PIXEL_EDITOR':       PE.draw();              break;
    case 'CHARACTER_CONFIRM':  drawCharacterConfirm(); break;
    case 'PUZZLE_ROOM':        drawPuzzleRoom();       break;
    case 'STAGE1_CLEAR':       drawStage1Clear();      break;
    case 'STAGE_CLEAR':        drawStageClear();       break;
    default:
      gameBackground(0);
      fill(255); textSize(14); textAlign(LEFT, TOP);
      text('알 수 없는 상태: ' + currentState, 10, 10);
  }
  endGameView();
}

// ──────────────────────────────────────────────────────────
//  p5.js mousePressed()
// ──────────────────────────────────────────────────────────
function mousePressed() {
  switch (currentState) {
    case 'INTRO':
      // 타이틀 게임 시작 버튼 클릭 → 컷신1
      {
        const btnX = VIRTUAL_WIDTH / 2;
        const btnY = 280;
        const btnW = 220;
        const btnH = 70;

        if (
          isMouseInsideGame() &&
          gameMouseX() >= btnX - btnW / 2 &&
          gameMouseX() <= btnX + btnW / 2 &&
          gameMouseY() >= btnY - btnH / 2 &&
          gameMouseY() <= btnY + btnH / 2
        ) {
          // 타이틀 → 컷신1 → 픽셀 에디터
          startCutscene('scene1', () => {
            transitionTo('PIXEL_EDITOR');
          });
        }
      }
      break;

    case 'CUTSCENE':
      CUTSCENE.handleClick();
      break;

    case 'PIXEL_EDITOR':
      if (isMouseInsideGame()) PE.handleClick(gameMouseX(), gameMouseY());
      break;

    // 확인 화면 — 아무 곳이나 클릭하면 퍼즐로 이동
    case 'CHARACTER_CONFIRM':
      transitionTo('PUZZLE_ROOM');
      break;

    case 'PUZZLE_ROOM':
      // TODO: puzzle.js 구현 후 아래 주석 해제
      // PUZZLE.handleClick(mouseX, mouseY);
      break;

    // 스테이지 1 클리어 화면 — 클릭하면 onStageClearEnd 실행
    case 'STAGE1_CLEAR':
      if (isMouseInsideGame()) onStageClearEnd();
      break;

    case 'STAGE_CLEAR':
      break;
  }
}

// ──────────────────────────────────────────────────────────
//  p5.js mouseDragged()
// ──────────────────────────────────────────────────────────
function mouseDragged() {
  if (currentState === 'PIXEL_EDITOR') {
    if (isMouseInsideGame()) PE.handleDrag(gameMouseX(), gameMouseY());
  }
}

// ──────────────────────────────────────────────────────────
//  p5.js keyPressed()
// ──────────────────────────────────────────────────────────
function keyPressed() {
  switch (currentState) {
    case 'CUTSCENE':
      CUTSCENE.handleKey(key);
      break;

    case 'PIXEL_EDITOR':
      PE.handleKey(key);
      break;

    case 'PUZZLE_ROOM':
      // 방향키는 key 변수에 'ArrowUp' 등으로 들어옴
      PUZZLE.handleKey(key);
      // 방향키 기본 동작(스크롤) 방지
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)) {
        return false;
      }
      break;
  }
}


// ══════════════════════════════════════════════════════════
//  상태별 렌더 함수
//  구현이 완료되면 각자의 .js 파일로 분리하고
//  해당 파일의 draw 함수를 여기서 호출하는 방식으로 교체
// ══════════════════════════════════════════════════════════

// ── CHARACTER_CONFIRM ─────────────────────────────────────
//  에디터 완료 직후 표시되는 캐릭터 확인 화면.
//  왼쪽: 내가 그린 캐릭터 스프라이트
//  오른쪽: 부여된 속성 안내 텍스트
//  클릭하면 PUZZLE_ROOM 으로 이동 (mousePressed 에서 처리)
function drawCharacterConfirm() {
  gameBackground(30);

  // ── 속성별 배경 포인트 컬러 ─────────────────────────────
  // 속성에 따라 화면 분위기를 살짝 다르게
  const attrName = player?.attribute?.name ?? null;
  let accentColor;
  if      (attrName === '불') accentColor = color(205, 52,  52);
  else if (attrName === '물') accentColor = color(52,  118, 205);
  else if (attrName === '풀') accentColor = color(132, 180, 67);
  else                        accentColor = color(180, 180, 180);

  // 화면 상단/하단 얇은 강조선
  noStroke();
  fill(accentColor);
  rect(0, 0,      VIRTUAL_WIDTH, 4);
  rect(0, VIRTUAL_HEIGHT - 4, VIRTUAL_WIDTH, 4);

  // ── 캐릭터 스프라이트 (왼쪽 중앙) ──────────────────────
  // 16×16 원본을 8배 확대 → 128×128
  const SCALE  = 8;
  const sprW   = PE.COLS * SCALE;
  const sprH   = PE.ROWS * SCALE;
  const sprX   = VIRTUAL_WIDTH / 2 - 150;   // 화면 중앙 기준 왼쪽
  const sprY   = VIRTUAL_HEIGHT / 2;

  imageMode(CENTER);
  noSmooth();
  if (player?.sprite) {
    image(player.sprite, sprX, sprY, sprW, sprH);
  }
  imageMode(CORNER);

  // ── 오른쪽 텍스트 영역
  const textX = VIRTUAL_WIDTH / 2 + 20;   // 스프라이트 오른쪽

  textAlign(LEFT, CENTER);

  // 안내 문구
  fill(180);
  textSize(14);
  text('당신의 캐릭터 속성은', textX, VIRTUAL_HEIGHT / 2 - 40);

  // 속성 이름 (크게, 강조색)
  fill(accentColor);
  textSize(36);
  text(attrName ?? '없음', textX, VIRTUAL_HEIGHT / 2 + 10);

  // "입니다" 마무리
  fill(180);
  textSize(14);
  text('입니다.', textX, VIRTUAL_HEIGHT / 2 + 60);

  // ── 하단 클릭 안내 ──────────────────────────────────────
  // 깜빡임 효과
  if ((frameCount % 60) < 40) {
    fill(220);
    textSize(12);
    textAlign(CENTER, CENTER);
    text('클릭하여 게임 시작', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT - 30);
  }
}

// ── INTRO ─────────────────────────────────────────────────
function drawIntro() {
  gameBackground(255);
  textFont(gameFont);
  textAlign(CENTER, CENTER);
  fill(20);
  textSize(48);
  text("백신 구조대", VIRTUAL_WIDTH / 2, 150);

  const btnX = VIRTUAL_WIDTH / 2;
  const btnY = 280;
  const btnW = 220;
  const btnH = 70;

  rectMode(CENTER);

  fill(40, 120, 255);
  stroke(20);
  strokeWeight(2);
  rect(btnX, btnY, btnW, btnH, 12);

  noStroke();
  fill(255);
  textSize(24);
  text("게임 시작", btnX, btnY);

  rectMode(CORNER);

  fill(100);
  textSize(14);
  textAlign(RIGHT, BOTTOM);
  text("김한결, 박소이", VIRTUAL_WIDTH - 20, VIRTUAL_HEIGHT - 15);

  fill(70);
  textSize(10);
  textAlign(CENTER, CENTER);
  text("스스로 백신 캐릭터를 디자인 한 다음 속성을 부여받아\n바이러스에 감염된 복잡한 퍼즐 내부 공간을 통과하여 의뢰를 완료하세요!", btnX, btnY + 60);
}

// ── PUZZLE_ROOM ───────────────────────────────────────────
function drawPuzzleRoom() {
  PUZZLE.draw();
}

// ── STAGE1_CLEAR (임시) ───────────────────────────────────
//  아직 클리어 전용 일러스트가 없으므로 텍스트로만 표시.
//  이미지 완성 후 여기에 image(...) 를 추가하면 됨.
//  클릭하면 onStageClearEnd() → 컷신3 → 스테이지2 시작
function drawStage1Clear() {
  gameBackground(10);
  textFont(gameFont);
  textAlign(CENTER, CENTER);

  // 클리어 텍스트
  fill(255, 220, 50);
  textSize(60);
  text("STAGE 1 CLEAR!", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 80);

  fill(220);
  textSize(22);
  text("의뢰 완료: 논문 파일 복구 성공", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2);

  fill(180);
  textSize(16);
  text("별벅스 기프티콘 10만원 수령 완료", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 40);

  // 깜빡이는 진행 안내
  if ((frameCount % 60) < 40) {
    fill(160);
    textSize(14);
    text("클릭하여 계속", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 120);
  }
}

// ── STAGE_CLEAR (미래 확장용) ─────────────────────────────
function drawStageClear() {
  gameBackground(0);
  textFont(gameFont);
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(48);
  text("CLEAR!!", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2);
}


// ══════════════════════════════════════════════════════════
//  컷신 헬퍼
// ══════════════════════════════════════════════════════════

// 컷신을 시작하고 CUTSCENE 상태로 전환하는 헬퍼 함수
// 어느 파일에서도 호출 가능 (전역 함수)
//
// 사용법:
//   startCutscene('scene1', () => { transitionTo('PIXEL_EDITOR'); });
//
function startCutscene(sceneId, onEnd) {
  transitionTo('CUTSCENE');
  CUTSCENE.start(sceneId, onEnd);
}


// ══════════════════════════════════════════════════════════
//  공용 유틸 함수
// ══════════════════════════════════════════════════════════

// ── 캐릭터 스프라이트 렌더링 ──────────────────────────────
//  puzzle.js 등에서 캐릭터를 그릴 때 이 함수를 호출
//  x, y : 그릴 위치 (CENTER 기준)
//  scale: 확대 배수 (기본 4 → 16px × 4 = 64px)
function drawPlayerSprite(x, y, scale = 4) {
  if (!player || !player.sprite) return;
  const w = PE.COLS * scale;
  const h = PE.ROWS * scale;
  imageMode(CENTER);
  noSmooth();   // 픽셀 아트 — 보간 없이 선명하게
  image(player.sprite, x, y, w, h);
  imageMode(CORNER);
}
