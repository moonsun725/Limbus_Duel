import { Character } from "./00_0_sinner.js";
import type { Skill } from "../01_Skill/01_0_skill.js";
import type { Coin } from "../02_Coin/02_0_coin.js";

export function calculateDamage(attacker: Character, target: Character, atkSkill: Skill, atkCoin: Coin, basePower: number) : number
{
    let resistP = target.Stats.resistP[atkCoin.Type]!;
    let resistS = target.Stats.resistS[atkCoin.Color]!;
    if (resistP)
        resistP = (resistP < 1) ? resistP/2 : resistP; // 내성이 1보다 작다면 절반을 취한다
    if (resistS)
        resistS = (resistS < 1) ? resistS/2 : resistS;

    let Rmultiplier = ((resistP!+resistS! - 2) * attacker.bufList.IsCritical() + 1); // 
    console.log(`[calculateDamage]: 내성 배율: ${Rmultiplier}`);
    let Bmultiplier = attacker.bufList.GetDamageMultiplier() - target.bufList.GetDamageReduction(); 
    console.log(`[calculateDamage]: 버프 배율: ${Bmultiplier}`);
    let Smultiplier = 0;
    console.log(`[calculateDamage]: 스킬/코인 배율: ${Smultiplier}`);
    let Pmultiplier = 0;
    console.log(`[calculateDamage]: 패시브 배율: ${Pmultiplier}`);
    let ex = 0;
    
    let damage = Math.floor((basePower * (1 + Bmultiplier + Smultiplier + Pmultiplier) + ex ) * Rmultiplier); // 아 그랬지 1을 나중에 더하네
    console.log(`[calculateDamage]: 피해량: ${damage}`);
    if (damage <= 0) damage = 1;
    return damage;
}