

export interface Coin {
  Type: string;       // 예: "Slash", "Penetrate", "Guard"
  Color: string; // 예: "blue", "violet", "yellow"
  CoinPower: number;
  
  coindescs?: string[]; // 코인 설명 (툴팁용)
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

  condition?: any; // 사실 얘 꺼 형태가 어느 정도 다이나믹하긴 해서 any를 써야하나 싶기도 함 ㅇㅇ
}




