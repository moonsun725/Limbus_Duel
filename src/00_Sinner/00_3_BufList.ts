import type { Character } from "./00_0_sinner.js";
import { type BattleUnitBuf, type StatModifier, BufRegistry } from "../05_Ability/04_battleUnitBufs.js";
import type { BattleContext } from "../05_Ability/00_BattleContext.js";

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
    // AddBufNextTurn도 마찬가지로 깔끔하게 예약만 하도록 수정
    AddBufNextTurn(Id: string, data: BattleUnitBuf) : void
    {
        this.ReadyBufList.set(Id, data);
    }
    AddKeyWordBuf(keyword: string, data: BattleUnitBuf) : void // keywordBuf는 위력, 횟수 모두 무조건 존재하므로
    {
        if(this.hasBuf(keyword))
        {
            if (data.stack)
                this.BufList.get(keyword)!.stack += data.stack;
            if (data.count)
                this.BufList.get(keyword)!.count! += data.count;
        }
        else    
        {
            if (!data.stack) data.stack = 1; // 버프가 없는 상태에서 [출혈 횟수 1 부여] 효과 받음 -> 위력은 1로 고정
            if (!data.count) data.count = 1; // 버프가 없는 상태에서 [출혈 1 부여] 효과 받음 -> 횟수는 1로 고정

            else if (data.stack) data.count++; 
            this.BufList.set(keyword, data);
            const logic = BufRegistry[keyword];
            if (logic)
                logic.OnAddBuf(this.owner, data);
        }
    }
    AddKeyWordBufNextTurn(keyword: string, data: BattleUnitBuf) : void 
    {
        // 1. 이미 예약 목록에 같은 키워드가 있다면 수치만 누적
        if (this.ReadyBufList.has(keyword)) {
            const existing = this.ReadyBufList.get(keyword)!;
            if (data.stack) existing.stack += data.stack;
            if (data.count) existing.count! += data.count;
        } 
        // 2. 없다면 새로 예약 목록에 등록
        else {
            this.ReadyBufList.set(keyword, data);
        }
        console.log(`[BufList] 다음 턴 ${keyword} 버프 예약 됨`);
    }

    
    RemoveBuf(id: string) {
        if (this.BufList.delete(id)) {
            console.log(`✨ ${this.owner.name}의 [${id}] 상태 해제`);
        }
        else console.log("제거 실패");
    }
    Show() : void
    {
        console.log("버프 리스트:");
        this.BufList.forEach(element => {
            console.log("부여된 버프", element.typeId, "위력", element.stack, "횟수", element.count);
        });
        console.log("다음 턴 버프 리스트:");
        this.ReadyBufList.forEach(element =>{
            console.log("부여된 버프", element.typeId, "위력", element.stack, "횟수", element.count);
        })

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
        console.log('[BufList]/[OnTurnEnd]: 실행');
        // 1. 버프리스트에서 TurnEnd가 있는 친구들은 먼저 처리한다
        for (const [id, status] of this.BufList) {
            const logic = BufRegistry[id];
            if (logic && logic.OnTurnEnd) {
                logic.OnTurnEnd(this.owner, status);
            }
        }
        
        // 2. 횟수나 위력이 0인 버프들은 날린다
        for (const [id, status] of this.BufList) {
            console.log(`[BufList]/[OnTurnEnd]: ${status.Owner.name}, ${status.typeId}, ${id}, ${status.stack}, ${status.count}, ${status.count != null && status.count <= 0} `)
            if (status.count != null && status.count <= 0) {
                console.log("버프 제거");
                this.RemoveBuf(id);
            }
        }
    }
    OnTurnStart() : void 
    {
        // ==========================================
        // 1. 다음 턴 버프(ReadyBufList) 이사 및 병합
        // ==========================================
        for (const [id, nextStatus] of this.ReadyBufList) {
            
            if (nextStatus.keyword) {
                // 키워드 버프는 위력/횟수 합산 규칙이 복잡하므로 기존에 잘 만들어둔 함수 재활용!
                this.AddKeyWordBuf(nextStatus.keyword, nextStatus); // 그렇네 이게 있구나
            } else {
                // 일반 버프 처리 (예: 취약, 보호 등)
                if (this.BufList.has(id)) {
                    // 이미 본 리스트에 있다면 스택 합산 (기획에 따라 덮어쓰려면 += 대신 = 사용)
                    this.BufList.get(id)!.stack += nextStatus.stack;
                } else {
                    // 없다면 새로 등록하고 OnAddBuf(부여 시 효과) 발동!
                    this.BufList.set(id, nextStatus);
                    const logic = BufRegistry[id];
                    if (logic && logic.OnAddBuf) {
                        logic.OnAddBuf(this.owner, nextStatus);
                    }
                }
            }
        }

        // 병합이 끝났으니 예약 바구니는 깨끗하게 비워줍니다!
        this.ReadyBufList.clear();

        // ==========================================
        // 2. 턴 시작 효과 발동
        // ==========================================
        for (const [id, status] of this.BufList) {
            const logic = BufRegistry[id];
            if (logic && logic.OnTurnStart) {
                logic.OnTurnStart(this.owner, status);    
            }
        }
    }
    OnHit(attacker?: Character, damage?: number)
    {
        for (const [id, status] of this.BufList) {
            const logic = BufRegistry[id];

            console.log(`[BufList]/[CheckOnHit]: `, id);
            if (logic && logic.OnBeingHit) {
                logic.OnBeingHit(this.owner, status, attacker, damage);
            }
        }
    }
    OnCoinToss()
    {
        for (const [id, status] of this.BufList) {
            const logic = BufRegistry[id];
            console.log(`[BufList]/[CheckOnToss]: `, id);
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
    TremorBurst(amount?: number) 
    {
        for (const [id, status] of this.BufList) {
            // 너 일단은 보류야 
        }

        if (this.hasBuf("Tremor"))
        {
            const logic = BufRegistry["Tremor"];
            if (logic && logic.Activate) {
                logic.Activate(this.owner, this.BufList.get("Tremor")); // 나중에 진동 - XXX 이거는 어떻게 처리해야되나 
                if (logic.UseCount && amount)
                    logic.UseCount(this.owner, this.BufList.get("Tremor"), amount);
            }
        }
    }

    GetCombinedModifier(context?: BattleContext): StatModifier 
    {
        // 1. 깨끗한 일회용 바구니(Modifier) 준비
        const modifier: StatModifier = {
            damageMultiplier: 0,
            damageReductionRate: 0,

            powerBonus: 0,
            clashPowerBonus: 0,
            finalPowerBonus: 0,
            atkPowerBonus: 0,
            defPowerBonus: 0,
            coinPowerBonus: 0,
            coinPowerBonus_P: 0,
            coinPowerBonus_M: 0,
            
            atkLvBonus: 0,
            defLvBonus: 0,

            speedBoost: 0,
            minspeedBonus: 0,
            maxspeedBonus: 0
        };

        // 2. 버프 리스트를 단 *한 번만* 순회합니다.
        for (const [id, status] of this.BufList) {
            const logic = BufRegistry[id];
            
            // 디버깅용 로그도 여기서 한 번만 찍으면 훨씬 깔끔합니다.
            // console.log(`[BufList]/[GetCombinedModifier]: 계산 중인 버프 - ${id}`);
            
            if (logic && logic.OnModifyStats) {
                // 버프 로직에게 바구니를 넘겨주고 알아서 수치를 담으라고 위임
                logic.OnModifyStats(this.owner, status, modifier, context);
            }
        }

        // 3. 모든 버프의 계산이 끝난 완성된 바구니 반환
        return modifier;
    }

}