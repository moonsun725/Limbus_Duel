import type { Character } from "../00_Sinner/00_0_sinner.js";
import type { BattleUnitBuf } from "./04_battleUnitBufs.js";

export interface AbilityLogic {
    // 대부분의 경우 user, target을 구분해서 받지 않고, "적용 대상(target)" 하나만 받음
    Execute(target: Character, data: any, damage?: number, source?: Character): void;
    
    GetPowerMultiplier?(target: Character, user: Character, data: any) : number;
}

export const AbilityRegistry: { [key: string]: AbilityLogic } = {
    "AddKeywordBuf": {
        Execute: (target, data, damage) => {
            const status: BattleUnitBuf = {
                typeId: data.KeywordBuf,
                Owner: target,
                stack: data.stack,
                count: data.count,
                keyword: data.KeywordBuf
            };
            target.bufList.AddKeyWordBuf(status.keyword!, status); // 얘도 임시처리니까 나중에 체크해야한다~~
        }
    },
    "AddBuf": { // 이새끼는 당분간 보류다
        Execute: (target, data, damage, user) => {
                
            const status: BattleUnitBuf = {
                typeId: data.BattleUnitBuf,
                source: user,
                Owner: target,
                stack: data.stack,
                count: 0 // 대부분의 버프는 횟수가 없음 ㅇㅇ
            };
            target.bufList.AddBuf(status.typeId, status);
        }
    },
    "AddBufNextTurn": {
        Execute: (target, data, damage, user) => {
                
            const status: BattleUnitBuf = {
                typeId: data.BattleUnitBuf,
                source: user,
                Owner: target,
                stack: data.stack,
                count: 0 // 대부분의 버프는 횟수가 없음 ㅇㅇ
            };
            target.bufList.AddBufNextTurn(status.typeId, status);
        }
    },

    "PowerMultiplier": {
        Execute: () => {}
    },
    "CoinPowerMultiplier": {
        Execute: () => {}
    },
    "ClashPowerMultiplier": {
        Execute: () => {}
    },
    
    "DamageMultiplier": {
        Execute: () => {}
    },
    
}