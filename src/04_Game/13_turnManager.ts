
export type TurnState = "START" | "STARTAFTER" | "SELECT" | "COMBAT" | "END" | "ENDAFTER" | "DEFAULT"
export class TurnManager
{
    state: TurnState = 'DEFAULT';

    changeState() : TurnState
    {
        switch(this.state)
        {
            case 'START':
                this.state = 'STARTAFTER';
                break;
            case 'STARTAFTER':
                this.state = 'SELECT';
                break;
            case 'SELECT':
                this.state = 'COMBAT';
                break;
            case 'COMBAT':
                this.state = 'END';
                break;
            case 'END':
                this.state = 'ENDAFTER';
                break;
            case 'ENDAFTER':
                this.state = 'START';
                break;
        }
        return this.state; // state 변수는 room에서 받아다가 나머지 매니저들 호출하는게 맞겠지
    }
}