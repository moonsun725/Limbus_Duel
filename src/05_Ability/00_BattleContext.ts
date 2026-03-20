import { Character } from "../00_Sinner/00_0_sinner.js";
import { type Skill } from "../01_Skill/01_0_skill.js" ;

export interface BattleContext {
    user: Character;
    target: Character;
    skill?: Skill;
    damage?: number;
}