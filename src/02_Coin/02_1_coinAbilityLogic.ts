import type { Character } from "../00_Sinner/00_0_sinner.js";
import type { Coin } from "./02_0_coin.js";
import { AbilityRegistry } from "../05_Ability/03_Abilities.js";
import { CondRegistry } from "../05_Ability/05_conditions.js";
import type { BattleContext } from "../05_Ability/00_BattleContext.js";

// 트리거 타입 정의: 언제 호출되었는가?
export type CoinEffectTrigger = 'OnToss' | 'OnHit' | 'OnBasePower' | 'OnHeadsHit' | 'OnTailsHit';

// =========================================================
// 메인 실행 함수 (Dispatcher)
// =========================================================

export function ProcessCoinEffects(coin: Coin, defender: Character, attacker: Character, currentTiming: CoinEffectTrigger, damage: number = 0): void 
{
    if (!coin.abilities) return;

    // 1. [핵심] 만능 가방(Context) 생성!
    // 스킬 참조가 당장 없다면 as any 처리를 하거나 인터페이스에서 ?(옵셔널) 처리해도 됩니다.
    const context: BattleContext = {
        user: attacker,
        target: defender, 
        damage: damage
        // 스킬은 나중에
    };

    for (const ability of coin.abilities) 
    { 
        // 2. 타이밍 체크
        const entryTiming = ability.timing || 'OnHit'; 
        if (entryTiming !== currentTiming) continue;

        // 3. 조건 판단 (Switch문 싹 삭제!)
        if (ability.condition) {
            console.log("[processCoinEffects]: 효과 조건 판단");
            const cond = CondRegistry[ability.condition.id];
            if (cond) {
                // 가방(context)과 조건 데이터(ability.condition)를 던집니다.
                // 주의: 05_conditions.ts 에서 Execute가 boolean을 반환하게 고쳐야 합니다!
                const isPassed = cond.Execute(context, ability.condition);
                console.log(isPassed);
                if (!isPassed) continue; // 조건 불만족 시 아래 로직 스킵!
            }
        }

        // 4. 로직 실행
        // 여기서도 타겟을 밖에서 찾지 않고, 'ability 전체'를 data로 넘겨버립니다.
        const logic = AbilityRegistry[ability.Type]; 
        if (logic) {
            console.log("[processCoinEffects]: 코인 효과 발동:", ability.Type);
            logic.Execute(context, ability.data); 
        }
    }
}
