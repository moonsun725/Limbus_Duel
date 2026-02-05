import type { Character } from "./00_0_sinner.js";
import type { BattleUnitBuf } from "./03_battleUnitBufs.js";

export interface AbilityLogic {
    // 대부분의 경우 user, target을 구분해서 받지 않고, "적용 대상(target)" 하나만 받음
    Execute(target: Character, data: any, damage?: number, source?: Character): void;
    // 객기, 베놈쇼크: 한쪽만 검사 | 자이로볼, 히트스탬프: 쌍방 검사라 user랑 target 구분할 필요 있음
    GetPowerMultiplier?(target: Character, user: Character, data: any) : number;
}

export const AbilityRegistry: { [key: string]: AbilityLogic } = {
    "AddKeywordBuf": {
        Execute: (target, data, damage, user) => {
                
            const status: BattleUnitBuf = {
                typeId: data.id,
                source: user,
                Owner: target,
                stack: data.stack,
                count: data.count
            };
            target.bufList.AddBuf(data.id, status);
        }
    },
    "AddBuf": {
        Execute: (target, data, damage, user) => {
                
            const status: BattleUnitBuf = {
                typeId: data.id,
                source: user,
                Owner: target,
                stack: data.stack,
                count: 0 // 대부분의 버프는 횟수가 없음 ㅇㅇ
            };
            target.bufList.AddBuf(data.id, status);
        }
    }
}