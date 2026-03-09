import type { Character } from "../00_Sinner/00_0_sinner.js";
import type { KeyWords } from "./04_battleUnitBufs.js"; // >< 이거는 나중에 아예 목록으로 빼놓읍시다. 맵의 키로 사용하면 될듯 ㅇㅇ
export interface CheckLogic 
{
    CheckBuf?() : boolean | number; // 쪼갤까?
    CheckSpeed?() : boolean;
    CheckHpRate?() : boolean;
    CanConsume?(owner: Character, data: any) : boolean;
    /*
        들어오는 데이터가 이렇게 생겨야 함
        {
            targetBuf:
            stack?:
            count?:
        }
    */
    Random?(): boolean;
}

export const CondRegistry: { [key: string]: CheckLogic } = {
    "Wdon": { // 일단 프로토타입
        CanConsume:(owner, data) => {
            
            let count = owner.bufList.getKeywordBufCount('charge');
            if (!count) return false;
            return !(count < 10);
        },
    },
    "ConsumeCount": { // 횟수 소모 가능한지 여부
        CanConsume:(owner, data) => {
            
            const targetBuf = data.keywordBuf;
            const cp = data.count;
            let count = owner.bufList.getKeywordBufCount(targetBuf);
            if (!count) return false;
            return count >= cp;
        },
    }
}