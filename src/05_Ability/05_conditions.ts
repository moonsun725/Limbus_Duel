import type { Character } from "../00_Sinner/00_0_sinner.js";
import  { type BattleContext, handleTargets } from "./00_BattleContext.js";
import type { KeyWords } from "./04_battleUnitBufs.js"; // >< 이거는 나중에 아예 목록으로 빼놓읍시다. 맵의 키로 사용하면 될듯 ㅇㅇ

// utils/comparator.ts (또는 05_conditions.ts 상단) -> 나중에 따로 빼야겠다
// 허용할 연산자 타입 정의 (에디터 자동완성용)
export type Operator = '==' | '>=' | '<=' | '>' | '<';

// 실제 값(actual)과 기준 값(target)을 연산자(op)에 맞춰 비교해주는 만능 판독기
export function Compare(actual: number, op: Operator, target: number): boolean {
    switch (op) {
        case '>=': return actual >= target;
        case '<=': return actual <= target;
        case '>':  return actual > target;
        case '<':  return actual < target;
        case '==': return actual === target;
        default:   
            console.warn(`[Compare] 알 수 없는 연산자: ${op}`);
            return false;
    }
}

export interface CheckLogic 
{
    Execute(context: BattleContext, data: any): boolean;
    
    // 근데 이거 다 조건식이니까 일괄적으로 처리하려면 exexute 하나만 두는게 맞지않음?
    CheckBuf?() : boolean; // 쪼갤까?
    CheckSpeed?() : boolean;
    CheckHpRate?() : boolean;
    CanConsume?(owner: Character, data: any) : boolean;
    /*
        들어오는 데이터가 이렇게 생겨야 함
        {
            targetBuf:
            stack?:
            count?:
        }
    */
    Random?(): boolean;
}

export const CondRegistry: { [key: string]: CheckLogic } = {
    "Wdon": { // 일단 프로토타입
        Execute:(context, data) => {
            const owner = context.user;
            let count = owner.bufList.getKeywordBufCount('charge');
            if (!count) return false;
            return !(count < 10);
        },
    },
    "ConsumeCount": { // 횟수 소모 가능한지 여부
        Execute:(context, data) => {
            const owner = context.target;
            const targetBuf = data.keywordBuf;
            const cp = data.count;
            let count = owner.bufList.getKeywordBufCount(targetBuf);
            if (!count) return false;
            return count >= cp;
        },
    },
    "CheckSP" : { // 정신력 기준 판단 연산
        Execute: (context, data) => {
            console.log("정신력 체크 시작");
            const target = (data.target === 'self') ? context.user : context.target; // 사실 이것도 target이 여러 종류이기 때문에 단지 두 가지로만 비교할 수는 없는데?
            const sp = target.Stats.sp;
            console.log("대상: ", target.name, "조건치: ", data.value, "현재 정신력: ", target.Stats.sp, "연산:", data.operator);
            return Compare(sp, data.operator || '>=', data.value);
        }
    },

    "CheckKeywordBuf": { // ConsumeCount 대신 써야지 ㅇㅇ
        Execute: (context, data) => {
            // 1. 주체 판별
            const target = (data.target === 'self') ? context.user : context.target;
            
            // 2. 실제 값(현재 버프 수치) 가져오기
            const actualCount = target.bufList.getKeywordBufCount(data.keywordBuf) || 0;
            
            // 3. 연산자에 따라 헬퍼 함수가 T/F를 반환하도록 던짐!
            // (JSON에 operator가 안 적혀있으면 기본값으로 '>=' 적용)
            return Compare(actualCount, data.operator || '>=', data.value);
        }
    },

    // 속도 비교 검사기 (예시)
    "CheckSpeed": {
        Execute: (context, data) => {
            const subject = (data.target === 'self') ? context.user : context.target;
            const actualSpeed = subject.speed;
            
            // 여기서도 똑같이 Compare 재사용!
            return Compare(actualSpeed, data.operator || '>=', data.value);
        }
    }

    // 이러면 data의 생김새를 생각해야되는데
    /*
        type, target, operator, value, KeywordBuf?
    */
    
}