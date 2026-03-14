import type { Character } from "../00_Sinner/00_0_sinner.js";
import type { BattleUnitBuf } from "./04_battleUnitBufs.js";
import type { BattleContext } from "./00_BattleContext.js";

export interface AbilityLogic { // 아니시발 인터페이스니까 여기에 needSource 변수 박으면 되잖아?
    // 대부분의 경우 user, target을 구분해서 받지 않고, "적용 대상(target)" 하나만 받음

    Execute?(context: BattleContext, data: any): void;
    
    GetPowerMultiplier?(context: BattleContext, data: any) : number;
}

export const AbilityRegistry: { [key: string]: AbilityLogic } = {
    "AddKeywordBuf": {
        Execute: (context, data) => {

            const target = context.target;
            const status: BattleUnitBuf = {
                typeId: data.KeywordBuf,
                Owner: target,
                stack: data.stack,
                count: data.count,
                keyword: data.KeywordBuf
            };
            if (!status.keyword) return;
            target.bufList.AddKeyWordBuf(status.keyword, status); // 얘도 임시처리니까 나중에 체크해야한다~~
        }
    },
    "AddBuf": { // 이새끼는 당분간 보류다
        Execute: (context, data) => {
            
            const user = context.user;
            const target = context.target;
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
        Execute: (context, data) => {
            
            const user = context.user;
            const target = context.target;
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