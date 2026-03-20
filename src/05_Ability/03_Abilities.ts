import type { Character } from "../00_Sinner/00_0_sinner.js";
import type { BattleUnitBuf } from "./04_battleUnitBufs.js";
import type { BattleContext } from "./00_BattleContext.js";

export interface AbilityLogic { // 아니시발 인터페이스니까 여기에 needSource 변수 박으면 되잖아?
    // 대부분의 경우 user, target을 구분해서 받지 않고, "적용 대상(target)" 하나만 받음

    Execute(context: BattleContext, data: any): void;
    
    GetPowerBonus?(context: BattleContext, data: any) : number;
    GetCoinPowerBonus?(context: BattleContext, data: any): number;
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
            target.bufList.AddKeyWordBuf(status.keyword!, status); // 얘도 임시처리니까 나중에 체크해야한다~~
            console.log("AddKeyWordBuf 실행:",JSON.stringify(data), "대상:", target.name, "키워드버프", status.keyword);
            console.log("버프 추가 완료.", data.KeywordBuf);
        }
    },
    "AddKeywordBufNextTurn": {
        Execute: (context, data) => {
            
            const target = context.target;
            const status: BattleUnitBuf = {
                typeId: data.KeywordBuf,
                Owner: target,
                stack: data.stack,
                count: data.count,
                keyword: data.KeywordBuf
            };
            target.bufList.AddKeyWordBuf(status.keyword!, status); // 얘도 임시처리니까 나중에 체크해야한다~~
            console.log("AddKeyWordBuf 실행:",JSON.stringify(data), "대상:", target.name, "키워드버프", status.keyword);
            console.log("버프 추가 완료.", data.KeywordBuf);
        }
    },
    "AddBuf": { // 이새끼는 당분간 보류다
        Execute: (context, data) => {
            
            const user = context.user;
            const target = context.target;
            const status: BattleUnitBuf = {
                typeId: data.BattleUnitBuf,
                source: user, // 누적 가능이면 user가 다를 때 머리아플텐데...
                Owner: target,
                stack: data.stack,
                count: 0 // 대부분의 버프는 횟수가 없음 ㅇㅇ
            };
            target.bufList.AddBuf(status.typeId, status);
            console.log("대상에게 버프 추가", status.typeId, data.stack);
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

    "PowerBonus": { // 위력 보너스
        Execute: () => {},
        GetPowerBonus: (context, data) => {
            let multiplier = data.amount;
            return multiplier;
        },
    },
    "CoinPowerBonus": { // 코인 위력 보너스
        Execute: () => {},
        GetCoinPowerBonus: (context, data) => {
            let multiplier = data.amount;
            return multiplier;
        }
    },
    "ClashPowerBonus": {
        Execute: () => {}
    },
    
    "DamageMultiplier": {
        Execute: () => {}
    },
    
    "TremorBurst": {
        Execute: (context, data) => {
            const user = context.user;
            const target = context.target;
            const cost = data.cost; // 있으면 값 넣고 없으면 0 넣어라 근데 지금은 any라서 판단을 안 하지 않나

            if(cost) target.bufList.TremorBurst(cost);
            else target.bufList.TremorBurst();
        }
    }
}