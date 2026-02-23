const socket = io();
/**
 * Game Client Logic
 */

// [New] 서버에서 받은 스킬 정보를 저장할 공간
let skillDataCache = [];
// --------------------------------------------------------
// DOM 요소 참조
// --------------------------------------------------------
// 스킬 버튼 툴팁
const tooltip = document.getElementById('info-tooltip');
const tooltipText = document.getElementById('tooltip-text');
const interactableElements = document.querySelectorAll('[data-has-info="true"]');
const buttons = document.querySelectorAll('button');

// --------------------------------------------------------
// [Rule 0] 이벤트 핸들러 함수 정의 (Logic Placeholders)
// --------------------------------------------------------

// [New] 타겟팅 현황을 저장할 맵 (Key: 내 유닛 인덱스, Value: 적 유닛 인덱스)
let targetingData = {};

/**
 * 객체 클릭 시 실행되는 함수 (버튼 등)
 */
function handleClick(event) {
    const target = event.currentTarget;

    // TODO: 클릭된 요소에 따른 로직 구현
    console.log('Clicked:', target);
}

/**
 * 마우스가 객체 위에 올라갔을 때 (Rule 3)
 */
function handleMouseEnter(event) {
    const target = event.currentTarget;
    const type = getElementType(target);

    tooltip.classList.remove('hidden');
    let infoMessage = "";

    // 붉은 버튼(스킬)일 경우, 캐시된 데이터에서 정보를 찾음
    if (type === 'red') {
        // 현재 버튼이 몇 번째 버튼인지 찾기 (0~11)
        const allRedButtons = document.querySelectorAll('.type-red');
        const btnIndex = Array.from(allRedButtons).indexOf(target);

        if (btnIndex >= 0 && skillDataCache.length > 0) {
            const uIndex = btnIndex % 6;
            const sIndex = (btnIndex < 6) ? 1 : 0;

            if (btnIndex >= 0 && skillDataCache.length > 0) {
                // 유닛 인덱스(0~5), 스킬 슬롯(0 or 1) 계산
                const uIndex = btnIndex % 6;
                const sIndex = (btnIndex < 6) ? 1 : 0;

                const charData = skillDataCache[uIndex];

                if (charData && charData.skills && charData.skills[sIndex]) {
                    const skill = charData.skills[sIndex];

                    infoMessage = `[${skill.name}]\n위력: ${skill.basePower}`;
                    if (skill.coinPower) infoMessage += ` (+${skill.coinPower} x ${skill.coinNum})`;
                    infoMessage += `\n\n${skill.desc || ''}`;

                    if (skill.coinDescs) {
                        skill.coinDescs.forEach((desc, idx) => {
                            if (desc) infoMessage += `\n🪙${idx + 1}: ${desc}`;
                        });
                    }
                } else {
                    console.warn("Skill data is missing for this slot!");
                    infoMessage = "스킬 정보 없음 (데이터 누락)";
                }
            } else {
                console.warn("SkillCache is empty or Button Index Invalid");
                infoMessage = "데이터 로딩 중...";
            }
            console.groupEnd(); // 로그 그룹 닫기
        } else {
            infoMessage = "데이터 로딩 중...";
        }

        // 이 버튼이 'used'(확정된 스킬) 상태라면, 누구를 때리는지 적에게 표시
        if (target.classList.contains('used')) {
            const uIndex = btnIndex % 6;
            const targetEnemyIdx = targetingData[uIndex];
            
            if (targetEnemyIdx !== undefined) {
                const enemyUnits = document.querySelectorAll('.right-team .circle'); // .unit-column button
                // 적 유닛에게 'hover-targeted' 효과 부여
                if (enemyUnits[targetEnemyIdx]) {
                    enemyUnits[targetEnemyIdx].classList.add('hover-targeted');
                }
            }
        }
    }
    // 기존 로직 유지
    else {
        switch (type) {
            case 'pink': infoMessage = "패시브 정보"; break;
            case 'blue': infoMessage = "아군 상태"; break;
            case 'orange': infoMessage = "캐릭터 상세"; break;
            case 'green': infoMessage = "수비 스킬"; break;
            case 'white': infoMessage = "적군 유닛"; break; // 적군 추가
            default: infoMessage = "정보";
        }
    }

    // 줄바꿈 처리를 위해 textContent 대신 innerText 혹은 HTML 사용
    tooltipText.innerText = infoMessage;
}

/**
 * 마우스가 객체에서 벗어났을 때
 */
function handleMouseLeave(event) {
    tooltip.classList.add('hidden');

    // [New] 호버 효과 제거
    document.querySelectorAll('.hover-targeted').forEach(el => {
        el.classList.remove('hover-targeted');
    });
}

/**
 * 마우스 움직임에 따라 툴팁 위치 갱신
 */
function handleMouseMove(event) {
    // 마우스 커서 약간 옆에 툴팁 표시
    tooltip.style.left = (event.pageX + 10) + 'px';
    tooltip.style.top = (event.pageY + 10) + 'px';
}

// --------------------------------------------------------
// 헬퍼 함수
// --------------------------------------------------------

// 요소의 클래스를 분석하여 타입(색상) 반환
function getElementType(element) {
    if (element.classList.contains('type-pink')) return 'pink'; // 핑크: 전투 패시브/서포트 패시브
    if (element.classList.contains('type-blue')) return 'blue'; // 아군 스킬 슬롯
    if (element.classList.contains('type-orange')) return 'orange'; // 단순 스프라이트/나중에는 버튼으로?
    if (element.classList.contains('type-red')) return 'red'; // 스킬 패널 -> 스킬 버튼
    if (element.classList.contains('type-green')) return 'green'; // 초상화 있어야하는 곳인데 당장은 눌렀을 때 수비 나가게
    if (element.classList.contains('type-yellow')) return 'yellow'; // 전투 시작 버튼
    return 'unknown';
}

// --------------------------------------------------------
// 초기화 및 이벤트 리스너 등록
// --------------------------------------------------------
function init() {
    console.log("Game Client Initialized");

    // [Rule 3] 정보가 있는 모든 객체에 호버 이벤트 연결
    interactableElements.forEach(el => {
        el.addEventListener('mouseenter', handleMouseEnter);
        el.addEventListener('mouseleave', handleMouseLeave);
        el.addEventListener('mousemove', handleMouseMove);
    });

    // [Rule 2] 모든 버튼 객체에 클릭 이벤트 연결
    buttons.forEach(btn => {
        btn.addEventListener('click', handleClick);
    });
}

// 상태 관리 변수
let myRole = null;       // 'p1' or 'p2'
let selectedUnitIndex = null; // 현재 스킬을 선택한 내 유닛 인덱스
let selectedSkillSlot = null; // 현재 선택한 스킬 슬롯 (0 or 1)

// DOM 요소 가져오기
const skillButtons = document.querySelectorAll('.type-red'); // 하단 붉은 버튼 (스킬)
const targetButtons = document.querySelectorAll('.right-team .circle'); // 우측 상대 유닛 (타겟)

// --------------------------------------------------------
// 1. 초기화 및 역할 할당
// --------------------------------------------------------
// 게임 참가 요청 (임시로 room1 고정)
socket.emit('join_game', 'room1');

socket.on('role_assigned', (data) => {
    myRole = data.role;
    console.log(`Role Assigned: ${myRole}`);
    // 내 역할에 따라 UI 배치 반전 등의 로직이 필요할 수 있음
});

// --------------------------------------------------------
// [New] 서버로부터 게임 데이터(스킬 정보 등) 수신
// --------------------------------------------------------
socket.on('update_ui', (data) => {
    // data 구조 예시: { p1: { active: [CharacterData...], ... }, p2: ... }

    // 내 역할(p1/p2)에 맞는 캐릭터들의 스킬 정보를 캐싱합니다.
    const myData = (myRole === 'p1') ? data.p1 : data.p2;
    if (myData && myData.active) {
        skillDataCache = myData.active; // 캐릭터 배열 저장
        console.log("Skill Data Updated:", skillDataCache);
    }
});

// --------------------------------------------------------
// [핵심 변경] 2. 스킬 선택 로직 : (가로 매핑) -> (세로 매핑) -> 중복 선택 시 초기화 
// --------------------------------------------------------
skillButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        if (!myRole) return;

        const uIndex = index % 6; 
        const sIndex = (index < 6) ? 1 : 0;

        // [New] 같은 열(같은 유닛)의 다른 버튼들의 'used' 상태 초기화
        // 이유: 스킬을 다시 고르려 한다는 건, 이전 행동을 취소하거나 덮어쓰겠다는 뜻임
        const colStart = uIndex;      // 윗줄 (0~5 사이)
        const colEnd = uIndex + 6;    // 아랫줄 (6~11 사이)
        
        if (skillButtons[colStart]) skillButtons[colStart].classList.remove('used');
        if (skillButtons[colEnd]) skillButtons[colEnd].classList.remove('used');

        // 서버 전송 등 기존 로직...
        socket.emit('action_select', {
            type: 'skillSelect',
            userIndex: uIndex,
            actionIndex: sIndex
        });

        selectedUnitIndex = uIndex;
        selectedSkillSlot = sIndex;
    });
});

// [서버 응답] 스킬 선택 하이라이트 동기화
socket.on('ui_move_selected', (data) => {
    // data: { userIndex, skillSlot }
    // 모든 버튼에서 'selected' 제거 (하나만 선택 가능하므로)
    skillButtons.forEach(b => b.classList.remove('selected'));

    const targetBtnIndex = (data.skillSlot === 1) ? data.userIndex : data.userIndex + 6;
    if (skillButtons[targetBtnIndex]) {
        skillButtons[targetBtnIndex].classList.add('selected'); // [cite: 13]
    }
});

// --------------------------------------------------------
// 3. 타겟 선택 로직 (회색 버튼) [Source 6]
// --------------------------------------------------------
targetButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        // 스킬이 먼저 선택되어 있어야 함
        if (selectedUnitIndex === null) {
            alert("먼저 스킬을 선택해주세요!");
            return;
        }

        // 서버로 전송 (누가 -> 누구를)
        socket.emit('target_select', {
            type: 'targetSelect',
            userIndex: selectedUnitIndex, // 공격자 (내 유닛)
            actionIndex: index            // 방어자 (클릭한 상대 유닛)
        });

        console.log(`Request Target Select: MyUnit ${selectedUnitIndex} -> EnemyUnit ${index}`);
    });
});

// [서버 응답] 타겟 매핑 확인 (화살표/연결선 표시)
socket.on('ui_target_locked', (data) => {
    // data: { srcPlayer, srcIndex, targetIndex }

    if (data.srcPlayer === myRole) {
        // 1. 데이터 갱신 (내 유닛 srcIndex가 targetIndex를 찜함)
        targetingData[data.srcIndex] = data.targetIndex;

        // 2. 스킬 버튼 스타일 업데이트 (Used 처리)
        const sSlot = (selectedSkillSlot !== null) ? selectedSkillSlot : 0; 
        const btnIdx = (sSlot === 1) ? data.srcIndex : data.srcIndex + 6;
        
        // 같은 유닛의 다른 버튼 선택 해제
        const siblingIdx = (sSlot === 1) ? data.srcIndex + 6 : data.srcIndex;
        if(skillButtons[siblingIdx]) skillButtons[siblingIdx].classList.remove('used', 'selected');

        if (skillButtons[btnIdx]) {
            skillButtons[btnIdx].classList.remove('selected');
            skillButtons[btnIdx].classList.add('used');
        }

        // 3. 적 유닛 'Locked' 상태 전면 재계산 (요구사항 22: 매핑 해제 시 초기화)
        // 모든 적의 locked를 지우고, targetingData에 있는 애들만 다시 칠함
        const enemyUnits = document.querySelectorAll('.right-team .circle');
        enemyUnits.forEach(el => el.classList.remove('locked'));

        // 현재 targetingData에 등록된 모든 타겟들에게 locked 부여
        Object.values(targetingData).forEach(tIdx => {
            if (enemyUnits[tIdx]) enemyUnits[tIdx].classList.add('locked');
        });
        
        // 변수 초기화
        selectedUnitIndex = null;
        selectedSkillSlot = null;
    }
});

// (임시) 화살표 대신 로그 출력 및 스타일 변경 함수
function drawArrow(uIdx, tIdx) {
    // 일단 타겟 버튼에 스타일 표시로 대체
    targetButtons.forEach(b => b.classList.remove('targeted'));
    targetButtons[tIdx].classList.add('targeted');

    alert(`[매핑 성공] 내 ${uIdx}번 유닛이 적 ${tIdx}번 유닛을 조준했습니다.`);
}

// --------------------------------------------------------
// 페이즈/화면 전환 
// --------------------------------------------------------
// 1. DOM 요소 가져오기
const phaseSelect = document.getElementById('phase-select');
const phaseBattle = document.getElementById('phase-battle');
const goButton = document.querySelector('.circle.large'); // GO 버튼

// 2. GO 버튼 클릭 시 (서버에 요청)
if (goButton) {
    goButton.addEventListener('click', () => {
        if (goButton.classList.contains('disabled')) return;

        console.log("서버에 전투 시작 요청 보냄...");
        
        // 버튼 잠금 (중복 클릭 방지)
        goButton.innerText = "WAIT";
        goButton.classList.add('disabled');

        // 서버로 '나 준비됐어!' 전송
        socket.emit('start_battle', { type: 'BattleStart' });
    });
}

socket.on('battle_start_confirmed', () => {
    // 1. 일단 전투 화면으로 전환 (배경, 캐릭터 박스는 보임)
    // 선택 페이즈 레이어에는 hidden 속성을 추가하고
    phaseSelect.classList.add('hidden');
    // 전투 페이즈 레이어에서는 hidden 속성을 뺀다
    phaseBattle.classList.remove('hidden');

    // 2. 처음에는 스킬 UI를 숨겨둠 (캐릭터만 보이게)
    hideSkillUI(); 

    // 3. 1초 뒤에 스킬 정보가 스르륵 나타나게 연출!
    setTimeout(() => {
        renderBattleScene(); // 데이터 채우기
        showSkillUI();       // 보여주기
    }, 100);
});

// UI 요소 가져오기
const p1SkillUI = document.getElementById('p1-skill-ui');
const p2SkillUI = document.getElementById('p2-skill-ui');

// 1. 스킬 UI 보여주기 함수
function showSkillUI() {
    if (p1SkillUI) p1SkillUI.classList.add('visible');
    if (p2SkillUI) p2SkillUI.classList.add('visible');
}

// 2. 스킬 UI 숨기기 함수
function hideSkillUI() {
    if (p1SkillUI) p1SkillUI.classList.remove('visible');
    if (p2SkillUI) p2SkillUI.classList.remove('visible');
}

function renderBattleScene() {
    // 1. 스킬 이름
    document.getElementById('p1-skill-name').innerText = "신속한 제압";
    document.getElementById('p2-skill-name').innerText = "공간 절단";

    // 2. 메인 위력
    document.getElementById('p1-power').innerText = "0";
    document.getElementById('p2-power').innerText = "0";

    // 3. 코인 위력 배지 (+n)
    document.getElementById('p1-coin-power').innerText = "+6";
    document.getElementById('p2-coin-power').innerText = "+4";

    // 4. 코인 생성 (P1: 3개, P2: 4개)
    createCoins('p1-coins', 3);
    createCoins('p2-coins', 4);
}

function createCoins(containerId, count) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const coin = document.createElement('div');
        coin.className = 'coin';
        container.appendChild(coin);
    }
}

// 서버에서 전투 진행 중 특정 슬롯의 정보가 올 때
socket.on('update_battle_slot', (data) => {
    // data 안에 "isNewCharacter: true" 같은 플래그를 주거나,
    // 클라이언트가 "어? 아까랑 ID가 다르네?" 라고 판단해도 됨.
    
    // P1 처리
    if (isDifferentCharacter(currentP1, data.p1Slot.owner)) {
        // 1. 캐릭터가 바뀌었으면 -> Swap (페이드 아웃/인)
        swapCharacter('p1-bundle', data.p1Slot.owner);
    } else {
        // 2. 같은 캐릭터면 -> Update (그냥 HP만 깎기)
        updateCharacterHP('p1-bundle', data.p1Slot.owner);
    }

    // 스킬은 무조건 재생성
    rebuildSkillUI('p1-bundle', data.p1Slot.readySkill);
    
    // 현재 캐릭터 정보 갱신
    currentP1 = data.p1Slot.owner;
});

// 캐릭터 교체 함수 (페이드 효과 포함)
function swapCharacter(bundleId, newOwnerData) {
    const bundle = document.getElementById(bundleId);
    if (!bundle) return;

    // 캐릭터 박스 찾기
    const charBox = bundle.querySelector('.char-box');
    const hpBar = bundle.querySelector('.hp-bar'); // HP바가 있다고 가정
    const nameTag = bundle.querySelector('.name-tag'); // 이름표

    // 1. 일단 페이드 아웃 (잠시 숨김)
    charBox.classList.add('fade-out');

    // 2. 0.2초(페이드 아웃 시간) 뒤에 내용물 교체
    setTimeout(() => {
        // --- 데이터 교체 시작 ---
        
        // (1) 이름/이미지 변경
        nameTag.innerText = newOwnerData.name;
        // charBox.style.backgroundImage = `url(${newOwnerData.img})`; 

        // (2) [핵심] HP바 애니메이션 끄고 위치 잡기 (Snap)
        if (hpBar) {
            hpBar.classList.add('no-transition'); // 애니메이션 끄기
            
            const hpPercent = (newOwnerData.hp / newOwnerData.maxHp) * 100;
            hpBar.style.width = `${hpPercent}%`;   // 즉시 이동 (이동 과정 안 보임)
            
            // 브라우저가 변경사항을 적용할 시간을 줌 (Reflow 강제)
            void hpBar.offsetWidth; 
            
            hpBar.classList.remove('no-transition'); // 다시 애니메이션 켜기
        }

        // --- 데이터 교체 끝 ---

        // 3. 다시 페이드 인 (짜잔~ 하고 등장)
        charBox.classList.remove('fade-out');

    }, 200); // CSS transition 시간과 맞춤
}

// [1] 캐릭터 박스 업데이트 함수 (DOM 재활용)
function updateCharacterBox(bundleId, ownerData) {
    const bundle = document.getElementById(bundleId);
    if (!bundle || !ownerData) return; // 혹은 데이터 없으면 숨기기 처리

    // 박스 자체를 찾는 게 아니라, 그 안의 요소들을 찾아서 값만 바꿈
    // (HTML 구조상 .char-box 안에 HP바 등이 있다고 가정)
    const hpBar = bundle.querySelector('.hp-bar');
    const spBar = bundle.querySelector('.sp-bar');
    
    if (hpBar) {
        const hpPercent = (ownerData.hp / ownerData.maxHp) * 100;
        hpBar.style.width = `${hpPercent}%`; // CSS transition 덕분에 스르륵 줄어듦
    }
    // ... 이름, SP 등 업데이트
}

// [2] 스킬 UI 재생성 함수 (기존 로직 활용)
function rebuildSkillUI(bundleId, skillData) {
    // 기존꺼 삭제
    removeSkillUI(bundleId);

    if (!skillData) return; // 스킬 없으면(이미 씀) 삭제된 상태로 둠

    // 새로 생성
    createSkillUI(
        bundleId, 
        skillData.name, 
        skillData.coinlist.length, 
        skillData.BasePower, // 현재 위력
        skillData.coinPower  // 코인 위력 표기 등
    );
}

// 실행
init();