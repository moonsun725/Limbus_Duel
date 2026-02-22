import { Character } from "../00_Sinner/00_0_sinner.js";
import type { BattleSlot } from "../00_Sinner/00_4_Slot.js";
import { type Skill } from "../01_Skill/01_0_skill.js";
import type { Coin } from "../02_Coin/02_0_coin.js";
import { calculateDamage } from '../00_Sinner/00_7_dmgCalc.js';
import { ProcessCoinEffects } from '../02_Coin/02_1_coinAbilityLogic.js';
import { ProcessMoveEffects } from '../01_Skill/01_3_skillAbilityLogic.js';
import { utimes } from "fs";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ActManager {
    ActorList: Map<BattleSlot, BattleSlot | undefined> = new Map();
    turnOrder: BattleSlot[] = [];

    SkillSelect(user: Character, skillIndex: 0 | 1, slotIndex: number = 0) {
        user.SkillSelect(skillIndex); // 0번 슬롯에 아래쪽 스킬패널의 스킬 할당
        if (!user.Slots[slotIndex]) {
            // try catch를 아직 생각 안해놔서 throw는 당장 못하겠음
            return;
        }
        console.log("[ActManager]: ",user.name, "이/가", slotIndex+1,"번째 슬롯에", user.Slots[slotIndex].readySkill?.name, "선택");
        this.ActorList.set(user.Slots[slotIndex], undefined);
    }

    /**
     * 
     * @param user : 스킬을 실행한 객체가 
     * @param target : 공격 대상 
     * @param slotIndex : user의 슬롯 인덱스 (0 또는 1) - 기본값은 0
     * @param targetIndex : target의 슬롯 인덱스 (0 또는 1) - 기본값은 0
     * @returns 
     */
    TargetLock(user: Character, target: Character, slotIndex: number = 0, targetIndex: number = 0) {
        if (!user.Slots[slotIndex] || !target.Slots[targetIndex]) {
            // try catch를 아직 생각 안해놔서 throw는 당장 못하겠음
            return;
        }
        console.log(target.name, "의", targetIndex+1,"번째 슬롯 지정");
        this.ActorList.set(user.Slots[slotIndex], target.Slots[targetIndex]);
        if (user.speed > target.speed)
            target.Slots[targetIndex].forcedTarget(user.Slots[slotIndex]);

    }

    orderSort(): BattleSlot[] {
        this.turnOrder = Array.from(this.ActorList.keys()).sort((a, b) => a.speed - b.speed);
        this.turnOrder.forEach((element, i) => {
            console.log(i, '번', element.owner.name);
        });
        return this.turnOrder;
    }

    async StartCombat() // 비동기 함수 <- 얘는 나중에 룸에서 처리할 예정임
    {
        for (let user of this.turnOrder) {
            // 1. 이미 행동을 마친 경우(나보다 빠른 대상에 의해 합이 걸려왔다든지) 스킵
            console.log("************************", user.owner.name, "차례");

            if (!user.readySkill) {
                console.log("이미 스킬 사용됨");
                continue;
            }

            let uTarget = this.ActorList.get(user);
            if (!uTarget) {
                console.log("타겟 없음");
                continue;
            }

            let tTarget = uTarget.targetSlot
            if (tTarget === user && tTarget.readySkill)
                await this.Clash(user, uTarget);
            else
                await this.Attack(user, uTarget.owner, user.readySkill, user.readySkill?.coinlist);
        }
    }

    public async Clash(slot1: BattleSlot, slot2: BattleSlot): Promise<void> {
        const char1 = slot1.owner;
        const char2 = slot2.owner;
        const skill1 = slot1.readySkill;
        const skill2 = slot2.readySkill;

        if (!skill1 || !skill2) return;

        console.log(`[Clash Start] ${char1.name}(${skill1.name}) VS ${char2.name}(${skill2.name})`);
        // await this.callbacks.onClashStart(char1, char2);

        // 코인 복사 (원본 손상 방지)
        let coins1 = [...skill1.coinlist];
        let coins2 = [...skill2.coinlist];
        let clashCount = 0;
        const maxClash = 99;

        // 합 진행 루프
        while (coins1.length > 0 && coins2.length > 0 && clashCount < maxClash) {
            clashCount++;
            char1.CoinToss();
            char2.CoinToss();

            // 코인 토스 및 위력 계산
            console.log(`[Clash]: 스킬명: ${skill1.name}`);
            const power1 = await this.CoinToss(char1, skill1, coins1);
            console.log(`[Clash]: 스킬위력: ${power1}`);

            console.log(`[Clash]: 스킬명: ${skill2.name}`);
            const power2 = await this.CoinToss(char2, skill2, coins2);
            console.log(`[Clash]: 스킬위력: ${power2}`);
            // await this.callbacks.onClashResult(char1, power1, char2, power2, clashCount);

            console.log(`   [Clash ${clashCount}합] ${skill1.name}: ${power1} vs ${skill2.name}: ${power2}`);
            await wait(1000); // 합 팅! 팅! 하는 연출 시간

            if (power1 > power2) {
                coins2.shift(); // 패배한 쪽 코인 하나 제거 (앞에서부터)
            } else if (power2 > power1) {
                coins1.shift();
            }
            console.log(`[Clash]: ${clashCount}합`);

            // 합 횟수에 따른 정신력/상태 업데이트 등은 여기서
        }

        // 승자 판별 및 공격 이행
        if (coins1.length > 0) {
            this.ApplyClashResult(char1, char2, "WIN", clashCount);
            slot2.consumeSkill(); // 패배한 스킬 소멸
            await this.Attack(slot1, char2, skill1, coins1); // 남은 코인으로 공격
        } else {
            this.ApplyClashResult(char2, char1, "WIN", clashCount);
            slot1.consumeSkill();
            await this.Attack(slot2, char1, skill2, coins2);
        }
    }

    // 합 위력 계산 헬퍼
    private async CoinToss(char: Character, skill: Skill, coins: Coin[]): Promise<number> {
        let power = skill.BasePower;
        let headsCount = 0;

        for (const coin of coins) {
            // 정신력 기반 코인 토스
            const isHeads = Math.random() * 100 < (char.Stats.sp + 50)
            if (isHeads) {
                console.log(`[CoinToss]: 앞면: + ${coin.CoinPower}`);
                // await this.callbacks.onCoinToss(isHeads);
                power += coin.CoinPower;
                headsCount++;
            }
            else
                console.log(`[CoinToss]: 뒷면: + 0`);
            await wait(300);
        }
        return power;
    }

    private ApplyClashResult(winner: Character, loser: Character, state: string, clashCount: number) {
        console.log(`[Clash Result] 승자: ${winner.name}`);
        winner.ClashWin(clashCount);
        loser.ClashLose();
        // 필요하다면 BattleState 변경 로직 추가
    }

    /**
     * 일방 공격 또는 합 승리 후 공격을 수행합니다.
     */
    public async Attack(attackSlot: BattleSlot, target: Character, skill: Skill, activeCoins: Coin[]) {

        const attacker = attackSlot.owner;
        console.log(`[Attack Start] ${attacker.name} -> ${target.name} (스킬: ${skill.name})`);
        // await this.callbacks.onAttackStart(attacker.id, target.id, skill.name);

        // 일방공격이라면 공격 시작 시 효과 (OnUse) 이때 발동
        if (attacker.BattleState.GetState() === "NORMAL") {
            ProcessMoveEffects(skill, target, attacker, "OnUse");
        }

        let currentPower = skill.BasePower; // 누적 위력 방식이라면 여기서 초기화

        for (const coin of activeCoins) {
            // 연출을 위한 딜레이 (코인 하나하나 때리는 느낌)
            await wait(2000);

            attacker.bufList.OnCoinToss();
            const isHeads = Math.random() * 100 < (attacker.Stats.sp + 50);

            if (isHeads) {
                currentPower += coin.CoinPower; // 앞면이면 위력 증가
                console.log(`   [Coin] 앞면! 현재 위력: ${currentPower}`);
                // await this.callbacks.onCoinResult(isHeads, currentPower);
            } else {
                console.log(`   [Coin] 뒷면! 현재 위력: ${currentPower}`);
            }

            // 데미지 계산 및 적용
            const damage = calculateDamage(attacker, target, skill, coin, currentPower);
            target.takeDamage(damage);
            // this.callbacks.onDamage(target.id, damage, target.Stats.hp); // UI 처리

            // 적중 시 효과 처리
            target.bufList.OnHit(attacker, Math.floor(damage));

            // const effectType = isHeads ? "OnHeadsHit" : "OnTailsHit";
            // ProcessCoinEffects(coin, target, attacker, effectType);
            ProcessCoinEffects(coin, target, attacker, "OnHit");

            // 만약 대상이 죽거나 흐트러지면 중단할지 여부 체크 로직 추가 가능
        }
        attackSlot.consumeSkill();
        console.log(`[Attack End] 공격 종료`);
    }

}

// 합 가능성 따지는 거는 클래스랑 독립된 행위니까 밖으로 빼는 게 나은 것 같아
function isClashAble(user: BattleSlot, target: BattleSlot, targetTarget?: BattleSlot): boolean {
    // 성립 조건
    // 1. user가 target보다 속도가 높다
    // 2. user가 target보다 속도가 낮지만, target의 공격대상이 user이다 // 하지만 이건 쌍방 블라인드 지정이라...도 존재할 수 있네?
    if (!target.readySkill) return false;
    if (user.speed > target.speed) return true;
    if (targetTarget && targetTarget === user) return true;
    return false;
}
