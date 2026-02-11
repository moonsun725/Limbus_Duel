import type { Coin } from "../02_Coin/02_0_coin.js";

export interface Skill {
  id: number;
  level: number;
  name: string;
  desc: string;
  abilities: SkillAbility[];
  category: string;  
  color: string; 
  BasePower: number;
  coinlist: Coin[];

  // 공격/수비 스킬 여부에 따라 존재하지 않는 필드 Optional 처리

  keywords?: string[]; // 예: ["Sinking"] (가드 스킬에는 없음)
  AtkLv?: number;      // (가드 스킬에는 없음)
  Weight?: number;     // (가드 스킬에는 없음)
}

export type EffectTiming = 'OnUse' | 'OnHit' | 'OnTurnEnd' | 'OnBasePower';
export type EffectTarget = 'Self' | 'Enemy' | 'RandomAlley' | 'RandomEnemy';

export interface SkillAbility {
  type: string;
  timing: EffectTiming;
  target: EffectTarget;

  condition?: boolean;
  data?: any;
}

export function CoinToss(coinlist:Coin[], sp:number, coinmultiplier?:number, gameState?: string) : number {
  let finalpower: number = 0;
  coinlist.forEach(element => {
    if(100*Math.random() < (sp+50) )
    {  
      console.log(`[CoinToss]: 앞면: + ${element.CoinPower}`);
      finalpower += element.CoinPower; 
    }
    else
      console.log(`[CoinToss]: 뒷면: + 0`);
  });

  return finalpower;
}

