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
let tooltip, tooltipText;
let interactableElements;
let buttons, skillButtons, targetButtons, goButton;
let phaseSelect, phaseBattle;

// 상태 변수
let myRole = null;
let selectedUnitIndex = null;
let selectedSkillSlot = null;
let skillDataCache = [];
let targetingData = {};

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
    skillButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (!myRole) return;
            const uIndex = index % 6;
            const sIndex = (index < 6) ? 1 : 0;

            // UI 초기화
            const colStart = uIndex;
            const colEnd = uIndex + 6;
            if (skillButtons[colStart]) skillButtons[colStart].classList.remove('used');
            if (skillButtons[colEnd]) skillButtons[colEnd].classList.remove('used');

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
    targetButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (selectedUnitIndex === null) {
                alert("먼저 스킬을 선택해주세요!");
                return;
            }
            socket.emit('target_select', {
                type: 'targetSelect',
                userIndex: selectedUnitIndex,
                actionIndex: index
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
        const targetBtnIndex = (data.skillSlot === 1) ? data.userIndex : data.userIndex + 6;
        if (skillButtons[targetBtnIndex]) skillButtons[targetBtnIndex].classList.add('selected');
    });

    // 타겟 매핑 확인
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
            if (skillButtons[siblingIdx]) skillButtons[siblingIdx].classList.remove('used', 'selected');

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

}

function initDOMs_BattleSelect() {
    tooltip = document.getElementById('info-tooltip');
    tooltipText = document.getElementById('tooltip-text');
    interactableElements = document.querySelectorAll('[data-has-info="true"]');
    buttons = document.querySelectorAll('button');

    phaseSelect = document.getElementById('phase-select');
    phaseBattle = document.getElementById('phase-battle');
    goButton = document.querySelector('.circle.large');

    skillButtons = document.querySelectorAll('.type-red');
    targetButtons = document.querySelectorAll('.right-team .circle');
}

// 기본적으로 클릭했을때 실행되는 함수
function handleClick(event) {
    console.log('Clicked:', event.currentTarget);
}

// 마우스가 객체 위에 올라갔을 때 실행되는 함수
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
            // 유닛 인덱스(0~5), 스킬 슬롯(0 or 1) 계산
            const uIndex = btnIndex % 6;
            const sIndex = (btnIndex < 6) ? 1 : 0;

            const charData = skillDataCache[uIndex];

            if (charData && charData.skills && charData.skills[sIndex]) {
                const skill = charData.skills[sIndex];

                infoMessage = `[${skill.name}]\n위력: ${skill.basePower}`;
                if (skill.coinPower) infoMessage += ` (+${skill.coinPower} x ${skill.coinNum}) [${skill.basePower} ~ ${skill.basePower + skill.coinPower * skill.coinNum}]`;
                
                infoMessage += `\n\n${skill.desc || ''}`;

                if (skill.coinDescs) {
                    skill.coinDescs.forEach((desc, idx) => {
                        if (desc) infoMessage += `\n🪙${idx + 1}: ${desc}`;
                        else infoMessage += `\n🪙${idx + 1}`;
                    });
                }
            } else {
                console.warn("Skill data is missing for this slot!");
                infoMessage = "스킬 정보 없음 (데이터 누락)";
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

// 마우스가 객체에서 벗어났을 때 실행되는 함수
function handleMouseLeave(event) {
    tooltip.classList.add('hidden');

    // [New] 호버 효과 제거
    document.querySelectorAll('.hover-targeted').forEach(el => {
        el.classList.remove('hover-targeted');
    });
}

// 마우스 움직임에 따라 툴팁 위치 갱신하는 헬퍼 함수
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

// 헬퍼 함수: 턴 시작시 UI 만들기
/** 
@param {Object} data  - 서버에서 받은 턴 시작 데이터 (p1, p2 정보 포함)
*/
function OnTurnStart(data) {
    // 맨 처음 init: 이거는 따로 분리를 해야되나?
    const myData = (myRole === 'p1') ? data.p1 : data.p2;
    if (myData && myData.active) {
        skillDataCache = myData.active;
    }

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
}