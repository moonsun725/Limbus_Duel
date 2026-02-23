const socket = io();
console.log("Game Client Initialized");

// --------------------------------------------------------
// DOM 요소 참조
// --------------------------------------------------------
const tooltip = document.getElementById('info-tooltip');
const tooltipText = document.getElementById('tooltip-text');
const interactableElements = document.querySelectorAll('[data-has-info="true"]');
const buttons = document.querySelectorAll('button');

const phaseSelect = document.getElementById('phase-select');
const phaseBattle = document.getElementById('phase-battle');
const goButton = document.querySelector('.circle.large');

const skillButtons = document.querySelectorAll('.type-red'); 
const targetButtons = document.querySelectorAll('.right-team .circle');

// 상태 변수
let myRole = null;
let selectedUnitIndex = null;
let selectedSkillSlot = null;
let skillDataCache = [];
let targetingData = {};

// [New] 현재 슬롯 캐릭터 ID 기억 (교체 판단용)
let currentP1CharId = null;
let currentP2CharId = null;


// --------------------------------------------------------
// 초기화 및 공통 이벤트
// --------------------------------------------------------
function init() {
    interactableElements.forEach(el => {
        el.addEventListener('mouseenter', handleMouseEnter);
        el.addEventListener('mouseleave', handleMouseLeave);
        el.addEventListener('mousemove', handleMouseMove);
    });

    buttons.forEach(btn => {
        btn.addEventListener('click', handleClick);
    });
}

function handleClick(event) {
    // console.log('Clicked:', event.currentTarget);
}

// --------------------------------------------------------
// 툴팁 관련 함수들 (MouseEnter, MouseLeave, MouseMove)
// ... (기존 툴팁 코드 그대로 유지 - 내용이 길어서 생략) ...
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
// 소켓 통신: 게임 진행 (Join, Action, Battle Start)
// --------------------------------------------------------

socket.emit('join_game', 'room1');

socket.on('role_assigned', (data) => {
    myRole = data.role;
    console.log(`Role Assigned: ${myRole}`);
});

socket.on('update_ui', (data) => {
    const myData = (myRole === 'p1') ? data.p1 : data.p2;
    if (myData && myData.active) {
        skillDataCache = myData.active;
    }
});

// 스킬 선택
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

// 스킬 선택 하이라이트 동기화
socket.on('ui_move_selected', (data) => {
    skillButtons.forEach(b => b.classList.remove('selected'));
    const targetBtnIndex = (data.skillSlot === 1) ? data.userIndex : data.userIndex + 6;
    if (skillButtons[targetBtnIndex]) skillButtons[targetBtnIndex].classList.add('selected');
});

// 타겟 선택
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

// 전투 시작 요청 (GO 버튼)
if (goButton) {
    goButton.addEventListener('click', () => {
        if (goButton.classList.contains('disabled')) return;
        goButton.innerText = "WAIT";
        goButton.classList.add('disabled');
        socket.emit('start_battle', { type: 'BattleStart' });
    });
}


// --------------------------------------------------------
// [핵심] 전투 화면(Battle Phase) 연출 로직
// --------------------------------------------------------

// 1. 전투 시작 확정 (화면 전환) -> ★ 여기서는 전환만 하고 데이터는 안 기다림
socket.on('battle_start_confirmed', () => {
    // 선택 페이즈 레이어는 숨기기
    phaseSelect.classList.add('hidden');
    // 전투 페이즈 레이어는 드러내기
    phaseBattle.classList.remove('hidden');
    
    // 혹시 남아있을 스킬 UI 제거 (초기화)
    const p1Bundle = document.getElementById('p1-bundle');
    const p2Bundle = document.getElementById('p2-bundle');
    if(p1Bundle) {
         const existing = p1Bundle.querySelector('.skill-container');
         if(existing) existing.remove();
    }
    if(p2Bundle) {
         const existing = p2Bundle.querySelector('.skill-container');
         if(existing) existing.remove();
    }
});


// 2. 합(Clash) 시작 신호 (데이터 수신)
socket.on('anim_clash_start', (data) => {
    console.log("🔥 합 연출 시작!", data);

    // 혹시 화면 전환 안됐을까봐 안전장치
    phaseSelect.classList.add('hidden');
    phaseBattle.classList.remove('hidden');

    // [왼쪽 P1] 갱신
    updateCharacterUI('p1-bundle', data.p1.char);
    rebuildSkillUI('p1-bundle', data.p1.skill, data.p1.power, data.p1.coinPower);

    // [오른쪽 P2] 갱신
    updateCharacterUI('p2-bundle', data.p2.char);
    rebuildSkillUI('p2-bundle', data.p2.skill, data.p2.power, data.p2.coinPower);
});


// 3. 일방 공격(Attack) 시작 신호
socket.on('anim_attack_start', (data) => {
    // data: { atkId, targetId, skillName ... } 인데,
    // 서버(11_room.ts)에서는 { atkId, targetId, skillName }만 보내고 있어서
    // 캐릭터 전체 정보를 보내도록 서버 코드를 살짝 보완해야 완벽하게 작동합니다.
    // 일단 구조만 잡아둡니다.
    
    console.log("⚔️ 공격 시작!", data);
    
    // (임시) 스킬창만 지우기
    const p1Bundle = document.getElementById('p1-bundle');
    const p2Bundle = document.getElementById('p2-bundle');
    if(p1Bundle && p1Bundle.querySelector('.skill-container')) p1Bundle.querySelector('.skill-container').remove();
    if(p2Bundle && p2Bundle.querySelector('.skill-container')) p2Bundle.querySelector('.skill-container').remove();
});


// --------------------------------------------------------
// [UI Update Functions] 캐릭터 및 스킬 UI 갱신 구현부
// --------------------------------------------------------

/**
 * 캐릭터 UI 업데이트 (Update & Swap)
 * @param {string} bundleId - 'p1-bundle' 또는 'p2-bundle'
 * @param {object} charData - 서버에서 받은 캐릭터 데이터 (이름, HP, 이미지 등)
 */
function updateCharacterUI(bundleId, charData) {
    const bundle = document.getElementById(bundleId);
    if (!bundle || !charData) return;

    let charBox = bundle.querySelector('.char-box');
    
    // [보완] charBox가 아예 비어있으면(첫 실행) 내부 구조를 만들어줌
    if (!charBox.querySelector('.name-tag')) {
        charBox.innerHTML = `
            <div class="char-info-overlay" style="position: absolute; bottom: 0; width: 100%; text-align: center;">
                <div class="name-tag" style="background: rgba(0,0,0,0.5); color: #fff; font-size: 14px;"></div>
                <div class="hp-bar-container" style="width: 100%; height: 10px; background: #555;">
                    <div class="hp-bar-fill" style="width: 100%; height: 100%; background: #4caf50; transition: width 0.3s;"></div>
                </div>
            </div>
        `;
    }

    // 현재 표시 중인 캐릭터인지 확인
    const isNewCharacter = (bundleId === 'p1-bundle') 
        ? (currentP1CharId !== charData.id) 
        : (currentP2CharId !== charData.id);

    if (isNewCharacter) {
        // [Swap] 교체 연출
        charBox.classList.add('fade-out');
        setTimeout(() => {
            applyCharData(charBox, charData, false); 
            
            if (bundleId === 'p1-bundle') currentP1CharId = charData.id;
            else currentP2CharId = charData.id;

            charBox.classList.remove('fade-out');
        }, 300); 

    } else {
        // [Update] 수치 갱신
        applyCharData(charBox, charData, true);
    }
}

// 내부 헬퍼: 실제 DOM 값 변경
function applyCharData(charBox, data, animate) {
    const nameTag = charBox.querySelector('.name-tag');
    const hpBar = charBox.querySelector('.hp-bar-fill');
    
    if (nameTag) nameTag.innerText = data.name;

    if (hpBar) {
        const hpPercent = (data.hp / data.maxHp) * 100;

        if (!animate) {
            hpBar.classList.add('no-transition');
            hpBar.style.width = `${hpPercent}%`;
            void hpBar.offsetWidth; // Reflow
            hpBar.classList.remove('no-transition');
        } else {
            hpBar.style.width = `${hpPercent}%`;
        }
    }
}

/**
 * 스킬 UI 재생성 (Delete & Recreate)
 */
function rebuildSkillUI(bundleId, skillData, power, coinPower) {
    const bundle = document.getElementById(bundleId);
    if (!bundle) return;

    // 1. 기존 UI 삭제
    const existing = bundle.querySelector('.skill-container');
    if (existing) existing.remove();

    if (!skillData) return; 

    // 2. HTML 문자열 생성
    let coinsHtml = '';
    for(let i=0; i < skillData.coinCount; i++) {
        coinsHtml += `<div class="coin"></div>`;
    }

    const container = document.createElement('div');
    container.className = 'skill-container'; // style.css의 opacity: 0 적용됨
    
    container.innerHTML = `
        <div class="skill-group">
            <div class="coin-row">${coinsHtml}</div>
            <div class="skill-bar">${skillData.name}</div>
        </div>
        <div class="circle-wrapper">
            <div class="main-circle">${power}</div>
            <div class="power-badge">${coinPower > 0 ? '+'+coinPower : coinPower}</div>
        </div>
    `;

    // 3. DOM 추가 (캐릭터 박스 앞에)
    bundle.prepend(container); 

    // 4. 등장 애니메이션
    requestAnimationFrame(() => {
        container.classList.add('visible');
    });
}

// 실행
init();