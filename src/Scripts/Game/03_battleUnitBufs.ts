import type { Character } from "./00_0_sinner.js";

/*
 * 키워드 버프 효과 (예: 침잠) - JSON상 배열로 존재
 */
export interface BattleUnitBuf {
   typeId: string;
    stack: number;
    count: number;
    Owner: Character;
    source?: Character | undefined;
}

export interface TriggerEvents {
    // 강제 발동
    Activate(owner: Character, BufData: any) : void
    // 효과 부여 시점
    OnAddBuf(status: BattleUnitBuf, stack: number, count: number): void

    OnCoinToss?(owner: Character, volatileData: any): void; 
    
    // 턴 종료 시 효과 
    OnTurnEnd?(owner: Character, volatileData: any): void;
    
    // 맞았을 때 발동 
    OnBeingHit?(owner: Character, attacker: Character, damage: number): void;

    GetDamageIncreseRate?(): number
}

export const BufRegistry: { [key: string]: TriggerEvents } = {
    "Burn":
    {
        Activate: (owner, data) => {
            owner.takeDamage(data.stack);
            data.count--;
        },
        OnAddBuf: () => {

        },
        OnTurnEnd: (owner, data) => {
            owner.takeDamage(data.stack);
            data.count--;
        }
    },
    "Bleeding":
    {
        Activate: (owner, data) => {
            owner.loseHP(data.stack);
            data.count--;
        },
        OnAddBuf: () => {

        },
    },
    "Thremor":
    {
        Activate: (owner, data) => {
            owner.takeDamage(data.stack);
            data.count--;
        },
        OnAddBuf: () => {

        },
    },
    "Rupture":
    {
        Activate: (owner, data) => {
            owner.takeDamage(data.stack);
            data.count--;
        },
        OnAddBuf: () => {

        },
    },
    "Sinking":
    {
        Activate: (owner, data) => {
            owner.Stats.LoseSP(data.stack);
            data.count--;
        },
        OnAddBuf: () => {

        },
    }
}

