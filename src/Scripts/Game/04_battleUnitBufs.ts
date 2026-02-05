import type cluster from "cluster";
import type { Character } from "./00_0_sinner.js";

/*
 * 키워드 버프 효과 (예: 침잠) - JSON상 배열로 존재
 */
type KeyWords = 'BURN' | 'BLEEDING' | 'THREMOR' | 'RUPTURE' | 'SINKING' | 'POISE' | 'CHARGE'
export interface BattleUnitBuf {
   typeId: string;
    stack: number;
    count: number | null;
    Owner: Character;
    source?: Character | undefined;
    isNegative?: boolean; // 
    keyword?: KeyWords
}

export interface TriggerEvents {
    // 강제 발동
    Activate?(owner: Character, BufData: any, stack?: number, count?: number) : void
    // 효과 부여 시점
    OnAddBuf?(owner: Character, BufData: any): void

    OnCoinToss?(owner: Character, BufData: any): void; 
    
    // 턴 종료 시 효과 
    OnTurnEnd?(owner: Character, BufData: any): void;
    
    // 맞았을 때 발동 
    OnBeingHit?(owner: Character, BufData: any, attacker?: Character, damage?: number): void;
    
    // 데미지 계산 전에 발동
    IsCritical?(owner: Character, BufData: any) : boolean;

    // 내가 주는 피해 버프 
    GetDamageMultiplier?(): number

    // 내가 받는 피해
    GetDamageReductionRate?(): number

    // 마비 매커니즘
    ParalyzeMechanic?(): boolean
    
    // 합 위력 보너스 반환
    GetClashPowerBonus?() : number

    // 최종 위력 보너스 반환
    GetFinalPowerBonus?(): number

    // 공격 위력 보너스 반환
    GetAtkPowerBonus?(): number
    
    // 수비 위력 보너스 반환
    GetDefPowerBonus?(): number

    // 공격 레벨 증감 반환
    GetAtkLvBonus?(): number

    // 방어 레벨 증감 반환
    GetDefLvBonus?() : number

}

export const BufRegistry: { [key: string]: TriggerEvents } = {
    "Burn":
    {
        Activate: (owner, data) => {
            owner.takeDamage(data.stack);
            data.count--;
        },
        OnAddBuf: (owner, data) => {}, // 혹시 몰라서 남겨는 놓음
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
        OnAddBuf: () => {},
        OnCoinToss: (owner, data) =>
        {
            owner.loseHP(data.stack);
            data.count--;
            if (data.count <= 0)
                owner.bufList.RemoveBuf("Bleeding");
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
            data.count--; // 이건 함수로 만들만하다
            if (data.count <= 0)
                owner.bufList.RemoveBuf("Rupture");
        },
        OnAddBuf: () => {

        },
        OnBeingHit: (owner, data) => {
            owner.takeDamage(data.stack);
            data.count--;
            if (data.count <= 0)
                owner.bufList.RemoveBuf("Rupture");
        },
    },
    "Sinking": // 사실 이상때문에 얘를 제일 먼저 구현해야함
    {
        Activate: (owner, data) => {
            owner.loseSP(data.stack);
            data.count--;
            if (data.count <= 0)
                owner.bufList.RemoveBuf("Sinking");
        },
        OnAddBuf: () => {

        },
        OnBeingHit: (owner, data) => {
            owner.loseSP(data.stack);
            data.count--;
            if (data.count <= 0)
                owner.bufList.RemoveBuf("Sinking");
        },
    },
    "Poise":
    {
        Activate: (owner, data) => {},
        OnAddBuf: () => {},
        OnTurnEnd: (owner, data) =>
        {
            data.count--;
            if (data.count <= 0)
                owner.bufList.RemoveBuf("Poise");
        },
        IsCritical: (owner, data) =>
        {
            if (data.stack*5 < Math.random()*100)
            {
                data.count--;
                if (data.count <= 0)
                    owner.bufList.RemoveBuf("Poise");
                return true;
            }
            return false;
        }
        
    },
    "Charge":
    {
        Activate: (owner, data, stack, count) => {
            
        }, // 이새낀 더미라서 괜찮아
        OnAddBuf: () => {},
    },

}

