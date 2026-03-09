/*
    역할 설명:
    선택 화면에서는 다음의 기능이 주를 이룹니다
    // 턴 시작
    - 체력 바 갱신 
    - 유닛 스프라이트 재배치
    - 스킬 슬롯 재배치
    - E.G.O 자원 표기

    // 턴 준비
    - 캐릭터 정보 띄우기 - 호버링
    - 스킬 버튼 클릭 - 버튼 클릭
    - 적 지정 - 버튼 클릭

    // 로직 내 미구현 
    - e.g.o 스킬 생성 및 장착
    - 죄악 공명/완전 공명 표기
    - 보유/공명에 따라 활성화되는 패시브 표기

*/
import { socket } from './network.js';

// --------------------------------------------------------
// DOM 요소 선언
// --------------------------------------------------------

let floatingTooltip, skillTooltip, charTooltip;
let floatingText, skillText, charText;
let interactableElements;
let buttons, skillButtons, targetButtons, goButton;
let phaseSelect, phaseBattle;
let allySlots;

// 상태 변수
let myRole = null;
let allyTeamInfo = [];
let enemyTeamInfo = [];
let selectedUnitIndex = null;
let selectedSkillSlot = null;
let targetingData = {};
let isSkillTooltipLocked = false;
let isCharTooltipLocked = false;

// 로컬라이즈?
const translateP = {
    'Slash': '참격',
    'Penetrate': '관통',
    'Blunt': '타격'
};

const translateS = {
    'red': '분노',
    'orange': '색욕',
    'yellow': '나태',
    'green': '탐식',
    'blue': '우울',
    'indigo': '오만',
    'violet': '질투'
};

export function initBattleSelect() {
    // DOM 요소 할당
    initDOMs_BattleSelect();

    interactableElements.forEach(el => {
        el.addEventListener('mouseenter', handleMouseEnter);
        el.addEventListener('mouseleave', handleMouseLeave);
        el.addEventListener('mousemove', handleMouseMove);
    });

    buttons.forEach(btn => {
        btn.addEventListener('click', handleClick);
    });

    // 스킬 선택 버튼 스크립트 할당
    skillButtons.forEach((btn) => {
        btn.addEventListener('click', (event) => {
            if (!myRole) return;

            const targetBtn = event.currentTarget;
            const parentCol = targetBtn.closest('.skill-column');

            // ★ 수학 계산 필요 없이 속성에서 바로 꺼내옴!
            const uIndex = parseInt(parentCol.dataset.unitIndex, 10);
            const sIndex = parseInt(targetBtn.dataset.skillSlot, 10);

            // UI 초기화: 내가 속한 기둥(캐릭터)의 다른 스킬들 불 다 끄기
            parentCol.querySelectorAll('.type-red').forEach(b => b.classList.remove('used'));

            // 서버 전송
            socket.emit('action_select', {
                type: 'skillSelect',
                userIndex: uIndex,
                actionIndex: sIndex
            });
            selectedUnitIndex = uIndex;
            selectedSkillSlot = sIndex;
        });
    });

    // 타겟 선택 버튼 스크립트 할당
    targetButtons.forEach((btn) => {
        btn.addEventListener('click', (event) => {
            if (selectedUnitIndex === null) {
                alert("먼저 스킬을 선택해주세요!");
                return;
            }

            // ★ [핵심 통합] 클릭한 흰색 동그라미의 부모(unit-column)에서 번호표 추출!
            const tIndex = parseInt(event.currentTarget.closest('.unit-column').dataset.unitIndex, 10);

            socket.emit('target_select', {
                type: 'targetSelect',
                userIndex: selectedUnitIndex,
                actionIndex: tIndex
            });
        });
    });

    // 전투 시작 버튼 스크립트 할당
    // 전투 시작 요청 (GO 버튼)
    if (goButton) {
        goButton.addEventListener('click', () => {
            if (goButton.classList.contains('disabled')) return;
            goButton.innerText = "WAIT";
            goButton.classList.add('disabled');
            socket.emit('start_battle', { type: 'BattleStart' });
        });
    }
    socket.emit('join_game', 'room1');

    socket.on('role_assigned', (data) => {
        myRole = data.role;
        console.log(`Role Assigned: ${myRole}`);
    });

    // 턴 시작시 UI 할당
    socket.on('turn_start', (data) => {
        OnTurnStart(data);
    });

    // 턴 종료시 UI 초기화

    // 스킬 선택 하이라이트 동기화 이벤트 등록
    socket.on('ui_move_selected', (data) => {
        skillButtons.forEach(b => b.classList.remove('selected'));
        // 쿼리셀렉터로 단번에 찾기!
        const targetBtn = document.querySelector(`.skill-column[data-unit-index="${data.userIndex}"] .type-red[data-skill-slot="${data.skillSlot}"]`);
        if (targetBtn) targetBtn.classList.add('selected');
    });

    // 타겟 매핑 확인
    // 타겟 지정 완료 시 (노란 테두리 표시 등)
    socket.on('ui_target_locked', (data) => {
        if (data.srcPlayer === myRole) {
            targetingData[data.srcIndex] = data.targetIndex;

            const charData = allyTeamInfo[data.srcIndex];
            const sSlot = (selectedSkillSlot !== null) ? selectedSkillSlot : 0; // 선택했던 스킬 번호
            
            if (charData && charData.skills) {
                // 아직 slots 배열이 없다면 빈 배열로 만들어 줌
                if (!charData.slots) charData.slots = []; 
                
                // 하단 스킬(skills)의 데이터를 상단 장착 슬롯(slots)으로 그대로 복사!
                charData.slots[0] = charData.skills[sSlot]; // 하드코딩인거 마음에 정말 안 듦
            }

            // 해당 캐릭터 기둥 찾기
            const parentCol = document.querySelector(`.skill-column[data-unit-index="${data.srcIndex}"]`);

            if (parentCol) {
                // 내 기둥에 있는 모든 스킬 선택/사용 해제
                parentCol.querySelectorAll('.type-red').forEach(b => b.classList.remove('used', 'selected'));

                // 선택했던 스킬에만 'used' 달아주기
                // const sSlot = (selectedSkillSlot !== null) ? selectedSkillSlot : 0;
                const targetBtn = parentCol.querySelector(`.type-red[data-skill-slot="${sSlot}"]`);
                if (targetBtn) targetBtn.classList.add('used');
            }

            // 3. 적 유닛 'Locked' 상태 전면 재계산 (요구사항 22: 매핑 해제 시 초기화)
            // 모든 적의 locked를 지우고, targetingData에 있는 애들만 다시 칠함
            const enemyUnits = document.querySelectorAll('.right-team .circle');
            enemyUnits.forEach(el => el.classList.remove('locked'));

            Object.values(targetingData).forEach(tIdx => {
                // ★ [수정] 부모(unit-column)의 번호표를 찾아서, 그 안에 있는 동그라미(.circle)를 선택!
                const targetEl = document.querySelector(`.right-team .unit-column[data-unit-index="${tIdx}"] .circle`);

                if (targetEl) targetEl.classList.add('locked');
            });

            // 변수 초기화
            selectedUnitIndex = null;
            selectedSkillSlot = null;
        }
    });

    document.addEventListener('click', (event) => {
        // 1. 내가 클릭한 곳이 상호작용 가능한 요소(버튼)인가?
        const isInteractable = event.target.closest('.type-red, .type-blue, .type-green, .type-orange, .type-white, .type-yellow, .type-violet');

        // 2. 내가 클릭한 곳이 툴팁 그 자체인가? (툴팁 안의 텍스트를 드래그할 수도 있으니)
        const isTooltipS = event.target.closest('#tooltip-skill');
        const isTooltipC = event.target.closest('#tooltip-char');


        // 버튼도 아니고 툴팁도 아닌 완전 엉뚱한 곳(배경)을 눌렀다면!
        if (!isInteractable && !isTooltipS) {
            isSkillTooltipLocked = false;
            skillTooltip.classList.add('hidden');
        }
        if (!isInteractable && !isTooltipC) {
            isCharTooltipLocked = false;
            charTooltip.classList.add('hidden');
        }
    });
}

function initDOMs_BattleSelect() {
    // tooltip = document.getElementById('info-tooltip');
    // tooltipText = document.getElementById('tooltip-text');

    // 1. 컨테이너 (보이고 숨기는 용도)
    floatingTooltip = document.getElementById('tooltip-floating');
    skillTooltip = document.getElementById('tooltip-skill');
    charTooltip = document.getElementById('tooltip-char');

    // 2. 텍스트 요소 (글자 집어넣는 용도)
    floatingText = document.getElementById('text-floating');
    skillText = document.getElementById('text-skill');
    charText = document.getElementById('text-char');

    interactableElements = document.querySelectorAll('[data-has-info="true"]');
    buttons = document.querySelectorAll('button');

    phaseSelect = document.getElementById('phase-select');
    phaseBattle = document.getElementById('phase-battle');
    goButton = document.querySelector('.circle.large');

    skillButtons = document.querySelectorAll('.type-red');
    targetButtons = document.querySelectorAll('.right-team .circle');

    allySlots = document.querySelectorAll('.left-team .circle');

}

// 마우스가 객체 위에 올라갔을 때 실행되는 함수
// ==========================================
// 1. 마우스 진입 (Hover) - switch문 리팩토링
// ==========================================
function handleMouseEnter(event) {
    const target = event.currentTarget;
    const type = getElementType(target);

    switch (type) {
        // 스킬 아이콘들 (red, blue, green 모두 이 로직을 탐)
        case 'red':
        case 'blue':
        case 'green':
            handleMouseEnter_SkillIcon(target, type);
            break;

        // 아군 캐릭터
        case 'orange':
            handleMouseEnter_Character(target, 'ally');
            break;

        // 적군 캐릭터
        case 'white':
            break;
        case 'violet':
            handleMouseEnter_Character(target, 'enemy');
            break;

        // 기타 아이콘 (버프, 디버프 등)
        default:
            floatingTooltip.classList.remove('hidden');
            floatingText.innerText = "기타 정보";
            break;
    }
}

// ==========================================
// 2. 마우스 클릭 (Click) - switch문 리팩토링
// ==========================================
function handleClick(event) {
    const target = event.currentTarget;
    const type = getElementType(target);

    console.log(`Clicked: ${type}`, target);

    switch (type) {
        // 스킬 아이콘 클릭 시 -> 잠금 ON
        case 'red':
        case 'blue':
        case 'green':
            isSkillTooltipLocked = true;
            console.log("🔒 스킬 툴팁 잠금 ON!");
            // (여기에 기존 스킬 선택 처리 로직 작성)
            // selectSkill(target);
            break;
        case 'orange':
        case 'violet':
            isCharTooltipLocked = true;
            console.log("🔒 캐릭터 툴팁 잠금 ON!");
            break;
        // 그 외 모든 곳 클릭 시 -> 잠금 OFF    
        default:
            isSkillTooltipLocked = false;
            isCharTooltipLocked = false;
            skillTooltip.classList.add('hidden');
            charTooltip.classList.add('hidden');
            console.log("🔓 스킬 툴팁 잠금 OFF!");
            console.log("🔓 캐릭터 툴팁 잠금 OFF!");

            // (여기에 캐릭터 선택 등 다른 버튼 처리 로직 추가)
            break;
    }
}

// 2. 스킬 툴팁 전담 로직
function handleMouseEnter_SkillIcon(target, type) {
    // 1. [핵심] 스킬 툴팁의 숨김 상태를 해제해서 화면에 보이게 함!
    skillTooltip.classList.remove('hidden');

    // 2. CSS 클래스 부여 (상단 중앙 고정)
    // (이미 HTML에 클래스가 하드코딩 되어있다면 이 줄은 없어도 무방합니다)
    skillTooltip.classList.add('tooltip-skill');

    let infoMessage = "";

    if (type === 'red') {
        // [빨간 버튼] 하단 스킬 패널에서 데이터 찾기
        const uIndex = parseInt(target.closest('.skill-column').dataset.unitIndex, 10);
        const sIndex = parseInt(target.dataset.skillSlot, 10);
        const charData = allyTeamInfo[uIndex];

        // ★ 찾은 데이터를 텍스트 조립기에 던짐!
        const skillData = charData ? charData.skills[sIndex] : null;
        infoMessage = buildSkillText(skillData);

        // 타겟팅 선 UI 로직 (uIndex 에러 해결)
        if (target.classList.contains('used')) {
            const targetEnemyIdx = targetingData[uIndex];
            if (targetEnemyIdx !== undefined) {
                const targetEl = document.querySelector(`.right-team .unit-column[data-unit-index="${targetEnemyIdx}"] .circle`);
                if (targetEl) {
                    targetEl.classList.add('hover-targeted');
                }
            }
        }

    } else if (type === 'blue') {
        // [파란 버튼] 상단 캐릭터 슬롯에서 데이터 찾기
        const uIndex = parseInt(target.closest('.unit-column').dataset.unitIndex, 10);
        const charData = allyTeamInfo[uIndex];

        // ★ 찾은 데이터(slots)를 텍스트 조립기에 똑같이 던짐!
        const skillData = (charData && charData.slots) ? charData.slots[0] : null;
        infoMessage = skillData ? buildSkillText(skillData) : "장착된 스킬 없음";

    } else if (type === 'green') {
        infoMessage = "수비 스킬 정보";
    }

    skillText.innerText = infoMessage;
}
// 헬퍼 함수: 순수 텍스트 조립기 (데이터를 주면 글자로 바꿔서 리턴만 함)
// 빨간 버튼이든 파란 버튼이든 '스킬 데이터'만 던져주면 다 처리해줍니다.
function buildSkillText(skill) {
    if (!skill) return "스킬 정보 없음 (데이터 누락)";

    let infoMessage = `[${skill.name}]\n위력: ${skill.basePower}`;

    if (skill.coinPower) {
        infoMessage += ` (+${skill.coinPower} x ${skill.coinNum}) [${skill.basePower} ~ ${skill.basePower + skill.coinPower * skill.coinNum}]`;
    }
    infoMessage += `\n\n${skill.desc || ''}`;

    if (skill.coinDescs && skill.coinDescs.length > 0) {
        skill.coinDescs.forEach((desc, idx) => {
            infoMessage += `\n🪙${idx + 1}: ${desc}`;
        });
    }
    
    return infoMessage;
}

// 3. 캐릭터 툴팁 전담 로직
function handleMouseEnter_Character(target, team) {
    // 1. [핵심] 툴팁의 숨김 상태를 해제해서 화면에 보이게 함!
    charTooltip.classList.remove('hidden');

    // 2. [중요] 이전에 붙어있던 위치 클래스 지우기
    // (이게 없으면 아군 봤다가 적군 보면 클래스가 2개 겹쳐서 UI가 고장 납니다)
    charTooltip.classList.remove('tooltip-ally', 'tooltip-enemy');

    const uIndex = parseInt(target.closest('.unit-column').dataset.unitIndex, 10);
    let charData; // 데이터를 담을 변수

    if (team === 'ally') {
        charTooltip.classList.add('tooltip-ally');
        charData = allyTeamInfo[uIndex]; // ★ 아군 캐시에서 꺼냄

        if (charData) {
            charTextSetting(charData);
        } else {
            charText.innerText = `[아군 정보 - 자리 번호: ${uIndex}]\n\n...`;
        }
    } else {
        charTooltip.classList.add('tooltip-enemy');
        charData = enemyTeamInfo[uIndex]; // ★ 적군 캐시에서 꺼냄

        if (charData) {
            charTextSetting(charData);
        } else {
            charText.innerText = `[적군 정보 - 자리 번호: ${uIndex}]\n\n...`;
        }
    }
}
// 3-1. 캐릭터 툴팁 텍스트
function charTextSetting(charData) {
    const staggerText = charData.stagger.length > 0 ? charData.stagger.join('/ ') : "없음";

    // 2. 물리 내성 번역 및 조립
    let resistPText = "";
    if (charData.resistP) {
        resistPText = Object.entries(charData.resistP)
            // ★ 딕셔너리를 통해 영문 키값을 한국어로 바꿉니다. (사전에 없으면 원래 영문 출력)
            .map(([key, value]) => `${translateP[key] || key}: ${value}`)
            .join(' / ');
    }

    // 3. 속성 내성 번역 및 조립
    let resistSText = "";
    if (charData.resistS) {
        resistSText = Object.entries(charData.resistS)
            // ★ 속성 내성도 마찬가지로 번역 딕셔너리 통과
            .map(([key, value]) => `${translateS[key] || key}: ${value}`)
            .join(' / ');
    }

    // 4. 최종 텍스트 조립
    charText.innerText =
        `[${charData.name}] (LV. ${charData.lv})

체력: ${charData.hp} / ${charData.maxHp}
흐트러짐: ${staggerText}
정신력: ${charData.sp}
속도: ${charData.speed}

[물리 내성]
${resistPText}

[속성 내성]
${resistSText}`;
}

// 4. 마우스 이동 핸들러 수정 (따라다니기 해제)
function handleMouseMove(event) {
    // floatingTooltip이 숨겨져 있지 않을 때만 마우스를 따라다니게 함
    if (!floatingTooltip.classList.contains('hidden')) {
        floatingTooltip.style.left = (event.pageX + 10) + 'px';
        floatingTooltip.style.top = (event.pageY + 10) + 'px';
    }
}

// 마우스가 객체에서 벗어났을 때 실행되는 함수
// 5. 마우스가 벗어날 때 (숨김 처리)
function handleMouseLeave(event) {
    const target = event.currentTarget;
    const type = getElementType(target);

    switch (type) {
        case 'red':
            const enemyCircles = document.querySelectorAll('.right-team .circle');
            enemyCircles.forEach(circle => circle.classList.remove('hover-targeted'));
        case 'blue':
        case 'green':
            // ★ 스킬 툴팁: 잠겨있으면 숨기지 않음!
            if (!isSkillTooltipLocked) {
                skillTooltip.classList.add('hidden');
            }
            break;

        case 'orange':
        case 'white':
        case 'violet':
            if (!isCharTooltipLocked) {
                charTooltip.classList.add('hidden');
            }
            break;

        default:
            floatingTooltip.classList.add('hidden');
            break;
    }
}

// --------------------------------------------------------
// 헬퍼 함수
// --------------------------------------------------------

// 요소의 클래스를 분석하여 타입(색상) 반환
function getElementType(element) {
    if (element.classList.contains('type-pink')) return 'pink'; // 핑크: 전투 패시브/서포트 패시브

    if (element.classList.contains('type-blue')) return 'blue'; // 아군 스킬 슬롯
    if (element.classList.contains('type-white')) return 'white'; // 동그란 타겟 버튼/적군 스킬 슬롯

    if (element.classList.contains('type-orange')) return 'orange'; // 단순 스프라이트/나중에는 버튼으로?
    if (element.classList.contains('type-violet')) return 'violet'; // ★ [추가] 적군 네모 박스용

    if (element.classList.contains('type-red')) return 'red'; // 스킬 패널 -> 스킬 버튼
    if (element.classList.contains('type-green')) return 'green'; // 초상화 있어야하는 곳인데 당장은 눌렀을 때 수비 나가게

    if (element.classList.contains('type-yellow')) return 'yellow'; // 전투 시작 버튼


    return 'unknown';
}

// 헬퍼 함수: 턴 시작시 UI 만들기
/** 
@param {Object} data  - 서버에서 받은 턴 시작 데이터 (p1, p2 정보 포함)
*/
function OnTurnStart(data) {
    // 1. 아군 데이터와 적군 데이터 분리
    const myData = (myRole === 'p1') ? data.p1 : data.p2;
    const oppData = (myRole === 'p1') ? data.p2 : data.p1;

    // 2. 각각의 캐시에 할당 (toData() 형식 그대로 저장됨)
    if (myData && myData.active) allyTeamInfo = myData.active;
    if (oppData && oppData.active) enemyTeamInfo = oppData.active;

    // 정신력 갱신
    updateAllSanityUI();
    // 속도 갱신
    updateAllSpeedUI();

    // 선택 페이즈 레이어는 드러내기
    phaseSelect.classList.remove('hidden');
    // 전투 페이즈 레이어는 숨기기
    phaseBattle.classList.add('hidden');

    // GO 버튼 초기화
    if (goButton) {
        goButton.innerText = "GO";
        goButton.classList.remove('disabled');
    }

    // UI 초기화: 스킬 버튼 초기화
    skillButtons.forEach(btn => {
        btn.classList.remove('used', 'selected');
    });

    // UI 초기화: 타겟 버튼 초기화
    targetButtons.forEach(btn => {
        btn.classList.remove('locked');
    });
    targetingData = {};
}

// 정신력 갱신
function updateAllSanityUI() {
    // 1. 아군 정신력 업데이트 (상단 필드 & 하단 스킬 패널)
    allyTeamInfo.forEach((charData, idx) => {
        if (!charData) return; // 죽었거나 없는 슬롯이면 스킵
        
        // 상단 배틀 필드의 아군 속도치 찾기
        const topAllyUI = document.querySelector(`.left-team .unit-column[data-unit-index="${idx}"] .type-sanity`);
        if (topAllyUI) topAllyUI.innerText = charData.sp;
        topAllyUI.classList.add('maxsp')

        // 하단 스킬 패널의 아군 동그라미 찾기
        const bottomAllyUI = document.querySelector(`.skill-panel .skill-column[data-unit-index="${idx}"] .type-sanity`);
        if (bottomAllyUI) bottomAllyUI.innerText = charData.sp;
    });

    // 2. 적군 정신력 업데이트 (상단 필드)
    enemyTeamInfo.forEach((charData, idx) => {
        if (!charData) return;
        
        // 상단 배틀 필드의 적군 동그라미 찾기
        const topEnemyUI = document.querySelector(`.right-team .unit-column[data-unit-index="${idx}"] .type-sanity`);
        if (topEnemyUI) topEnemyUI.innerText = charData.sp;
        topEnemyUI.classList.add('minsp')
    });
}

function updateAllSpeedUI() {
    allyTeamInfo.forEach((charData, idx) => {
        if (!charData) return; // 죽었거나 없는 슬롯이면 스킵
        
        // 상단 배틀 필드의 아군 속도 박스 찾기
        const topAllyUI = document.querySelector(`.left-team .unit-column[data-unit-index="${idx}"] .type-speed`);
        if (topAllyUI) topAllyUI.innerText = charData.speed;

        // 하단 스킬 패널의 아군 속도 박스 찾기
        const bottomAllyUI = document.querySelector(`.skill-panel .skill-column[data-unit-index="${idx}"] .type-speed`);
        if (bottomAllyUI) bottomAllyUI.innerText = charData.speed;
    });
    
    enemyTeamInfo.forEach((charData, idx) => {
        if (!charData) return;
        
        // 상단 배틀 필드의 적군 속도 박스 찾기
        const topEnemyUI = document.querySelector(`.right-team .unit-column[data-unit-index="${idx}"] .type-speed`);
        if (topEnemyUI) topEnemyUI.innerText = charData.speed;
    });
}