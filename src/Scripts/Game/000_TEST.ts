import { Character, createSinnerFromData, } from './00_sinner.js'
import type { Skill } from './01_skill.js';

const yisang : Character = createSinnerFromData(10101);
const faust : Character = createSinnerFromData(10201);
export function Clash(ch1: Character, ch2: Character, sk1: Skill, sk2: Skill) : void {
    
}