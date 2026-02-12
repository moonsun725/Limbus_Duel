import { Character, createSinnerFromData } from "../../00_Sinner/00_0_sinner.js";
export function buildParty(data?: any[]): Character[] 
{
    const party: Character[] = [];
    
    // 데이터가 유효하면 그걸로 생성
    if (data && Array.isArray(data) && data.length > 0) {
        for (const p of data) {
            try {
                // createPokemon 옵션으로 moves, item 전달
                const newPoke = createSinnerFromData(p.id);
                party.push(newPoke);
            } catch (e) {
                console.error(`[Room] 포켓몬 생성 실패 (${p.name}):`, e);
            }
        }
    }

    // 만약 생성된 게 없으면 (데이터 오류 or 빈 팀) -> 기본 렌탈팀 제공
    if (party.length === 0) {
        console.log("[Room] 렌탈팀을 제공합니다.");
        for (var i = 10101; i <= 11201; i +=100)
            party.push(createSinnerFromData(i))
    }
    
    return party;
}