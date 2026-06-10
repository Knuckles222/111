// ============================================================
//  main.js
//  게임 전체 상태 머신 & p5.js 진입점
//
//  [ 게임 흐름 ]
//
//  INTRO(타이틀)
//    → CUTSCENE(scene1)     (오프닝 컷신)
//    → PIXEL_EDITOR          (1스테이지 캐릭터 생성)
//    → CHARACTER_CONFIRM
//    → PUZZLE_ROOM           (1스테이지 방 1→2→3)
//    → STAGE_CLEAR_1         (stageClear01.png + 캐릭터, SPACE)
//    → CUTSCENE(scene2)     (1스테이지 클리어 컷신)
//    → FEW_DAYS_LATER        (fewDaysLater.png, SPACE)
//    → CUTSCENE(scene3)     (2스테이지 오프닝 컷신)
//    → PIXEL_EDITOR          (2스테이지 캐릭터 생성)
//    → CHARACTER_CONFIRM
//    → PUZZLE_ROOM           (2스테이지 방 1→2→3)
//    → STAGE_CLEAR_2         (stageClear02.png + 캐릭터, SPACE)
//    → CUTSCENE(scene4)     (2스테이지 클리어 컷신)
//    → INTRO                 (endBackground로 시작화면 복귀)
//
//  [ 상태(currentState) 목록 ]
//  'INTRO'              : 타이틀 화면
//  'CUTSCENE'           : 컷신
//  'PIXEL_EDITOR'       : 픽셀 그림판
//  'CHARACTER_CONFIRM'  : 캐릭터 + 속성 확인 (SPACE로 진행)
//  'PUZZLE_ROOM'        : 퍼즐 방
//  'STAGE_CLEAR_1'      : 1스테이지 클리어 화면 (SPACE)
//  'STAGE_CLEAR_2'      : 2스테이지 클리어 화면 (SPACE)
//  'FEW_DAYS_LATER'     : 며칠 후 중간 화면 (SPACE)
// ============================================================


// ──────────────────────────────────────────────────────────
//  전역 게임 상태
// ──────────────────────────────────────────────────────────
let currentState = 'INTRO';

// ──────────────────────────────────────────────────────────
//  저장/불러오기 & ESC 메뉴 상태
//
//  localStorage 를 사용하므로 브라우저를 닫았다가 다시 열어도
//  같은 주소에서 실행하면 마지막 저장 지점을 불러올 수 있음.
// ──────────────────────────────────────────────────────────
const SAVE_KEY = 'pixel-game-cutscene-save-v1';
let escMenuOpen = false;
let saveMessage = '';
let saveMessageTimer = 0;

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
let gameCompleted = false;  // 컷신4 종료 후 true → INTRO에서 endBackground 표시

// ──────────────────────────────────────────────────────────
//  사각형 파도 화면 전환 효과
//  wipePhase: 'idle' | 'closing' | 'hold' | 'opening'
//  wipeProgress: 0~1 (hold 중엔 프레임 카운터)
// ──────────────────────────────────────────────────────────
let wipePhase    = 'idle';
let wipeProgress = 0;
let wipePending  = null;   // 닫힘 완료 후 실행할 콜백
const WIPE_SPEED = 0.055;  // 클수록 빠름

// 전환 효과를 적용할 상태 목록
const WIPE_STATES = new Set([
  'CUTSCENE', 'PUZZLE_ROOM', 'CHARACTER_CONFIRM',
  'STAGE_CLEAR_1', 'STAGE_CLEAR_2', 'FEW_DAYS_LATER',
]);

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

let confirmBobY    = 333;   // 캐릭터 현재 y (lerp용)
let confirmBobTarget = 333; // 목표 y (sin파로 계산)

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
  escMenuOpen = false;
  console.log(`[STATE] ${currentState} → ${newState}`);

  const needsWipe = WIPE_STATES.has(newState) || WIPE_STATES.has(currentState);

  if (needsWipe && wipePhase === 'idle') {
    // 닫힘 시작 — 완료 후 실제 전환 실행
    wipePhase    = 'closing';
    wipeProgress = 0;
    wipePending  = () => _doTransition(newState);
    // 닫힐 때 역재생
    if (typeof loadingSound !== 'undefined' && loadingSound) {
      loadingSound.rate(-1);
      loadingSound.play();
    }
  } else {
    // 효과 없이 즉시 전환 (또는 이미 closing 중 — 무시)
    if (wipePhase !== 'closing') _doTransition(newState);
  }
}

// 실제 상태 초기화 (마름모 닫힘 완료 후 호출)
function _doTransition(newState) {
  // ── 모든 BGM 정지 헬퍼 ───────────────────────────────
  // CUTSCENE으로 진입할 때는 cutsceneBGM/cutscene02BGM을 건드리지 않음
  // (startCutscene에서 직접 재생하므로)
  const stopAll = () => {
    [startMenuSound, endMenuSound].forEach(s => {
      if (typeof s !== 'undefined' && s && s.isPlaying()) s.stop();
    });
    if (newState !== 'CUTSCENE') {
      [cutsceneBGM, cutscene02BGM].forEach(s => {
        if (typeof s !== 'undefined' && s && s.isPlaying()) s.stop();
      });
    }
    // PUZZLE_ROOM 진입 시엔 puzzleBGM 유지 (방 이동 중에도 끊기지 않게)
    if (newState !== 'PUZZLE_ROOM' || currentState !== 'PUZZLE_ROOM') {
      if (typeof puzzleBGM !== 'undefined' && puzzleBGM && puzzleBGM.isPlaying()) puzzleBGM.stop();
    }
  };

  // ── 퍼즐방 BGM ───────────────────────────────────────
  if (newState === 'PUZZLE_ROOM') {
    stopAll();
    if (typeof puzzleBGM !== 'undefined' && puzzleBGM && !puzzleBGM.isPlaying()) puzzleBGM.loop();
  }
  // ── 컷신 BGM (sceneId별 분기) ────────────────────────
  // startCutscene 호출 시 CUTSCENE 상태로 전환되므로
  // 여기선 일단 멈추고, startCutscene 헬퍼에서 sceneId 보고 재생
  else if (newState === 'CUTSCENE') {
    stopAll();
    // 실제 재생은 startCutscene()에서 처리
  }
  // ── 시작화면/캐릭터 디자인 BGM ───────────────────────
  else if (newState === 'INTRO' || newState === 'PIXEL_EDITOR') {
    stopAll();
    // PIXEL_EDITOR는 항상 startMenuSound (클리어 여부 무관)
    const bgm = (newState === 'INTRO' && gameCompleted && typeof endMenuSound !== 'undefined' && endMenuSound)
      ? endMenuSound
      : (typeof startMenuSound !== 'undefined' ? startMenuSound : null);
    if (bgm && !bgm.isPlaying()) bgm.loop();
  }
  // ── 그 외 상태 (클리어 화면, 며칠후 등): BGM 정지 ───
  else {
    stopAll();
  }

  // ── victory: 속성화면 + 1스테이지 클리어 ─────────────
  if (newState === 'CHARACTER_CONFIRM' || newState === 'STAGE_CLEAR_1') {
    if (typeof victorySound !== 'undefined' && victorySound) {
      victorySound.stop();
      victorySound.play();
    }
  }

  // ── clear02: 2스테이지 클리어 ────────────────────────
  if (newState === 'STAGE_CLEAR_2') {
    if (typeof clear02Sound !== 'undefined' && clear02Sound) {
      clear02Sound.stop();
      clear02Sound.play();
    }
  }

  currentState = newState;

  switch (newState) {

    case 'CUTSCENE':
      break;

    case 'STAGE_CLEAR_1':
    case 'STAGE_CLEAR_2':
    case 'FEW_DAYS_LATER':
      break;

    case 'PIXEL_EDITOR':
      PE.init((result) => {
        loadImage(result.imageDataURL, (sprite) => {
          player = createCharacter(result, sprite);
          console.log('[Character Created] attribute:', player.attribute?.name);
          transitionTo('CHARACTER_CONFIRM');
        });
      });
      break;

    case 'CHARACTER_CONFIRM':
      break;

    case 'PUZZLE_ROOM':
      PUZZLE.init({
        player:  player,
        stage:   currentStage,
        room:    currentRoom,
        onClear: onRoomClear,
      });
      break;

    case 'STAGE_CLEAR':
      break;

    case 'INTRO':
      break;

    case 'GAME_EXIT':
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
    if (currentStage === 1) {
      // 1스테이지 퍼즐 3방 완료 → STAGE_CLEAR_1
      transitionTo('STAGE_CLEAR_1');
    } else {
      // 2스테이지 퍼즐 3방 완료 → STAGE_CLEAR_2
      transitionTo('STAGE_CLEAR_2');
    }
  } else {
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
// STAGE_CLEAR_1 → SPACE → 컷신2 → FEW_DAYS_LATER
function onStage1ClearDone() {
  startCutscene('scene2', () => {
    transitionTo('FEW_DAYS_LATER');
  });
}

// FEW_DAYS_LATER → SPACE → 컷신3 → 2스테이지 픽셀 에디터
function onFewDaysLaterDone() {
  startCutscene('scene3', () => {
    currentStage = 2;
    currentRoom  = 1;
    player       = null;
    transitionTo('PIXEL_EDITOR');
  });
}

// STAGE_CLEAR_2 → SPACE → 컷신4 → INTRO(endBackground)
function onStage2ClearDone() {
  startCutscene('scene4', () => {
    gameCompleted = true;
    transitionTo('INTRO');
  });
}


// ──────────────────────────────────────────────────────────
//  p5.js preload() — 게임 시작 전 리소스 로드
//
//  폰트, 이미지 등 setup() 전에 반드시 준비돼야 하는 것들
// ──────────────────────────────────────────────────────────
let gameFont;
let completeButtonUnPush;
let completeButtonPush;
let board;
let screen;
let whiteBoard;

// ── 타이틀 에셋 ──────────────────────────────────────────
let startBackground;
let endBackground;
let manual;
let showingManual = false;

// ── 클리어·중간 화면 에셋 ────────────────────────────────
let stageClear01, stageClear02;
let fewDaysLater;

// ── 속성 확인 화면 에셋 ──────────────────────────────────
let attributeBackground;

// ── 컷신 추가 일러스트 ────────────────────────────────────
let murder02;

// ── 문서 이미지 ──────────────────────────────────────────
let document01, document02, document03;

// ── 퍼즐 에셋 전역 변수 ──────────────────────────────────
let gameover, puzzleUI;
let documentImg, fold, foothold, virus;
let fire, grass, water;
let thorn01, thorn02, thorn03, thorn04;

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
// 퍼즐 BGM
let puzzleBGM;
// 추가 효과음
let loadingSound;    // 화면 전환
let selectSound;     // 버튼 선택
let gameoverSound;   // 게임오버 부서짐
let textScrollSound; // 컷신 타이핑
let movingSound;     // 이동
// BGM
let startMenuSound;  // 시작화면 BGM
let endMenuSound;    // 클리어 후 시작화면 BGM
let cutsceneBGM;     // 컷신1,2 BGM
let cutscene02BGM;   // 컷신3 BGM
let victorySound;    // 캐릭터 완성 → 속성화면 → 1스테이지 클리어
let clear02Sound;    // 2스테이지 클리어
// 효과음
let hurtSound;       // 가시 밟기

function preload() {
  // ── 폰트 ──────────────────────────────────────────────
  gameFont = loadFont('assets/x12y12pxMaruMinyaHangul.ttf');

  // ── 타이틀 에셋 ──────────────────────────────────────
  startBackground = loadImage('assets/startBackground.png');
  endBackground   = loadImage('assets/endBackground.png');
  manual          = loadImage('assets/manual.png');

  // ── 컷신 추가 일러스트 ────────────────────────────────────
  murder02 = loadImage('assets/murder02.png');

  // ── 문서 이미지 ──────────────────────────────────────────
  document01 = loadImage('assets/document01.png');
  document02 = loadImage('assets/document02.png');
  document03 = loadImage('assets/document03.png');

  // ── 클리어·중간 화면 에셋 ──────────────────────────────
  stageClear01  = loadImage('assets/stageClear01.png');
  stageClear02  = loadImage('assets/stageClear02.png');
  fewDaysLater  = loadImage('assets/fewDaysLater.png');

  // ── 속성 확인 화면 에셋 ────────────────────────────────
  attributeBackground = loadImage('assets/attributeBackground.png');

  // ── 문서 이미지 ────────────────────────────────────────
  document01 = loadImage('assets/document01.png');
  document02 = loadImage('assets/document02.png');
  document03 = loadImage('assets/document03.png');

  // ── 픽셀 에디터 UI ────────────────────────────────────
  whiteBoard            = loadImage('assets/whiteboard.png');
  completeButtonUnPush  = loadImage('assets/completeButtonUnPush.png');
  completeButtonPush    = loadImage('assets/completeButtonPush.png');
  board                 = loadImage('assets/board.png');
  screen                = loadImage('assets/screen.png');

  // ── 퍼즐 에셋 ────────────────────────────────────────────
  // puzzle.js 에서 전역 변수명으로 직접 참조
  // (gameover, puzzleUI, documentImg, fold, foothold, virus,
  //  fire, grass, water, thorn01~04)
  gameover    = loadImage('assets/gameover_UI.png');
  puzzleUI    = loadImage('assets/puzzle_UI.png');
  documentImg = loadImage('assets/puzzle_document.png');
  fold        = loadImage('assets/puzzle_fold.png');
  foothold    = loadImage('assets/puzzle_foothold.png');
  virus       = loadImage('assets/puzzle_virus.png');
  fire        = loadImage('assets/puzzle_fire.png');
  grass       = loadImage('assets/puzzle_grass.png');
  water       = loadImage('assets/puzzle_water.png');
  thorn01     = loadImage('assets/thorn01.png');
  thorn02     = loadImage('assets/thorn02.png');
  thorn03     = loadImage('assets/thorn03.png');
  thorn04     = loadImage('assets/thorn04.png');

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

  // ── BGM ──────────────────────────────────────────────
  puzzleBGM = loadSound('assets/black_rose_rabbit-8-bit-game-music.mp3');
  puzzleBGM.setVolume(2.0);  // 볼륨 올리기

  // ── 추가 효과음 ──────────────────────────────────────
  loadingSound     = loadSound('assets/loading.wav');
  selectSound      = loadSound('assets/select.wav');
  gameoverSound    = loadSound('assets/gameoverSound.wav');
  textScrollSound  = loadSound('assets/text-scroll.mp3');
  movingSound      = loadSound('assets/moving.mp3');
  startMenuSound   = loadSound('assets/startMenuSound.mp3');
  endMenuSound     = loadSound('assets/endMenuSound.mp3');
  cutsceneBGM      = loadSound('assets/cutscene01.mp3');
  cutscene02BGM    = loadSound('assets/cutscene02.mp3');
  hurtSound        = loadSound('assets/hurt.wav');
  victorySound     = loadSound('assets/victory.mp3');
  clear02Sound     = loadSound('assets/clear02.mp3');
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
    case 'STAGE_CLEAR_1':      drawStageClear1();      break;
    case 'STAGE_CLEAR_2':      drawStageClear2();      break;
    case 'FEW_DAYS_LATER':     drawFewDaysLater();     break;
    case 'STAGE_CLEAR':        /* 미사용 */             break;
    case 'GAME_EXIT':          drawGameExit();         break;
    default:
      gameBackground(0);
      fill(255); textSize(14); textAlign(LEFT, TOP);
      text('알 수 없는 상태: ' + currentState, 10, 10);
  }

  if (escMenuOpen) drawEscMenu();
  if (showingManual) _drawManual();
  drawSaveMessage();
  _drawWipe();

  endGameView();
}

// ──────────────────────────────────────────────────────────
//  p5.js mousePressed()
// ──────────────────────────────────────────────────────────
function mousePressed() {
  // 매뉴얼 오버레이가 열려 있으면 클릭으로 닫기
  if (showingManual) { showingManual = false; return; }

  if (escMenuOpen) {
    handleEscMenuClick(gameMouseX(), gameMouseY());
    return;
  }

  switch (currentState) {
    case 'INTRO':
      {
        if (!isMouseInsideGame()) break;

        // 매뉴얼이 열려 있으면 클릭으로 닫기
        if (showingManual) {
          showingManual = false;
          break;
        }

        const startBtn  = getIntroStartButtonRect();
        const loadBtn   = getIntroLoadButtonRect();
        const manualBtn = getIntroManualButtonRect();
        const gx = gameMouseX();
        const gy = gameMouseY();

        if (isInsideRect(gx, gy, startBtn)) {
          if (typeof selectSound !== 'undefined' && selectSound) selectSound.play();
          currentStage = 1;
          currentRoom  = 1;
          player       = null;
          startCutscene('scene1', () => {
            transitionTo('PIXEL_EDITOR');
          });
        } else if (isInsideRect(gx, gy, loadBtn)) {
          if (typeof selectSound !== 'undefined' && selectSound) selectSound.play();
          loadGame();
        } else if (isInsideRect(gx, gy, manualBtn)) {
          if (typeof selectSound !== 'undefined' && selectSound) selectSound.play();
          showingManual = true;
        }
      }
      break;

    case 'CUTSCENE':
      CUTSCENE.handleClick();
      break;

    case 'PIXEL_EDITOR':
      if (isMouseInsideGame()) PE.handleClick(gameMouseX(), gameMouseY());
      break;

    // 확인 화면 — SPACE로 퍼즐 시작 (mousePressed에서는 처리 안 함)
    case 'CHARACTER_CONFIRM':
      break;

    case 'PUZZLE_ROOM':
      if (isMouseInsideGame()) PUZZLE.handleClick(gameMouseX(), gameMouseY());
      break;

    case 'STAGE_CLEAR_1':
    case 'STAGE_CLEAR_2':
    case 'FEW_DAYS_LATER':
      // SPACE로만 진행 (mousePressed는 처리 안 함)
      break;

    case 'STAGE_CLEAR':
      break;

    case 'GAME_EXIT':
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
  // 매뉴얼 오버레이가 열려 있으면 SPACE/ESC로 닫기 (어느 화면에서든)
  if (showingManual) {
    if (key === ' ' || key === 'Escape') { showingManual = false; return false; }
    return;
  }

  if (key === 'Escape') {
    if (currentState === 'CUTSCENE' || currentState === 'PUZZLE_ROOM') {
      escMenuOpen = !escMenuOpen;
      return false;
    }
  }

  if (escMenuOpen) return false;

  switch (currentState) {
    case 'INTRO':
      if (showingManual && key === ' ') {
        showingManual = false;
        return false;
      }
      break;

    case 'STAGE_CLEAR_1':
      if (key === ' ') onStage1ClearDone();
      break;

    case 'STAGE_CLEAR_2':
      if (key === ' ') onStage2ClearDone();
      break;

    case 'FEW_DAYS_LATER':
      if (key === ' ') onFewDaysLaterDone();
      break;

    case 'CUTSCENE':
      // P키: 컷신 전체 스킵 (시연용)
      if (key === 'p' || key === 'P') {
        CUTSCENE.skip();
      } else {
        CUTSCENE.handleKey(key);
      }
      break;

    case 'PIXEL_EDITOR':
      PE.handleKey(key);
      break;

    case 'CHARACTER_CONFIRM':
      // SPACE로 퍼즐 시작
      if (key === ' ') transitionTo('PUZZLE_ROOM');
      break;

    case 'PUZZLE_ROOM':
      // P키: 퍼즐 스킵 (시연용) — 현재 방 클리어로 처리
      if (key === 'p' || key === 'P') {
        onRoomClear();
        break;
      }
      PUZZLE.handleKey(key);
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
  // 배경 이미지
  if (typeof attributeBackground !== 'undefined' && attributeBackground) {
    image(attributeBackground, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  } else {
    gameBackground(30);
  }

  const attrName = player?.attribute?.name ?? null;

  // 속성별 텍스트 색상
  let attrColor;
  if      (attrName === '불') attrColor = color(205, 52,  52 );
  else if (attrName === '물') attrColor = color(52,  118, 205);
  else if (attrName === '풀') attrColor = color(132, 180, 67 );
  else                        attrColor = color(180, 180, 180);

  // 속성 텍스트 (크기 참고 코드 기준: textSize(300), text('불', 1000, 900))
  // 1920×1080 → 1600×900 스케일 보정: x=1000/1.2≈833, y=900/1.2=750
  textFont(gameFont);
  fill(attrColor);

  // 투명도 깜빡임 (sin파로 부드럽게, 180~255 사이)
  const alphaPulse = (frameCount % 30 < 15) ? 255 : 0;
  fill(red(attrColor), green(attrColor), blue(attrColor), alphaPulse);

  textSize(250);
  textAlign(LEFT, BASELINE);          // 👈 좌측 하단 기준으로 정렬 변경
  text(attrName ?? '없음', 833.3, 750); // 👈 X를 833.3으로, Y를 750으로 수정

  // 위아래 둥둥 효과 (sin파 → lerp)
  const bobOffset = sin(frameCount * 0.04) * 12;  // 진폭 12px, 속도 0.04
  confirmBobTarget = 333 + bobOffset;
  confirmBobY = lerp(confirmBobY, confirmBobTarget, 0.1);

  const cX = 137, cY = confirmBobY, cW = 417, cH = 417;
  if (player?.sprite) {
    imageMode(CORNER);
    noSmooth();
    image(player.sprite, cX, cY, cW, cH);
    imageMode(CORNER);
  } else {
    noFill();
    stroke(200);
    strokeWeight(2);
    rect(cX, cY, cW, cH);
    noStroke();
  }
}

// ── INTRO ─────────────────────────────────────────────────
function drawIntro() {
  // 게임 전체 완료(컷신4 종료) 후 INTRO로 돌아오면 endBackground
  const bg = (gameCompleted && typeof endBackground !== 'undefined' && endBackground)
    ? endBackground
    : (typeof startBackground !== 'undefined' && startBackground ? startBackground : null);

  if (bg) {
    image(bg, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  } else {
    gameBackground(30);
  }

  // 매뉴얼 오버레이가 열려 있으면 그 위에 렌더
  if (showingManual) {
    _drawManual();
    return;
  }

  const startBtn  = getIntroStartButtonRect();
  const loadBtn   = getIntroLoadButtonRect();
  const manualBtn = getIntroManualButtonRect();
  const hasSave   = hasSavedGame();

  const gx = isMouseInsideGame() ? gameMouseX() : -1;
  const gy = isMouseInsideGame() ? gameMouseY() : -1;

  const hoverStart  = isInsideRect(gx, gy, startBtn);
  const hoverLoad   = isInsideRect(gx, gy, loadBtn);
  const hoverManual = isInsideRect(gx, gy, manualBtn);

  cursor((hoverStart || hoverLoad || hoverManual) ? HAND : ARROW);

  textFont(gameFont);
  rectMode(CORNER);

  // ── 새로운 게임 버튼
  _drawMenuButton(83, 417, 292, 83, gameCompleted ? '다시 회상하기' : '새로운 게임', hoverStart, 28);

  // ── 불러오기 버튼 (저장 없으면 비활성)
  if (hasSave) {
    _drawMenuButton(83, 542, 292, 83, '불러오기', hoverLoad, 28);
  } else {
    fill(60); noStroke(); rect(83, 542, 292, 83);
    fill(100); textSize(28); textAlign(CENTER, CENTER);
    text('불러오기', loadBtn.x, loadBtn.y);
  }

  // ── 게임 방법 버튼
  _drawMenuButton(83, 667, 292, 83, '게임 방법', hoverManual, 28);

  fill(180);
  textFont(gameFont);
  textSize(20);
  textAlign(LEFT, BOTTOM);
  text('제작: 리트리버 스튜디오 - 김한결, 박소이', 83, VIRTUAL_HEIGHT - 15);
}

// ── 매뉴얼 오버레이 ──────────────────────────────────────
//  INTRO의 '게임 방법' 버튼 또는 ESC 메뉴에서 열림.
//  SPACE 키 또는 클릭으로 닫기.
function _drawManual() {
  if (typeof manual !== 'undefined' && manual) {
    image(manual, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  } else {
    fill(0, 0, 0, 220);
    noStroke();
    rect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    textFont(gameFont);
    fill(255);
    textSize(28);
    textAlign(CENTER, CENTER);
    text('[ 게임 방법 이미지 준비 중 ]', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2);
  }
}

// ── PUZZLE_ROOM ───────────────────────────────────────────
function drawPuzzleRoom() {
  PUZZLE.draw();
}

// ── STAGE_CLEAR_1 ─────────────────────────────────────────
//  1스테이지 퍼즐 3방 완료 직후.
//  stageClear01.png 위에 캐릭터 스프라이트를 중앙에 표시.
//  SPACE로 컷신2로 진행.
function drawStageClear1() {
  if (typeof stageClear01 !== 'undefined' && stageClear01) {
    image(stageClear01, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  } else {
    gameBackground(10);
  }
  if (player?.sprite) {
    const sz = 583;
    const bobOffset = sin(frameCount * 0.04) * 12;
    confirmBobTarget = 450 + bobOffset;
    confirmBobY = lerp(confirmBobY, confirmBobTarget, 0.1);
    imageMode(CENTER);
    noSmooth();
    image(player.sprite, 800, confirmBobY, sz, sz);
    imageMode(CORNER);
  }
}

function drawStageClear2() {
  if (typeof stageClear02 !== 'undefined' && stageClear02) {
    image(stageClear02, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  } else {
    gameBackground(10);
  }
  if (player?.sprite) {
    const sz = 583;
    const bobOffset = sin(frameCount * 0.04) * 12;
    confirmBobTarget = 450 + bobOffset;
    confirmBobY = lerp(confirmBobY, confirmBobTarget, 0.1);
    imageMode(CENTER);
    noSmooth();
    image(player.sprite, 800, confirmBobY, sz, sz);
    imageMode(CORNER);
  }
}

function drawFewDaysLater() {
  if (typeof fewDaysLater !== 'undefined' && fewDaysLater) {
    image(fewDaysLater, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  } else {
    gameBackground(0);
    textFont(gameFont);
    fill(200);
    textSize(40);
    textAlign(CENTER, CENTER);
    text('며칠 후...', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2);
  }
}


// ── GAME_EXIT ─────────────────────────────────────────────
function drawGameExit() {
  gameBackground(0);
  textFont(gameFont);
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(42);
  text('게임이 종료되었습니다.', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 20);
  fill(160);
  textSize(16);
  text('창이 닫히지 않으면 브라우저 탭 또는 VSCode 미리보기 창을 직접 닫아주세요.', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 40);
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

  // sceneId별 BGM 재생
  if (sceneId === 'scene1' || sceneId === 'scene2') {
    if (typeof cutsceneBGM !== 'undefined' && cutsceneBGM && !cutsceneBGM.isPlaying()) cutsceneBGM.loop();
  } else if (sceneId === 'scene3') {
    if (typeof cutscene02BGM !== 'undefined' && cutscene02BGM && !cutscene02BGM.isPlaying()) cutscene02BGM.loop();
  }
  // scene4: BGM 없음
}


// 컷신 저장 데이터를 불러올 때는 sceneId 별 종료 콜백을 다시 연결해야 함
function getCutsceneEndCallback(sceneId) {
  if (sceneId === 'scene1') return () => transitionTo('PIXEL_EDITOR');
  if (sceneId === 'scene2') return () => transitionTo('STAGE_CLEAR_1');
  if (sceneId === 'scene3') return () => transitionTo('PIXEL_EDITOR');
  if (sceneId === 'scene4') return () => { gameCompleted = true; transitionTo('INTRO'); };
  return () => transitionTo('INTRO');
}

// INTRO 버튼 좌표
// 원본 참고 코드가 1920×1080 기준이므로 1600 가상 좌표로 변환 (÷1.2)
// rect(100, 500, 350, 100) → x=83, y=417, w=292, h=83
// isInsideRect는 { x: center, y: center, w, h } 형태
function getIntroStartButtonRect() {
  return { x: 83 + 292/2, y: 417 + 83/2, w: 292, h: 83 };  // 새로운 게임
}
function getIntroLoadButtonRect() {
  return { x: 83 + 292/2, y: 542 + 83/2, w: 292, h: 83 };  // 불러오기
}
function getIntroManualButtonRect() {
  return { x: 83 + 292/2, y: 667 + 83/2, w: 292, h: 83 };  // 게임 방법
}

function getEscMenuButtons() {
  const x = VIRTUAL_WIDTH / 2;
  const w = 340;
  const h = 56;
  return [
    { id: 'save',   label: '저장',                 x, y: 370, w, h },
    { id: 'manual', label: '게임 방법',             x, y: 438, w, h },
    { id: 'intro',  label: '메인 메뉴로 돌아가기', x, y: 506, w, h },
    { id: 'exit',   label: '게임 종료하기',         x, y: 574, w, h },
  ];
}

function isInsideRect(gx, gy, rectObj) {
  return gx >= rectObj.x - rectObj.w / 2 &&
         gx <= rectObj.x + rectObj.w / 2 &&
         gy >= rectObj.y - rectObj.h / 2 &&
         gy <= rectObj.y + rectObj.h / 2;
}

function hasSavedGame() {
  return !!localStorage.getItem(SAVE_KEY);
}

function showSaveMessage(message) {
  saveMessage = message;
  saveMessageTimer = 120;
}

function drawSaveMessage() {
  if (saveMessageTimer <= 0 || !saveMessage) return;

  push();
  rectMode(CENTER);
  noStroke();
  fill(0, 0, 0, 180);
  rect(VIRTUAL_WIDTH / 2, 95, 420, 54, 12);
  fill(255);
  textFont(gameFont);
  textAlign(CENTER, CENTER);
  textSize(18);
  text(saveMessage, VIRTUAL_WIDTH / 2, 95);
  pop();

  saveMessageTimer--;
}

// ── 공통 버튼 렌더 (게임오버 버튼 스타일 기준) ───────────────
//  x, y, w, h : rectMode CORNER 기준
//  hover : 마우스 올라가 있는지 여부
function _drawMenuButton(x, y, w, h, label, hover, textSz = 24) {
  if (hover) { fill(255); stroke(0); }
  else       { fill(20, 20, 20, 180); stroke(150); }
  strokeWeight(2);
  rectMode(CORNER);
  rect(x, y, w, h);
  noStroke();
  fill(hover ? 0 : 220);
  textFont(gameFont);
  textSize(textSz);
  textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + h / 2);
}

function drawEscMenu() {
  push();
  rectMode(CENTER);
  noStroke();
  fill(0, 0, 0, 175);
  rect(VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

  // 메뉴 박스 — '메뉴' 타이틀(y=300) + 버튼4개(y=370~574) + 하단안내(y=625) 모두 포함
  // 박스 중심: y=(300+625)/2=462.5, 높이: 625-300+60=385
  fill(245);
  stroke(30);
  strokeWeight(3);
  rect(VIRTUAL_WIDTH / 2, 462, 500, 400, 18);

  // '메뉴' 텍스트 — 박스 상단 안쪽
  noStroke();
  fill(20);
  textFont(gameFont);
  textAlign(CENTER, CENTER);
  textSize(34);
  text('메뉴', VIRTUAL_WIDTH / 2, 300);

  const buttons = getEscMenuButtons();
  const egx = isMouseInsideGame() ? gameMouseX() : -1;
  const egy = isMouseInsideGame() ? gameMouseY() : -1;
  let anyHover = false;

  for (const btn of buttons) {
    const hover = isInsideRect(egx, egy, btn);
    if (hover) anyHover = true;
    // btn은 CENTER 기준이므로 CORNER로 변환
    _drawMenuButton(btn.x - btn.w/2, btn.y - btn.h/2, btn.w, btn.h, btn.label, hover, 22);
  }

  cursor(anyHover ? HAND : ARROW);

  fill(100);
  textSize(12);
  text('ESC 키를 다시 누르면 메뉴가 닫힙니다.', VIRTUAL_WIDTH / 2, 625);
  pop();
}

function handleEscMenuClick(gx, gy) {
  if (!isMouseInsideGame()) return;

  for (const btn of getEscMenuButtons()) {
    if (!isInsideRect(gx, gy, btn)) continue;

    if (typeof selectSound !== 'undefined' && selectSound) selectSound.play();

    if (btn.id === 'save') {
      saveGame();
    } else if (btn.id === 'manual') {
      escMenuOpen = false;
      showingManual = true;
      // 매뉴얼은 INTRO 상태가 아니어도 열 수 있도록 별도 플래그 사용
      // draw()에서 escMenuOpen 위에 렌더되므로 별도 처리
    } else if (btn.id === 'intro') {
      escMenuOpen = false;
      transitionTo('INTRO');
    } else if (btn.id === 'exit') {
      exitGame();
    }
    return;
  }
}

function serializePlayer() {
  if (!player) return null;
  return {
    grid: player.grid,
    imageDataURL: player.imageDataURL,
    attribute: player.attribute?.name ?? null,
    moveCount: player.moveCount ?? 0,
    isAlive: player.isAlive ?? true,
  };
}

function restorePlayer(savedPlayer, done) {
  if (!savedPlayer || !savedPlayer.imageDataURL) {
    player = null;
    done();
    return;
  }

  loadImage(savedPlayer.imageDataURL, (sprite) => {
    player = createCharacter({
      grid: savedPlayer.grid,
      imageDataURL: savedPlayer.imageDataURL,
      attribute: savedPlayer.attribute,
    }, sprite);

    player.moveCount = savedPlayer.moveCount ?? 0;
    player.isAlive   = savedPlayer.isAlive ?? true;
    done();
  }, () => {
    console.warn('[SAVE] 캐릭터 이미지 복원 실패');
    player = null;
    done();
  });
}

function buildSaveData() {
  const saveData = {
    version: 1,
    savedAt: new Date().toISOString(),
    currentState,
    currentStage,
    currentRoom,
    player: serializePlayer(),
  };

  if (currentState === 'CUTSCENE') {
    saveData.cutscene = CUTSCENE.getSaveData();
  }

  if (currentState === 'PUZZLE_ROOM') {
    saveData.puzzle = PUZZLE.getSaveData();
  }

  return saveData;
}

function saveGame() {
  if (currentState !== 'CUTSCENE' && currentState !== 'PUZZLE_ROOM') {
    showSaveMessage('현재 화면에서는 저장할 수 없습니다.');
    return;
  }

  try {
    const saveData = buildSaveData();
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    showSaveMessage('저장되었습니다.');
  } catch (e) {
    console.error('[SAVE] 저장 실패:', e);
    showSaveMessage('저장에 실패했습니다.');
  }
}

function loadGame() {
  let saveData = null;

  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      showSaveMessage('저장된 데이터가 없습니다.');
      return;
    }
    saveData = JSON.parse(raw);
  } catch (e) {
    console.error('[SAVE] 불러오기 실패:', e);
    showSaveMessage('저장 데이터를 읽을 수 없습니다.');
    return;
  }

  currentStage = saveData.currentStage ?? 1;
  currentRoom  = saveData.currentRoom ?? 1;
  escMenuOpen  = false;

  restorePlayer(saveData.player, () => {
    if (saveData.currentState === 'CUTSCENE' && saveData.cutscene) {
      transitionTo('CUTSCENE');
      CUTSCENE.loadSaveData(saveData.cutscene, getCutsceneEndCallback(saveData.cutscene.sceneId));
      showSaveMessage('불러오기를 완료했습니다.');
      return;
    }

    if (saveData.currentState === 'PUZZLE_ROOM' && saveData.puzzle) {
      transitionTo('PUZZLE_ROOM');
      PUZZLE.loadSaveData(saveData.puzzle);
      showSaveMessage('불러오기를 완료했습니다.');
      return;
    }

    showSaveMessage('불러올 수 없는 저장 지점입니다.');
  });
}

function exitGame() {
  escMenuOpen = false;

  // 브라우저 보안 정책상 코드로 VSCode 자체를 닫을 수는 없음.
  // window.close() 가 허용되지 않으면 종료 화면으로 전환함.
  try { window.close(); } catch (e) {}
  transitionTo('GAME_EXIT');
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
  noSmooth();
  image(player.sprite, x, y, w, h);
  imageMode(CORNER);
}

// ══════════════════════════════════════════════════════════
//  화면 전환 효과 — 열 단위 스트립 (왼쪽→오른쪽 파도)
// ══════════════════════════════════════════════════════════
function _drawWipe() {
  if (wipePhase === 'idle') return;

  // ── progress 업데이트 ──────────────────────────────────
  if (wipePhase === 'closing') {
    wipeProgress = min(wipeProgress + WIPE_SPEED, 1);
    if (wipeProgress >= 1 && wipePending) {
      wipePending();
      wipePending  = null;
      wipePhase    = 'hold';
      wipeProgress = 0;
      // 화면이 다시 열릴 때 정재생
      if (typeof loadingSound !== 'undefined' && loadingSound) {
        loadingSound.rate(1);
        loadingSound.play();
      }
    }
  } else if (wipePhase === 'hold') {
    wipeProgress++;
    if (wipeProgress >= 30) {
      wipePhase    = 'opening';
      wipeProgress = 1;
    }
  } else if (wipePhase === 'opening') {
    wipeProgress = max(wipeProgress - WIPE_SPEED, 0);
    if (wipeProgress <= 0) wipePhase = 'idle';
  }

  // ── 렌더: 열(column)마다 위에서 내려오는 검은 스트립 ──
  const stripW   = 80;                                // 열 너비
  const cols     = ceil(VIRTUAL_WIDTH / stripW) + 1;
  const delay    = 0.35;  // 왼→오른 파도 딜레이 폭 (0~1)

  push();
  noStroke();
  fill(0);

  for (let col = 0; col < cols; col++) {
    const wave = (col / (cols - 1)) * delay;  // 이 열의 시작 딜레이

    let stripH;
    if (wipePhase === 'closing') {
      // 0→VIRTUAL_HEIGHT 로 내려옴
      const localP = constrain(map(wipeProgress, wave, 1, 0, 1), 0, 1);
      stripH = VIRTUAL_HEIGHT * localP;
      rect(col * stripW, 0, stripW + 1, stripH);
    } else if (wipePhase === 'hold') {
      // 전체 덮음
      rect(col * stripW, 0, stripW + 1, VIRTUAL_HEIGHT);
    } else {
      // opening: 위로 올라가며 사라짐
      const revWave = ((cols - 1 - col) / (cols - 1)) * delay;
      const localP  = constrain(map(wipeProgress, revWave, 1, 0, 1), 0, 1);
      stripH = VIRTUAL_HEIGHT * localP;
      rect(col * stripW, 0, stripW + 1, stripH);
    }
  }

  pop();
}
