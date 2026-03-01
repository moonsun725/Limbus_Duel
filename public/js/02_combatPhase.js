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
import { socket } from "./00_main";

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
    socket.on('anim_attack_start', (data) => {
        console.log(`⚔️ 공격 시작! [${data.attacker.role}] -> [${data.defender.role}]`);

        // 1. 방어자 (Defender) 처리: 무조건 삭제
        // (합에서 졌거나, 일방적으로 맞는 상황이므로 스킬 캔슬 연출)
        const defBundleId = (data.defender.role === 'p1') ? 'p1-bundle' : 'p2-bundle';
        // if (defBundleId.querySelector('.skill-container').coins.length > 0) { // 코인이 남아있으면 삭제 x(나중에 한참뒤에 파불코가 있음)
        removeSkillUI(defBundleId);

        // 2. 공격자 (Attacker) 처리: 상황에 따라 다름
        const atkBundleId = (data.attacker.role === 'p1') ? 'p1-bundle' : 'p2-bundle';
        const atkBundle = document.getElementById(atkBundleId);

        if (atkBundle) {
            // ★ [핵심] 이미 스킬 UI가 존재하는지 확인
            const existingUI = atkBundle.querySelector('.skill-container');
            // 조건이 너무 널널한데
            if (existingUI) {
                // [상황 A: 합 승리 후]
                // 이미 UI가 있고, 합 진행 중에 코인이 알맞게 줄어들었음.
                // 따라서 아무것도 하지 않고 유지함. (부드러운 연결)
                console.log("♻️ 합 승리자 UI 유지");

                // (선택) 만약 확실히 하기 위해 텍스트 색상만 리셋하고 싶다면:
                // resetPowerText(atkBundleId); 
            } else {
                // [상황 B: 일방 공격]
                // 합 과정 없이 바로 공격하므로 UI가 없음. 새로 그려야 함.
                console.log("🆕 일방 공격 UI 생성");
                rebuildSkillUI(
                    atkBundleId,
                    data.attacker.skill,
                    data.attacker.power,
                    data.attacker.coinPower
                );
            }
        }

        // 공격 끝났으니 UI 지워야지
        // removeSkillUI(atkBundleId);
        // attack에서 지우면 공격 코인 굴리기 전에 UI가 사라져
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

