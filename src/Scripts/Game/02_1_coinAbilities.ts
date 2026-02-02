import { Character } from './00_sinner.js';
import type { Coin } from './02_0_coin.js';

// 트리거 타입 정의: 언제 호출되었는가?
export type EffectTrigger = 'OnHit' | 'OnParrying'| 'OnHeadHit' | 'OnBasePower';

interface AbilityLogic {
    
    Execute(target: Character, data: any, damage?: number, source?: Character): void;
    
    GetPowerMultiplier?(target: Character, user: Character, data: any) : number;
}

// =========================================================
// 메인 실행 함수 (Dispatcher)
// =========================================================
// src/Game/Ability/coinAbility.ts

export function ProcessCoinEffects(
    coin: Coin, 
    defender: Character, // target (맞는 쪽)
    attacker: Character, // user (쓰는 쪽)
    currentTiming: EffectTrigger, // 현재 시점 ('OnUse' or 'OnHit')
    damage: number = 0
    ) : void 
{
    
    if (!coin.abilities) return;

    for (const entry of coin.abilities) // abilities가 effect의 배열이니 foreach로 내용물 확인
    { 
        
        // 1. [필터링] 타이밍 체크
        // JSON에 타이밍이 적혀있는데, 지금 시점과 다르면 스킵!
        // (타이밍이 안 적혀있으면 '항상 발동'으로 간주하거나, 기본값 설정)
        const entryTiming = entry.timing || 'OnHit'; // 기본값은 상황에 따라
        if (entryTiming !== currentTiming) continue;
    

        // 3. 타겟 결정 (JSON 데이터 기반)
        // entry.target이 'Self'면 attacker, 'Enemy'면 defender
        // 기본값: OnUse는 Self, OnHit은 Enemy로 설정하면 편함
        let actualTarget = defender; 
        if (entry.target === 'Self') {
            actualTarget = attacker;
        } else if (entry.target === 'Enemy') {
            actualTarget = defender;
        } else {
             // 타겟 명시가 없으면 타이밍에 따라 관례적으로 처리 (일단 무조건 포함하도록 짜긴 했는데 )
             actualTarget = (currentTiming === 'OnHit') ? attacker : defender; 
             console.log("[ProcessCoinEffects]: 부가효과의 타겟이 명시되어 있지 않음.")
        }

        // 4. 로직 실행
        const logic = AbilityRegistry[entry.type];
        if (logic) {
            // 이제 로직에게 "누구한테(actualTarget)" 할지만 알려주면 됨
            logic.Execute(actualTarget, entry.data, damage); 
        }
    }
}

// =========================================================
// 위력 보정 전용 함수 (number 반환)
// =========================================================
export function GetPowerMultiplier(
    coin: Coin, 
    target: Character, 
    user: Character
): number {
    let multiplier = 1.0;
    
    if (!coin.abilities) return multiplier;

    for (const entry of coin.abilities) {
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


// =========================================================
// 레지스트리 (Registry)
// 기술의 abilities(문자열)와 실제 로직을 매핑
// =========================================================

const AbilityRegistry: { [key: string]: AbilityLogic } = {

};
