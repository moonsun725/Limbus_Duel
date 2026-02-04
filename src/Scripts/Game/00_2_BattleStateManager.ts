import { Character } from "./00_0_sinner.js";

type SinnerBattleState = 'NORMAL' | 'STARTCOMBAT' | 'CLASHWIN' | 'CLASHLOSE' | 'EXHAUSTED' | 'GUARDING' |'STAGGERED' | 'STAGGERED+' | 'STAGGERED++' | 'PANIC' | 'ERODE' |'DEAD'; // 당장은 이대로만
export class BattleStateManager {  
    private owner: Character;
    private state: SinnerBattleState;
    constructor(owner: Character)
    {
        this.owner = owner;
        this.state = 'NORMAL';
    } 
    
    ChangeState()
    {
        
    }

    
}