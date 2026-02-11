import { Character } from "../00_Sinner/00_0_sinner.js";
import { type Skill, CoinToss } from "../01_Skill/01_0_skill.js";
import type { Coin } from "../02_Coin/02_0_coin.js";
export class ActManager
{
    // 들어가야 할 거: 합, 공격-가드, 공격-회피, 공격-반격
    Clash(ch1: Character, ch2: Character, sk1: Skill, sk2: Skill) : void {
        let sk1cpy = [...sk1.coinlist]; // 얕은 복사라 sk1cpy.xxx 수정하면 sk1이 바뀌어버린다
        let sk2cpy = [...sk2.coinlist]; 
    
        let winner: Character;
        let target: Character;
        let winnerskill: Skill;
        let coinlist: Coin[];
    
        do
        {
            console.log(`[Clash]: 스킬명: ${sk1.name}`);
            let resP1 = CoinToss(sk1cpy, ch1.Stats.sp) + sk1.BasePower;
            console.log(`[Clash]: 스킬위력: ${resP1}`);
            
            console.log(`[Clash]: 스킬명: ${sk2.name}`);
            let resP2 = CoinToss(sk2cpy, ch2.Stats.sp) + sk2.BasePower;
            console.log(`[Clash]: 스킬위력: ${resP2}`);
    
            if(resP1 > resP2) sk2cpy.shift(); 
            else if (resP2 > resP1) sk1cpy.shift(); // 아 시발 존나 맘에안들어
            // 동률이면 다시 굴릴거니까 ㅇㅇ
            ch1.parrycnt++;
            ch2.parrycnt++;
            ch1.bufList.OnCoinToss();
            ch2.bufList.OnCoinToss();
            console.log(`[Clash]: ${ch1.parrycnt}합`);
            console.log(`[Clash]: ${ch2.parrycnt}합`);
        }
        while(sk1cpy.length !== 0 && sk2cpy.length !== 0)
    
        if (sk1cpy.length > sk2cpy.length)
        {
            winner = ch1;
            target = ch2;
            winnerskill = sk1;
            coinlist = sk1cpy;
        }
        else // 계산 순서상 길이가 같을 리는 없다
        {
            winner = ch2;
            target = ch1;
            winnerskill = sk2;
            coinlist = sk2cpy;
        }
        console.log(`[합 결과]: ${winner.name} 승리, ${target.name} 패배`);
        winner.BattleState.ChangeState('CLASHWIN');
        target.BattleState.ChangeState('CLASHLOSE');
        winner.Attack(target, winnerskill, coinlist);
    }

    withGuard()
    {

    }
    withEvasion()
    {

    }
    withCounter()
    {
        
    }
}