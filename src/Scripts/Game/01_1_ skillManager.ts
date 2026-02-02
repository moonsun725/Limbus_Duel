// MoveManager.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Skill } from './01_0_skill.js'; // 위에서 만든 타입 import

// __dirname 설정 (ES Module 환경)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JSON 파일 경로 (위치에 따라 수정 필요)
/*
    src/Data/스킬데이터
    src/Scripts/Game/매니저

*/

const jsonPath = path.join(__dirname, '../../Data_WIP/Skills.json');

// ★ 기술 도감 (Dictionary)
// 이름만 대면 기술이 툭 튀어나오게 저장
export const MoveBundleRegistry: { [prefix: number]: Skill[] } = {};

export function LoadSkillData() {
    try
    {
        const rawData = fs.readFileSync(jsonPath, 'utf-8'); // 파일 읽기
        const json = JSON.parse(rawData);

        const moveList = json.dataList as Skill[]; // json 배열 돌기
        
        moveList.forEach((move) => {
            // 1. 소수점 제거하여 정수 그룹 키 생성
            const prefix = Math.floor(move.id / 100);

            // 2. 해당 그룹에 배열이 없으면 새로 생성 (매우 중요!)
            if (!MoveBundleRegistry[prefix]) { // 없을 수도 있기 때문에
                MoveBundleRegistry[prefix] = [];
            }

            // 3. 이제 안전하게 push
            MoveBundleRegistry[prefix]?.push(move); // 키값을 지금 공통ID로 하고 있고 이러면 move의 배열이 묶인다
        });
    }
    catch(err)
    {
        console.error(`[Error] Skills.json 로딩 실패:`, err);
    }
}

// 헬퍼 함수: 이름으로 기술 묶음 찾기
export function GetMoves(id: number): Skill[] | undefined
{
    return MoveBundleRegistry[id];
}