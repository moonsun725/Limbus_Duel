import { Character } from "../../00_Sinner/00_0_sinner.js";

type SinnerBattleState = 'NORMAL' | 'STARTCOMBAT' | 'CLASHWIN' | 'CLASHLOSE' | 'EXHAUSTED' | 'GUARDING' |'STAGGERED' | 'STAGGERED+' | 'STAGGERED++' | 'PANIC' | 'ERODE' |'DEAD'; // 당장은 이대로만
export class BattleStateManager {  
    private owner: Character;
    private state: SinnerBattleState;
    constructor(owner: Character)
    {
        this.owner = owner;
        this.state = 'NORMAL';
    } 
    
    ChangeState(state: SinnerBattleState)
    {
        this.state = state;
        this.statusCheck();
    }

    GetState()
    {
        return this.state;
    }

    statusCheck() : void 
    { 
        // 상태에 따라 만들기
        switch(this.state)
            {
                case 'STAGGERED':
                    this.owner.Stats.resistP = {"Slash": 2.0, "Penetrate": 2.0, "Blunt": 2.0};
                    break;
                case 'STAGGERED+':
                    this.owner.Stats.resistP = {"Slash": 2.5, "Penetrate": 2.5, "Blunt": 2.5};
                    break;
                case 'STAGGERED++':
                    this.owner.Stats.resistP = {"Slash": 3.0, "Penetrate": 3.0, "Blunt": 3.0};
                    break;
                case 'CLASHWIN':
                    this.owner.ClashWin();
                    break;
                case 'CLASHLOSE':
                    // 합위력 증가 얻기: 나중에
                    this.owner.ClashLose();
                    // this.parrycnt = 0;
                    break;
            }
        
    }
    
}