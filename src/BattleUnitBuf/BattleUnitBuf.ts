import { Character } from "../Scripts/Game/00_sinner.js";
export interface BattleUnitBuf
{
    name: string;
    stack: number | null;
    owner: Character;
}