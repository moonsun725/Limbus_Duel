/*
 * 키워드 버프 효과 (예: 침잠) - JSON상 배열로 존재
 */
export interface KeywordEffect {
  event: string;
  target: string;
  KeywordBuf: string;
  stack: number;
  count: number;
}

/*
 * 전투 유닛 버프 효과 (예: 취약) - JSON상 객체로 존재
 */
export interface BattleUnitEffect {
  event: string;
  target: string;
  BattleUnitBuf: string;
  amount: number;
}