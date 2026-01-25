import type { KeywordEffect, BattleUnitEffect } from "./03_effect.js";

export interface Coin {
  Type: string;       // 예: "Slash", "Penetrate", "Guard"
  SinAffinity: string; // 예: "blue", "violet", "yellow"
  CoinPower: number;
  
  // 아래 항목들은 코인에 따라 없을 수 있으므로 Optional 처리
  coindescs?: CoinDescription[];
  effectK?: KeywordEffect[];    
  effectB?: BattleUnitEffect[];   
  // 나중엔 코인 자체에 즉발로 적용되는 효과도
}

export interface CoinDescription {
  desc: string;
}


