import type { Character } from "./00_0_sinner.js";
import { type BattleUnitBuf, BufRegistry } from "../05_Ability/04_battleUnitBufs.js";


export class BattleUnitBufList 
{
    private owner: Character
    private BufList: Map<string, BattleUnitBuf> = new Map(); // add, get 이런건 함수로 만들자고요
    private ReadyBufList: Map<string, BattleUnitBuf> = new Map(); // 더미로 만들었다고

    constructor(owner: Character)
    {
        this.owner = owner;
    }
    // 부여/해제
    AddBuf(Id: string, data: BattleUnitBuf) : void
    {
        // 그냥 set만 쓰면 키가 중복될 때 갱신됨.
        this.BufList.set(Id, data);
        const logic = BufRegistry[Id]
        if (logic)
            logic.OnAddBuf(this.owner, data);
    }
    AddBufNextTurn(Id: string, data: BattleUnitBuf) : void
    {
        this.ReadyBufList.set(Id, data);
        const logic = BufRegistry[Id]
        if (logic)
            logic.OnAddBuf(this.owner, data);
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
            const logic = BufRegistry[keyword]
            if (logic)
                logic.OnAddBuf(this.owner, data);
        }
    }
    RemoveBuf(id: string) {
        if (this.BufList.delete(id)) {
            console.log(`✨ ${this.owner.name}의 [${id}] 상태 해제`);
        }
    }
    Show() : void
    {
        console.log("버프 리스트:");
        this.BufList.forEach(element => {
            console.log("부여된 버프", element.typeId, "위력", element.stack, "횟수", element.count);
        });
    }

    // 존재 여부 확인
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

    // 이벤트
    OnTurnEnd() : void
    {
        // 1. 버프리스트에서 TurnEnd인 친구들은 먼저 처리한다
        // 2. 횟수나 위력이 0인 버프들은 날린다
        // 3. readyBufList에 있는 친구들을 옮겨온다
    }
    OnTurnStart() : void 
    {
        // 1. 버프리스트에서 TurnStart인 친구들은 먼저 처리한다
        // 나머진 모르겠음
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
    OnCoinToss()
    {
        for (const [id, status] of this.BufList) {
            const logic = BufRegistry[id];
            console.log(id);
            console.log(`[CheckOnToss]: `);
            if (logic && logic.OnCoinToss) {
                logic.OnCoinToss(this.owner, status);
            }
        }
    }
    IsCritical() : number
    {
        if (this.hasBuf("Poise"))
        {
            const logic = BufRegistry["Poise"];
            if (logic && logic.IsCritical) {
                if(logic.IsCritical(this.owner, this.BufList.get("Poise")))
                    return 0.2;
            }
        }
        
        return 0;
    }
    GetDamageMultiplier() : number
    {
        let Bmultipler = 0;
        for (const [id, status] of this.BufList) {
            const logic = BufRegistry[id];
            console.log(id);
            console.log(`[BufList]/[GetDamageMultiplier]: `);
            if (logic && logic.GetDamageMultiplier) {
                Bmultipler += logic.GetDamageMultiplier(this.owner, status);
            }
        }
        return Bmultipler;
    }

    GetDamageReduction() : number
    {
        let Bmultipler = 0;
        for (const [id, status] of this.BufList) {
            const logic = BufRegistry[id];
            console.log(id);
            console.log(`[BufList]/[GetGetDamageReduction]: `);
            if (logic && logic.GetDamageReductionRate) {
                Bmultipler += logic.GetDamageReductionRate(this.owner, status);
            }
        }
        return Bmultipler;
    }

}