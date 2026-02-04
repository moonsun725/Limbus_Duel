import type { Character } from "./00_0_sinner.js";

/*
 * 키워드 버프 효과 (예: 침잠) - JSON상 배열로 존재
 */
type KeyWords = 'BURN' | 'BLEEDING' | 'THREMOR' | 'RUPTURE' | 'SINKING' | 'POISE' | 'CHARGE'
export interface BattleUnitBuf {
   typeId: string;
    stack: number;
    count: number;
    Owner: Character;
    source?: Character | undefined;
    keyword?: KeyWords | undefined;
}

export interface TriggerEvents {
    // 강제 발동
    Activate(owner: Character, BufData: any) : void
    // 효과 부여 시점
    OnAddBuf(owner: Character, BufData: any): void

    OnCoinToss?(owner: Character, BufData: any): void; 
    
    // 턴 종료 시 효과 
    OnTurnEnd?(owner: Character, BufData: any): void;
    
    // 맞았을 때 발동 
    OnBeingHit?(owner: Character, BufData: any, attacker: Character, damage: number): void;

    GetDamageIncreseRate?(): number
}

export const BufRegistry: { [key: string]: TriggerEvents } = {
    "Burn":
    {
        Activate: (owner, data) => {
            owner.takeDamage(data.stack);
            data.count--;
        },
        OnAddBuf: (owner, data) => {
            if (owner.bufList.getKeywordBufCount(data.Id) === 0)
                owner.bufList.AddKeyWordBuf("BURN", 0, 1);
            if (owner.bufList.getKeywordBufCount(data.Id) === 0)
                owner.bufList.AddKeyWordBuf("BURN", 1, 0);
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
        OnCoinToss: (owner, data) =>
        {
            owner.loseHP(data.stack);
            data.count--;
        }
    },
    "Thremor":
    {
        Activate: () => {},
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
    "Sinking": // 사실 이상때문에 얘를 제일 먼저 구현해야함
    {
        Activate: (owner, data) => {
            owner.loseSP(data.stack);
            data.count--;
        },
        OnAddBuf: () => {

        },
        OnBeingHit: (owner, data, attacker, damage) => {
            owner.loseSP(data.stack);
            data.count--;
        },
    }
}

