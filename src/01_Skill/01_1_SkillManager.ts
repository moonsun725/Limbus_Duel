import { Character } from "../00_Sinner/00_0_sinner.js";
import { type Skill } from "./01_0_skill.js";
import { GetMoves, MoveBundleRegistry } from "./01_2_ skillLoader.js";
import data_S from '../06_Data/SkillData/Skills.json' with {type: 'json'}; 

export class SkillManager 
{
    private owner : Character;
    private Skills: Skill[];

    constructor(owner: Character)
    {
        this.owner = owner;
        this.Skills = [];
        this.addSkillByID();
    }

    addSkill(skill:Skill) : void {
            this.Skills.push(skill);
            console.log(`[Sinner]/[addSkill]: ${skill.name}을 스킬 목록에 추가`);
    }
    
    addSkillByID() : void
    {
        const mySkills = GetMoves(this.owner.id);
        if (mySkills) // != undefined
            this.Skills = mySkills;
    }

    ShowSkillList() : void // 나중에 스킬도 나눠놔야지
    {
        for (var i = 0; i < 4; i++)
        {
            console.log("스킬목록", i, this.Skills[i]?.name);
        }
    }
    
    GetSkill(i: number) : Skill
    {
        if (this.Skills[i])
            return this.Skills[i]; 
        return data_S.dataList[0] as Skill;
    }
}