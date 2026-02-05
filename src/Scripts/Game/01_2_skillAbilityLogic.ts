import type { Character } from "./00_0_sinner.js";
import type { Skill } from "./01_0_skill.js";
import { AbilityRegistry } from "./03_Abilities.js";


// 트리거 타입 정의: 언제 호출되었는가?
export type EffectTrigger = 'OnUse' | 'OnHit' | 'OnBasePower';

interface AbilityLogic {
    // 대부분의 경우 user, target을 구분해서 받지 않고, "적용 대상(target)" 하나만 받음
    Execute(target: Character, data: any, damage?: number, source?: Character): void;
    // 나중에 군루 생각하면 쌍방 검사해야됨 이 시벌롬
    GetPowerMultiplier?(target: Character, user: Character, data: any) : number;
}

// =========================================================
// 메인 실행 함수 (Dispatcher)
// =========================================================

export function ProcessMoveEffects(move: Skill, defender: Character, attacker: Character, currentTiming: EffectTrigger, damage: number = 0): void 
{
    
    if (!move.abilities) return;

    for (const ability of move.abilities) // effects가 effect의 배열이니 for...of로 내용물 확인
    { 
        
        // 1. 타이밍 체크
        // JSON에 타이밍이 적혀있는데, 지금 시점과 다르면 스킵
        // (타이밍이 안 적혀있으면 '항상 발동'으로 간주하거나, 기본값 설정)
        const entryTiming = ability.timing || 'OnHit'; // 기본값은 상황에 따라
        if (entryTiming !== currentTiming) continue;

        // 2. 확률 체크
        // const chance = entry.chance ?? 100; // 이거 컨디션으로 바꾼다음에 콜백을 써야겠다
        // if (Math.random() * 100 > chance) continue;

        // 3. 타겟 결정 (JSON 데이터 기반)
        // entry.target이 'Self'면 attacker, 'Enemy'면 defender
        // 기본값: OnUse는 Self, OnHit은 Enemy로 설정하면 편함
        let actualTarget = defender; 
        if (ability.target === 'Self') {
            actualTarget = attacker;
        } else if (ability.target === 'Enemy') {
            actualTarget = defender;
        } else {
             // 타겟 명시가 없으면 타이밍에 따라 관례적으로 처리 (일단 무조건 포함하도록 짜긴 했는데 )
             actualTarget = (currentTiming === 'OnUse') ? attacker : defender; 
             console.log("[ProcessMoveEffects]: 부가효과의 타겟이 명시되어 있지 않음.")
        }

        // 4. 로직 실행
        const logic = AbilityRegistry[ability.type];
        if (logic) {
            // 이제 로직에게 "누구한테(actualTarget)" 할지만 알려주면 됨
            logic.Execute(actualTarget, ability.data, damage); 
        }
    }
}

// =========================================================
// 위력 보정 전용 함수 (number 반환)
// =========================================================
export function GetPowerMultiplier(
    move: Skill, 
    target: Character, 
    user: Character
): number {
    let multiplier = 1.0;
    
    if (!move.abilities) return multiplier;

    for (const entry of move.abilities) {
        // 타이밍이 OnBasePower인 것만 찾음
        if (entry.timing !== 'OnBasePower') continue;

        const logic = AbilityRegistry[entry.type];
        // 해당 로직에 GetPowerMultiplier 메서드가 있으면 실행
        if (logic && logic.GetPowerMultiplier) {

            let subject = target; // 기본적으로는 target
            if (entry.target === 'Self') {
                subject = user;
            }

            // ★ 여기서 user와 target을 둘 다 넘겨줌
            const result = logic.GetPowerMultiplier(subject, user, entry.data);
            multiplier *= result;
        }
    }
    return multiplier;
}
