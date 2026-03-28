// 00_BattleManager.ts
import type { Character } from '../00_Sinner/00_0_sinner.js';
import type { Skill } from '../01_Skill/01_0_skill.js';
import type { Coin } from '../02_Coin/02_0_coin.js';
import { calculateDamage } from '../00_Sinner/00_7_dmgCalc.js';
import { ProcessCoinEffects } from '../02_Coin/02_1_coinAbilityLogic.js';
import { ProcessMoveEffects } from '../01_Skill/01_3_skillAbilityLogic.js';
import { BattleSlot } from '../00_Sinner/00_4_Slot.js'; // 타입 참조용
import type { BattleCallbacks } from '../04_Game/Events/BattleEvents.js';
import type { BattleContext } from '../05_Ability/00_BattleContext.js';

export class BattleManager 
{
    private callbacks: BattleCallbacks;

    constructor(callbacks?: BattleCallbacks) {
        if(callbacks)
            this.callbacks = callbacks;
        else
            this.callbacks = {
                onLog: (msg) => {},
                onAttackStart: async (attackerId, targetId, skillName) => {}, // 연출 대기
                onClashStart: async (slot1, slot2) => {},
                onCoinToss: async (char, isHeads) => {},
                onClashResult: async (char1, power1, coinCount1, char2, power2, coinCount2, clashCount) =>  {},
                onDamage: async (target, damage) => {},
                onGetHit: async (target, damage) => {},
                onCoinResult: async (char, isHeads) => {},
                onAttackEnd: async (attacker, target) => {},
                
                onPowModify: async (char, amount) => {},
                onCoinPowModify: async (char, amount) => {},
                onFinalPowModify: async (char, amount) => {}
            }
    }

    /**
     * 두 슬롯 간의 합(Clash)을 진행합니다.
     * 승리한 캐릭터가 패배한 캐릭터를 공격하는 로직까지 연결할 수 있습니다.
     */
    public async Clash(slot1: BattleSlot, slot2: BattleSlot): Promise<void> {
        const char1 = slot1.owner;
        const char2 = slot2.owner;
        const skill1 = slot1.readySkill;
        const skill2 = slot2.readySkill;

        if (!skill1 || !skill2) return;

        console.log(`[Clash Start] ${char1.name}(${skill1.name}) VS ${char2.name}(${skill2.name})`);
        await this.callbacks.onClashStart(slot1, slot2);

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
            // [수정 후] 병렬 실행 (동시에 시작!)
            const [power1, power2] = await Promise.all([
                this.CoinToss(char1, char2, skill1, coins1), // 수정사항: CoinToss가 양측 다 검사하도록 함
                this.CoinToss(char2, char1, skill2, coins2)
            ]);

            console.log(`   [Clash ${clashCount}합] ${char1.name}: ${power1} vs ${char2.name}: ${power2}`);

            if (power1 > power2) {
                coins2.shift(); // 패배한 쪽 코인 하나 제거 (앞에서부터)
            } else if (power2 > power1) {
                coins1.shift();
            } 

            await this.callbacks.onClashResult(
                char1, power1, coins1.length, 
                char2, power2, coins2.length, 
                clashCount
            );
            console.log(`[Clash]: ${clashCount}합`);
            
            // 합 횟수에 따른 정신력/상태 업데이트 등은 여기서
        }

        // 승자 판별 및 공격 이행
        if (coins1.length > 0) {
            this.ApplyClashResult(char1, char2, "WIN", clashCount);
            await this.Attack(slot1, slot2, coins1, clashCount); // 남은 코인으로 공격
            slot2.consumeSkill(); // 패배한 스킬 소멸
        } else {
            this.ApplyClashResult(char2, char1, "WIN", clashCount);
            await this.Attack(slot2, slot1, coins2, clashCount);
            slot1.consumeSkill();
        }
    }

    // 합 위력 계산 헬퍼
    private async CoinToss(char: Character, target: Character, skill: Skill, coins: Coin[]): Promise<number> {
        let power = skill.BasePower;
        const context = { user: char, target: target, damage: 0, skill: skill };
        const bMods = char.bufList.GetCombinedModifier(context);
        // 이제 skill이랑 coin에서도 효과가 있을 건데 그때도 마찬가지로 context 넘기면서 하면 될듯??

        // 기본 위력 계산
        power += bMods.powerBonus;
        if (skill.category == "attack") power += bMods.atkPowerBonus;
        else power += bMods.defPowerBonus;

        // 코인 위력 계산
        for (const coin of coins) {
            // 정신력 기반 코인 토스
            const BaseCoinPower = coin.CoinPower; // 여기에다가 나중에 버프리스트 등등 긁어와서 추가로 더해줄 수 있음
            let coinPower = BaseCoinPower + bMods.coinPowerBonus;
            if (BaseCoinPower < 0) coinPower += bMods.coinPowerBonus_M; 
            else coinPower += bMods.coinPowerBonus_P;
            const isHeads = Math.random() * 100 < (char.Stats.sp + 50)
            if (isHeads) {
                console.log(`[CoinToss]: 앞면: + ${coinPower}`);
                power += coinPower;
            }
            else
                console.log(`[CoinToss]: 뒷면: + 0`);

            await this.callbacks.onCoinToss(char, isHeads); // 이제 앞뒷면 둘다 연출될거임
        }

        // 최종 위력 계산
        power += bMods.finalPowerBonus;
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
    public async Attack(skillSlot: BattleSlot, targetSlot: BattleSlot, activeCoins: Coin[], clashCnt: number = 0)
    {
        let attacker = skillSlot.owner;
        let target = targetSlot.owner;
        let skill = skillSlot.readySkill;
        if (!skill) return;

        console.log(`[Attack Start] ${attacker.name} -> ${target.name} (스킬: ${skill.name})`);
        await this.callbacks.onAttackStart(attacker, target, skill, activeCoins);

        // 일방공격이라면 공격 시작 시 효과 (OnUse) 이때 발동
        if (attacker.BattleState.GetState() === "NORMAL") {
            ProcessMoveEffects(skill, target, attacker, "OnUse");
        }

        // 코인의 앞/뒷면에 따라 '순수하게 누적되는 스킬 위력'
        let baseCurrentPower = skill.BasePower; 

        for (const coin of activeCoins) {
            attacker.bufList.OnCoinToss();
            const isHeads = Math.random() * 100 < (attacker.Stats.sp + 50);

            // ---------------------------------------------------------
            // 1. 새끼야 코인 위력도 계속 갱신해야하잖니
            // ---------------------------------------------------------
            const context = { user: attacker, target: target, damage: 0, skill: skill };
            const bMods = attacker.bufList.GetCombinedModifier(context);

            const BaseCoinPower = coin.CoinPower; // 여기에다가 나중에 버프리스트 등등 긁어와서 추가로 더해줄 수 있음
            let coinPower = BaseCoinPower + bMods.coinPowerBonus;
            if (BaseCoinPower < 0) coinPower += bMods.coinPowerBonus_M; 
            else coinPower += bMods.coinPowerBonus_P;

            // 2. 앞뒷면 여부 계산
            if (isHeads) {
                baseCurrentPower += coinPower; // 앞면이면 기본 위력 증가 (누적됨)
                console.log(`   [Coin] 앞면! 현재 기본 위력: ${baseCurrentPower}`);
            } else {
                console.log(`   [Coin] 뒷면! 현재 기본 위력: ${baseCurrentPower}`);
            }
            await this.callbacks.onCoinResult(attacker, isHeads);

            
            // 3. 이번 타격의 '최종 위력' 계산 (누적된 코인 위력 + 현재 시점의 버프 보너스)
            // 버프 보너스는 누적되면 안 되므로 여기서 임시로 더해줍니다.
            let finalHitPower = baseCurrentPower + bMods.atkPowerBonus + bMods.finalPowerBonus;

            // 4. 데미지 계산 및 적용 (calculateDamage 내부에서도 최신 Modifier를 가져오게 됨!)
            const damage = calculateDamage(attacker, target, skill, coin, finalHitPower, clashCnt);
            target.takeDamage(damage);
            this.callbacks.onGetHit(target); 
            this.callbacks.onDamage(target, damage); 

            // 5. ★ 적중 시 효과 발동 (여기서 대상의 파열, 침잠 등이 깎임!) ★
            target.bufList.OnHit(attacker, Math.floor(damage));
            ProcessCoinEffects(coin, target, attacker, "OnHit");

            // -> 루프 끝! 
            // 대상의 파열이 깎였으므로, 다음 코인 루프가 돌 때 
            // 2번 과정에서 가져오는 atkMods에는 파열 보너스가 빠진 상태로 깔끔하게 계산됩니다!
        }
        skillSlot.consumeSkill();
        console.log(`[Attack End] 공격 종료`);
        this.callbacks.onAttackEnd(attacker, target);
    }
}