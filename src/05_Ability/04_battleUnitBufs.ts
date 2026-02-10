import type cluster from "cluster";
import type { Character } from "../00_Sinner/00_0_sinner.js";

/*
 * 키워드 버프 효과 (예: 침잠) - JSON상 배열로 존재
 */
type KeyWords = 'BURN' | 'BLEEDING' | 'TREMOR' | 'RUPTURE' | 'SINKING' | 'POISE' | 'CHARGE'
export interface BattleUnitBuf {
   typeId: string;
    stack: number;
    count: number | null;
    Owner: Character;
    source?: Character | undefined;
    isNegative?: boolean; // 
    keyword?: KeyWords;
    usage?: number;
}

export interface TriggerEvents {
    // 강제 발동
    Activate?(owner: Character, BufData: any) : void 

    //횟수/위력 사용
    UseStack?(owner: Character, BufData: any, amount: number) : boolean
    UseCount?(owner: Character, BufData: any, amount: number) : boolean

    // 효과 부여 시점
    OnAddBuf(owner: Character, BufData: any): void

    OnCoinToss?(owner: Character, BufData: any): void; 
    
    // 턴 종료 시 효과 
    OnTurnEnd?(owner: Character, BufData: any): void;
    
    // 맞았을 때 발동 
    OnBeingHit?(owner: Character, BufData: any, attacker?: Character, damage?: number): void;
    
    // 데미지 계산 전에 발동
    IsCritical?(owner: Character, BufData: any) : boolean;

    // 내가 주는 피해 버프 
    GetDamageMultiplier?(owner: Character, BufData: any): number

    // 내가 받는 피해
    GetDamageReductionRate?(owner: Character, BufData: any): number

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
        OnAddBuf: (owner, data) => {
            data.isNegative = true;
        }, // 혹시 몰라서 남겨는 놓음
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
        OnAddBuf: (owner, data) => {
            data.isNegative = true;
        },
        OnCoinToss: (owner, data) =>
        {
            owner.loseHP(data.stack);
            data.count--;
            if (data.count <= 0)
                owner.bufList.RemoveBuf("Bleeding");
        }
    },
    "Themor":
    {
        Activate: () => {},
        OnAddBuf: (owner, data) => {
            data.isNegative = true;
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
        OnAddBuf: (owner, data) => {
            data.isNegative = true;
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
        OnAddBuf: (owner, data) => {
            data.isNegative = false;
        },
        OnTurnEnd: (owner, data) =>
        {
            data.count--;
            if (data.count <= 0)
                owner.bufList.RemoveBuf("Poise");
        },
        IsCritical: (owner, data) =>
        {
            if (data.stack*0.05 > Math.random())
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
        Activate: (owner, data) => { // useStack처럼 쓸거임
           // 아 충전이면 data에 누적값 하나 더 달고 다녀야하네 
        }, 
        OnAddBuf: (owner, data) => {
            data.isNegative = false;
        },
        OnTurnEnd: (owner, data) =>
        {
            data.count--;
            if (data.count <= 0 && data.stack <= 1)
                owner.bufList.RemoveBuf("Charge");
        },
    },
    "Protection":
    {
        OnAddBuf: (owner, data) =>
        {
            data.isNegative = false;
        },
        GetDamageReductionRate: (owner, data) =>
        {
            return data.stack;
        }
    },
    "Fragile":
    {
        OnAddBuf: (owner, data) => {
            data.isNegative = true;
        },
        GetDamageReductionRate: (owner, data) =>
        {
            return -data.stack;
        }
    },
    "DmgUp":
    {
        OnAddBuf: (owner, data) =>
        {
            data.isNegative = false;
        }
    },
    "DmgDown":
    {
        OnAddBuf: (owner, data) => {
            data.isNegative = true;
        },
    },
    "AtkLvUp":
    {
        OnAddBuf: (owner, data) =>
        {
            data.isNegative = false;
        }
    },
    "AtkLvDown":
    {
        OnAddBuf: (owner, data) => {
            data.isNegative = true;
        },
    },
    "DefLvUp":
    {
        OnAddBuf: (owner, data) =>
        {
            data.isNegative = false;
        }
    },
    "DefLvDown":
    {
        OnAddBuf: (owner, data) => {
            data.isNegative = true;
        },
    },  
}

