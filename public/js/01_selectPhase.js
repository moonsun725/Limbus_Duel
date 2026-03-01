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
import { socket } from "./network.js";

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

// 기본적으로 클릭했을때 추가
function handleClick(event) {
    console.log('Clicked:', event.currentTarget);
}

// 마우스가 객체 위에 올라갔을 때
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

// 마우스가 객체에서 벗어났을 때
function handleMouseLeave(event) {
    tooltip.classList.add('hidden');

    // [New] 호버 효과 제거
    document.querySelectorAll('.hover-targeted').forEach(el => {
        el.classList.remove('hover-targeted');
    });
}

// 마우스 움직임에 따라 툴팁 위치 갱신
function handleMouseMove(event) {
    // 마우스 커서 약간 옆에 툴팁 표시
    tooltip.style.left = (event.pageX + 10) + 'px';
    tooltip.style.top = (event.pageY + 10) + 'px';
}