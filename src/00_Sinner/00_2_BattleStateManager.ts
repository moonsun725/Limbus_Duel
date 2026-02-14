import { Character } from "./00_0_sinner.js";

type SinnerBattleState = 'NORMAL' | 'TURNSTART' | 'STARTCOMBAT' | 'USESKILL' | 'STARTCLASH' | 'CLASHWIN' | 'CLASHLOSE' | 'EXHAUSTED' | 'GUARDING' | 'STAGGERED' | 'STAGGERED+' | 'STAGGERED++' | 'PANIC' | 'ERODE' | 'DEAD'; // 당장은 이대로만
export class BattleStateManager {  // 야 시발 합승리 패배는 따로 관리해
    private owner: Character;
    private state: SinnerBattleState;
    private exhaustHandler: number = 0;
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
                case 'TURNSTART':
                    this.SpeedSetting();
                    break;
                    // 여기서부터는 피격 시 전환됨
                case 'EXHAUSTED':
                    this.ExhaustHandle();
                    break;
                case 'STAGGERED':
                    this.owner.Stats.resistP = {"Slash": 2.0, "Penetrate": 2.0, "Blunt": 2.0};
                    break;
                case 'STAGGERED+':
                    this.owner.Stats.resistP = {"Slash": 2.5, "Penetrate": 2.5, "Blunt": 2.5};
                    break;
                case 'STAGGERED++':
                    this.owner.Stats.resistP = {"Slash": 3.0, "Penetrate": 3.0, "Blunt": 3.0};
                    break;
            }
        
    }

    SpeedSetting()
    {
        this.owner.speed = Math.floor(Math.random()*(this.owner.maxSpeed-this.owner.maxSpeed)+this.owner.minSpeed); // 스피드 세팅
        this.owner.speed += 0; // 당장은 더미로 남겨놓고(신속, 속박 처리)
        if (this.owner.speed <= 0)
            this.owner.speed = 1;
    }
    
    ExhaustHandle()
    {
        if (this.exhaustHandler >= 1) 
            this.ChangeState('STAGGERED');
    }

    EndTurn()
    {
        if (this.state == 'EXHAUSTED' && this.exhaustHandler == 0)
            this.exhaustHandler++;
    }
}