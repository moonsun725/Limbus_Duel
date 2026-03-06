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
let myteamInfo, targetInfo;


// 상태 변수
let myRole = null;
let selectedUnitIndex = null;
let selectedSkillSlot = null;
let skillDataCache = [];
let targetingData = {};
let isSkillTooltipLocked = false;

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
    // 아군 정보 버튼 스크립트 할당

    // 타겟 선택 버튼 스크립트 할당
    // 속도가 빠른 놈은 뒤에 위치하니까 얘는 또 역순으로 돌아야 돼
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
    // 타겟 정보 버튼 스크립트 할당
    // 얘도 좌우반전이라 역순으로 돌아야 됨

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

    document.addEventListener('click', (event) => {
        // 1. 내가 클릭한 곳이 상호작용 가능한 요소(버튼)인가?
        const isInteractable = event.target.closest('.type-red, .type-blue, .type-green, .type-orange, .type-white, .type-yellow, .type-violet');

        // 2. 내가 클릭한 곳이 툴팁 그 자체인가? (툴팁 안의 텍스트를 드래그할 수도 있으니)
        const isTooltip = event.target.closest('#tooltip-skill');

        // 버튼도 아니고 툴팁도 아닌 완전 엉뚱한 곳(배경)을 눌렀다면!
        if (!isInteractable && !isTooltip) {
            isSkillTooltipLocked = false;
            skillTooltip.classList.add('hidden');
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

        // 그 외 모든 곳 클릭 시 -> 잠금 OFF    
        default:
            isSkillTooltipLocked = false;
            skillTooltip.classList.add('hidden');
            console.log("🔓 스킬 툴팁 잠금 OFF!");
            
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
        } else {
            infoMessage = "데이터 로딩 중...";
        }

        // 이 버튼이 'used'(확정된 스킬) 상태라면, 누구를 때리는지 적에게 표시
        if (target.classList.contains('used')) {
            const uIndex = btnIndex % 6;
            const targetEnemyIdx = targetingData[uIndex];

            if (targetEnemyIdx !== undefined) {
                const enemyUnits = document.querySelectorAll('.sidebar.right .circle'); // 오른쪽 팀 캐릭터들
                // 적 유닛에게 'hover-targeted' 효과 부여
                if (enemyUnits[targetEnemyIdx]) {
                    enemyUnits[targetEnemyIdx].classList.add('hover-targeted');
                }
            }
        }

    } else if (type === 'blue') {
        infoMessage = "아군 스킬 정보 (데이터 연결 필요)";
    } else if (type === 'green') {
        infoMessage = "수비 스킬 정보";
    }

    // 3. [핵심] 텍스트를 skillText에 꽂아넣기!
    skillText.innerText = infoMessage;
}

// 3. 캐릭터 툴팁 전담 로직
function handleMouseEnter_Character(target, team) {
    // 1. [핵심] 툴팁의 숨김 상태를 해제해서 화면에 보이게 함!
    charTooltip.classList.remove('hidden');

    // 2. [중요] 이전에 붙어있던 위치 클래스 지우기
    // (이게 없으면 아군 봤다가 적군 보면 클래스가 2개 겹쳐서 UI가 고장 납니다)
    charTooltip.classList.remove('tooltip-ally', 'tooltip-enemy');

    // 3. 진영에 맞춰서 위치 클래스 붙이고 텍스트(innerText) 넣기
    if (team === 'ally') {
        charTooltip.classList.add('tooltip-ally');
        // 나중에는 target.dataset.charId 등으로 캐시를 뒤져서 정보를 가져옵니다.
        charText.innerText = "[아군 정보]\n\n체력: 100/100\n흐트러짐: 30, 60\n내성 정보...";
    } else {
        charTooltip.classList.add('tooltip-enemy');
        charText.innerText = "[적군 정보]\n\n주요 패턴: ...\n약점: 참격";
    }
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
            charTooltip.classList.add('hidden');
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
    if (element.classList.contains('type-orange')) return 'orange'; // 단순 스프라이트/나중에는 버튼으로?
    if (element.classList.contains('type-violet')) return 'violet'; // ★ [추가] 적군 네모 박스용
    if (element.classList.contains('type-red')) return 'red'; // 스킬 패널 -> 스킬 버튼
    if (element.classList.contains('type-green')) return 'green'; // 초상화 있어야하는 곳인데 당장은 눌렀을 때 수비 나가게
    if (element.classList.contains('type-yellow')) return 'yellow'; // 전투 시작 버튼
    if (element.classList.contains('type-white')) return 'white'; // 동그란 타겟 버튼용
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
    targetingData = {}; // 
}