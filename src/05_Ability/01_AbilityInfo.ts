// 일단은 CoinAbility랑 SkillAbility는 끌고와야될지 좀 고민이 됨
// 다른곳에 import만 안 해주면 되니 여기에 더미로 써놓긴하겠음

export type EffectTiming = 'OnUse' | 'OnHit' | 'OnTurnEnd' | 'OnBasePower' | 'OnToss' | 'OnHit' | 'OnHeadsHit' | 'OnTailsHit'; // 코인에만 사용 가능한 이벤하고 스킬에만 사용 가능한 이벤이 달라서리...
export type EffectTarget = 'self' | 'opponent' | 'randomAlley' | 'randomEnemy';

export interface CoinAbility {
  Type: string;
  timing: EffectTiming;
  target: EffectTarget;

  data?: any;

  // 조건이 있을수도 있고 없을수도 있기 때문에...
  condType?: string;
  condData?: any
  
}

export interface SkillAbility {
  type: string;
  timing: EffectTiming;
  target: EffectTarget;
  data?: any;

  condType?: string;
  condData?: any;
}
