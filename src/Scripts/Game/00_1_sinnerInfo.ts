import { Character } from "./00_0_sinner.js";
// 여기다 뭘 만들거냐면 인터페이스로 고정치들 정의함(체력공렙방렙속도내성 등등등)
export interface Resist1 { [key: string]: number }
export interface Resist2 { [key: string]: number }


export interface IsinnerData
{
    Snumber: number;
    name: string;
    id: number;
    lv: number; 
    hp: number; 
    hpRate: number; 
    Def: number; 
    
    minSpeed: number; 
    maxSpeed: number; 
    staggerGauge: number[];
    ResistP: Resist1; // 참관타 
}
export class SinnerInfo // 각종 스탯, 내성
{
    private baseInfo: IsinnerData; // 데이터상 기본값
    owner: Character;

    lv: number; // 여기부턴 실수치들
    maxHp: number; // 최대체력
    hp: number; // 체력
    sp: number; // 정신력

    public maxSp: number = 45;
    public minSp: number = -45;

    resistP: Resist1;
    resistS: Resist2 = 
    {
        "red": 1.0,
        "orange": 1.0,
        "yellow": 1.0,    
        "green": 1.0,
        "blue": 1.0,
        "indigo": 1.0,
        "violet": 1.0
    }; 
    speed: number;
    stagger: number[] = [];

    constructor(data: IsinnerData, level: number, owner: Character)
    {
        this.baseInfo = data; 
        this.owner = owner;

        this.lv = level;
        this.maxHp = data.hp + Math.floor(this.lv*data.hpRate);
        this.hp = this.maxHp;
        this.sp = 0;

        this.speed = data.minSpeed; // 값만 정해놓고 실제로는 턴마다 갱신할거니까
        this.resistP = data.ResistP;
        data.staggerGauge.forEach(element => {
            this.stagger.push(Math.floor(element*this.maxHp));
        });
    }

    ShowStats()
    {
        console.log("이름:", this.owner.name, "ID:", this.baseInfo.id, "레벨:", this.lv, "체력:", this.hp + "/" + this.maxHp, "방렙:", this.baseInfo.Def, "정신력:", this.sp);
        console.log("속도:", this.baseInfo.minSpeed , "~" , this.baseInfo.maxSpeed);
        console.log("흐트러짐 게이지:", this.stagger[0] , "/" , this.stagger[1] , "/", this.stagger[2]);
        console.log("참격내성:", this.resistP.Slash, "관통내성:", this.resistP.Penetrate, "타격내성:", this.resistP.Blunt);
    }

    LoseHP(amount: number)
    {   
        this.hp -= amount;
    }
    LoseSP(amount: number)
    {
        this.sp -= amount;
    }   
    
}