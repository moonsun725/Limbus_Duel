

export interface Coin {
  Type: string;       // 예: "Slash", "Penetrate", "Guard"
  Color: string; // 예: "blue", "violet", "yellow"
  CoinPower: number;
  
  // 아래 항목들은 코인에 따라 없을 수 있으므로 Optional 처리
  abilities?: CoinAbility[];  
  // 나중엔 코인 자체에 즉발로 적용되는 효과도
}

export type EffectTiming = 'OnToss' | 'OnHit' | 'OnHeadsHit' | 'OnTailsHit';
export type EffectTarget = 'self' | 'opponent' | 'randomAlley' | 'randomEnemy';

export interface CoinAbility {
  Type: string;
  timing: EffectTiming;
  target: EffectTarget;

  data?: any;
  condition?: boolean;
  
}


