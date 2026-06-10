// ============================================================
//  pixelEditor.js
//  픽셀 그림판 모듈
//  - drawPixelEditor()   : 매 프레임 그림판 UI 렌더링
//  - handlePixelEditorClick() / handlePixelEditorDrag() : 입력 처리
//  - getEditorResult()   : 완료 시 { grid, dominantColor, attribute } 반환
// ============================================================

// ──────────────────────────────────────────────
//  상수 & 내부 상태 (이 파일 안에서만 직접 접근)
// ──────────────────────────────────────────────
const PE = (() => {
  // 레이아웃
  const ROWS      = 16;
  const COLS      = 16;
  const CELL      = 30;          // 셀 크기(px)
  // 1600×900 픽셀 에디터 UI 이미지 기준 좌표
  const OFFSET_X  = 560;         // 그리드 왼쪽 시작 X
  const OFFSET_Y  = 240;         // 그리드 위쪽 시작 Y

  // 팔레트
  // index : 0=지우개(흰색)  1=빨강  2=파랑  3=초록
  const PALETTE = [
    { r:255, g:255, b:255 },   // 0 – 흰색(지우개)
    { r:205, g: 52, b: 52 },   // 1 – 빨강
    { r: 52, g:118, b:205 },   // 2 – 파랑
    { r:132, g:180, b: 67 },   // 3 – 초록
  ];

  // 속성 매핑 (dominantColor index → 캐릭터 속성)
  // character.js 의 ATTRIBUTE_TABLE 키와 반드시 일치해야 함
  // 0(투명/지우개) 은 속성 없음 → null 반환
  const ATTRIBUTES = {
    1: '불',
    2: '물',
    3: '풀',
  };

  // UI 버튼 영역 정의 (rectMode CORNER 기준)
  // { x, y, w, h, action }
  const BUTTONS = [
    // 아래 좌표는 사용자가 준 1600×900 샘플 코드의 rectMode(CENTER) 결과와 동일한 위치
    { x:202,  y:230, w:80,  h:80,  action:'color_1'   },  // 빨강
    { x:202,  y:350, w:80,  h:80,  action:'color_2'   },  // 파랑
    { x:202,  y:470, w:80,  h:80,  action:'color_3'   },  // 초록
    { x:202,  y:590, w:80,  h:80,  action:'color_0'   },  // 흰색(지우개)
    { x:182,  y:702.5, w:120, h:35, action:'clear_all' },  // 모두 지우기

    // completeButtonUnPush.png 안의 초록색 완료 버튼 영역
    { x:1186, y:480, w:340, h:285, action:'done'      },
  ];

  // ── 내부 상태 ──────────────────────────────
  let grid         = [];
  let currentColor = 0;
  let history      = [];
  let historyIndex = -1;
  let onDone       = null;   // 완료 콜백 (main.js 에서 등록)
  let isCompleting = false; // 완료 버튼을 누른 뒤 눌린 이미지 잠깐 표시

  // ──────────────────────────────────────────
  //  초기화
  // ──────────────────────────────────────────
  function init(callback) {
    onDone = callback || null;
    currentColor = 1;          // 기본색: 빨강
    isCompleting = false;
    grid = [];
    history = [];
    historyIndex = -1;

    for (let y = 0; y < ROWS; y++) {
      const row = [];
      for (let x = 0; x < COLS; x++) row.push(0);
      grid.push(row);
    }
    _saveState();
  }

  // ──────────────────────────────────────────
  //  렌더링 (draw() 에서 호출)
  // ──────────────────────────────────────────
  function draw() {
    // ── 배경/UI 이미지 ─────────────────────
    // main.js의 beginGameView() 안에서 호출되므로 아래 좌표는 1600×900 가상 좌표 그대로 사용됨
    gameBackground(220);
    if (typeof whiteBoard !== 'undefined' && whiteBoard) image(whiteBoard, 0, 0);
    if (isCompleting && typeof completeButtonPush !== 'undefined' && completeButtonPush) {
      image(completeButtonPush, 0, 0);
    } else if (typeof completeButtonUnPush !== 'undefined' && completeButtonUnPush) {
      image(completeButtonUnPush, 0, 0);
    }
    if (typeof board !== 'undefined' && board) image(board, 0, 0);
    if (typeof screen !== 'undefined' && screen) image(screen, 0, 0);

    // ── 그리드 ────────────────────────────
    rectMode(CORNER);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const c = PALETTE[grid[y][x]];
        fill(c.r, c.g, c.b);
        stroke(50);
        strokeWeight(0.5);
        rect(
          OFFSET_X + x * CELL,
          OFFSET_Y + y * CELL,
          CELL, CELL
        );
      }
    }
    noStroke();

    // ── 중앙 가이드선 ─────────────────────
    stroke('#800000');
    strokeWeight(1);
    line(OFFSET_X + COLS / 2 * CELL, OFFSET_Y,
         OFFSET_X + COLS / 2 * CELL, OFFSET_Y + ROWS * CELL);
    line(OFFSET_X, OFFSET_Y + ROWS / 2 * CELL,
         OFFSET_X + COLS * CELL, OFFSET_Y + ROWS / 2 * CELL);
    noStroke();

    // ── 팔레트 버튼 ────────────────────────
    // 사용자가 준 샘플 코드와 같은 위치/크기
    rectMode(CENTER);

    fill(205, 52, 52);
    rect(242, 270, 80, 80);

    fill(52, 118, 205);
    rect(242, 390, 80, 80);

    fill(132, 180, 67);
    rect(242, 510, 80, 80);

    fill(255);
    rect(242, 630, 80, 80);

    fill(198, 198, 198);
    rect(242, 720, 120, 35);

    rectMode(CORNER);

    // ── Undo / Redo 화살표 ────────────────
    fill(255, 165, 0);
    triangle(1050, 250, 1080, 235, 1080, 265);
    triangle(1150, 250, 1120, 235, 1120, 265);

    fill(30);
    textSize(11);
    textAlign(CENTER, CENTER);
    text('모두 지우기', 242, 720);
    textSize(10);
    text('← UNDO   REDO →', 1100, 275);

    // ── 커서 미리보기 ─────────────────────
    const c = PALETTE[currentColor];
    fill(c.r, c.g, c.b, 200);
    noStroke();
    ellipse(gameMouseX(), gameMouseY(), 20, 20);
  }

  // ──────────────────────────────────────────
  //  입력 처리
  // ──────────────────────────────────────────
  function handleClick(mx, my) {
    if (isCompleting) return;
    // Undo
    if (_inRect(mx, my, 1050, 235, 30, 30)) {
      if (historyIndex > 0) { historyIndex--; grid = _copyGrid(history[historyIndex]); }
      return;
    }
    // Redo
    if (_inRect(mx, my, 1120, 235, 30, 30)) {
      if (historyIndex < history.length - 1) { historyIndex++; grid = _copyGrid(history[historyIndex]); }
      return;
    }

    // 버튼 처리: 모든 좌표는 1600×900 가상 좌표 기준
    for (const btn of BUTTONS) {
      if (_inRect(mx, my, btn.x, btn.y, btn.w, btn.h)) {
        _handleButtonAction(btn.action);
        return;
      }
    }

    // 그리드 칸 칠하기
    _paintCell(mx, my);
  }

  function handleDrag(mx, my) {
    if (isCompleting) return;
    _paintCell(mx, my, true);
  }

  function handleKey(k) {
    const map = { r:1, R:1, b:2, B:2, g:3, G:3, e:0, E:0 };
    if (map[k] !== undefined) currentColor = map[k];
  }

  // ──────────────────────────────────────────
  //  버튼 액션
  // ──────────────────────────────────────────
  function _handleButtonAction(action) {
    if (action.startsWith('color_')) {
      currentColor = parseInt(action.split('_')[1]);
      return;
    }
    if (action === 'clear_all') {
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++)
          grid[y][x] = 0;
      _saveState();
      return;
    }
    if (action === 'done') {
      const result = getResult();

      if (result.dominantColorIndex === null) {
        alert('한 가지 이상의 색깔을 꼭 사용해주세요.');
        return;
      }

      // 완료 버튼 효과음
      if (typeof selectSound !== 'undefined' && selectSound) selectSound.play();

      isCompleting = true;
      setTimeout(() => {
        if (onDone) onDone(result);
      }, 500);
      return;
    }
  }

  // ──────────────────────────────────────────
  //  셀 칠하기
  // ──────────────────────────────────────────
  function _paintCell(mx, my, isDrag = false) {
    const x = floor((mx - OFFSET_X) / CELL);
    const y = floor((my - OFFSET_Y) / CELL);
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
    if (isDrag && grid[y][x] === currentColor) return;
    grid[y][x] = currentColor;
    _saveState();
  }

  // ──────────────────────────────────────────
  //  결과 반환
  //  { grid, dominantColorIndex, attribute, imageDataURL }
  //
  //  imageDataURL : 16×16 픽셀을 오프스크린 canvas에 그린 뒤
  //                 투명 PNG base64로 변환한 값.
  //                 index 0(지우개) 셀은 alpha=0(투명) 처리.
  //                 게임 화면에서 loadImage(imageDataURL) 로 바로 사용 가능.
  //                 교수님이 저장/불러오기 기능 붙일 때
  //                 이 문자열 하나만 DB에 저장하면 됨.
  // ──────────────────────────────────────────
  function getResult() {
    const counts = [0, 0, 0, 0];
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        counts[grid[y][x]]++;

    // 흰색(0) 제외하고 가장 많이 쓰인 색
    let dominant = null;
    let maxCount = 0;
    for (let i = 1; i <= 3; i++) {
      if (counts[i] > maxCount) { maxCount = counts[i]; dominant = i; }
    }

    return {
      grid:               _copyGrid(grid),
      dominantColorIndex: dominant,              // null = 색 없음
      attribute:          dominant !== null ? ATTRIBUTES[dominant] : null,
      palette:            PALETTE,
      imageDataURL:       _gridToDataURL(grid),  // 투명 PNG base64
    };
  }

  // ──────────────────────────────────────────
  //  그리드 → 투명 PNG DataURL 변환
  //  오프스크린 <canvas> 를 이용해 p5.js 외부에서 렌더링
  //  index 0 셀 → alpha 0 (투명)
  // ──────────────────────────────────────────
  function _gridToDataURL(src) {
    const cvs = document.createElement('canvas');
    cvs.width  = COLS;   // 16px (1셀 = 1px, 게임에서 scale해서 사용)
    cvs.height = ROWS;
    const ctx  = cvs.getContext('2d');

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const idx = src[y][x];
        if (idx === 0) continue;               // 투명 (fillRect 안 함)
        const c = PALETTE[idx];
        ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return cvs.toDataURL('image/png');         // base64 PNG
  }

  // ──────────────────────────────────────────
  //  히스토리
  // ──────────────────────────────────────────
  function _saveState() {
    history.splice(historyIndex + 1);
    history.push(_copyGrid(grid));
    historyIndex++;
  }

  function _copyGrid(src) {
    return src.map(row => [...row]);
  }

  // ──────────────────────────────────────────
  //  유틸
  // ──────────────────────────────────────────
  function _inRect(mx, my, rx, ry, rw, rh) {
    return mx >= rx && mx <= rx + rw && my >= ry && my <= ry + rh;
  }

  // 공개 API
  return { init, draw, handleClick, handleDrag, handleKey, getResult, PALETTE, ROWS, COLS, CELL };
})();
