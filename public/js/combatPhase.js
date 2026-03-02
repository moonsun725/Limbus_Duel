/*
    역할 설명:
    전투 화면에서는 다음의 기능을 처리해야 합니다

    // 합
    - 두 대상이 모두 스킬 UI를 생성해야 함
        - 코위증 적용될 때 UI에 표기하기
        - 위력 증가, 합 위력 증가, 최종 위력 증가 각자 적용되는 효과
    - 1합을 갱신할 때마다 코인리스트 체크할 것
    - 합에서 패배한 대상의 스킬 UI 파괴

    // 공격

        // 광역기?

    // 수비 상호작용
        - 방어
        - 회피
        - 반격
*/
import { socket } from './network.js';

// [New] 현재 슬롯 캐릭터 ID 기억 (교체 판단용): 전투 화면에서 사용
let currentP1CharId = null;
let currentP2CharId = null;

export function initBattleCombat() {
    // DOM 요소 할당
    const phaseSelect = document.getElementById('phase-select');
    const phaseBattle = document.getElementById('phase-battle');

    // 1. 전투 시작 확정 (화면 전환) -> ★ 여기서는 전환만 하고 데이터는 안 기다림
    socket.on('battle_start_confirmed', () => {
        // 선택 페이즈 레이어는 숨기기
        phaseSelect.classList.add('hidden');
        // 전투 페이즈 레이어는 드러내기
        phaseBattle.classList.remove('hidden');

        // 혹시 남아있을 스킬 UI 제거 (초기화)
        const p1Bundle = document.getElementById('p1-bundle');
        const p2Bundle = document.getElementById('p2-bundle');
        if (p1Bundle) {
            const existing = p1Bundle.querySelector('.skill-container');
            if (existing) existing.remove();
        }
        if (p2Bundle) {
            const existing = p2Bundle.querySelector('.skill-container');
            if (existing) existing.remove();
        }
    });

    // 2. 합(Clash) 시작 신호 (데이터 수신)
    socket.on('anim_clash_start', (data) => {
        // data: {p1: {char: { id, name, hp, maxhp }, skill: { name, coinCount }, power, coinPower}
        
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

    // 3. 공격 시작 신호 (데이터 수신) -> 상황에 따라 UI 유지 or 재생성
    /**
     * @param {Object} data = { attacker: { role, skill: {name, coinCount}, power, coinPower} defender: {role} }
     */
   socket.on('anim_attack_start', (data) => {
        // 1. 데이터 정리: 누가 P1이고 누가 P2인가?
        // (공격자가 P1이면 -> P1데이터=attacker, P2데이터=defender)
        // (공격자가 P2이면 -> P1데이터=defender, P2데이터=attacker)
        let p1Data, p2Data;
        let attackerData; // 스킬 UI 그릴 때 필요

        if (data.attacker.role === 'p1') {
            p1Data = data.attacker;
            p2Data = data.defender;
            attackerData = data.attacker;
        } else {
            p1Data = data.defender;
            p2Data = data.attacker;
            attackerData = data.attacker;
        }

        console.log(`⚔️ 공격 시작! P1[${p1Data.name}] vs P2[${p2Data.name}]`);

        // 2. ★ 양쪽 진영 캐릭터 갱신 (함수로 분리해서 깔끔하게 처리)
        checkAndUpdateChar('p1', p1Data);
        checkAndUpdateChar('p2', p2Data);

        // 3. 스킬 UI 처리
        // 3-1. 방어자는 스킬 UI 제거 (맞을 준비)
        const defBundleId = (data.attacker.role === 'p1') ? 'p2-bundle' : 'p1-bundle';
        removeSkillUI(defBundleId);

        // 3-2. 공격자는 스킬 UI 생성/유지
        const atkBundleId = (data.attacker.role === 'p1') ? 'p1-bundle' : 'p2-bundle';
        // (여기는 아까 짰던 로직 그대로: 이미 있으면 유지, 없으면 생성)
        const existingUI = document.getElementById(atkBundleId).querySelector('.skill-container');
        
        // 주의: 캐릭터가 바뀌었으면(방금 위에서 갱신됨) 기존 UI가 있어도 무효일 수 있음.
        // 하지만 checkAndUpdateChar 안에서 초기화를 안 했다면, 
        // 여기서 "캐릭터가 교체된 직후"인지 알 필요가 있음.
        
        // 팁: checkAndUpdateChar가 "true(교체됨)"를 반환하게 하면 편함
        // 하지만 간단하게 가려면: rebuildSkillUI를 그냥 호출하되, 
        // "합 승리 후 연계" 상황만 구분하면 됨.
        
        // 가장 안전한 방법: 
        // 캐릭터가 바뀌었으면 -> 무조건 rebuild
        // 캐릭터가 안 바뀌었고 UI가 있다 -> 유지
        if (existingUI) {
             // UI가 있는데 캐릭터가 바뀌었는지 확인은 이미 위에서 끝났음.
             // 다만 "기존 UI"가 "이전 캐릭터의 UI"일 수도 있으므로,
             // checkAndUpdateChar 함수 안에서 "캐릭터 바뀌면 스킬 UI 싹 지우기"를 넣어주는 게 베스트.
             console.log("♻️ UI 유지");
        } else {
             console.log("🆕 UI 생성");
             rebuildSkillUI(atkBundleId, attackerData.skill, attackerData.power, attackerData.coinPower);
        }
    });

    socket.on('anim_attack_end', (data) => {
        // data: { atkRole: 'p1'|'p2', defRole: 'p1'|'p2' }
        console.log(`🛡️ 공격 종료 신호 수신! 공격자: [${data.atkRole}], 방어자: [${data.defRole}]`);

        // 공격자 찾기
        const atkBundleId = (data.atkRole === 'p1') ? 'p1-bundle' : 'p2-bundle';
        removeSkillUI(atkBundleId);
    });

    // 4. 코인 토스() 신호
    // 이게 코인 던질때마다 받아야 됨(콜백이 루프 안에서 여러 번 던져주니까)
    socket.on('individual_coin_result', (data) => {
        // data: { role: 'p1'|'p2', isHead: boolean }
        console.log(`🪙 코인 토스 결과 수신 [${data.role}] isHead: ${data.isHead}`);
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
                // (1) 데이터셋에서 값 가져오기 (숫자로 변환)
                const coinPower = parseInt(container.dataset.coinPower || 0);
                let currentTotal = parseInt(container.dataset.currentPower || 0);

                // (2) 더하기
                currentTotal += coinPower;

                // (3) 저장 및 표시
                container.dataset.currentPower = currentTotal; // 저장
                circle.innerText = currentTotal; // 표시

                // (수정) 글자만 감싸는 span 생성 또는 선택
                let textSpan = circle.querySelector('.anim-target');
                if (!textSpan) {
                    circle.innerHTML = `<span class="anim-target">${currentTotal}</span>`;
                    textSpan = circle.querySelector('.anim-target');
                } else {
                    textSpan.innerText = currentTotal;
                }

                // (수정) 애니메이션을 circle이 아닌 textSpan에 적용
                textSpan.classList.remove('pop-anim');
                void textSpan.offsetWidth; // Reflow 강제
                textSpan.classList.add('pop-anim');

                circle.style.color = '#ffffff';
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

    // 6. 피격 연출(흔들림)
    socket.on('anim_hit_reaction', (data) => {
        const bundleId = (data.role === 'p1') ? 'p1-bundle' : 'p2-bundle';
        const bundle = document.getElementById(bundleId);

        if (bundle) {
            const charImg = bundle.querySelector('.character-image');
            // 흔들림 애니메이션 재시작 테크닉
            if (charImg) {
                charImg.classList.remove('shake');
                void charImg.offsetWidth; // Reflow 강제 (애니메이션 리셋용)
                charImg.classList.add('shake');
            }
        }
    });

    // 7. 데미지 UI (HP바, 숫자)
    socket.on('anim_damage_ui', (data) => {
        const bundleId = (data.role === 'p1') ? 'p1-bundle' : 'p2-bundle';
        const bundle = document.getElementById(bundleId);

        if (bundle) {
            // (1) HP 바 줄이기
            const hpBar = bundle.querySelector('.hp-fill');
            if (hpBar) {
                const percent = (data.hp / data.maxHp) * 100;
                hpBar.style.width = `${percent}%`;
            }

            // (2) 데미지 숫자 띄우기 (Helper 함수)
            showFloatingDamage(bundle, data.damage);
        }
    });

    // [Helper] 데미지 텍스트 생성
    function showFloatingDamage(parent, damage) {
        const el = document.createElement('div');
        el.className = 'floating-damage';
        el.innerText = `-${damage}`;

        // 위치를 살짝 랜덤하게 (겹치지 않게)
        const randomX = (Math.random() - 0.5) * 40;
        el.style.left = `calc(50% + ${randomX}px)`;

        parent.appendChild(el);
        setTimeout(() => el.remove(), 800); // 0.8초 뒤 삭제
    }
}



// --------------------------------------------------------
// [UI Update Functions] 캐릭터 및 스킬 UI 갱신 구현부
// --------------------------------------------------------

/**
 * 캐릭터 UI 업데이트 (Update & Swap)
 * @param {string} bundleId - 'p1-bundle' 또는 'p2-bundle'
 * @param {object} charData - 데이터 형식을 적어주세요
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
 * 배틀 화면: 스킬 UI 재생성 (Delete & Recreate)
 * @param {string} bundleId - 'p1-bundle' 또는 'p2-bundle'
 * @param {object} skillData - 데이터 형식을 적어주세요
 * @param {number} power - 스킬의 기본 위력
 * @param {number} coinPower - 코인으로 인한 위력 증가량 (0이면 코인 없음)
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
    for (let i = 0; i < skillData.coinCount; i++) {
        coinsHtml += `<div class="coin"></div>`;
    }

    const container = document.createElement('div');
    container.className = 'skill-container'; // style.css의 opacity: 0 적용됨

    // ★ [핵심] 여기에 코인 위력을 데이터 속성으로 심어둡니다!
    // 나중에 JS가 이 값을 읽어서 더하기 연산을 할 겁니다.
    container.dataset.coinPower = coinPower;
    container.dataset.basePower = power;
    container.dataset.currentPower = power; // 추가: 현재 위력도 저장 (코인 토스 때마다 갱신할 예정)

    container.innerHTML = `
        <div class="skill-group">
            <div class="coin-row">${coinsHtml}</div>
            <div class="skill-bar">${skillData.name}</div>
        </div>
        <div class="circle-wrapper">
            <div class="main-circle">${power}</div>
            <div class="power-badge">${coinPower > 0 ? '+' + coinPower : coinPower}</div>
        </div>
    `;

    // 3. DOM 추가 (캐릭터 박스 앞에)
    bundle.prepend(container);

    // 4. 등장 애니메이션
    requestAnimationFrame(() => {
        container.classList.add('visible');
    });
}

// [Helper] 스킬 UI 제거 함수 (삭제 + 애니메이션)
function removeSkillUI(bundleId) {
    const bundle = document.getElementById(bundleId);
    if (!bundle) return;

    const container = bundle.querySelector('.skill-container');
    if (container) {
        // (선택) 휙 사라지는 애니메이션 (css transition 활용)
        container.style.opacity = '0';
        container.style.transform = 'scale(0.9)';

        // 0.3초 뒤에 DOM에서 완전히 제거
        setTimeout(() => {
            if (container) container.remove();
        }, 300);
    }
}

// --------------------------------------------------------
// [Helper Functions] UI 관련 헬퍼 함수
// --------------------------------------------------------

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
        for (let i = 0; i < targetCount; i++) {
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

        // ★ [수정] currentPower도 초기화 필수!
        container.dataset.currentPower = baseVal;

        // 2. 텍스트 원상복구
        circle.innerText = baseVal;

        // 3. 스타일 초기화 (주황색 -> 원래색, 팝 애니메이션 제거)
        circle.style.color = ''; // 인라인 스타일 제거 (CSS 기본값인 흰색/검은색으로 돌아감)
        circle.classList.remove('pop-anim');
    }
}

/**
 * [Helper] 진영별 캐릭터 갱신 검사기
 * 역할: "지금 그려진 놈이랑 데이터랑 다르면 갈아치워라"
 */
function checkAndUpdateChar(side, data) {
    const isP1 = (side === 'p1');
    const currentId = isP1 ? currentP1CharId : currentP2CharId;
    const bundleId = isP1 ? 'p1-bundle' : 'p2-bundle';
    
    // 1. ID가 다르면 교체!
    if (currentId !== data.id) {
        console.log(`🔄 [${side}] 캐릭터 교체: ${currentId} -> ${data.id} (${data.name})`);
        
        // ID 업데이트
        if (isP1) currentP1CharId = data.id;
        else currentP2CharId = data.id;

        // 화면 갱신 (초상화, 이름 등)
        updateCharacterUI(bundleId, data);
        
        // ★ [중요] 캐릭터가 바뀌었으니, 기존에 남아있던(이전 놈의) 스킬 UI나 코인 등은 싹 지워야 함!
        // 그래야 밖에서 "UI가 없네? 새로 그려야지" 하고 정상 작동함.
        removeSkillUI(bundleId); 
        
        return true; // 교체됨
    }
    return false; // 유지됨
}
