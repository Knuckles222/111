// ============================================================
//  cutscene.js
//  컷신 시스템
//
//  [ 게임 흐름에서의 위치 ]
//  INTRO(타이틀) → [CUTSCENE: scene1] → PIXEL_EDITOR
//    → PUZZLE_ROOM → [CUTSCENE: scene2] → STAGE1_CLEAR
//    → [CUTSCENE: scene3] → PIXEL_EDITOR
//    → PUZZLE_ROOM → [CUTSCENE: scene4]
//
//  [ 외부에서 사용하는 함수 ]
//  CUTSCENE.start(sceneId, onEndCallback)  — 컷신 시작
//  CUTSCENE.draw()                         — 매 프레임 렌더링
//  CUTSCENE.handleClick()                  — 마우스 클릭 처리
//  CUTSCENE.handleKey(k)                   — 키 입력 처리 (스페이스)
//
//  [ sceneId 목록 ]
//  'scene1' : 오프닝 (기록 10번 ~ 동기 등장)
//  'scene2' : 바이러스 제거 성공 (기록 11번)
//  'scene3' : 새 의뢰 (기록 12번 ~ 낯선 남자)
//  'scene4' : 위기 (기록 13번 ~ 살인자 등장)
// ============================================================



const CUTSCENE = (() => {

  // ──────────────────────────────────────────────────────
  //  에셋 변수 (preload 에서 main.js 가 채워줌)
  //  각 컷신 draw 에서 참조하는 이미지·사운드는
  //  main.js preload() 에서 로드한 전역 변수를 그대로 사용
  // ──────────────────────────────────────────────────────

  // ──────────────────────────────────────────────────────
  //  컷신 데이터 정의
  //  원본 대사·캐릭터 이미지 변수명·state 값 그대로 유지
  // ──────────────────────────────────────────────────────
  const SCENES = {

    // ────────────────────────────────────────────────────
    //  컷신 1 : 오프닝 (기록 10번)
    // ────────────────────────────────────────────────────
    scene1: [
      { imgVar: null,    text: "기록 제 10번: O월 O일",                                                                              state: "나" },
      { imgVar: null,    text: "드디어 몇 개월 간 밤을 세운 끝에 난 모든 바이러스를 제거할 수 있는 백신을 만들었다",                state: "나" },
      { imgVar: null,    text: "이 백신이 특별한 점은 마치 백신을 로봇처럼 내가 조종할 수 있다는 점이다.",                          state: "나" },
      { imgVar: null,    text: "이제 필요한 건 이 백신이 정말로 쓸모 있는지 확인해 보는 것이다.",                                   state: "나" },
      { imgVar: null,    text: "그래도 그 전에, 나는 잠을 좀 자야겠다....",                                                         state: "나" },
      { imgVar: null,    text: "...",                                                                                                state: "나" },
      { imgVar: null,    text: "*** 띵  동  ! ***",                                                                                 state: "bell-effect" },
      { imgVar: null,    text: "...( 졸리니까 무시해야겠다 )...",                                                                   state: "나" },
      { imgVar: null,    text: "*** 띵  동  !!! ***",                                                                               state: "bell-effect" },
      { imgVar: null,    text: "야! 문 좀 열어줘! 급한 일이야! 너 설마 아직까지 자고 있는 건 아니지? 해가 중천에 떴다고!",          state: "???" },
      { imgVar: 'girl03', text: "오! 문 열어줬다! ...얼굴을 보니 너 정말 잠자고 있었나 보네.. 정말 미안해.",                       state: "나의 대학 동기" },
      { imgVar: 'girl03', text: "( 이 사람은 나의 대학 동기다. 전에 팀 프로젝트를 한 것으로 친해졌다. )", state: "나" },
      { imgVar: 'girl03', text: "( 하지만 오늘은 어째선지 굉장히 안절부절못하고 있다.. )", state: "나" },
      { imgVar: 'girl03', text: "뭐, 무슨 일이길래 그래.",                                                                         state: "나" },
      { imgVar: 'girl02', text: "내가 전에 너한테 말해줬던거 있잖아, 내가 논문을 쓰고 있다고 한거.",                               state: "나의 대학 동기" },
      { imgVar: 'girl02', text: "그게 왜?",                                                                                         state: "나" },
      { imgVar: 'girl01', text: "그 논문 전체를 내가 노트북에 저장했는데, 글쎄, 그게, 바이러스에 걸려서 노트북이 먹통이 됐어!!",  state: "나의 대학 동기" },
      { imgVar: 'girl01', text: "이거 어떡해?? 나 일주일 뒤에 교수님께 제출해야 한단 말이야!",                                     state: "나의 대학 동기" },
      { imgVar: 'girl01', text: "너가 뭐 만들고 있다는 그 백신 그걸로 어떻게 해주면 안 될까? 나 일주일 내에 논문 다시 못 만들어....", state: "나의 대학 동기" },
      { imgVar: 'girl01', text: "백신으로? 마침 어제 막 완성하긴 했는데.",                                                         state: "나" },
      { imgVar: 'girl03', text: "어? 어? 정말?! 나 너 믿는다! 땡큐!! 노트북 여기 두고 갈게!!",                                    state: "나의 대학 동기" },
      { imgVar: null,    text: "( 내가 해주겠다는 말도 안했는데 뭐가 그리 급한 지 나가버렸다 )",                                   state: "나" },
      { imgVar: null,    text: "내가 만든 백신이라면 이 정도는 금방이지. 아무리 그래도 그렇지 부탁만 하고 냅다 가버리는 게 어디 있어.", state: "나" },
      { imgVar: null,    text: "잠도 다 깼으니 이제 일을 시작해보자.",                                                              state: "나" },
    ],

    // ────────────────────────────────────────────────────
    //  컷신 2 : 바이러스 제거 성공 (기록 11번)
    // ────────────────────────────────────────────────────
    scene2: [
      { imgVar: null,    text: "기록 제 11번: O월 O일",                                                                             state: "나" },
      { imgVar: null,    text: "굉장히 간단하게 바이러스는 없어졌다.",                                                              state: "나" },
      { imgVar: null,    text: "내 백신의 성능이 좋은 건 알고 있었지만, 실제로 작동하는 걸 보니 매우 만족스럽다.",                  state: "나" },
      { imgVar: null,    text: "확실히 내 백신의 속성을 부여하니 바이러스의 작은 빈틈을 뚫고 가기에 적합했다.",                     state: "나" },
      { imgVar: null,    text: "( ...걔는 내가 친구인 걸 고마워해야해. )",                                                          state: "나" },
      { imgVar: null,    text: "이제 전화를 해볼까.",                                                                               state: "나" },
      { imgVar: null,    text: "( 전화를 한 뒤 10분 쯤 후에 그 친구가 도착했다. )",                                                state: "나" },
      { imgVar: 'girl02', text: "*헉헉* 바이러스 없엤어? 내 논문은? 무사해?!",                                                     state: "나의 대학 동기" },
      { imgVar: 'girl02', text: "응. 완벽하게 복구했어.",                                                                           state: "나" },
      { imgVar: 'girl04', text: "오, 오오!! 신이시여!! 아싸!!!!",                                                                   state: "나의 대학 동기" },
      { imgVar: 'girl04', text: "진짜 넌 내 신이야!! 아, 감사합니다!! 휴!!",                                                        state: "나의 대학 동기" },
      { imgVar: 'girl04', text: "( 귀가 아프다... )",                                                                               state: "나" },
      { imgVar: 'girl04', text: "그럼 이제 논문 마저 마무리하고 제출해.",                                                           state: "나" },
      { imgVar: 'girl03', text: "아하하! 아니지. 그냥 이렇게 가면 넌 날 세상에서 제일 이기적인 사람으로 생각하겠지!",              state: "나의 대학 동기" },
      { imgVar: 'girl03', text: "자, 별벅스 기프티콘이야! 너가 좋아하잖아! 이번 일은 정말 정말 고마워.",                           state: "나의 대학 동기" },
      { imgVar: 'girl05', text: "넌 정말 사람 한명을 살린거야. 말로 다 할 수 없을만큼.",                                           state: "나의 대학 동기" },
      { imgVar: 'girl06', text: "헤헤, 칭찬해주니까 입꼬리 올라가는 것봐. 그럼, 이제 너도 쉬어. 너 컨디션 완전 메롱인 것 같아.", state: "나의 대학 동기" },
      { imgVar: null,    text: "( 눈물까지 흘리며 나갔다... )",                                                                     state: "나" },
      { imgVar: null,    text: "( 그래도 별벅스 기프티콘을 주었다. ...우와, 10만 원권이네? )",                                     state: "나" },
      { imgVar: null,    text: "이 정도면 할 만한 걸?",                                                                             state: "나" },
    ],

    // ────────────────────────────────────────────────────
    //  컷신 3 : 새 의뢰 (기록 12번)
    // ────────────────────────────────────────────────────
    scene3: [
      { imgVar: null,    text: "기록 제 12번: O월 O일",                                                                             state: "나" },
      { imgVar: null,    text: "...그렇게 동기의 문제를 완벽하게 해결한 뒤, 그 친구 특유의 친화성으로 내 백신은 많은 사람들에게 알려졌다.", state: "나" },
      { imgVar: null,    text: "내 핸드폰 번호는 어떻게 알아냈는지 굉장히 다급해 보이는 낯선 사람에게서 시도 때도 없이 문자를 받았다.", state: "나" },
      { imgVar: null,    text: "이런 걸 바라진 않았는데.",                                                                          state: "나" },
      { imgVar: null,    text: "그렇게 잡일에 쓰라고 만든 백신이 아닌데. 난 이것보다는 더 큰 일에 이 백신을 쓰고 싶었다.",         state: "나" },
      { imgVar: null,    text: "영화에 나오는 것처럼 바이러스를 추적해서 세계 차원의 음모나 전쟁을 막는다거나 그런 멋진 일 말이다.", state: "나" },
      { imgVar: null,    text: "그래도 소소하게 돈을 벌고 있으니 일단 그걸로 만족해야겠다.",                                        state: "나" },
      { imgVar: null,    text: "*** 띵 동 ! ***",                                                                                   state: "bell-effect" },
      { imgVar: null,    text: "( 또 걘가. 이젠 아주 자기 집처럼 아무 때나 오네. 저번엔 한낮이기라도 했지, 지금이 몇 신데. )",     state: "나" },
      { imgVar: null,    text: "( 귀찮음을 이기고 문을 여니까... )",                                                                state: "나" },
      { imgVar: 'boy01', text: "( 모르는 사람이 서있었다. )",                                                                       state: "나" },
      { imgVar: 'boy01', text: "누구세요?",                                                                                         state: "나" },
      { imgVar: 'boy01', text: "혹시 제 친구의 바이러스를 완벽하게 퇴치했다는 분이 맞나요?",                                       state: "???" },
      { imgVar: 'boy01', text: "( 뭐야, 집 주소는 어떻게 알았어? )",                                                               state: "나" },
      { imgVar: 'boy01', text: "사람 잘못보셨습니다.",                                                                              state: "나" },
      { imgVar: 'boy06', text: "잠, 잠시만요! 문 닫지 마시고! 저도 부탁 드리려고 왔, 아니, 그래, 의뢰를 드리려고 왔습니다!",     state: "???" },
      { imgVar: 'boy01', text: "이건 꽤 규모가 큰 바이러스거든요. 그만큼의 보수도 당연히 생각하고 왔습니다.",                     state: "???" },
      { imgVar: 'boy02', text: "큰 돈을 만져보고 싶지 않습니까?",                                                                  state: "???" },
      { imgVar: 'boy02', text: "( 부모님이 큰 돈 벌자고 하는 사람들을 조심하랬지. )",                                             state: "나" },
      { imgVar: 'boy06', text: "흠, 그래도 별로 관심 없어보이시네요.. 앗, 일단 문은 닫지 마시고!",                                state: "???" },
      { imgVar: 'boy06', text: "제발 도와주세요, 누군가의 목숨이 걸린 일입니다, 진짜 말 그대로!",                                  state: "???" },
      { imgVar: 'boy06', text: "( 바이러스에 목숨이 걸려? )",                                                                      state: "나" },
      { imgVar: 'boy03', text: "궁금하신 모양이군요....사실대로 말하겠습니다... 사실, 제 친구가 실종됐어요.",                      state: "???" },
      { imgVar: 'boy03', text: "경찰에게 가서 말씀하세요.",                                                                         state: "나" },
      { imgVar: 'boy06', text: "당신은 끝까지 듣고 말씀하세요!",                                                                   state: "???" },
      { imgVar: 'boy05', text: "하여튼, 저는 경찰에 신고하려고 했습니다. 그런데 일전에 그 친구가 늘 저에게 하던 말이 있습니다.", state: "???" },
      { imgVar: 'boy05', text: " '내가 없어지더라도 절대 다른 사람에게 말하거나 하지 말아줘.' ",                                   state: "???" },
      { imgVar: 'boy05', text: " 이상해 보일 수 있죠, 하지만 전 그 친구가 그 말을 하면서 엄청 겁먹은 걸 봤습니다. ",              state: "???" },
      { imgVar: 'boy03', text: " 누군가에게 쫒기고 있냐고 물어봤지만, 그 친구는 제가 위험해질 수도 있다며 말하지 않았습니다. ",   state: "???" },
      { imgVar: 'boy03', text: " 며칠씩 연락이 안돼서 그 친구가 갔다는 산에 제가 직접 찾으러 가봤습니다. 그런데.... ",            state: "???" },
      { imgVar: 'boy05', text: " 제 친구의 핸드폰만 찾았습니다... 게다가 바이러스에 걸려있었고요! ",                               state: "???" },
      { imgVar: 'boy05', text: " 제 친구가 실종된 이유가 이 핸드폰에 있을겁니다. 그 이유를 찾을 수 있도록 저를 도와주세요! ", state: "???" },
      { imgVar: 'boy01', text: " 물론, 이 일로 인한 모든 책임은 제가 지겠습니다. ",                                                state: "???" },
      { imgVar: 'boy01', text: " ( 본인이 책임을 지겠다면, 흠... 한 번 해볼까? ) ",                                                state: "나" },
      { imgVar: 'boy01', text: " 바이러스를 지워 드리겠습니다. ", state: "나" },
      { imgVar: 'boy01', text: " 그래도 바이러스가 이미 핸드폰 데이터를 지워버렸을 수도 있으니 너무 기대하진 마세요. ", state: "나" },
      { imgVar: 'boy02', text: " 아, 감사합니다! 그거면 됩니다! 지금은 지푸라기라도 잡는 심정이거든요. ",                         state: "???" },
      { imgVar: 'boy02', text: " 여기 그 핸드폰입니다. 그리고, 제 핸드폰 번호도 드리겠습니다. 작업이 끝나시면 이 번호로 전화 걸어주세요! ", state: "???" },
      { imgVar: null,    text: " ( 사실 바이러스를 없에는 것보다 이 핸드폰 속 자료의 내용이 더 궁금하다. ) ",                      state: "나" },
      { imgVar: null,    text: "이제 일을 시작해보자.",                                                                             state: "나" },
    ],

    // ────────────────────────────────────────────────────
    //  컷신 4 : 위기 (기록 13번)
    // ────────────────────────────────────────────────────
    scene4: [
      { imgVar: null, text: "내가 본 대화 내용과 핸드폰 주인의 메모...",                                                                               state: "나" },
      { imgVar: null, text: "의뢰인은 친구가 실종되서 걱정된다고 했는데, 사실은 그게 아니었다.",                                                           state: "나" },
      { imgVar: null, text: "너무 잘못되었다. 상황이 안 좋다.",                                                                     state: "나" },
      { imgVar: null, text: "일단 생각해보자.",                                                                                     state: "나" },
      { imgVar: null, text: "의뢰인은 바이러스에 걸려 장부를 못보는 상태였다.",                                                           state: "나" },
      { imgVar: null, text: "그 장부가 뭐든간에 굉장히 중요한 자료인 것이 틀림없다.",                                                     state: "나" },
      { imgVar: null, text: "그리고 나는 지금 전 핸드폰 주인에 이어 목숨이 걸려 있는 상태다.",                                                                         state: "나" },
      { imgVar: null, text: "아무 것도 못 본 척 핸드폰을 그냥 돌려줄 수 있다. 아니면 전 주인의 경고대로 경찰에 신고하거나.",            state: "나" },
      { imgVar: null, text: "휴대폰이 이미 의뢰인의 손에 들어온 것으로 보아, 전 주인은 그리 좋은 결말을 맞지 못한 듯싶다.", state: "나" },
      { imgVar: null, text: "그리고 이 핸드폰이 내 손을 떠나면 나도 같은 결말을 맞을 것 같은 느낌이 강하게 난다.", state: "나" },
      { imgVar: null, text: "생각 할 시간이 별로 없다... 그렇다면 일단 경찰에 신고를 하자.",                                                                         state: "나" },
      { imgVar: null, text: "*** 띵 동 ! ***",                                                                                     state: "bell-effect" },
      { imgVar: null, text: "*** 띵 동 ! 띵 동 ! ***",                                                                            state: "bell-effect" },
      { imgVar: null, text: "...",                                                                                                  state: "나" },
      { imgVar: null, text: " 철컥      철컥 ",                                                                                     state: "clank-effect" },
      { imgVar: null, text: "...",                                                                                                  state: "나" },
      { imgVar: null, text: " 띡    띡    띡    띡 ",                                                                              state: "bip-effect" },
      { imgVar: null, text: "벌컥",                                                                                                 state: "open-effect" },
      { imgVar: null, text: "안녕하세요.",                                                                                          state: "살인자" },
      { imgVar: null, text: "처음부터 지켜보고 있었습니다.",                                                                        state: "살인자" },
      { imgVar: null, text: "지금부터는 쓸데없는 행동 하시면 안됩니다.",                                                           state: "살인자" },
      { imgVar: null, text: "절 조용히 따라오세요.", state: "살인자" },
      { imgVar: null, text: "가는 길에 저한테서 도망치시더라도 제 조직에게서는 벗어나실 수 없다는 것도 알아두세요.", state: "살인자" },
    ],
  };

  // ──────────────────────────────────────────────────────
  //  효과음이 필요한 state 종류
  //  (draw 안에서 UI 렌더, 진행 시 사운드 트리거)
  // ──────────────────────────────────────────────────────
  const EFFECT_STATES = ['bell-effect', 'clank-effect', 'bip-effect', 'open-effect'];

  // ──────────────────────────────────────────────────────
  //  런타임 상태
  // ──────────────────────────────────────────────────────
  let currentSceneId  = null;
  let currentSlide    = 0;
  let onEndCallback   = null;

  // 컷신에서 사용할 이미지 맵 (start() 시 채움)
  let imgMap = {};

  // ──────────────────────────────────────────────────────
  //  컷신 시작
  //
  //  @param sceneId   'scene1' | 'scene2' | 'scene3' | 'scene4'
  //  @param onEnd     컷신 종료 후 호출할 콜백 (main.js 에서 다음 상태로 전환)
  // ──────────────────────────────────────────────────────
  function start(sceneId, onEnd, startSlide = 0) {
    currentSceneId = sceneId;
    const dataLength = (SCENES[sceneId] || []).length;
    currentSlide = constrain(Number(startSlide) || 0, 0, Math.max(0, dataLength - 1));
    onEndCallback  = onEnd || null;

    imgMap = {};
    const data = SCENES[sceneId] || [];
    for (const slide of data) {
      if (slide.imgVar) {
        // 복잡한 window 조회 대신, 안전하게 eval이나 글로벌 스코프를 타도록
        // 그냥 문자열 키값 자체를 맵에 보관하거나, draw에서 직접 판단하게 만듭니다.
        imgMap[slide.imgVar] = slide.imgVar; 
      }
    }
  }

  // ──────────────────────────────────────────────────────
  //  렌더링 — main.js draw() 에서 매 프레임 호출
  // ──────────────────────────────────────────────────────
  function draw() {
    if (!currentSceneId) return;
    const data = SCENES[currentSceneId];
    if (!data) return;

    const slide = data[currentSlide];
    if (!slide) return;

    // ── 배경 이미지 ─────────────────────────────────────
    // scene4에서 '살인자' state부터는 murder02.png 전체화면으로 대체
    const isMurderSlide = (currentSceneId === 'scene4' && slide.state === '살인자');

    if (isMurderSlide) {
      if (typeof murder02 !== 'undefined' && murder02) {
        image(murder02, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
      } else {
        gameBackground(0);
      }
    } else {
      if (typeof backgrounds !== 'undefined' && backgrounds) {
        image(backgrounds, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
      } else {
        gameBackground(220);
      }
      if (typeof room !== 'undefined' && room) {
        image(room, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
      }
    }

    // ── 캐릭터 이미지 (있을 때만, 살인자 슬라이드 제외) ──
    if (slide.imgVar && !isMurderSlide) {
      try {
        let targetImg = eval(slide.imgVar); 
        if (targetImg) {
          
          // 1. 캐릭터 크기를 더 과감하게 키웁니다! (기존 750 -> 850으로 조정)
          // 화면 전체 높이가 900이므로 850이면 화면에 꽉 차는 시원한 크기가 됩니다.
          let charHeight = 850; 
          
          // 원본 이미지의 비율 유지
          let aspectRatio = targetImg.width / targetImg.height;
          let charWidth = charHeight * aspectRatio;
          
          // 2. 캐릭터 가로 위치 (오른쪽 이동 반영)
          let charX = 80; 
          
          // 3. 캐릭터 세로 위치 조정
          // 이미지 밑에 여백이 있을 것을 감안하여 화면 맨 밑바닥(900)에 딱 붙이거나
          // Y값을 살짝 더 내려서(-20) 여백을 화면 밑으로 묻어버릴 수 있습니다.
          let charY = VIRTUAL_HEIGHT - charHeight + 20; 

          // 4. 그리기
          image(targetImg, charX, charY, charWidth, charHeight);
          
        }
      } catch (e) {
        // 에러 방지
      }
    }

    // ── 말풍선 배경 이미지 ───────────────────────────────
    if (typeof comu !== 'undefined' && comu) {
      image(comu, 0, 100, VIRTUAL_WIDTH, VIRTUAL_HEIGHT - 100);
    }

    // ── 화자 이름 & 대사 텍스트 ─────────────────────────
    // 원본과 동일한 textSize / 좌표 / 색상 로직
    textFont(gameFont);  // 에셋 폰트 적용
    textSize(30);
    textAlign(CENTER, CENTER);

    // 화자에 따라 텍스트 색상
    const st = slide.state;
    if (st === '나') {
      fill('yellow');
    } else {
      fill('white');
    }

    // 대사 (원본 좌표: 960, 940 → VIRTUAL 기준 800, 940)
    text(slide.text, VIRTUAL_WIDTH / 2, 740);

    // 화자 이름 (효과음 state 는 표시 안 함)
    if (!EFFECT_STATES.includes(st)) {
      text(st, VIRTUAL_WIDTH / 2, 668);
    }

    // ── SPACE >> 안내 ────────────────────────────────────
    push();
    textFont(gameFont);
    fill(150);
    textSize(20);
    textAlign(RIGHT, BOTTOM);
    text('SPACE >>', VIRTUAL_WIDTH - 20, VIRTUAL_HEIGHT - 10);
    pop();
  }

  // ──────────────────────────────────────────────────────
  //  슬라이드 진행
  // ──────────────────────────────────────────────────────
  function _advance() {
    const data = SCENES[currentSceneId];
    if (!data) return;

    currentSlide++;

    // 컷신 종료
    if (currentSlide >= data.length) {
      currentSlide = data.length - 1; // 안전 클램프
      if (onEndCallback) {
        const cb = onEndCallback;
        onEndCallback = null;         // 중복 호출 방지
        cb();
      }
      return;
    }

    // 효과음 트리거 (전역 사운드 변수 접근)
    _playEffectSound(data[currentSlide].state);
  }

  // ──────────────────────────────────────────────────────
  //  효과음 재생
  // ──────────────────────────────────────────────────────
  function _playEffectSound(state) {
    try {
      if (state === 'bell-effect') {
        if (typeof doorbell !== 'undefined' && doorbell) {
          doorbell.rate(1.5);
          doorbell.play();
        }
      } else if (state === 'clank-effect') {
        if (typeof clank !== 'undefined' && clank) clank.play();
      } else if (state === 'bip-effect') {
        if (typeof bip !== 'undefined' && bip) bip.play();
      } else if (state === 'open-effect') {
        if (typeof doorOpen !== 'undefined' && doorOpen) doorOpen.play();
      } else {
        if (typeof click !== 'undefined' && click) click.play();
      }
    } catch (e) {
      // 사운드 미로드 시 무시
    }
  }

  // ──────────────────────────────────────────────────────
  //  입력 처리
  // ──────────────────────────────────────────────────────
  function handleClick() {
    _advance();
  }

  function handleKey(k) {
    if (k === ' ') _advance();
  }

  // ──────────────────────────────────────────────────────
  //  저장/불러오기용 공개 상태
  //
  //  컷신 도중 저장하면 sceneId 와 현재 대사 번호를 저장하고,
  //  불러오기 시 동일한 컷신·동일한 대사부터 이어서 표시함.
  // ──────────────────────────────────────────────────────
  function getSaveData() {
    return {
      sceneId: currentSceneId,
      slide: currentSlide,
    };
  }

  function loadSaveData(data, onEnd) {
    if (!data || !data.sceneId) return;
    start(data.sceneId, onEnd, data.slide ?? 0);
  }

  // 공개 API
  return { start, draw, handleClick, handleKey, getSaveData, loadSaveData };

})();
