import { Character } from "./00_0_sinner.js";
// 여기다 뭘 만들거냐면 인터페이스로 고정치들 정의함(체력공렙방렙속도내성 등등등)
export interface Resist1 { [key: string]: number }
export interface Resist2 { [key: string]: number }


export interface IsinnerData
{
    Snumber: number;
    name: string;
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
    stagger: number[];

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
        this.stagger = [];
        data.staggerGauge.forEach(element => {
            this.stagger.push(Math.floor(element*this.maxHp));
        });
    }

    ShowStats()
    {
        console.log("이름:", this.owner.name, "ID:", this.owner.id, "레벨:", this.lv, "체력:", this.hp + "/" + this.maxHp, "방렙:", this.baseInfo.Def, "정신력:", this.sp);
        console.log("속도:", this.baseInfo.minSpeed , "~" , this.baseInfo.maxSpeed);
        console.log("흐트러짐 게이지:", this.stagger[0] , "/" , this.stagger[1] , "/", this.stagger[2]);
        console.log("내성:", this.resistP);
    }
    reset()
    {
        this.hp = this.maxHp;
        this.sp = 0;
        this.resistP = this.baseInfo.ResistP;
        this.baseInfo.staggerGauge.forEach(element => {
            this.stagger.push(Math.floor(element*this.maxHp));
        });
    }

    LoseHP(amount: number) : boolean
    {   
        this.hp -= amount;
        return this.hp <= 0;
    }
    recoverHP(amount: number)
    {
        this.hp += amount
        if (this.hp > this.maxHp) 
            this.hp = this.maxHp
    }

    recoverSp(spAmount: number) : void
    {
        if (this.sp + spAmount > 45)
            spAmount = 45 - this.sp;
        this.sp += spAmount;
    }
    LoseSP(spAmount: number)
    {
        if (this.sp + spAmount < -45)
            spAmount = -45 - this.sp;
        this.sp -= spAmount;
    }   

    takeStaggerDamage(stgDmg: number) : boolean
    {
        this.stagger[this.stagger.length -1]! += stgDmg; // >< 이거 나중에 수정해야될수도 있음
        if (this.stagger.at(-1)! >= this.hp)
        {
            this.stagger.pop();
        }
        return (this.stagger.at(-1)! >= this.hp);
    }
   
    takeDamage(damage: number): { isDead: boolean, StaggerState: number } // 곧 옮길거니까 조금만 참아
    {
        this.hp -= damage;
        if (this.hp < 0)
            this.hp = 0;
        
        let staggerCount = 0;
        this.stagger.forEach(element => {
            if (this.hp <= element)
            {
                staggerCount++;
            }
        });
        for (var i = 0; i < staggerCount; i++)
            this.stagger.pop();

        return {
            isDead: this.hp === 0, 
            StaggerState: staggerCount // 이러면 넘버를 반환하고, 기본: 0, 흐트: 1, 흐트+: 2, 흐트++: 3에서 유효값은 1,2다 ㅇㅇ
        };
    }

}