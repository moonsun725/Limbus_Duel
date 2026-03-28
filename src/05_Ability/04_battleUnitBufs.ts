import type { Character } from "../00_Sinner/00_0_sinner.js";
import type { BattleContext } from "./00_BattleContext.js";

export type KeyWords = 'BURN' | 'BLEEDING' | 'TREMOR' | 'RUPTURE' | 'SINKING' | 'POISE' | 'CHARGE'; 

export interface BattleUnitBuf {
    typeId: string;
    stack: number;
    count: number | null;
    Owner: Character;
    source?: Character | undefined; 
    isNegative?: boolean; 
    keyword?: string;
    usage?: number;
}

// 🌟 새롭게 추가된 Modifier 객체 (스탯 증감치를 모두 담는 바구니)
export interface StatModifier {
    damageMultiplier: number;
    damageReductionRate: number;

    powerBonus: number;
    clashPowerBonus: number;
    finalPowerBonus: number;
    atkPowerBonus: number;
    defPowerBonus: number;
    coinPowerBonus: number;
    coinPowerBonus_P: number;
    coinPowerBonus_M: number;

    atkLvBonus: number;
    defLvBonus: number;
    speedBoost: number;
}

export interface TriggerEvents {
    Activate?(owner: Character, BufData: any) : void 
    UseStack?(owner: Character, BufData: any, amount: number) : boolean
    UseCount?(owner: Character, BufData: any, amount: number) : boolean
    OnAddBuf(owner: Character, BufData: any): void
    OnCoinToss?(owner: Character, BufData: any): void; 
    OnTurnEnd?(owner: Character, BufData: any): void;
    OnTurnStart?(owner: Character, BufData: any): void;
    OnBeingHit?(owner: Character, BufData: any, attacker?: Character, damage?: number): void;
    IsCritical?(owner: Character, BufData: any) : boolean;
    ParalyzeMechanic?(owner: Character, BufData: any) : 0 | 1;

    // 🌟 기존의 9개 Get~~ 함수들을 이거 하나로 통폐합!
    // context는 스피드 굴림처럼 아직 타겟이 없는 상황일 수도 있으므로 옵셔널(?) 처리합니다.
    OnModifyStats?(owner: Character, BufData: any, modifier: StatModifier, context?: BattleContext): void;
}

export const BufRegistry: { [key: string]: TriggerEvents } = {
    "Burn":
    {
        Activate: (owner, data) => {
            owner.takeDamage(data.stack);
            data.count--;
            if (data.count <= 0)
                owner.bufList.RemoveBuf("Bleeding");
        },
        OnAddBuf: (owner, data) => {
            data.isNegative = true;
        }, // 혹시 몰라서 남겨는 놓음
        OnTurnEnd: (owner, data) => {
            owner.takeDamage(data.stack);
            data.count--;
            if (data.count <= 0)
                owner.bufList.RemoveBuf("Bleeding");
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
    "Tremor":
    {
        Activate: (owner, data) => {
            owner.takeStagger(data.stack);
        },
        OnAddBuf: (owner, data) => {
            data.isNegative = true;
        },
        OnTurnEnd: (owner, data) => {
            data.count--;
            if (data.count <= 0)
                owner.bufList.RemoveBuf("Themor");
        },
        UseCount: (owner, data, amount) => {
            // 진동 횟수 소모 가능한지 따지는 경우가 있고, 안 따지는 경우가 있잖음 ㅇㅇ
            let posible
            data.count -= amount;
            if (data.count <= 0)
                owner.bufList.RemoveBuf("Themor");
            return false; // >< 임시
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
        OnAddBuf: (owner, data) => {
            data.isNegative = true;
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
    "Protection": {
        OnAddBuf: (owner, data) => { data.isNegative = false; },
        OnModifyStats: (owner, data, modifier) => {
            modifier.damageReductionRate += data.stack;
        }
    },
    "Fragile": {
        OnAddBuf: (owner, data) => { data.isNegative = true; },
        OnModifyStats: (owner, data, modifier) => {
            modifier.damageReductionRate -= data.stack * 0.1;
        }
    },
    "DmgUp": {
        OnAddBuf: (owner, data) => { data.isNegative = false; },
        OnModifyStats: (owner, data, modifier) => {
            modifier.damageMultiplier += data.stack;
        }
    },
    "DmgDown": {
        OnAddBuf: (owner, data) => { data.isNegative = true; },
        OnModifyStats: (owner, data, modifier) => {
            modifier.damageMultiplier -= data.stack;
        }
    },
    "AtkLvUp": {
        OnAddBuf: (owner, data) => { data.isNegative = false; },
        OnModifyStats: (owner, data, modifier) => {
            modifier.atkLvBonus += data.stack;
        }
    },
    "AtkLvDown": {
        OnAddBuf: (owner, data) => { data.isNegative = true; },
        OnModifyStats: (owner, data, modifier) => {
            modifier.atkLvBonus -= data.stack;
        }
    },
    "DefLvUp": {
        OnAddBuf: (owner, data) => { data.isNegative = false; },
        OnModifyStats: (owner, data, modifier) => {
            modifier.defLvBonus += data.stack;
        }
    },
    "DefLvDown": {
        OnAddBuf: (owner, data) => { data.isNegative = true; },
        OnModifyStats: (owner, data, modifier) => {
            modifier.defLvBonus -= data.stack;
        }
    },  
    "Agility": {
        OnAddBuf: (owner, data) => { data.isNegative = false; },
        OnModifyStats: (owner, data, modifier) => {
            modifier.speedBoost += data.stack;
        }
    },
    "Binding": {
        OnAddBuf: (owner, data) => { data.isNegative = true; },
        OnModifyStats: (owner, data, modifier) => {
            modifier.speedBoost -= data.stack;
        }
    },
    "Assemble": { // 광신
        OnAddBuf: (owner, data) => { data.isNegative = false; },
        OnModifyStats: (owner, data, modifier, context) => {
            // Context가 있고, 타겟에게 Nail이 있는지 확인
            if (context && context.target && context.target.bufList.hasBuf("Nail")) {
                modifier.finalPowerBonus += data.stack;
            }
        }
    },

    "PowUp": { // 위력 증가 시리즈
        OnAddBuf: (owner, data) => { data.isNegative = false; },
        OnModifyStats: (owner, data, modifier) => {
            modifier.powerBonus += data.stack;
        }
    },
    "AtkPowUp": {
        OnAddBuf: (owner, data) => { data.isNegative = false; },
        OnModifyStats: (owner, data, modifier) => {
            modifier.atkPowerBonus += data.stack;
        }
    },
    "DefPowUp": {
        OnAddBuf: (owner, data) => { data.isNegative = false; },
        OnModifyStats: (owner, data, modifier) => {
            modifier.defPowerBonus += data.stack;
        }
    },
    "FinPowUp" : {
        OnAddBuf: (owner, data) => { data.isNegative = false; },
        OnModifyStats: (owner, data, modifier) => {
            modifier.finalPowerBonus += data.stack;
        }
    },
    "TypePowUp" : {
        OnAddBuf: (owner, data) => { data.isNegative = false; },
        OnModifyStats: (owner, data, modifier, context) => {
            modifier.powerBonus += data.stack;
        }
    }
}

