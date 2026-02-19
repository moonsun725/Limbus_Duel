import { Character } from './00_0_sinner.js';
import { type Skill } from '../01_Skill/01_0_skill.js';
import { type Coin } from '../02_Coin/02_0_coin.js';
import { calculateDamage } from './00_7_dmgCalc.js';
import { ProcessCoinEffects } from '../02_Coin/02_1_coinAbilityLogic.js';
import { ProcessMoveEffects } from '../01_Skill/01_3_skillAbilityLogic.js';

export class BattleSlot {
    // 읽기 전용으로 설정하여 원본 교체 방지
    readonly owner: Character;
    public id: number;
    public speed: number; 
    public deckIndex?: 0|1; // 스킬패널 번호: 0 or 1
    readySkill?: Readonly<Skill> | null = null; // 재할당은 가능하지만 내부 속성은 변경 불가하게 함.
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
        this.targetSlot = attacker;
    }

    consumeSkill()
    {
        this.readySkill = null;
        if (this.deckIndex)
            this.owner.useSkill(this.deckIndex)
    }

    updateState()
    {
        this.speed = this.owner.speed;
        this.readySkill = null;
        this.targetSlot = null;
    }
}