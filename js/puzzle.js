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
  let docAnim        = 0;      // 0=닫힘 1=완전열림, opening/closing 중 0~1
  let docAnimState   = 'closed'; // 'closed' | 'opening' | 'open' | 'closing'
  const DOC_ANIM_SPEED = 0.07;

  let currentConfigIdx = 1;
  let configMoves    = 0;
  let initialMap     = [];

  // ── 산데비스탄 이동 효과 ──────────────────────────────
  // renderX/Y : 화면에 그릴 실제 픽셀 위치 (lerp으로 targetX/Y 추적)
  // trails    : 잔상 배열 { x, y, alpha, r, g, b }
  let renderX = 0;
  let renderY = 0;
  let targetX = 0;
  let targetY = 0;
  const LERP_SPEED    = 0.28;  // 클수록 빠르게 도착
  const TRAIL_INTERVAL = 2;    // 몇 프레임마다 잔상 찍기
  let trailTimer = 0;
  let trails     = [];

  // 잔상 색 순환 (산데비스탄 느낌: 파랑→보라→빨강)
  const TRAIL_COLORS = [
    { r: 80,  g: 180, b: 255 },  // 하늘색
    { r: 140, g: 80,  b: 255 },  // 보라
    { r: 255, g: 80,  b: 160 },  // 핑크빨강
    { r: 255, g: 200, b: 60  },  // 노랑
  ];
  let trailColorIdx = 0;

  // ── 가시 밟기 효과 ───────────────────────────────────
  // thornBounce: 남은 프레임 수 (0이면 비활성)
  // thornBounceTotal: 전체 길이 (sin 계산용)
  let thornBounce      = 0;
  const THORN_BOUNCE_FRAMES = 22;

  // ── 이동 횟수 감소 팝업 ──────────────────────────────
  // { text, x, y, alpha }
  let dmgPopups = [];

  // ── 사망 조각 파티클 ─────────────────────────────────
  // { x, y, vx, vy, rot, rotSpeed, size, alpha, r, g, b }
  let deathShards = [];
  let deathAnimDone = false;  // 조각 애니메이션 끝나면 게임오버 UI 표시

  // ── 화면 흔들림 ──────────────────────────────────────
  let shakeFrames    = 0;   // 남은 흔들림 프레임
  let shakeIntensity = 0;   // 흔들림 강도(px)

  // ── lock 벽 조각 파티클 ───────────────────────────────
  let lockShards = [];  // { x, y, vx, vy, rot, rotSpeed, size, alpha }


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
    docAnim      = 0;
    docAnimState = 'closed';

    _loadConfig(currentConfigIdx);

    // 렌더 위치를 스폰 위치로 즉시 초기화
    renderX = BOARD_X + px * CELL;
    renderY = BOARD_Y + py * CELL;
    targetX = renderX;
    targetY = renderY;
    trails  = [];
    trailTimer = 0;
    trailColorIdx = 0;
    thornBounce   = 0;
    dmgPopups     = [];
    deathShards   = [];
    deathAnimDone = false;
    shakeFrames    = 0;
    shakeIntensity = 0;
    lockShards     = [];
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
    docAnim      = 0;
    docAnimState = 'closed';
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

    renderX = BOARD_X + px * CELL;
    renderY = BOARD_Y + py * CELL;
    targetX = renderX;
    targetY = renderY;
    trails  = [];
    trailTimer    = 0;
    thornBounce   = 0;
    dmgPopups     = [];
    deathShards   = [];
    deathAnimDone = false;
    shakeFrames    = 0;
    shakeIntensity = 0;
    lockShards     = [];
  }

  // ──────────────────────────────────────────────────────
  //  렌더링 — main.js draw() 에서 매 프레임 호출
  // ──────────────────────────────────────────────────────
  function draw() {
    if (MAP.length === 0) return;

    // ── 화면 흔들림 ─────────────────────────────────────
    push();
    if (shakeFrames > 0) {
      shakeFrames--;
      const s = shakeIntensity * (shakeFrames / 15);
      translate(random(-s, s), random(-s, s));
    }

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

    // 게임오버여도 조각 애니메이션을 위해 _drawPlayer 항상 호출
    _drawPlayer();

    if (isGameOver) {
      _drawGameOver();
    }

    if (docAnimState !== 'closed') {
      _drawDocScreen();
    }

    // ── lock 조각 렌더링 ─────────────────────────────────
    _drawLockShards();

    pop();  // 화면 흔들림 push/pop
  }

  // 중심(cx, cy) 기준으로 글로우 여러 겹 그리기  col: [r, g, b]
  function _drawGlow(cx, cy, size, col) {
    const layers = 5;
    noStroke();
    for (let i = layers; i >= 1; i--) {
      const spread = size * 0.15 * i;
      const alpha  = map(i, layers, 1, 18, 55);
      fill(col[0], col[1], col[2], alpha);
      rectMode(CENTER);
      rect(cx, cy, size + spread * 2, size + spread * 2);
      rectMode(CORNER);
    }
  }

  function _drawTile(tile, x, y) {

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
      // ── 폴더: 노란 글로우 ──────────────────────────────
      _drawGlow(x + CELL / 2, y + CELL / 2, CELL, [255, 220, 50]);
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
      // ── 문서: 노란 글로우 + 위아래 부유 ──────────────────
      const floatY = sin(frameCount * 0.06) * 5;  // ±5px 부유
      _drawGlow(x + CELL / 2, y + CELL / 2 + floatY, CELL, [255, 240, 120]);
      if (typeof documentImg !== 'undefined' && documentImg) {
        image(documentImg, x, y + floatY, CELL, CELL);
      } else {
        fill(240, 240, 200);
        rect(x, y + floatY, CELL, CELL);
      }
    }
  }

  function _drawPlayer() {
    // ── 사망 조각 애니메이션 ─────────────────────────────
    if (isGameOver && deathShards.length > 0) {
      let allDone = true;
      for (const s of deathShards) {
        s.x   += s.vx;
        s.y   += s.vy;
        s.vy  += 0.4;
        s.rot += s.rotSpeed;
        s.alpha -= 4;
        if (s.alpha > 0) {
          allDone = false;
          push();
          translate(s.x, s.y);
          rotate(s.rot);
          noStroke();
          fill(s.r, s.g, s.b, s.alpha);
          rectMode(CENTER);
          rect(0, 0, s.size, s.size);
          rectMode(CORNER);
          pop();
        }
      }
      if (allDone) deathAnimDone = true;
      _drawDmgPopups();
      return;
    }

    // ── lerp으로 렌더 위치를 목표 위치로 부드럽게 이동 ──
    renderX = lerp(renderX, targetX, LERP_SPEED);
    renderY = lerp(renderY, targetY, LERP_SPEED);

    // ── 가시 바운스 Y 오프셋 계산 ───────────────────────
    let bounceOffsetY = 0;
    let thornTint     = false;
    if (thornBounce > 0) {
      thornBounce--;
      const t = 1 - thornBounce / THORN_BOUNCE_FRAMES;
      bounceOffsetY = -sin(t * PI) * 18;
      thornTint     = true;
    }

    // 이동 중일 때만 잔상 찍기
    const moving = dist(renderX, renderY, targetX, targetY) > 1;
    if (moving) {
      trailTimer++;
      if (trailTimer >= TRAIL_INTERVAL) {
        trailTimer = 0;
        const c = TRAIL_COLORS[trailColorIdx % TRAIL_COLORS.length];
        trailColorIdx++;
        trails.push({ x: renderX, y: renderY, alpha: 200, r: c.r, g: c.g, b: c.b });
        if (trails.length > 12) trails.shift();
      }
    }

    // ── 잔상 렌더링 ──────────────────────────────────────
    for (let i = trails.length - 1; i >= 0; i--) {
      const t = trails[i];
      t.alpha -= 18;
      if (t.alpha <= 0) { trails.splice(i, 1); continue; }
      tint(t.r, t.g, t.b, t.alpha);
      if (playerRef?.sprite) {
        imageMode(CORNER); noSmooth();
        image(playerRef.sprite, t.x, t.y, CELL, CELL);
        imageMode(CORNER);
      } else {
        fill(t.r, t.g, t.b, t.alpha); noStroke();
        ellipse(t.x + CELL / 2, t.y + CELL / 2, CELL * 0.75);
      }
      noTint();
    }

    // ── 본체 렌더링 ──────────────────────────────────────
    const drawY = renderY + bounceOffsetY;
    if (thornTint) tint(255, 60, 60, 230);
    if (playerRef?.sprite) {
      imageMode(CORNER); noSmooth();
      image(playerRef.sprite, renderX, drawY, CELL, CELL);
      imageMode(CORNER);
    } else {
      fill(thornTint ? color(255, 60, 60) : color(0, 160, 255));
      noStroke();
      ellipse(renderX + CELL / 2, drawY + CELL / 2, CELL * 0.75);
    }
    if (thornTint) noTint();

    _drawDmgPopups();
  }

  function _drawDmgPopups() {
    textFont(gameFont);
    textAlign(CENTER, CENTER);
    for (let i = dmgPopups.length - 1; i >= 0; i--) {
      const p = dmgPopups[i];
      p.y    -= 1.5;
      p.alpha -= 5;
      if (p.alpha <= 0) { dmgPopups.splice(i, 1); continue; }
      noStroke();
      fill(255, 60, 60, p.alpha);
      textSize(36);
      text(p.text, p.x, p.y);
    }
  }


  function _drawGameOver() {
    // 조각 애니메이션이 끝나기 전엔 게임오버 UI 숨김
    if (!deathAnimDone && deathShards.length > 0) return;

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
    // ── 애니메이션 progress 업데이트 ─────────────────────
    if (docAnimState === 'opening') {
      docAnim = min(docAnim + DOC_ANIM_SPEED, 1);
      if (docAnim >= 1) docAnimState = 'open';
    } else if (docAnimState === 'closing') {
      docAnim = max(docAnim - DOC_ANIM_SPEED, 0);
      if (docAnim <= 0) {
        docAnimState = 'closed';
        showingDoc   = false;
        return;
      }
    }

    // easing: 부드럽게
    const t   = docAnim;
    const eas = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;  // ease in-out quad

    const alpha  = eas * 255;
    const scaleV = 0.85 + eas * 0.15;  // 0.85→1.0 크기 변화
    const cx = 800, cy = 450;

    // ── 검정 배경 (투명도 적용) ──────────────────────────
    fill(0, 0, 0, alpha);
    noStroke();
    rect(0, 0, 1600, 900);

    // ── 문서 이미지 (중앙 기준 스케일 + 투명도) ──────────
    let docImg = null;
    if      (roomNumber === 1 && typeof document01 !== 'undefined') docImg = document01;
    else if (roomNumber === 2 && typeof document02 !== 'undefined') docImg = document02;
    else if (roomNumber === 3 && typeof document03 !== 'undefined') docImg = document03;

    const w = 1600 * scaleV;
    const h = 900  * scaleV;

    tint(255, alpha);
    if (docImg) {
      imageMode(CENTER);
      image(docImg, cx, cy, w, h);
      imageMode(CORNER);
    } else {
      fill(40, 40, 40, alpha);
      rectMode(CENTER);
      rect(cx, cy, w, h);
      rectMode(CORNER);
      fill(200, 200, 200, alpha);
      textFont(gameFont);
      textAlign(CENTER, CENTER);
      textSize(28);
      text('[ 문서 내용 준비 중 ]', cx, cy);
    }
    noTint();

    // ── 닫기 안내 (완전히 열렸을 때만, 깜빡임) ───────────
    if (docAnimState === 'open' && (frameCount % 60) < 40) {
      fill(180);
      noStroke();
      textFont(gameFont);
      textSize(16);
      textAlign(CENTER, CENTER);
      text('SPACE 키를 눌러 닫기', 800, 860);
    }
  }

  function handleKey(k) {
    if (docAnimState !== 'closed') {
      if (k === ' ' && docAnimState === 'open') {
        docAnimState = 'closing';
      }
      return;
    }

    if (isGameOver) {
      if (k === 'r' || k === 'R') _reset();
      if (k === 'm' || k === 'M') transitionTo('INTRO');
      return;
    }

    // lerp 이동 중(아직 목표에 도달 안 함)에는 입력 무시
    if (dist(renderX, renderY, targetX, targetY) > 3) return;

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
      if (typeof selectSound !== 'undefined' && selectSound) selectSound.play();
      _reset();
      return;
    }

    if (mx >= BTN_MAIN.x && mx <= BTN_MAIN.x + BTN_MAIN.w &&
        my >= BTN_MAIN.y && my <= BTN_MAIN.y + BTN_MAIN.h) {
      if (typeof selectSound !== 'undefined' && selectSound) selectSound.play();
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
      _spawnDeathShards();
      return;
    }

    // 잠긴 문 통과 불가
    if (tile === 11) return;

    // 속성 바이러스 상성 체크
    if (tile === 2 || tile === 3 || tile === 4) {
      if (PASSABLE[attrName] !== tile) {
        isGameOver = true;
        _spawnDeathShards();
        return;
      }
    }

    // 폴더 도착 완료 처리
    if (tile === 5) {
      px = nx; py = ny;
      targetX = BOARD_X + px * CELL;
      targetY = BOARD_Y + py * CELL;
      setTimeout(() => { if (onClear) onClear(); }, 500);
      return;
    }

    px = nx;
    py = ny;
    targetX = BOARD_X + px * CELL;
    targetY = BOARD_Y + py * CELL;
    movesLeft--;

    // 발판 기믹 활성화 연산 파트
    if (tile === 6) {
      // lock 조각 효과 (MAP 바꾸기 전에 위치 파악)
      _spawnLockShards();

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
      const penalty = THORN_PENALTY[tile];
      movesLeft -= penalty;

      // 가시 밟기 시각 효과
      thornBounce = THORN_BOUNCE_FRAMES;
      dmgPopups.push({
        text:  `-${penalty}`,
        x:     renderX + CELL / 2,
        y:     renderY,
        alpha: 255,
      });

      // 가시 효과음
      if (typeof hurtSound !== 'undefined' && hurtSound) {
        hurtSound.stop();
        hurtSound.play();
      }
    }

    if (tile === 12) {
      showingDoc   = true;
      docAnimState = 'opening';
      docAnim      = 0;
    }

    if (movesLeft <= 0) {
      isGameOver = true;
      _spawnDeathShards();
    }
  }

  // 사망 시 조각 파티클 생성
  function _spawnDeathShards() {
    deathShards = [];
    deathAnimDone = false;
    const cx = renderX + CELL / 2;
    const cy = renderY + CELL / 2;
    const SHARD_COUNT = 16;

    const colors = [
      { r: 255, g: 255, b: 255 },
      { r: 200, g: 200, b: 255 },
      { r: 255, g: 200, b: 200 },
    ];

    for (let i = 0; i < SHARD_COUNT; i++) {
      const angle = (TWO_PI / SHARD_COUNT) * i + random(-0.3, 0.3);
      const speed = random(2, 6);
      const c     = random(colors);
      deathShards.push({
        x:        cx,
        y:        cy,
        vx:       cos(angle) * speed,
        vy:       sin(angle) * speed - random(1, 3),
        rot:      random(TWO_PI),
        rotSpeed: random(-0.2, 0.2),
        size:     random(6, 16),
        alpha:    255,
        r: c.r, g: c.g, b: c.b,
      });
    }

    // 죽을 때 강한 화면 흔들림
    shakeFrames    = 25;
    shakeIntensity = 8;

    // 게임오버 사운드
    if (typeof gameoverSound !== 'undefined' && gameoverSound) gameoverSound.play();
  }

  // lock 벽 조각 파티클 생성 (발판 밟을 때 호출)
  function _spawnLockShards() {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        // 열리기 직전 MAP에서 11인 칸(이미 0으로 바뀌기 전에 호출됨)
        if (MAP[r][c] === 11) {
          const cx = BOARD_X + c * CELL + CELL / 2;
          const cy = BOARD_Y + r * CELL + CELL / 2;
          for (let i = 0; i < 8; i++) {
            const angle = random(TWO_PI);
            const speed = random(1.5, 4);
            lockShards.push({
              x:        cx + random(-CELL/3, CELL/3),
              y:        cy + random(-CELL/3, CELL/3),
              vx:       cos(angle) * speed,
              vy:       sin(angle) * speed - random(0.5, 2),
              rot:      random(TWO_PI),
              rotSpeed: random(-0.15, 0.15),
              size:     random(4, 10),
              alpha:    255,
            });
          }
        }
      }
    }

    // 약한 화면 흔들림
    shakeFrames    = 15;
    shakeIntensity = 4;

    // 부서지는 소리
    if (typeof gameoverSound !== 'undefined' && gameoverSound) gameoverSound.play();
  }

  // lock 조각 렌더링
  function _drawLockShards() {
    if (lockShards.length === 0) return;
    noStroke();
    for (let i = lockShards.length - 1; i >= 0; i--) {
      const s = lockShards[i];
      s.x   += s.vx;
      s.y   += s.vy;
      s.vy  += 0.3;
      s.rot += s.rotSpeed;
      s.alpha -= 5;
      if (s.alpha <= 0) { lockShards.splice(i, 1); continue; }
      push();
      translate(s.x, s.y);
      rotate(s.rot);
      fill(180, 80, 80, s.alpha);   // 붉은 계열 (LOCK 색상)
      rectMode(CENTER);
      rect(0, 0, s.size, s.size);
      rectMode(CORNER);
      pop();
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