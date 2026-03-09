import { Character } from "./00_0_sinner.js";
import type { Skill } from "../01_Skill/01_0_skill.js";
import type { Coin } from "../02_Coin/02_0_coin.js";

export function calculateDamage(attacker: Character, target: Character, atkSkill: Skill, atkCoin: Coin, basePower: number, clashCnt: number) : number
{
    let resistP = target.Stats.resistP[atkCoin.Type]!;
    let resistS = target.Stats.resistS[atkCoin.Color]!;
    if (resistP)
        resistP = (resistP < 1) ? 1-resistP/2 : resistP; // 내성이 1보다 작다면 절반만 적용된다 ex: -0.5 -> -0.25 -> 실적용 75%만 
    if (resistS)
        resistS = (resistS < 1) ? 1-resistS/2 : resistS;

    let Rmultiplier = 1; // 이게 기본식임
    Rmultiplier += (resistP!+resistS! - 2);
    Rmultiplier += attacker.bufList.IsCritical();
        let aL = attacker.Stats.lv + attacker.bufList.GetAtkLvBonus() + (atkSkill.AtkLv ?? 0);
        let dL = target.Stats.lv + target.Stats.Get('Def') + target.bufList.GetDefLvBonus();
    Rmultiplier += ((aL - dL) / 25 + Math.abs(aL - dL));
    Rmultiplier += clashCnt * 0.03;
    Rmultiplier = Math.floor(Rmultiplier); // 구간이 나뉘었다고 하니 일단은 여기서 절댓값 처리
    console.log(`[calculateDamage]: 내성 배율: ${Rmultiplier}`);

    let Bmultiplier = 0
    Bmultiplier += attacker.bufList.GetDamageMultiplier() - target.bufList.GetDamageReduction(); 
    console.log(`[calculateDamage]: 버프 배율: ${Bmultiplier}`);
    let Smultiplier = 0;
    console.log(`[calculateDamage]: 스킬/코인 배율: ${Smultiplier}`);
    let Pmultiplier = 0;
    console.log(`[calculateDamage]: 패시브 배율: ${Pmultiplier}`);

    let ex = 0;
    
    // (basePower + basePower*multiplier) = basePower(1+multiplier)
    let damage = Math.floor((basePower * (1 + Bmultiplier + Smultiplier + Pmultiplier) + ex ) * Rmultiplier); // 아 그랬지 1을 나중에 더하네
    console.log(`[calculateDamage]: 피해량: ${damage}`);
    if (damage <= 0) damage = 1;
    return damage;
}