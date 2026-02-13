import { Character } from "../00_Sinner/00_0_sinner.js";
import { type Skill, CoinToss } from "../01_Skill/01_0_skill.js";

export function Clash(ch1: Character, ch2: Character, sk1: Skill, sk2: Skill) : void {
    let sk1cpy = [...sk1.coinlist]; // 얕복이라 sk1cpy.xxx 수정하면 sk1이 바뀌어버린다
    let sk2cpy = [...sk2.coinlist]; 
    let clashLimit = 99;

    do
    {
        console.log(`[Clash]: 스킬명: ${sk1.name}`);
        let resP1 = CoinToss(sk1cpy, ch1.Stats.sp) + sk1.BasePower;
        console.log(`[Clash]: 스킬위력: ${resP1}`);
        
        console.log(`[Clash]: 스킬명: ${sk2.name}`);
        let resP2 = CoinToss(sk2cpy, ch2.Stats.sp) + sk2.BasePower;
        console.log(`[Clash]: 스킬위력: ${resP2}`);

        // 동률이면 다시 굴릴거니까 ㅇㅇ
        ch1.parrycnt++;
        ch2.parrycnt++;
        
        ch1.bufList.OnCoinToss();
        ch2.bufList.OnCoinToss();

        console.log(`[Clash]: ${ch1.parrycnt}합`); 
        console.log(`[Clash]: ${ch2.parrycnt}합`);

        if (resP1 === resP2) continue; // 동률이면 아래 생략하고 다음 루프

        const loserCoins = resP1 > resP2 ? sk2cpy : sk1cpy;
        loserCoins.shift();
    }
    while(sk1cpy.length > 0 && sk2cpy.length > 0 && --clashLimit > 0) // 혹시 모르니까 무한루프 방지용 안전장치

    if (clashLimit <= 0) {
        console.log(`[Clash]: 무한 루프 방지 장치 발동! 강제 종료.`);
        return;
    }
    
    // 객체로 짜는 게 나은가
    const [winner, target, winnerSkill, remainingCoins] = sk1cpy.length > 0 ? [ch1, ch2, sk1, sk1cpy] : [ch2, ch1, sk2, sk2cpy];

    console.log(`[합 결과]: ${winner.name} 승리, ${target.name} 패배`);
    winner.BattleState.ChangeState('CLASHWIN');
    target.BattleState.ChangeState('CLASHLOSE');
    winner.Attack(target, winnerSkill, remainingCoins);
    
    // 임시 코드
    target.consumeSkill();
}