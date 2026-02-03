import type { BattleUnitBuf } from "./03_battleUnitBufs.js";

export class BattleUnitBufList 
{
    private BufList: Map<string, BattleUnitBuf> = new Map(); // add, get 이런건 함수로 만들자고요
    addBuf(Id: string, data: BattleUnitBuf) : void
    {
        this.BufList.set(Id, data);
    }

    hasKeywordBuf(keyword: string): boolean
    {
        return this.BufList.has(keyword);
    }
    getKeywordBufStack(keyword: string): number | void
    {
        return this.BufList.get(keyword)?.stack;
    }
    getKeywordBufCount(keyword: string): number | void
    {
        return this.BufList.get(keyword)?.count;
    }

}