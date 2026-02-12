import { Character, createSinnerFromData, type Iskill } from '../00_Sinner/00_0_sinner.js'
import { Clash } from './000_TEST.js';
import { LoadSkillData } from '../01_Skill/01_2_ skillLoader.js';

LoadSkillData();
const yisang : Character = createSinnerFromData(10101);
const faust : Character = createSinnerFromData(10201);


let skillPanel1: Iskill = yisang.deck[0]!;
let skillPanel2: Iskill = yisang.deck[1]!;

for (var i = 0; i < 6; i++)
{
    console.log(skillPanel2.skill.name, skillPanel2.owner.name);

    yisang.useSkill(0);

    skillPanel2 = yisang.deck[1]!; // 갱신
}