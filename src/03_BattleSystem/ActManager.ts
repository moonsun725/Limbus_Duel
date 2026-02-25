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
     * @param user : 스킬 실행 객체
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
        if(!user.Slots[slotIndex].targetSlot) // 상대방에 의해 강제로 타겟이 변경되었을 때 유저에게는 더 이상 선택권이 없음 ㅇㅇ
            user.Slots[slotIndex].targetSlot = target.Slots[targetIndex];
        console.log(target.name, "의", targetIndex+1,"번째 슬롯 지정");
        
        this.ActorList.set(user.Slots[slotIndex], target.Slots[targetIndex]);
        if (user.speed > target.speed)
            target.Slots[targetIndex].forcedTarget(user.Slots[slotIndex]);

    }

    orderSort(): BattleSlot[] {
        this.turnOrder = Array.from(this.ActorList.keys()).sort((a, b) => b.speed - a.speed); // 속도 내림차순 정렬
        return this.turnOrder;
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
