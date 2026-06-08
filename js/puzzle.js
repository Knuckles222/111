const PUZZLE = (() => {

  // ──────────────────────────────────────────────────────
  //  레이아웃 상수 (팀원 코드 기준 그대로)
  // ──────────────────────────────────────────────────────
  const GRID_SIZE = 12;
  const CELL      = 60;
  const BOARD_X   = 620;
  const BOARD_Y   = 120;

  // 게임오버 재시도 버튼 영역 (팀원 코드와 동일)
  const BTN_RETRY = { x: 500, y: 520, w: 240, h: 65 };
  const BTN_MAIN  = { x: 860, y: 520, w: 240, h: 65 };

  // 속성 이름(한글) → 통과 가능 바이러스 타일 번호
  const PASSABLE = { '불': 2, '물': 3, '풀': 4 };

  // 가시 타일 → 추가 이동 횟수 페널티
  const THORN_PENALTY = { 7: 1, 8: 2, 10: 3, 9: 4 };



  // ──────────────────────────────────────────────────────
  //  스테이지 1 맵 데이터
  //  - 사용자가 제공한 1스테이지 방 1~3 배열 기준
  //  - moves 값은 튜토리얼 난이도에 맞춰 여유 있게 설정
  //  - 1번 방은 행1/열5를 잠긴 문(B)으로 표시하고, 발판을 밟으면 열리도록 지정
  // ──────────────────────────────────────────────────────
  const STAGE1_CONFIGS = {
    1: {
      moves: 16,
      buttonOpens: [{ r: 1, c: 5 }],
      map: [
        [1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1],
        [1, 1, 0, 0, 0, 'B', 0, 0, 0, 1, 1, 1],
        [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1],
        [1, 1, 2, 1, 1, 4, 1, 1, 3, 1, 1, 1],
        [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1],
        [1, 1, 6, 1, 1, 6, 1, 1, 6, 1, 1, 1],
        [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1],
        [1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
        [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 'c', 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ],
    },
    2: {
      moves: 13,
      map: [
        [1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1],
        [1, 1, 1, 0, 1, 8, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 0, 1, 7, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 'c', 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ],
    },
    3: {
      moves: 20,
      map: [
        [1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 'B', 1, 1, 1, 1, 1, 1],
        [1, 1, 0, 0, 3, 0, 4, 0, 0, 1, 1, 1],
        [1, 1, 0, 1, 1, 2, 1, 1, 0, 1, 1, 1],
        [1, 1, 0, 0, 9, 0, 0, 0, 0, 1, 1, 1],
        [1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1],
        [1, 1, 0, 0, 0, 6, 0, 0, 0, 1, 1, 1],
        [1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1],
        [1, 1, 0, 0, 8, 0, 0, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 'c', 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ],
    },
  };

  // ──────────────────────────────────────────────────────
  //  스테이지 2 맵 데이터 (팀원 원본 그대로)
  // ──────────────────────────────────────────────────────
  const STAGE2_CONFIGS = {
    1: {
      moves: 68,
      map: [
        ['c', 1, 0, 0, 0, 1, 'D', 7, 0, 1, 1, 1],
        [0, 1, 0, 1, 0, 1, 7, 1, 0, 1, 1, 1],
        [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1],
        [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1],
        [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1],
        [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1],
        [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1],
        [0, 1, 0, 1, 0, 1, 0, 1, 0, 2, 9, 5],
        [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1],
        [0, 1, 0, 1, 0, 1, 0, 1, 0, 3, 8, 5],
        [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1],
        [0, 0, 0, 1, 0, 0, 0, 1, 0, 4, 0, 5],
      ],
    },
    2: {
      moves: 43,
      map: [
        ['r', 7, 0, 0, 0, 9, 1, 7, 9, 9, 'A', 'g'],
        [9, 1, 4, 3, 1, 9, 1, 8, 4, 1, 1, 7],
        [0, 3, 0, 'A', 2, 'A', 4, 'A', 2, 9, 0, 0],
        [0, 4, 0, 1, 6, 'A', 2, 9, 9, 9, 0, 2],
        [0, 0, 0, 9, 9, 1, 1, 1, 9, 3, 0, 0],
        [1, 3, 1, 2, 1, 5, 'B', 4, 7, 9, 2, 0],
        [0, 7, 1, 9, 9, 'B', 'D', 9, 9, 3, 0, 0],
        [0, 'A', 4, 9, 9, 8, 1, 1, 9, 9, 0, 3],
        [0, 1, 3, 9, 3, 1, 3, 9, 9, 9, 0, 0],
        [0, 2, 'A', 1, 'A', 9, 9, 9, 9, 9, 1, 0],
        ['A', 1, 0, 0, 0, 4, 0, 0, 0, 1, 6, 4],
        ['b', 7, 0, 4, 0, 0, 0, 2, 0, 0, 3, 9],
      ],
    },
    3: {
      moves: 71,
      map: [
        ['c', 7, 7, 7, 7, 7, 7, 1, 7, 7, 7, 7],
        [1, 8, 1, 8, 9, 9, 9, 1, 9, 9, 9, 7],
        [7, 7, 9, 7, 9, 9, 9, 1, 9, 9, 9, 7],
        [7, 9, 7, 7, 9, 9, 1, 9, 9, 9, 9, 9],
        [7, 9, 8, 8, 9, 1, 9, 9, 9, 7, 7, 7],
        [7, 9, 9, 1, 1, 6, 9, 1, 9, 7, 9, 7],
        [7, 9, 9, 9, 1, 7, 'D', 7, 8, 7, 9, 7],
        [7, 9, 8, 9, 1, 7, 1, 8, 9, 9, 'A', 8],
        [7, 9, 1, 9, 9, 7, 1, 7, 7, 9, 9, 9],
        [7, 9, 9, 9, 9, 7, 1, 9, 7, 7, 9, 7],
        [7, 1, 8, 9, 9, 7, 1, 7, 1, 7, 7, 'B'],
        [7, 7, 7, 8, 7, 7, 1, 9, 7, 9, 'B', 5],
      ],
    },
  };

  // ──────────────────────────────────────────────────────
  //  런타임 상태
  // ──────────────────────────────────────────────────────
  let playerRef      = null;   
  let onClear        = null;   
  let roomNumber     = 1;
  let stageNumber    = 1;

  let MAP            = [];
  let px = 0, py = 0;
  let movesLeft      = 0;
  let isGameOver     = false;
  let showingDoc     = false;  

  let currentConfigIdx = 1;
  let configMoves    = 0;
  let initialMap     = [];


  function _getStageConfigs() {
    return stageNumber === 1 ? STAGE1_CONFIGS : STAGE2_CONFIGS;
  }

  function _getCurrentConfig() {
    return _getStageConfigs()[currentConfigIdx];
  }

  function init(config) {
    playerRef    = config.player;
    onClear      = config.onClear;
    roomNumber   = config.room ?? 1;
    stageNumber  = config.stage ?? 1;
    currentConfigIdx = roomNumber;
    showingDoc   = false;

    _loadConfig(currentConfigIdx);
  }

  // 설정에서 맵 로드 + 스폰 위치 파싱
  function _loadConfig(idx) {
    const cfg = _getStageConfigs()[idx];
    if (!cfg) {
      console.warn('[PUZZLE] 존재하지 않는 방:', { stage: stageNumber, room: idx });
      return;
    }

    configMoves = cfg.moves;
    const userAttr = playerRef?.attribute?.name ?? '';

    let spawnX = 0, spawnY = 0;
    const parsed = cfg.map.map((row, r) =>
      row.map((cell, c) => {
        if (cell === 'c') { spawnX = c; spawnY = r; return 0; }
        if (cell === 'r' && userAttr === '불') { spawnX = c; spawnY = r; return 0; }
        if (cell === 'b' && userAttr === '물') { spawnX = c; spawnY = r; return 0; }
        if (cell === 'g' && userAttr === '풀') { spawnX = c; spawnY = r; return 0; }
        if (cell === 'r' || cell === 'b' || cell === 'g') return 0;
        
        if (cell === 'D') return 12; // 문서 타일
        
        // ──────────────────────────────────────────────────
        // 💡 [버그 수정] 'B' 기호가 오실 때 잠긴 문(11)으로 정상 생성되도록 연결!
        // ──────────────────────────────────────────────────
        if (cell === 'B') return 11; 
        if (cell === 'A') return 10; // 가시 3개 내부 번호 변환
        return Number(cell);
      })
    );

    initialMap  = parsed.map(row => [...row]);
    MAP         = parsed.map(row => [...row]);
    px          = spawnX;
    py          = spawnY;
    movesLeft   = configMoves;
    isGameOver  = false;
    showingDoc  = false;
  }

  function _reset() {
    MAP        = initialMap.map(row => [...row]);
    movesLeft  = configMoves;
    isGameOver = false;
    showingDoc = false;

    const cfg = _getCurrentConfig();
    const userAttr = playerRef?.attribute?.name ?? '';
    outer:
    for (let r = 0; r < cfg.map.length; r++) {
      for (let c = 0; c < cfg.map[r].length; c++) {
        const cell = cfg.map[r][c];
        if (cell === 'c') { px = c; py = r; break outer; }
        if (cell === 'r' && userAttr === '불') { px = c; py = r; break outer; }
        if (cell === 'b' && userAttr === '물') { px = c; py = r; break outer; }
        if (cell === 'g' && userAttr === '풀') { px = c; py = r; break outer; }
      }
    }
  }

  // ──────────────────────────────────────────────────────
  //  렌더링 — main.js draw() 에서 매 프레임 호출
  // ──────────────────────────────────────────────────────
  function draw() {
    if (MAP.length === 0) return;

    if (typeof puzzleUI !== 'undefined' && puzzleUI) {
      image(puzzleUI, 0, 0, 1600, 900);
    } else {
      gameBackground(40);
    }

    textFont(gameFont);
    fill('white');
    textSize(200);
    textAlign(CENTER, CENTER);
    text(movesLeft, 215, 630);

    const attrName = playerRef?.attribute?.name ?? '없음';
    if      (attrName === '불') fill(205, 80,  80 );
    else if (attrName === '물') fill(80,  150, 220);
    else if (attrName === '풀') fill(100, 200, 80 );
    else                        fill(200, 200, 200);
    textSize(36);
    text(attrName, 215, 280);

    fill(0);
    noStroke();
    rect(BOARD_X, BOARD_Y, GRID_SIZE * CELL, GRID_SIZE * CELL);

    // 타일 렌더링
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const tile = MAP[r][c];
        const x    = BOARD_X + c * CELL;
        const y    = BOARD_Y + r * CELL;

        _drawTile(tile, x, y);
      }
    }

    // ──────────────────────────────────────────────────────
    // 💡 [그리드 기능 추가] 연한 격자 선 실시간 드로잉 연산 파트
    // ──────────────────────────────────────────────────────
    stroke(255, 255, 255, 40); 
    strokeWeight(1);           
    for (let c = 0; c <= GRID_SIZE; c++) {
      let x = BOARD_X + c * CELL;
      line(x, BOARD_Y, x, BOARD_Y + GRID_SIZE * CELL);
    }
    for (let r = 0; r <= GRID_SIZE; r++) {
      let y = BOARD_Y + r * CELL;
      line(BOARD_X, y, BOARD_X + GRID_SIZE * CELL, y);
    }
    noStroke(); 

    if (!isGameOver) {
      _drawPlayer();
    }

    if (isGameOver) {
      _drawGameOver();
    }

    if (showingDoc) {
      _drawDocScreen();
    }
  }

  function _drawTile(tile, x, y) {
    noStroke();

    if (tile === 1) {
      if (typeof virus !== 'undefined' && virus) image(virus, x, y, CELL, CELL);
      else { fill(180, 50, 200); rect(x, y, CELL, CELL); }
    }
    else if (tile === 2) {
      if (typeof fire !== 'undefined' && fire) image(fire, x, y, CELL, CELL);
      else { fill(200, 60, 60); rect(x, y, CELL, CELL); }
    }
    else if (tile === 3) {
      if (typeof water !== 'undefined' && water) image(water, x, y, CELL, CELL);
      else { fill(60, 100, 200); rect(x, y, CELL, CELL); }
    }
    else if (tile === 4) {
      if (typeof grass !== 'undefined' && grass) image(grass, x, y, CELL, CELL);
      else { fill(80, 160, 60); rect(x, y, CELL, CELL); }
    }
    else if (tile === 5) {
      if (typeof fold !== 'undefined' && fold) image(fold, x, y, CELL, CELL);
      else { fill(255, 220, 50); rect(x, y, CELL, CELL); }
    }
    else if (tile === 6) {
      if (typeof foothold !== 'undefined' && foothold) image(foothold, x, y, CELL, CELL);
      else { fill(150, 0, 255); rect(x, y, CELL, CELL); }
    }
    else if (tile === 7) {
      if (typeof thorn01 !== 'undefined' && thorn01) image(thorn01, x, y, CELL, CELL);
      else { fill(180, 120, 60); rect(x, y, CELL, CELL); }
    }
    else if (tile === 8) {
      if (typeof thorn02 !== 'undefined' && thorn02) image(thorn02, x, y, CELL, CELL);
      else { fill(160, 100, 40); rect(x, y, CELL, CELL); }
    }
    else if (tile === 9) {
      if (typeof thorn04 !== 'undefined' && thorn04) image(thorn04, x, y, CELL, CELL);
      else { fill(120, 60, 20); rect(x, y, CELL, CELL); }
    }
    else if (tile === 10) {
      if (typeof thorn03 !== 'undefined' && thorn03) image(thorn03, x, y, CELL, CELL);
      else { fill(140, 80, 30); rect(x, y, CELL, CELL); }
    }
    else if (tile === 11) {
      fill(60);
      stroke(255, 50, 50);
      strokeWeight(2);
      rect(x + 4, y + 4, CELL - 8, CELL - 8);
      fill(255, 50, 50);
      noStroke();
      textFont(gameFont);
      textSize(12);
      textAlign(CENTER, CENTER);
      text('LOCK', x + CELL / 2, y + CELL / 2);
    }
    else if (tile === 12) {
      if (typeof documentImg !== 'undefined' && documentImg) image(documentImg, x, y, CELL, CELL);
      else { fill(240, 240, 200); rect(x, y, CELL, CELL); }
    }
  }

  function _drawPlayer() {
    const x = BOARD_X + px * CELL;
    const y = BOARD_Y + py * CELL;

    if (playerRef?.sprite) {
      imageMode(CORNER);
      noSmooth();
      image(playerRef.sprite, x, y, CELL, CELL);
      imageMode(CORNER);
    } else {
      fill(0, 160, 255);
      noStroke();
      ellipse(x + CELL / 2, y + CELL / 2, CELL * 0.75);
    }
  }

  function _drawGameOver() {
    if (typeof gameover !== 'undefined' && gameover) {
      image(gameover, -32, 0, 1632, 918);
    } else {
      fill(0, 0, 0, 180);
      noStroke();
      rect(0, 0, 1600, 900);
    }

    textFont(gameFont);
    textAlign(CENTER, CENTER);
    fill(150);
    textSize(22);
    text('백신 연산 횟수가 소진되었거나 바이러스에 감염되었습니다.', 800, 450);

    const mx = typeof gameMouseX === 'function' ? gameMouseX() : mouseX;
    const my = typeof gameMouseY === 'function' ? gameMouseY() : mouseY;
    const hoverRetry = (mx >= BTN_RETRY.x && mx <= BTN_RETRY.x + BTN_RETRY.w &&
                        my >= BTN_RETRY.y && my <= BTN_RETRY.y + BTN_RETRY.h);
    const hoverMain = (mx >= BTN_MAIN.x && mx <= BTN_MAIN.x + BTN_MAIN.w &&
                       my >= BTN_MAIN.y && my <= BTN_MAIN.y + BTN_MAIN.h);

    cursor((hoverRetry || hoverMain) ? HAND : ARROW);

    _drawGameOverButton(BTN_RETRY, '다시 시도 (R)', hoverRetry);
    _drawGameOverButton(BTN_MAIN, '메인 화면', hoverMain);
  }

  function _drawGameOverButton(btn, label, hover) {
    if (hover) { fill(255); stroke(0); }
    else       { fill(20, 20, 20, 180); stroke(150); }
    strokeWeight(2);
    rect(btn.x, btn.y, btn.w, btn.h);

    noStroke();
    fill(hover ? 0 : 220);
    textFont(gameFont);
    textSize(24);
    textAlign(CENTER, CENTER);
    text(label, btn.x + btn.w / 2, btn.y + btn.h / 2);
  }

  function _drawDocScreen() {
    // 퍼즐 배경이 보이지 않도록 불투명 검정 배경을 먼저 깔기
    fill(0);
    noStroke();
    rect(0, 0, 1600, 900);

    // 방 번호에 따라 document01/02/03.png 선택
    let docImg = null;
    if      (roomNumber === 1 && typeof document01 !== 'undefined') docImg = document01;
    else if (roomNumber === 2 && typeof document02 !== 'undefined') docImg = document02;
    else if (roomNumber === 3 && typeof document03 !== 'undefined') docImg = document03;

    if (docImg) {
      image(docImg, 0, 0, 1600, 900);
    } else {
      // 이미지 없을 때 fallback
      fill(0, 0, 0, 230);
      noStroke();
      rect(0, 0, 1600, 900);
      textFont(gameFont);
      textAlign(CENTER, CENTER);
      fill(200);
      textSize(28);
      text('[ 문서 내용 준비 중 ]', 800, 420);
    }

    // 닫기 안내 (깜빡임)
    if ((frameCount % 60) < 40) {
      textFont(gameFont);
      fill(180);
      noStroke();
      textSize(16);
      textAlign(CENTER, CENTER);
      text('SPACE 키를 눌러 닫기', 800, 860);
    }
  }

  function handleKey(k) {
    if (showingDoc) {
      if (k === ' ') showingDoc = false;
      return;
    }

    if (isGameOver) {
      if (k === 'r' || k === 'R') _reset();
      if (k === 'm' || k === 'M') transitionTo('INTRO');
      return;
    }

    let dx = 0, dy = 0;
    if      (k === 'ArrowUp'    || k === 'w' || k === 'W') dy = -1;
    else if (k === 'ArrowDown'  || k === 's' || k === 'S') dy =  1;
    else if (k === 'ArrowLeft'  || k === 'a' || k === 'A') dx = -1;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') dx =  1;
    else return;

    _tryMove(dx, dy);
  }

  function handleClick(mx, my) {
    if (!isGameOver) return;

    if (mx >= BTN_RETRY.x && mx <= BTN_RETRY.x + BTN_RETRY.w &&
        my >= BTN_RETRY.y && my <= BTN_RETRY.y + BTN_RETRY.h) {
      _reset();
      return;
    }

    if (mx >= BTN_MAIN.x && mx <= BTN_MAIN.x + BTN_MAIN.w &&
        my >= BTN_MAIN.y && my <= BTN_MAIN.y + BTN_MAIN.h) {
      transitionTo('INTRO');
    }
  }

  function _tryMove(dx, dy) {
    const nx = px + dx;
    const ny = py + dy;

    if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) return;

    const tile     = MAP[ny][nx];
    const attrName = playerRef?.attribute?.name;

    // 벽 충돌 시 즉사
    if (tile === 1) {
      isGameOver = true;
      return;
    }

    // 잠긴 문 통과 불가
    if (tile === 11) return;

    // 속성 바이러스 상성 체크
    if (tile === 2 || tile === 3 || tile === 4) {
      if (PASSABLE[attrName] !== tile) {
        isGameOver = true;
        return;
      }
    }

    // 폴더 도착 완료 처리
    if (tile === 5) {
      px = nx; py = ny;
      setTimeout(() => { if (onClear) onClear(); }, 500);
      return;
    }

    px = nx;
    py = ny;
    movesLeft--;

    // 발판 기믹 활성화 연산 파트
    if (tile === 6) {
      // 1) B로 표시된 잠긴 문 전체 열기
      for (let r = 0; r < GRID_SIZE; r++)
        for (let c = 0; c < GRID_SIZE; c++)
          if (MAP[r][c] === 11) MAP[r][c] = 0;

      // 2) 방별로 지정된 추가 오픈 칸 열기
      //    스테이지 1-1처럼 배열상 벽(1)으로 보이지만 발판으로 열리는 튜토리얼 칸 처리
      const cfg = _getCurrentConfig();
      if (Array.isArray(cfg?.buttonOpens)) {
        for (const openCell of cfg.buttonOpens) {
          if (openCell && Number.isInteger(openCell.r) && Number.isInteger(openCell.c)) {
            MAP[openCell.r][openCell.c] = 0;
          }
        }
      }
    }

    if (THORN_PENALTY[tile] !== undefined) {
      movesLeft -= THORN_PENALTY[tile];
    }

    if (tile === 12) {
      showingDoc = true;
    }

    if (movesLeft <= 0) {
      isGameOver = true;
    }
  }

  return { init, draw, handleKey, handleClick, getSaveData, loadSaveData };

  function getSaveData() {
    return {
      stageNumber,
      roomNumber,
      currentConfigIdx,
      configMoves,
      px, py,
      movesLeft,
      isGameOver,
      showingDoc,
      map:        MAP.map(row => [...row]),
      initialMap: initialMap.map(row => [...row]),
    };
  }

  function loadSaveData(data) {
    if (!data) return;
    if (data.stageNumber !== undefined) stageNumber = data.stageNumber;
    roomNumber       = data.roomNumber       ?? 1;
    currentConfigIdx = data.currentConfigIdx ?? 1;
    configMoves      = data.configMoves      ?? 20;
    px               = data.px               ?? 0;
    py               = data.py               ?? 0;
    movesLeft        = data.movesLeft        ?? configMoves;
    isGameOver       = data.isGameOver       ?? false;
    showingDoc       = data.showingDoc       ?? false;

    if (Array.isArray(data.map))        MAP        = data.map.map(row => [...row]);
    if (Array.isArray(data.initialMap)) initialMap = data.initialMap.map(row => [...row]);
  }
})();