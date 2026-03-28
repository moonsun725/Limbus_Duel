import type { Character } from '../../00_Sinner/00_0_sinner.js';
import { BattleSlot } from '../../00_Sinner/00_4_Slot.js';
import type { Skill } from '../../01_Skill/01_0_skill.js';
import type { Coin } from '../../02_Coin/02_0_coin.js';

// 콜백함수
export interface BattleCallbacks {
    onLog: (msg: string) => void;
    onAttackStart: (attacker: Character, target: Character, skill: Skill, coinList: Coin[]) => Promise<void>;
    onClashStart: (slot1: BattleSlot, slot2: BattleSlot) => Promise<void>;
    onCoinToss: (char: Character, isHeads: boolean) => Promise<void>;
    onCoinResult: (char: Character, isHeads: boolean) => Promise<void>; // 레거시 코드(일단은 남겨둠)
    // 콜백 추가

    // 코인 위력 변경
    onCoinPowModify: (char: Character, bonusAmount: number) => Promise<void>;
    // 그냥 위력 변경 
    onPowModify: (char: Character, bonusAmount: number) => Promise<void>;
    // 최종 위력 변경
    onFinalPowModify: (char: Character, bonusAmount: number) => Promise<void>;

    onClashResult: (
        char1: Character, 
        power1: number, 
        coinCount1: number,  // ★ 추가

        char2: Character, 
        power2: number,
        coinCount2: number,  // ★ 추가
        
        clashCount: number
    ) => Promise<void>;
    onDamage: (target: Character, damage: number) => Promise<void>; // 얘는 일반적인 데미지 전반
    onGetHit: (target: Character, motiontype?: number) => Promise<void>; // 얘는 공격 적중
    onAttackEnd: (attacker: Character, target: Character) => Promise<void>;
}