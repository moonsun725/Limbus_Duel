import { initBattleSelect } from "./selectPhase.js";
import { initBattleCombat } from "./combatPhase.js";
/*
    역할 설명:
    // 나눠놓은 js 파일들을 한번에 실행하는 역할 
*/
document.addEventListener('DOMContentLoaded', () => {
    console.log("[System] 클라이언트 모듈 로딩 시작");

    initBattleSelect();
    initBattleCombat();

    console.log("[System] 클라이언트 모듈 로딩 완료");
});