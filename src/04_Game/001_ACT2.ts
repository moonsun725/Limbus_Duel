import { BattleManager } from "../03_BattleSystem/BattleManager.js";
import { ActManager } from "../03_BattleSystem/ActManager.js";
import { BattleSlot } from "../00_Sinner/00_4_Slot.js";
import { Character, createSinnerFromData } from "../00_Sinner/00_0_sinner.js";
import { LoadSkillData } from "../01_Skill/01_2_ skillLoader.js";

// npx tsx src/04_Game/001_ACT2.ts
LoadSkillData();
console.log("ACTLIST TEST");
let TestManager = new ActManager();
const actor1 : Character = createSinnerFromData(10101);
const actor2 : Character = createSinnerFromData(10201);
const actor3: Character = createSinnerFromData(10301);

let lockOrder: number = 0;
let turnOrder: BattleSlot[] = [];

actor1.speed = 2;
actor2.speed = 3;
actor3.speed = 5;

actor1.Stats.ShowStats();
actor1.Skills.ShowSkillList();
actor2.Stats.ShowStats();
actor2.Skills.ShowSkillList();
actor3.Stats.ShowStats();  
actor3.Skills.ShowSkillList();

TestManager.SkillSelect(actor1, 0);
TestManager.TargetLock(actor1,actor2);


TestManager.SkillSelect(actor2, 0);
TestManager.TargetLock(actor2, actor1);

TestManager.SkillSelect(actor3, 0);
TestManager.TargetLock(actor3, actor1);

TestManager.orderSort();
await TestManager.StartCombat();
