import type { Character } from "../00_Sinner/00_0_sinner.js";
import type { Coin } from "./02_0_coin.js";
import { AbilityRegistry } from "../05_Ability/03_Abilities.js";

// 트리거 타입 정의: 언제 호출되었는가?
export type CoinEffectTrigger = 'OnToss' | 'OnHit' | 'OnBasePower' | 'OnHeadsHit' | 'OnTailsHit';

interface AbilityLogic {
    // 대부분의 경우 user, target을 구분해서 받지 않고, "적용 대상(target)" 하나만 받음
    Execute(target: Character, data: any, damage?: number, source?: Character): void;
    // 나중에 군루 생각하면 쌍방 검사해야됨 이 시벌롬
    GetPowerMultiplier?(target: Character, user: Character, data: any) : number;
}

// =========================================================
// 메인 실행 함수 (Dispatcher)
// =========================================================

export function ProcessCoinEffects(coin: Coin, defender: Character, attacker: Character, currentTiming: CoinEffectTrigger, damage: number = 0): void 
{
    if (!coin.abilities) return;

    for (const abilitiy of coin.abilities) // abilities가 ability의 배열이니 for...of로 내용물 확인
    { 
        // 1. [필터링] 타이밍 체크
        // JSON에 타이밍이 적혀있는데, 지금 시점과 다르면 스킵!
        // (타이밍이 안 적혀있으면 '항상 발동'으로 간주하거나, 기본값 설정)
        const entryTiming = abilitiy.timing || 'OnHit'; // 기본값은 상황에 따라
        console.log("[ProcessCoinEffects]: 타이밍:", currentTiming, entryTiming);
        console.log("[ProcessCoinEffects]: 부가효과:", abilitiy);
        if (entryTiming !== currentTiming) continue;

        // 2. 타겟 결정
        // entry.target이 'self'면 attacker, 'opponent'면 defender
        let actualTarget = defender; 
        if (abilitiy.target === 'self') {
            actualTarget = attacker;
        } else if (abilitiy.target === 'opponent') {
            actualTarget = defender;
        } else {
             // 타겟 명시가 없으면 타이밍에 따라 관례적으로 처리 (일단 무조건 포함하도록 짜긴 했는데 )
             actualTarget = (currentTiming === 'OnHit') ? attacker : defender; 
             console.log("[ProcessCoinEffects]: 부가효과의 타겟이 명시되어 있지 않음.")
        }

        // 3. 로직 실행
        const logic = AbilityRegistry[abilitiy.Type];
        console.log(logic);
        if (logic) {
            // 이제 로직에게 "누구한테(actualTarget)" 할지만 알려주면 됨
            logic.Execute(actualTarget, abilitiy.data, damage); 
            // console.log(logic, actualTarget.name, abilitiy.data, damage)
        }
    }
}
