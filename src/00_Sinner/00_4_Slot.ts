import { Character } from './00_0_sinner.js';
import { type Skill } from '../01_Skill/01_0_skill.js';
import { type Coin } from '../02_Coin/02_0_coin.js';
import { calculateDamage } from './00_7_dmgCalc.js';
import { ProcessCoinEffects } from '../02_Coin/02_1_coinAbilityLogic.js';
import { ProcessMoveEffects } from '../01_Skill/01_3_skillAbilityLogic.js';

export class BattleSlot {
    // 읽기 전용으로 설정하여 원본 교체 방지
    readonly owner: Character;
    public speed: number; 
    public deckIndex: number;
    readySkill?: Readonly<Skill> | null; // 재할당은 가능하지만 내부 속성은 변경 불가하게 함.

    constructor(owner: Character, skill: Skill, deckIndex: number) {
        this.owner = owner;
        this.readySkill = skill;
        this.speed = owner.speed; // 현재는 캐릭터 속도를 따라감
        this.deckIndex = deckIndex
    }

    targetLock(SelectedSkill: Skill, skillIndex: number)
    {
        this.readySkill = SelectedSkill;
        this.deckIndex = skillIndex; // 0 또는 1이 저장됨
    }
    consumeSkill()
    {
        this.readySkill = null;
    }
}