import type { KeywordEffect, BattleUnitEffect } from "./03_effect.js";

export interface Coin {
  Type: string;       // 예: "Slash", "Penetrate", "Guard"
  SinAffinity: string; // 예: "blue", "violet", "yellow"
  CoinPower: number;
  
  // 아래 항목들은 코인에 따라 없을 수 있으므로 Optional 처리
  coindescs?: CoinDescription[];
  effectK?: KeywordEffect[];    // 배열 형태 (예: 1010101, 1010102)
  effectB?: BattleUnitEffect;   // 객체 형태 (예: 1010103)
  // 코인 자체에 즉발로 적용되는 효과
}

export interface CoinDescription {
  desc: string;
}
