import { Character } from "../Scripts/Game/00_sinner.js";
export abstract class BattleUnitBuf
{
    name: string;
    stack: number;
    owner: Character;

    constructor(name:string, stack:number, owner:Character)
    {
        this.name = name;
        this.stack = stack;
        this.owner = owner;
    }
}