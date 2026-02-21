import { Character } from '../00_Sinner/00_0_sinner.js';
import { BattleSlot } from '../00_Sinner/00_4_Slot.js'; // 슬롯이 있어야한다고 생각했는데 왜그러더라 아 정렬해야지


export class Player {
    public id: string;           // 플레이어 이름 or ID
    public party: Character[];     // 파티 (최대 12마리)
    public battleEntry: Character[] = []; // 현재 필드에 나와있는 아군들 (포인터 역할)
    public entrySlots: BattleSlot[] = []; // 룸에서 하기에는 좀 복잡해지니 여기에서 속도 정렬해야됨
    // public EGOresource: Map<string,number>; 나중에 string은 유니온 자료형 따로 만들어서 넣고 ㅇㅇ
    private count = 0;

    constructor(id: string, entry: Character[]) {
        this.id = id;
        
        // 1. 엔트리 복사 (Deep Copy 권장, 일단은 그냥 할당)
        this.party = entry;

        // 2. 선봉 설정 (배열의 0번째가 선봉)
        if (this.party.length > 0) {
            for (var i = 0; i < 6; i++) // 일단은 6마리 고정으로 돌리는건데 
            {
                this.battleEntry.push(this.party[i]!); // 임시처리해둠
                this.entrySlots.push(this.party[i]!.Slots[0]!) // 얘도 임시처리해둠
                console.log(`[System] ${this.id}의 전투 인원: ${this.battleEntry[i]!.name}`);
            }; // >< 임시처리
            
        } else {
            throw new Error("수감자 엔트리가 비어 있습니다!");
        }
    }

    // 턴 관리, 
    endTurn()
    {
        // 죽은 애가 있다면 이때 보충

        // 슬롯 모자라면 채우기
        this.battleEntry.forEach(member => { // 
            // member.OnEndTurn();
            if (this.entrySlots.length < 6)
            {
                // 제일 앞번호부터 슬롯 늘리기
                let index = member.AddSlot(); // 멤버는 슬롯 늘리고 몇번째 인덱스인지 반환
                this.entrySlots.push(member.Slots[index]!); // 추가된 슬롯도 넣고 돌려야 함
            }   
        });
    }
    startTurn()
    {
        this.entrySlots.sort((a, b) => a.speed - b.speed); // 정렬을 합니다
    }

    // 연전 교체(슬롯 늘리는거보다 얘가 쉬운듯) ㅇㅇ
    switchCharacter(deadindex: number): boolean {
        const target = this.party[6 + this.count]; // 인덱스 6부터 파티 7번이니까
        if (!target) return false;
        if (target.Stats.hp <= 0) return false;

        this.count++;
        
        this.battleEntry[deadindex] = target;
        
        return true;
    }

    // 패배 체크 (파티 죽은 인원 확인)
    isDefeated(): boolean {
        // 죽은 캐릭이 3인 이상이면 패배
        return this.count >= 3;
    }

}