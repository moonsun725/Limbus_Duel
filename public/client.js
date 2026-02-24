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

// ui 갱신
socket.on('update_ui', (data) => {
    // 맨 처음 init
    const myData = (myRole === 'p1') ? data.p1 : data.p2;
    if (myData && myData.active) {
        skillDataCache = myData.active;
    }

    // 선택 페이즈 레이어는 드러내기
    phaseSelect.classList.remove('hidden');
    // 전투 페이즈 레이어는 숨기기
    phaseBattle.classList.add('hidden');
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

// 4. 코인 토스() 신호
// 이게 코인 던질때마다 받아야 됨(콜백이 루프 안에서 여러 번 던져주니까)
socket.on('individual_coin_result', (data) => {
    // data: { role: 'p1'|'p2', isHead: boolean }

    // 1. 타겟 번들 찾기
    const targetBundleId = (data.role === 'p1') ? 'p1-bundle' : 'p2-bundle';
    const bundle = document.getElementById(targetBundleId);
    if (!bundle) return;

    // 2. 코인 뒤집기 연출 (기존 로직)
    const coins = bundle.querySelectorAll('.coin');
    for (let coin of coins) {
        if (!coin.classList.contains('heads') && !coin.classList.contains('tails')) {
            if (data.isHead) coin.classList.add('heads');
            else coin.classList.add('tails');
            break; 
        }
    }

    // 3. [추가됨] 위력 텍스트 갱신 로직 (Client Side Calculation)
    if (data.isHead) {
        const container = bundle.querySelector('.skill-container');
        const circle = bundle.querySelector('.main-circle');

        if (container && circle) {
            // (1) 심어둔 코인 위력 가져오기 (문자열이라 숫자로 변환)
            const coinPower = parseInt(container.dataset.coinPower || 0);
            
            // (2) 현재 적힌 위력 가져오기
            let currentVal = parseInt(circle.innerText || 0);

            // (3) 더하기!
            const newVal = currentVal + coinPower;
            circle.innerText = newVal;

            // (4) 팝(Pop) 애니메이션 효과
            circle.classList.remove('pop-anim');
            void circle.offsetWidth; // Reflow 강제
            circle.classList.add('pop-anim');
            
            // (선택) 텍스트 색상 강조
            circle.style.color = '#ff9800'; 
        }
    }
});

// 5. 합 결과 (Clash Result) 신호
socket.on('anim_clash_result', (data) => {
    console.log(`⚔️ [${data.clashCount}합] 결과 수신`, data);

    // 1. 첫 번째 캐릭터(c1) 처리
    // 서버가 알려준 role('p1' or 'p2')에 따라 어느 쪽 UI를 건드릴지 결정
    const bundle1 = (data.c1.role === 'p1') ? 'p1-bundle' : 'p2-bundle';
    updateCoinDisplay(bundle1, data.c1.remainCoins);
    resetPowerText(bundle1);

    // 2. 두 번째 캐릭터(c2) 처리
    const bundle2 = (data.c2.role === 'p1') ? 'p1-bundle' : 'p2-bundle';
    updateCoinDisplay(bundle2, data.c2.remainCoins);
    resetPowerText(bundle2);
});

// [Helper] 코인 개수 및 상태 업데이트 함수
function updateCoinDisplay(bundleId, targetCount) {
    const bundle = document.getElementById(bundleId);
    if (!bundle) return;

    const coinRow = bundle.querySelector('.coin-row');
    if (!coinRow) return;

    // 현재 화면에 그려진 코인들 가져오기
    const currentCoins = coinRow.querySelectorAll('.coin');
    const currentCount = currentCoins.length;

    if (currentCount !== targetCount) {
        // [상황 A] 코인이 깨짐 (개수 변경) -> 싹 지우고 남은 개수만큼 새로 그림
        coinRow.innerHTML = '';
        for(let i=0; i < targetCount; i++) {
            const coin = document.createElement('div');
            coin.className = 'coin'; // 초기 상태(노란색)로 생성
            coinRow.appendChild(coin);
        }
    } else {
        // [상황 B] 비김 (개수 유지) -> 앞면/뒷면 색깔만 뺌 (초기화)
        currentCoins.forEach(coin => {
            coin.classList.remove('heads', 'tails');
        });
    }
}
// [Helper] 위력 텍스트와 스타일을 초기 상태로 되돌린다
function resetPowerText(bundleId) {
    const bundle = document.getElementById(bundleId);
    if (!bundle) return;

    const container = bundle.querySelector('.skill-container');
    const circle = bundle.querySelector('.main-circle');

    if (container && circle) {
        // 1. 심어뒀던 basePower 꺼내오기
        const baseVal = container.dataset.basePower;
        
        // 2. 텍스트 원상복구
        circle.innerText = baseVal;

        // 3. 스타일 초기화 (주황색 -> 원래색, 팝 애니메이션 제거)
        circle.style.color = ''; // 인라인 스타일 제거 (CSS 기본값인 흰색/검은색으로 돌아감)
        circle.classList.remove('pop-anim'); 
    }
}

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
    
    // ★ [핵심] 여기에 코인 위력을 데이터 속성으로 심어둡니다!
    // 나중에 JS가 이 값을 읽어서 더하기 연산을 할 겁니다.
    container.dataset.coinPower = coinPower;
    container.dataset.basePower = power;
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