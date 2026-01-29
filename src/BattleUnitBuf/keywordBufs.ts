import type { BattleUnitBuf } from "./BattleUnitBuf.js";
/*
    의사코드
    KeywordBufX() : void
    {
        if (!스킬.코인.KeywordBuf)
        {
            // 위력 불러오기
            // 횟수 불러오기
            // 버프 적용하기
        }   
    }

*/

// 7키워드 효과는 
export interface KeywordBuf extends BattleUnitBuf
{
    stack: number;

    count: number;
    keyword: string;
}