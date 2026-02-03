import type { Character } from "./00_0_sinner.js";

/*
 * 키워드 버프 효과 (예: 침잠) - JSON상 배열로 존재
 */
export interface BattleUnitBuf {
  typeId: string;
  stack: number;
  count: number;
  source?: Character;
}

export interface VolatileLogic {
    // 효과 부여 시점
    OnAddBuf(status: BattleUnitBuf, stack: number, count: number): void

    OnCoinToss?(owner: Character, volatileData: any): void; 
    
    // 턴 종료 시 효과 
    OnTurnEnd?(owner: Character, volatileData: any): void;
    
    // 맞았을 때 발동 
    OnBeingHit?(owner: Character, attacker: Character, damage: number): void;

    GetDamageIncreseRate?(): number
}

