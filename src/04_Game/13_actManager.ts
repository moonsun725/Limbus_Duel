import { Character } from "../00_Sinner/00_0_sinner.js";
import { type Skill, CoinToss } from "../01_Skill/01_0_skill.js";
import type { Coin } from "../02_Coin/02_0_coin.js";

type Target = {
    target: Character,
    //몇번째 타깃인지
    index: number
}

export class ActManager
{
    ActorList: Map<Character, Target> = new Map();
    lockOrder: number = 0;
    turnOrder: Character[] = [];

    targetLock(user: Character, target: Character, SelectedSkill: Skill, index: number = 0) // 대상 지정하기
    {
        this.ActorList.set(user, {target: target, index: this.lockOrder}); // user가 target을 공격할거고 몇번째 타깃인지도 저장
        user.targetLock(SelectedSkill, index);
        this.lockOrder++;
    }

    orderSort()
    {
       this.turnOrder = Array.from(this.ActorList.keys()).sort((a, b) => b.speed - a.speed);
    }

    async StartCombat() // 비동기 함수
    {
        for (let user of this.turnOrder) {
            // 1. 이미 행동을 마친 경우(나보다 빠른 대상에 의해 합이 걸려왔다든지) 스킵
            if (user.readySkill === null) {
                console.log("이미 스킬 사용됨");
                continue; 
            }
        
            let uTargetInfo = this.ActorList.get(user);
            if (!uTargetInfo) 
            {
                console.log("왠진 모르겠는데 타겟이 없대");
                continue;
            }
        
            let target = uTargetInfo.target;
            if(!target || target.BattleState.GetState() === 'DEAD')
            {
                console.log("타겟 사망");
                continue;
            }
            let uSkill = user.readySkill;
            
            // 타겟이 이미 죽었거나 스킬을 다 썼으면 일방공격도 의미가 달라질 수 있으나, 
            // 여기서는 타겟의 스킬 유무로 합/일방공격을 나눔
            let tSkill = target.readySkill; 
        
            // --- [수정됨] 내가 합을 할 자격이 있는지 검증 ---
            let amIPriority = true; // 기본적으로 내가 우선순위라고 가정
            
            // 나보다 늦게 지정한(index가 큰) 경쟁자가 있는지 확인
            for (let [otherUser, oTargetInfo] of this.ActorList) {
                if (otherUser === user) continue; // 나는 제외
                if (otherUser.readySkill === null) continue; // 이미 행동한 애는 경쟁자가 아님
        
                // 같은 타겟을 노리는 경우
                if (oTargetInfo.target === target) {
                    // 상대방이 나보다 나중에 지정했다면(index가 크다면), 나는 합을 할 수 없음
                    // (림버스 시스템: 나중에 지정한 사람이 합을 가져감)
                    if (oTargetInfo.index > uTargetInfo.index) {
                        amIPriority = false;
                        break; // 나보다 센 놈 한 명만 있어도 나는 탈락이므로 여기서 break는 가능 (나의 패배 확정)
                    }
                }
            }
        
            // 2. 합(Clash) 진행 여부 결정
            // 타겟이 스킬이 있고 && 내가 타겟을 노리는 애들 중 가장 우선순위가 높고 && 합 성립 조건 만족 시
            if (tSkill && amIPriority && isClashAble(user, target, this.ActorList.get(target)?.target)) {
                console.log(`[합 발생]: ${user.name} (index: ${uTargetInfo.index}) vs ${target.name}`);
                Clash(user, target, uSkill, tSkill);
                
                // Clash 함수 내부에서 user와 target의 readySkill을 null로 만들어야 함
            } 
            // 3. 일방 공격 (우선순위에서 밀렸거나, 타겟이 스킬이 없거나 등)
            else {
                let reason = !tSkill ? "상대 스킬 없음" : (!amIPriority ? "합 권한 없음(다른 아군이 채감)" : "합 불가 조건");
                console.log(`[일방 공격]: ${user.name} -> ${target.name} (${reason})`);
                
                user.Attack(target, uSkill, uSkill.coinlist);
                user.consumeSkill(); // 행동 종료 처리
            }
        }
    }

}

// 합 가능성 따지는 거는 클래스랑 독립된 행위니까 밖으로 빼는 게 나은 것 같아
function isClashAble(user: Character, target: Character, targetTarget?: Character) : boolean 
{
    // 성립 조건
    // 1. user가 target보다 속도가 높다
    // 2. user가 target보다 속도가 낮지만, target의 공격대상이 user이다 // 하지만 이건 쌍방 블라인드 지정이라...도 존재할 수 있네?
    if (!target.readySkill) return false;
    if (user.speed > target.speed) return true;
    if (targetTarget && targetTarget === user) return true;
    return false;
}

// 합 치는 것도 마찬가지고
export async function Clash(ch1: Character, ch2: Character, sk1: Skill, sk2: Skill) // 비동기 함수
{
    let sk1cpy = [...sk1.coinlist]; // 얕복이라 sk1cpy.xxx 수정하면 sk1이 바뀌어버린다
    let sk2cpy = [...sk2.coinlist]; // 물론 내용물을 sk2cpy에서 넣고 빼는 거는 sk1에 영향이 없다
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