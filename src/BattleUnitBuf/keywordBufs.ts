import  { BattleUnitBuf } from "./BattleUnitBuf.js";
import { Character } from "../Scripts/Game/00_sinner.js";
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
export abstract class KeywordBuf extends BattleUnitBuf
{

    count: number;
    keyword: string;
    
    activate(amount: number): void {
        this.owner.takeDamage(this.stack);
        this.count--;
    }
    constructor(name:string, stack:number, count: number, owner: Character, keyword: string)
    {
        super(name, stack, owner);
        this.count = count;
        this.keyword = keyword;
    }

}
