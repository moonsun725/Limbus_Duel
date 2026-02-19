// npx tsx src/04_Game/000_NEWTEST.ts

import { Character, createSinnerFromData, } from '../00_Sinner/00_0_sinner.js'
import { LoadSkillData } from '../01_Skill/01_2_ skillLoader.js';
import { BattleManager } from '../03_BattleSystem/BattleManager.js'; // 새로 만든 매니저
import { BattleSlot } from '../00_Sinner/00_4_Slot.js'; // 슬롯 클래스

// 비동기 함수(async) 안에서 실행해야 await를 쓸 수 있습니다.
async function runTest() {
    LoadSkillData();
    
    const yisang : Character = createSinnerFromData(10101);
    const faust : Character = createSinnerFromData(10201);

    let TestManager = new BattleManager()

    console.log("--- 캐릭터 스탯 확인 ---");
    yisang.Stats.ShowStats();
    faust.Stats.ShowStats();

    // 슬롯 초기화 (Character 클래스 내부에서 자동으로 안 한다면 수동으로 생성)
    // 테스트를 위해 0번 스킬을 장착한 슬롯을 생성합니다.
    yisang.Slots[0] = new BattleSlot(yisang, yisang.Skill(0), 0);
    faust.Slots[0] = new BattleSlot(faust, faust.Skill(0), 0);

    /*
    // ==========================================
    // 테스트 1: 일방 공격 (One-Sided Attack)
    // ==========================================
    console.log("\n========== TEST 1: 일방 공격 테스트 ==========");
    // 이상이 파우스트를 공격 (스킬 2번 사용 가정)
    const attackSkill = yisang.Skill(2);
    
    // 일방 공격은 코인이 깨지지 않으므로 원본 리스트 복사해서 전달
    // yisang.Attack() 대신 BattleManager 사용!
    await BattleManager.Attack(yisang, faust, attackSkill, [...attackSkill.coinlist]);
    
    faust.Stats.ShowStats(); // 맞은 후 체력 확인
    */

    // ==========================================
    // 테스트 2: 합 (Clash)
    // ==========================================
    console.log("\n========== TEST 2: 합(Clash) 테스트 ==========");
    
    // 테스트를 위해 양쪽 슬롯에 스킬 장전
    // (Skill(i)는 매번 새로운 객체를 반환하거나 참조를 반환한다고 가정)
    yisang.Slots[0].readySkill = yisang.Skill(2); 
    faust.Slots[0].readySkill = faust.Skill(2);

    // 합 진행 (비동기)
    await TestManager.Clash(yisang.Slots[0], faust.Slots[0]);

    console.log("\n[합 종료 후 상태]");
    yisang.Stats.ShowStats();
    faust.Stats.ShowStats();


    // ==========================================
    // 테스트 3: 상태이상 및 반복 전투
    // ==========================================
    /*
    console.log("\n========== TEST 3: 상태이상 부여 확인 ==========");
    
    // 스킬 0번(보통 약한 스킬)으로 3번 연속 공격
    const debuffSkill = yisang.Skill(0);

    for (let i = 0; i < 3; i++) {
        console.log(`\n--- ${i+1}번째 공격 ---`);
        await BattleManager.Attack(yisang, faust, debuffSkill, [...debuffSkill.coinlist]);
        
        console.log(`[파우스트 버프 상태]`);
        faust.bufList.Show(); // 버프 리스트 출력
    }
    */
    console.log("\n모든 테스트 종료.");
}

// 테스트 실행
runTest().catch(e => console.error(e));