// 00_BattleManager.ts
import type { Character } from '../00_Sinner/00_0_sinner.js';
import type { Skill } from '../01_Skill/01_0_skill.js';
import type { Coin } from '../02_Coin/02_0_coin.js';
import { calculateDamage } from '../00_Sinner/00_7_dmgCalc.js';
import { ProcessCoinEffects } from '../02_Coin/02_1_coinAbilityLogic.js';
import { ProcessMoveEffects } from '../01_Skill/01_3_skillAbilityLogic.js';
import { BattleSlot } from '../00_Sinner/00_4_Slot.js'; // 타입 참조용

// 유틸리티: 비동기 지연 함수 (연출용)
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class BattleManager {

    /**
     * 두 슬롯 간의 합(Clash)을 진행합니다.
     * 승리한 캐릭터가 패배한 캐릭터를 공격하는 로직까지 연결할 수 있습니다.
     */
    public static async ProcessClash(slot1: BattleSlot, slot2: BattleSlot): Promise<void> {
        const char1 = slot1.owner;
        const char2 = slot2.owner;
        const skill1 = slot1.readySkill;
        const skill2 = slot2.readySkill;

        if (!skill1 || !skill2) return;

        console.log(`[Clash Start] ${char1.name}(${skill1.name}) VS ${char2.name}(${skill2.name})`);

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
            const power1 = this.CalculateClashPower(char1, skill1, coins1);
            const power2 = this.CalculateClashPower(char2, skill2, coins2);

            console.log(`   [Clash ${clashCount}] ${char1.name}: ${power1} vs ${char2.name}: ${power2}`);
            await wait(300); // 합 팅! 팅! 하는 연출 시간

            if (power1 > power2) {
                coins2.shift(); // 패배한 쪽 코인 하나 제거 (앞에서부터)
                console.log(`   -> ${char2.name} 코인 파괴! (남은 코인: ${coins2.length})`);
            } else if (power2 > power1) {
                coins1.shift();
                console.log(`   -> ${char1.name} 코인 파괴! (남은 코인: ${coins1.length})`);
            } else {
                console.log(`   -> 비김! (다시 굴림)`);
            }
            
            // 합 횟수에 따른 정신력/상태 업데이트 등은 여기서
        }

        // 승자 판별 및 공격 이행
        if (coins1.length > 0) {
            this.ApplyClashResult(char1, char2, "WIN", clashCount);
            await this.ProcessAttack(char1, char2, skill1, coins1); // 남은 코인으로 공격
            slot2.consumeSkill(); // 패배한 스킬 소멸
        } else {
            this.ApplyClashResult(char2, char1, "WIN", clashCount);
            await this.ProcessAttack(char2, char1, skill2, coins2);
            slot1.consumeSkill();
        }
    }

    // 합 위력 계산 헬퍼
    private static CalculateClashPower(char: Character, skill: Skill, coins: Coin[]): number {
        let power = skill.BasePower;
        let headsCount = 0;
        
        for (const coin of coins) {
            // 정신력 기반 코인 토스
            if (Math.random() * 100 < (char.Stats.sp + 50)) {
                power += coin.CoinPower;
                headsCount++;
            }
        }
        return power;
    }

    private static ApplyClashResult(winner: Character, loser: Character, state: string, clashCount: number) {
        console.log(`[Clash Result] 승자: ${winner.name}`);
        winner.ClashWin(clashCount);
        loser.ClashLose();
        // 필요하다면 BattleState 변경 로직 추가
    }

    /**
     * 일방 공격 또는 합 승리 후 공격을 수행합니다.
     */
    public static async ProcessAttack(attacker: Character, target: Character, skill: Skill, activeCoins: Coin[]) {
        console.log(`[Attack Start] ${attacker.name} -> ${target.name} (스킬: ${skill.name})`);

        // 공격 시작 시 효과 (OnUse)
        if (attacker.BattleState.GetState() === "NORMAL") {
            ProcessMoveEffects(skill, target, attacker, "OnUse");
        }

        let currentPower = skill.BasePower; // 누적 위력 방식이라면 여기서 초기화

        for (const coin of activeCoins) {
            // 연출을 위한 딜레이 (코인 하나하나 때리는 느낌)
            await wait(500);

            attacker.bufList.OnCoinToss();
            const isHeads = Math.random() * 100 < (attacker.Stats.sp + 50);

            if (isHeads) {
                currentPower += coin.CoinPower; // 앞면이면 위력 증가
                console.log(`   [Coin] 앞면! 현재 위력: ${currentPower}`);
            } else {
                console.log(`   [Coin] 뒷면! 현재 위력: ${currentPower}`);
            }

            // 데미지 계산 및 적용
            const damage = calculateDamage(attacker, target, skill, coin, currentPower);
            target.takeDamage(damage);
            
            // 적중 시 효과 처리
            target.bufList.OnHit(attacker, Math.floor(damage));
            
            const effectType = isHeads ? "OnHeadsHit" : "OnTailsHit";
            ProcessCoinEffects(coin, target, attacker, effectType);
            ProcessCoinEffects(coin, target, attacker, "OnHit");
            
            // 만약 대상이 죽거나 흐트러지면 중단할지 여부 체크 로직 추가 가능
        }

        console.log(`[Attack End] 공격 종료`);
    }
}