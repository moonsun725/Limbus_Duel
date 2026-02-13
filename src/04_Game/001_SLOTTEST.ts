import { Character, createSinnerFromData } from '../00_Sinner/00_0_sinner.js'
import { Clash } from './000_TEST.js';
import { LoadSkillData } from '../01_Skill/01_2_ skillLoader.js';
import type { Skill } from '../01_Skill/01_0_skill.js';
// npx tsx src/04_Game/001_SLOTTEST.ts
LoadSkillData();
const yisang : Character = createSinnerFromData(10101);
const faust : Character = createSinnerFromData(10201);


let skillPanel1: Skill = yisang.deck[0]!;
let skillPanel2: Skill = yisang.deck[1]!;

for (var i = 0; i < 6; i++)
{
    console.log(skillPanel2.name, skillPanel2.name);

    yisang.useSkill(0);

    skillPanel2 = yisang.deck[1]!; // 갱신
}