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

// 실행
init();