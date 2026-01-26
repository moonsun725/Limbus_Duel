import { Character, createSinnerFromData, } from './00_sinner.js'
import { type Skill, CoinToss } from './01_skill.js';
import { type Coin } from './02_coin.js';

import SkillData from '../../Data_WIP/Skills.json' with { type: 'json' };

const yisang : Character = createSinnerFromData(10101);
const faust : Character = createSinnerFromData(10201);

yisang.addSkill(SkillData.dataList[0]!);
faust.addSkill(SkillData.dataList[1]!);

yisang.sp = 45;

yisang.Show();
faust.Show();

yisang.ShowHp();
faust.ShowHp();
Clash(yisang, faust, yisang.Skills[0]!, faust.Skills[0]!)

yisang.ShowHp();
faust.ShowHp();



// 시부레 1대1 기본로직은 끝이다 시벌거
export function Clash(ch1: Character, ch2: Character, sk1: Skill, sk2: Skill) : void {
    let sk1cpy = [...sk1.coinlist]; // 얕복이라 sk1cpy.xxx 수정하면 sk1이 바뀌어버린다
    let sk2cpy = [...sk2.coinlist]; 

    let winner: Character;
    let target: Character;
    let winnerskill: Skill;
    let coinlist: Coin[];

    do
    {
        console.log(`[Clash]: 스킬명: ${sk1.name}`);
        let resP1 = CoinToss(sk1cpy, ch1.sp) + sk1.BasePower;
        console.log(`[Clash]: 스킬위력: ${resP1}`);
        
        console.log(`[Clash]: 스킬명: ${sk2.name}`);
        let resP2 = CoinToss(sk2cpy, ch2.sp) + sk2.BasePower;
        console.log(`[Clash]: 스킬위력: ${resP2}`);

        if(resP1 > resP2) sk2cpy.shift();
        else if (resP2 > resP1) sk1cpy.shift(); // 아 시발 존나 맘에안들어
        // 동률이면 다시 굴릴거니까 ㅇㅇ
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
    winner.Attack(target, winnerskill, coinlist);
}

