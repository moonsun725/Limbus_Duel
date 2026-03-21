
export type TurnState = "TURNSTART" | "TURNSTARTAFTER" | "SELECT" | "COMBATSTART" | "COMBATSTARTAFTER" | "COMBATEND" | "TURNEND" | "DEFAULT"
export class TurnManager
{
    state: TurnState = 'DEFAULT';

    changeState() : TurnState
    {
        switch(this.state)
        {
            case 'TURNSTART':
                this.state = 'TURNSTARTAFTER';
                break;
            case 'TURNSTARTAFTER':
                this.state = 'SELECT';
                break;
            case 'SELECT':
                this.state = 'COMBATSTART';
                break;
            case 'COMBATSTART':
                this.state = 'COMBATSTARTAFTER';
                break;
            case 'COMBATSTARTAFTER':
                this.state = 'TURNEND';
                break;
            case 'TURNEND':
            case 'DEFAULT':
                this.state = 'TURNSTART';
                break;
        }
        return this.state; // state 변수는 room에서 받아다가 나머지 매니저들 호출하는게 맞겠지
    }
}