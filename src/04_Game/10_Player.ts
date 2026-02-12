import { Character } from '../00_Sinner/00_0_sinner.js';

export class Player {
    public id: string;           // 플레이어 이름 or ID
    public party: Character[];     // 소지 포켓몬 (최대 6마리)
    public battleEntry: Character[] = []; // 현재 필드에 나와있는 포켓몬 (포인터 역할)
    private count = 0;

    constructor(id: string, entry: Character[]) {
        this.id = id;
        
        // 1. 엔트리 복사 (Deep Copy 권장, 일단은 그냥 할당)
        this.party = entry;

        // 2. 선봉 설정 (배열의 0번째가 선봉)
        if (this.party.length > 0) {
            for (var i = 0; i < 6; i++)
            {
                this.battleEntry.push(this.party[i]!); // 임시처리해둠
                console.log(`[System] ${this.id}의 전투 인원: ${this.battleEntry[i]!.name}`);
            }; // >< 임시처리
            
        } else {
            throw new Error("수감자 엔트리가 비어 있습니다!");
        }
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