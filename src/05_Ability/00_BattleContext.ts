import { Character } from "../00_Sinner/00_0_sinner.js";
import type { Skill, SkillAbility } from "../01_Skill/01_0_skill.js" ;
import type { CoinAbility } from "../02_Coin/02_0_coin.js";

export interface BattleContext {
    user: Character;
    target: Character;
    skill?: Skill;
    damage?: number;
}

export function handleTargets(context: BattleContext, data: SkillAbility | CoinAbility) : Character 
{
    switch (data.target) 
    {
        case 'self':
            return context.user;
        case 'opponent':
            return context.target;
        default: 
            console.warn(`[handleTargets] 알 수 없는 타겟 타입: ${data.target}. 기본값(target) 적용.`);
            return context.target;
    }
}