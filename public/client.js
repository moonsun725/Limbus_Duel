const socket = io();
/**
 * Game Client Logic
 */

// --------------------------------------------------------
// [Rule 0] 전역 변수 공간 (State Management)
// --------------------------------------------------------
const gameState = {
    // TODO: 턴 정보, 플레이어 HP 등 게임 상태 변수 선언
    turn: 0,
    playerHp: 100
};

// --------------------------------------------------------
// DOM 요소 참조
// --------------------------------------------------------
const tooltip = document.getElementById('info-tooltip');
const tooltipText = document.getElementById('tooltip-text');
const interactableElements = document.querySelectorAll('[data-has-info="true"]');
const buttons = document.querySelectorAll('button');

// --------------------------------------------------------
// [Rule 0] 이벤트 핸들러 함수 정의 (Logic Placeholders)
// --------------------------------------------------------

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
    const type = getElementType(target); // 색상/클래스 기반 타입 판별

    // 툴팁 표시 로직
    tooltip.classList.remove('hidden');
    
    // [Rule 4] 같은 색 = 같은 종류 데이터
    let infoMessage = "";
    
    switch(type) {
        case 'pink':
            infoMessage = "스킬/상태 정보";
            break;
        case 'blue':
            infoMessage = "아군 스탯 정보";
            break;
        case 'orange':
            infoMessage = "유닛 본체 정보";
            break;
        case 'red':
            infoMessage = "공격 액션";
            break;
        case 'green':
            infoMessage = "지원/회복 액션";
            break;
        case 'yellow':
            infoMessage = "필살기/메인 액션";
            break;
        default:
            infoMessage = "정보 없음";
    }

    tooltipText.textContent = infoMessage;
}

/**
 * 마우스가 객체에서 벗어났을 때
 */
function handleMouseLeave(event) {
    tooltip.classList.add('hidden');
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
// [핵심 변경] 2. 스킬 선택 로직 (세로 매핑)
// --------------------------------------------------------
skillButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        if (!myRole) return;

        // [Rule Update] 인덱스를 (유닛 번호, 스킬 번호)로 변환
        
        // 유닛 인덱스: 0~5 (열 번호)
        const uIndex = index % 6; 

        // 스킬 슬롯: 위쪽(0~5)이면 1번, 아래쪽(6~11)이면 0번
        // (이미지 기준 Top: 1번, Bottom: 0번)
        const sIndex = (index < 6) ? 1 : 0;

        // 서버 전송
        socket.emit('action_select', {
            type: 'skillSelect',
            userIndex: uIndex,
            actionIndex: sIndex
        });

        // 로컬 상태 저장
        selectedUnitIndex = uIndex;
        selectedSkillSlot = sIndex;
        
        console.log(`[Click] Unit ${uIndex}, Skill ${sIndex} (Button Idx: ${index})`);
    });
});

// [서버 응답] 스킬 선택 하이라이트 동기화
socket.on('ui_move_selected', (data) => {
    // data: { userIndex, skillSlot }

    // 기존 하이라이트 제거
    skillButtons.forEach(b => b.classList.remove('selected-skill'));

    // [Rule Update] (유닛, 스킬) -> 버튼 인덱스 역계산
    // 스킬 1번(Top)이면: userIndex 그대로
    // 스킬 0번(Bottom)이면: userIndex + 6 (아랫줄)
    const targetBtnIndex = (data.skillSlot === 1) 
        ? data.userIndex 
        : data.userIndex + 6;

    // 해당 버튼 강조
    if (skillButtons[targetBtnIndex]) {
        skillButtons[targetBtnIndex].classList.add('selected-skill');
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
    console.log(`Target Locked: ${data.srcPlayer} Unit ${data.srcIndex} -> Unit ${data.targetIndex}`);

    if (data.srcPlayer === myRole) {
        // 내가 지정한 타겟 표시 (예: 상대 유닛 테두리 빨갛게)
        // 실제로는 여기서 Canvas나 SVG로 화살표를 그리는 함수 호출
        drawArrow(data.srcIndex, data.targetIndex); 
    }
});

// (임시) 화살표 대신 로그 출력 및 스타일 변경 함수
function drawArrow(uIdx, tIdx) {
    // 일단 타겟 버튼에 스타일 표시로 대체
    targetButtons.forEach(b => b.classList.remove('targeted'));
    targetButtons[tIdx].classList.add('targeted');
    
    alert(`[매핑 성공] 내 ${uIdx}번 유닛이 적 ${tIdx}번 유닛을 조준했습니다.`);
}

// 실행
init();