import { Character } from './00_0_sinner.js';
import { type Skill } from '../01_Skill/01_0_skill.js';

export class BattleSlot {
    // 읽기 전용으로 설정하여 원본 교체 방지
    readonly owner: Character;
    public id: number;
    public speed: number; 
    public deckIndex?: 0|1; // 스킬패널 번호: 0 or 1
    readySkill: Readonly<Skill> | null = null; // 재할당은 가능하지만 내부 속성은 변경 불가하게 함.
    targetSlot?: BattleSlot | null;

    constructor(owner: Character) {
        this.owner = owner;
        this.speed = owner.speed; // 현재는 캐릭터 속도를 따라감
        this.id = Math.random() + owner.id; // 이러면 겹칠리는 없겠지
    }

    skillSelect(SelectedSkill: Skill, skillIndex: 0|1)
    {
        this.readySkill = SelectedSkill; // 덮어쓴다
        this.deckIndex = skillIndex; // 0 또는 1이 저장됨
    }

    forcedTarget(attacker: BattleSlot)
    {
        console.log(this.owner.name, "의", this.targetSlot?.owner.name, "이/가", attacker.owner.name, "에게 강제 타겟팅 당함");
        this.targetSlot = attacker;
    }

    consumeSkill()
    {
        console.log(`${this.owner.name}의 스킬 ${this.readySkill!.name} 소모, 인덱스: ${this.deckIndex}`);
        this.readySkill = null;
        if (this.deckIndex !== undefined) // 이게 생각해보니까 0이면 if문에서 false로 취급을 하잖음 그래서 안된 거네
            this.owner.useSkill(this.deckIndex);
    }

    updateState()
    {
        this.speed = this.owner.speed;
        this.readySkill = null;
        this.targetSlot = null;
    }
}