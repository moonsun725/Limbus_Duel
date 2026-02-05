import type { Character } from "./00_0_sinner.js";
import { type BattleUnitBuf, BufRegistry } from "./04_battleUnitBufs.js";


export class BattleUnitBufList 
{
    private owner: Character
    private BufList: Map<string, BattleUnitBuf> = new Map(); // add, get 이런건 함수로 만들자고요

    constructor(owner: Character)
    {
        this.owner = owner;
    }

    AddBuf(Id: string, data: BattleUnitBuf) : void
    {
        // 그냥 set만 쓰면 키가 중복될 때 갱신됨.
        this.BufList.set(Id, data);
    }
    Show() : void
    {
        console.log("버프 리스트:");
        this.BufList.forEach(element => {
            console.log("부여된 버프", element.typeId, "위력", element.stack, "횟수", element.count);
        });
    }
    OnHit(attacker?: Character, damage?: number)
    {
        for (const [id, status] of this.BufList) {
            const logic = BufRegistry[id];
            console.log(id);
            
            console.log(`[CheckOnHit]: `);
            if (logic && logic.OnBeingHit) {
                logic.OnBeingHit(this.owner, status, attacker, damage);
            }
        }
    }
    ActivateKeywordBuf(keyword: string) : void
    {
        
    }
    AddKeyWordBuf(keyword: string, data: BattleUnitBuf) : void // keywordBuf는 위력, 횟수 모두 무조건 존재하므로
    {
        if(this.hasBuf(keyword))
        {
            if (data.stack)
                this.BufList.get(keyword)!.stack += data.stack;
            if (data.count)
                this.BufList.get(keyword)!.count! += data.count
        }
        else    
        {

            if (!data.stack) data.stack = 1;
            if (!data.count) data.count = 1; 
            else if (data.stack) data.count++; 
            this.BufList.set(keyword, data);
        }
    }

    hasBuf(BufId: string): boolean // 버프 아이디로 직접 대조해서 찾기
    {
        return this.BufList.has(BufId);
    }
    hasKeywordBuf(KeywordBuf: string) : boolean // 얘는 특수 키워드도 찾는거라서 좀 달라
    {
        let res = false
        this.BufList.forEach(element => {
            if (element.keyword === KeywordBuf) res = true;
        });
        return res;
    }
    getKeywordBufStack(keyword: string): number | void
    {
        return this.BufList.get(keyword)?.stack;
    }
    getKeywordBufCount(keyword: string): number | void | null
    {
        return this.BufList.get(keyword)?.count;
    }
    
}