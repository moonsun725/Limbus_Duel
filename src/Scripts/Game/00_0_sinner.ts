import data from '../../IdentityData/10_personalities_LCB.json' with {type: 'json'};
import data_S from '../../Data_WIP/Skills.json' with {type: 'json'}; // 그냥 스킬 추가하는 메서드를 내가 살려놨으니까 일단은 둔다
import { GetMoves } from './01_1_ skillManager.js';
// skill.ts 상속
import type { Skill } from './01_0_skill.js'; 
import { type Coin } from './02_0_coin.js';
import type { Slot } from '../BattleSystem/slot.js';
import { BattleUnitBufList } from './00_2_BufList.js';

// "키는 DamageType 중 하나여야 하고, 값은 number다"

export interface Resist1 { [key: string]: number }

export interface Resist2 { [key: string]: number }


type SinnerBattleState = 'NORMAL' | 'STARTCOMBAT' | 'CLASHWIN' | 'CLASHLOSE' | 'EXHAUSTED' | 'GUARDING' |'STAGGERED' | 'STAGGERED+' | 'STAGGERED++' | 'PANIC' | 'ERODE' |'DEAD'; // 당장은 이대로만
export class Character
{
    public name: string; // 인격 이름
    public id: number; // 인격 ID

    public Skills: Skill[]; // 스킬 목록
    public Cycle: Slot[];

    public lv: number; // 레벨

    public hp: number; // 체력
    public sp: number = 0; // 정신력
    public maxSp: number = 45;
    public minSp: number = -45;
    public maxHp: number; // 최대체력
    public hpRate: number; // 체력 레벨당 계수
    public defLv: number; // 방렙
    public State: SinnerBattleState = 'NORMAL';

    public parrycnt: number = 0;
    private minusSP: 1 | -1 | 0 = 1;
    

    public ResistP : Resist1 =
    {
        "Slash": 1.0,
        "Penetrate": 1.0,
        "Blunt": 1.0
    };

    public ResistS : Resist2 = 
    {
        "red": 1.0,
        "orange": 1.0,
        "yellow": 1.0,    
        "green": 1.0,
        "blue": 1.0,
        "indigo": 1.0,
        "violet": 1.0
    }; 

    public bufList: BattleUnitBufList;
    public minSpeed: number; // 최소 속도
    public maxSpeed: number; // 최대 속도
    public currentSpeed: number; // 현재 속도

    public stg1?: number; // 흐트러짐 게이지 1
    Stg1checker: boolean = false; // 흐트러짐 된 이후면 켜짐

    public stg2?: number; // 흐트러짐 게이지 2
    Stg2checker: boolean = false;

    public stg3?: number; // 흐트러짐 게이지 3
    Stg3checker: boolean = false;

    // public Bpassive: Passive; // 전투 패시브
    // public Spassive: Passive; // 비전투 패시브

    constructor(name: string, id: number, lv: number,  maxHp: number, hpRate: number, defLv: number, RSlash: number, RPenetrate: number, RBlunt: number, minSpeed: number, maxSpeed: number, stg1: number, stg2?: number, stg3?: number, Rred?: number, Rorange?: number, Ryellow?: number, Rgreen?: number, Rblue?: number, Rindigo?: number, Rviolet?: number)
    {
        this.name = name;
        this.id = id;

        this.Skills = [];
        this.addSkillByID();
        this.Cycle = [];
        // this.EGO_Skills = [];

        this.lv = lv;
        this.maxHp = maxHp + Math.floor(lv*hpRate);
        this.hp = maxHp + Math.floor(lv*hpRate);
        this.hpRate = hpRate;
        this.defLv = defLv;
        
        // 물리 내성
        this.ResistP.Slash = RSlash;
        this.ResistP.Penetrate = RPenetrate;
        this.ResistP.Blunt = RBlunt; 

        // 버프 리스트
        this.bufList = new BattleUnitBufList;

        this.minSpeed = minSpeed;
        this.maxSpeed = maxSpeed;   
        this.currentSpeed = minSpeed;

        this.stg1 = Math.floor(this.maxHp*stg1);
        if(stg2)
            this.stg2 = Math.floor(this.maxHp*stg2); // 아 이건 좀 싶은데
        if (stg3)
            this.stg3 = Math.floor(this.maxHp*stg3);

        
    }

    Show() : void // js/ts에서는 클래스 내부에 함수 정의할 때 function 뺀다
    {
        console.log("이름:", this.name, "ID:", this.id, "레벨:", this.lv, "체력:", this.hp + "/" + this.maxHp, "방렙:", this.defLv, "정신력:", this.sp);
        console.log("속도:", this.minSpeed , "~" , this.maxSpeed);
        console.log("흐트러짐 게이지:", this.stg1 , "/" , this.stg2 , "/", this.stg3);
        console.log("참격내성:", this.ResistP.Slash, "관통내성:", this.ResistP.Penetrate, "타격내성:", this.ResistP.Blunt);
    }

    ShowHp() : void
    {
        console.log("이름:", this.name, "체력:", this.hp + "/" + this.maxHp);
    }

    ShowSkillList() : void
    {
        for (var i = 0; i < 4; i++)
        {
            console.log("스킬목록", i, this.Skills[i]?.name);
        }
    }

    Attack(target: Character, atkSkill: Skill, coinList: Coin[]) // 아니 씨부레 이러면 코인 부서진거 반영을 못하잖아 아 결국엔 따로 받아오냐
    {
            console.log(`[Attack]: 공격자: ${this.name}, 공격대상: ${target.name}, 스킬명: ${atkSkill.name}`);
            let Power = atkSkill.BasePower;
            console.log(`[Attack]: 기본위력: ${Power}`)
            coinList.forEach(element => {
            if(100*Math.random() < (this.sp+50) )
            {  
                console.log(`[Attack]: 앞면: + ${element.CoinPower}`);
                Power += element.CoinPower; 
                console.log(`[Attack]: 위력: ${Power}`);
                
                let damage = Power*(target.ResistP[element.Type]!+target.ResistS[element.Color]!); // 당장은 위력과 내성만 따지고, 나중에 CalcuateDamage함수 만들어야지... 정확한 계산식은 아니니까
                target.takeDamage(Math.floor(damage)); 
            }
            else
            {
                console.log(`[Attack]: 뒷면: + 0`);
                console.log(`[Attack]: 위력: ${Power}`);
                let damage = Power*(target.ResistP[element.Type]!+target.ResistS[element.Color]!); // 당장은 위력과 내성만 따지고, 나중에 CalcuateDamage함수 만들어야지... 정확한 계산식은 아니니까
                target.takeDamage(Math.floor(damage)); 
            }
        });
    }

    takeDamage(damage: number): void
    {
        this.hp -= damage;
        if(this.stg1) // 이건 또 언제 고치냐
        { 
            if (this.hp <= this.stg1 && !this.Stg1checker)
            {
                this.State = 'STAGGERED';
                console.log(`[takeDamage]: 흐트러짐!`);
                this.Stg1checker = true;
            }
        }
        if(this.stg2)
        { 
            if (this.hp <= this.stg2 && !this.Stg2checker)
            {
                switch(this.State)
                {
                    case 'STAGGERED':
                        this.State = 'STAGGERED+';
                        console.log(`[takeDamage]: 흐트러짐+!!`);
                        break;
                    default:
                        this.State = 'STAGGERED';
                        console.log(`[takeDamage]: 흐트러짐!`);
                        break;
                }
                this.Stg2checker = true;
            }
        }
        if(this.stg3)
        { 
            if (this.hp <= this.stg3 && !this.Stg3checker)
            {
                switch(this.State)
                {
                    case 'STAGGERED+':
                        this.State = 'STAGGERED++';
                        console.log(`[takeDamage]: 흐트러짐++!!!`);
                        break;
                    case 'STAGGERED':
                        this.State = 'STAGGERED+';
                        console.log(`[takeDamage]: 흐트러짐+!!`);
                        break;
                    default:
                        this.State = 'STAGGERED';
                        console.log(`[takeDamage]: 흐트러짐!`);
                        break;
                }
                this.Stg3checker = true;
            }
        }
        if (this.hp <= 0) 
        {
            this.hp = 0
            this.State = 'DEAD';
        };
        this.statusCheck();
    }

    loseHP(damage: number)
    {
        this.hp -= damage;
        if (this.hp <= 0) 
        {
            this.hp = 0
            this.State = 'DEAD';
        };
    }

    recoverSp(spAmount: number) : void
    {
        if (this.sp + spAmount > 45)
            spAmount = 45 - this.sp;
        else if (this.sp + spAmount < -45)
            spAmount = -45 - this.sp;
        this.sp += spAmount;
    }

    statusCheck() : void { // 상태에 따라 만들기
        switch(this.State)
        {
            case 'STAGGERED':
                this.ResistP = {"Slash": 2.0, "Penetrate": 2.0, "Blunt": 2.0};
                break;
            case 'STAGGERED+':
                this.ResistP = {"Slash": 2.5, "Penetrate": 2.5, "Blunt": 2.5};
                break;
            case 'STAGGERED++':
                this.ResistP = {"Slash": 3.0, "Penetrate": 3.0, "Blunt": 3.0};
                break;
            case 'CLASHWIN':
                this.sp += (10 + (this.parrycnt*2));
                this.parrycnt = 0;
                break;
            case 'CLASHLOSE':
                // 합위력 증가 얻기
                this.parrycnt = 0;
                break;
        }
    }

    addSkill(skill:Skill) : void {
        this.Skills.push(skill);
        console.log(`[Sinner]/[addSkill]: ${skill.name}을 스킬 목록에 추가`);
    }

    addSkillByID()
    {
        const mySkills = GetMoves(this.id);
        if (mySkills) // != undefined
            this.Skills = mySkills;
    }

    ResetCondition(): void {
        // (1) 체력, 정신력 초기화
        this.hp = this.maxHp;
        this.sp = 0;
                
        // (2) 상태 돌리기
        this.State = "NORMAL";
    }


}

export function createSinnerFromData(id: number): Character 
{
    // 데이터에서 해당 수감자 정보 찾기
    const sinnerData = data.Identities.find(sinner => sinner.id === id);
    if (!sinnerData) {
        throw new Error(`수감자 ID ${id}에 해당하는 데이터를 찾을 수 없습니다.`);
    }
    return new Character(
        sinnerData.name,
        sinnerData.id,
        sinnerData.lv,
        sinnerData.hp, // 초기 체력은 최대 체력과 동일하게
        sinnerData.hpRate,
        sinnerData.Def,
        
        sinnerData.RSlash,
        sinnerData.RPenetrate,
        sinnerData.RBlunt,

        sinnerData.minSpeed,
        sinnerData.maxSpeed,
        sinnerData.stg1,
        sinnerData.stg2,
        sinnerData.stg3
    );
}

