import type { Character } from "../00_Sinner/00_0_sinner.js";
import { type BattleContext } from "../05_Ability/00_BattleContext.js";
import { CondRegistry } from "../05_Ability/05_conditions.js";
import type { Skill } from "./01_0_skill.js";
import { AbilityRegistry } from "../05_Ability/03_Abilities.js";


// 트리거 타입 정의: 언제 호출되었는가?
export type EffectTrigger = 'OnUse' | 'OnHit' | 'OnBasePower' | 'OnParryWin';

interface AbilityLogic {
    // 대부분의 경우 user, target을 구분해서 받지 않고, "적용 대상(target)" 하나만 받음
    Execute(target: Character, data: any, damage?: number, source?: Character): void;
    // 나중에 군루 생각하면 쌍방 검사해야됨 이 시벌롬
    GetPowerBonus?(target: Character, user: Character, data: any) : number;
}

// =========================================================
// 메인 실행 함수 (Dispatcher)
// =========================================================

export function ProcessMoveEffects(
    move: Skill, 
    defender: Character, 
    attacker: Character, 
    currentTiming: EffectTrigger, 
    damage: number = 0
): void {
    
    if (!move.abilities) return;

    // 1. [핵심] 만능 가방(Context) 생성!
    const context: BattleContext = {
        user: attacker,
        target: defender,
        skill: move,
        damage: damage
    };

    for (const ability of move.abilities) { 
        
        // 2. 타이밍 체크
        const entryTiming = ability.timing || 'OnHit';
        if (entryTiming !== currentTiming) continue;

        // ★ 기존의 복잡했던 actualTarget(타겟 결정 로직)은 완전히 삭제되었습니다! ★

        // 3. 조건 판단 (Gate)
        if (ability.condition) {
            const cond = CondRegistry[ability.condition.id];
            if (cond && cond.Execute) {
                // 조건 레지스트리에게 가방과 조건 데이터를 넘겨서 통과(T/F) 여부만 받음
                const isPassed = cond.Execute(context, ability.condition);
                if (!isPassed) continue; // 조건 불만족 시 효과 실행 스킵!
            }
        }
            
        // 4. 로직 실행
        const logic = AbilityRegistry[ability.type];
        if (logic && logic.Execute) {
            // 이제 Dispatcher는 "누구한테" 할지 고민하지 않고 가방(context)만 던집니다.
            // 타겟 판별은 Registry 내부에서 알아서 처리합니다.
            logic.Execute(context, ability.data); 
        }
    }
}

// =========================================================
// 스킬 위력 보정 전용 함수 (number 반환)
// =========================================================
export function GetPowerBonus(
    move: Skill, 
    target: Character, 
    user: Character
): number {
    // multiplier(1.0) 대신 bonus(0)로 변경하고 합연산을 준비합니다.
    let bonus = 0;
    
    if (!move.abilities) return bonus;

    // 1. 만능 가방(Context) 생성!
    const context: BattleContext = {
        user: user,
        target: target,
        skill: move,
        damage: 0 
    };

    for (const ability of move.abilities) {
        if (ability.timing !== 'OnBasePower') continue;

        // 2. 조건(Gate)이 있다면 먼저 검사!
        if (ability.condition) {
            const cond = CondRegistry[ability.condition.id];
            if (cond && cond.Execute) {
                // 주의: 05_conditions.ts의 Execute가 boolean을 반환하게 설정되어 있어야 합니다!
                const isPassed = cond.Execute(context, ability.condition) as unknown as boolean;
                if (!isPassed) continue; // 조건 불만족 시 아래 계산 로직 컷!
            }
        }

        // 3. 로직 실행 (가방만 던짐!)
        const logic = AbilityRegistry[ability.type];
        if (logic && logic.GetPowerBonus) {
            // 이제 로직 안에서 context.user를 쓸지 context.target을 쓸지 알아서 결정함
            const result = logic.GetPowerBonus(context, ability);
            bonus += result; // ★ 곱하기(*=) 대신 더하기(+=)로 변경 완료!
        }
    }
    
    return bonus;
}
