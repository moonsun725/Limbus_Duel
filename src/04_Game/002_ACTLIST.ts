import { Character, createSinnerFromData, type Iskill } from '../00_Sinner/00_0_sinner.js'
import { type Skill, CoinToss } from '../01_Skill/01_0_skill.js';
import { type Coin } from '../02_Coin/02_0_coin.js';
import { LoadSkillData } from '../01_Skill/01_2_ skillLoader.js';

// npx tsx src/04_Game/002_ACTLIST.ts   

LoadSkillData();
console.log("ACTLIST TEST");
const actor1 : Character = createSinnerFromData(10101);
const actor2 : Character = createSinnerFromData(10201);
const actor3: Character = createSinnerFromData(10301);

actor1.speed = 3;
actor2.speed = 2;
actor3.speed = 5;

actor1.Stats.ShowStats();
actor1.Skills.ShowSkillList();
actor2.Stats.ShowStats();
actor2.Skills.ShowSkillList();
actor3.Stats.ShowStats();  
actor3.Skills.ShowSkillList();

let YskillPanel1: Iskill = actor1.deck[0]!;
let YskillPanel2: Iskill = actor1.deck[1]!;

let FskillPanel1: Iskill = actor2.deck[0]!;
let FskillPanel2: Iskill = actor2.deck[1]!;

let DskillPanel1: Iskill = actor3.deck[0]!;
let DskillPanel2: Iskill = actor3.deck[1]!;

let ActorList = new Map<Iskill, Character>(); // Iskill에는 owner의 정보가 있음

function targetLock(target: Character, SelectedSkill: Iskill)
{
    ActorList.set(SelectedSkill, target);
}

// 뭐할거냐
/*
    1. 각각 스킬 골라서 타겟 지정(targetLock)
    2. 스피드 순으로 정렬
    3. 타겟이랑 유저랑 겹치면 속도 빠른애랑 느린애랑 합
    4. 3명이니까 1명 남을거아냐 걔는 그냥 공격
*/
targetLock(actor1, DskillPanel2);
targetLock(actor2, YskillPanel1);
targetLock(actor1, FskillPanel1);


// 정렬 (속도 내림차순)
let SortedActorList = new Map([...ActorList.entries()].sort((a, b) => b[0].owner.speed - a[0].owner.speed));

// 행동을 마친 스킬을 저장할 Set (중복 행동 방지)
let processedSkills = new Set<Iskill>();

console.log("--- 전투 페이즈 시작 ---");

let consumedSkills = new Set<Iskill>();

console.log("--- 속도 우선권 기반 전투 시작 ---");

// [2] 속도 순으로 정렬된 리스트를 순회 (가장 빠른 놈이 "먼저" 상황을 정리함)
for (let [attackerSkill, attackerTarget] of SortedActorList) {
    
    // 이미 합을 해서 소모된 스킬이면 넘어감
    if (consumedSkills.has(attackerSkill)) continue;

    console.log(`\n[Action]: ${attackerSkill.owner.name} (Speed: ${attackerSkill.owner.speed}) 행동 개시! -> 타겟: ${attackerTarget.name}`);

    // [3] 방어자(Target)가 맞대응할 스킬이 있는지 찾아봄 (합 대상 탐색)
    // 조건: 방어자가 가진 스킬 중 아직 소모되지 않은 것이 있는가?
    let defenderSkillEntry = [...SortedActorList.entries()].find(([skill, target]) => {
        return skill.owner === attackerTarget && !consumedSkills.has(skill);
    });

    if (defenderSkillEntry) {
        let [defenderSkill, defenderOriginalTarget] = defenderSkillEntry;

        // [4] 합 발생 로직
        // 방어자가 원래 다른 놈(A2)을 보고 있었어도, 공격자(A3)가 더 빨라서 먼저 때리면 
        // 방어자는 어쩔 수 없이 그 스킬로 막아야 함 (합 결정권 강탈)
        
        // (옵션: 만약 '완벽한 합(서로 타게팅)'을 우선시하고 싶다면 여기서 defenderOriginalTarget === attackerSkill.owner 체크를 추가하면 되지만,
        //  현재 질문하신 '뺏어오는' 구현을 위해 무조건 가장 빠른 공격에 반응하도록 짰습니다.)

        console.log(`>>> [INTERCEPT]: ${attackerSkill.owner.name}이(가) 속도 우위로 합을 강제합니다!`);
        console.log(`    (원래 ${defenderSkill.owner.name}은 ${defenderOriginalTarget.name}을(를) 노렸으나 저지당함)`);

        Clash(attackerSkill.owner, defenderSkill.owner, attackerSkill.skill, defenderSkill.skill);

        // 두 스킬 모두 소모 처리
        consumedSkills.add(attackerSkill);
        consumedSkills.add(defenderSkill);

    } else {
        // [5] 일방 공격 (One-sided Attack)
        // 방어자가 이미 다른 빠른 놈이랑 합하느라 스킬을 다 썼거나, 애초에 스킬이 없을 때
        console.log(`>>> [ONE-SIDED]: ${attackerSkill.owner.name}의 일방 공격! (대상 ${attackerTarget.name}은 대응 불가)`);
        
        attackerSkill.owner.Attack(attackerTarget, attackerSkill.skill, attackerSkill.skill.coinlist);
        
        // 공격자 스킬만 소모 처리
        consumedSkills.add(attackerSkill);
    }
}


export function Clash(ch1: Character, ch2: Character, sk1: Skill, sk2: Skill) : void {
    let sk1cpy = [...sk1.coinlist]; // 얕복이라 sk1cpy.xxx 수정하면 sk1이 바뀌어버린다
    let sk2cpy = [...sk2.coinlist]; 

    let winner: Character;
    let target: Character;
    let winnerskill: Skill;
    let coinlist: Coin[];
    let clashLimit = 99;

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
    while(sk1cpy.length !== 0 && sk2cpy.length !== 0 && --clashLimit > 0) // 혹시 모르니까 무한루프 방지용 안전장치

    if (clashLimit <= 0) {
        console.log(`[Clash]: 무한 루프 방지 장치 발동! 강제 종료.`);
        return;
    }
    
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