import type { Coin } from "./02_coin.js";

export interface Skill {
  id: number;
  level: number;
  name: string;
  desc: string;
  BasePower: number;
  coinlist: Coin[];

  // 공격/수비 스킬 여부에 따라 존재하지 않는 필드 Optional 처리
  category?: string;  // 예: "attack", "defence" (1010103번 데이터에는 누락됨)
  skilltype?: string; // 예: "blue", "violet" (1010103번 데이터에는 누락됨)
  keywords?: string[]; // 예: ["Sinking"] (가드 스킬에는 없음)
  AtkLv?: number;      // (가드 스킬에는 없음)
  Weight?: number;     // (가드 스킬에는 없음)
}