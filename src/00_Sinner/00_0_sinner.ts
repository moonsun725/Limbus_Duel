import data from '../06_Data/IdentityData/10_personalities_LCB.json' with {type: 'json'};
import { GetMoves } from '../01_Skill/01_2_ skillLoader.js';
// skill.ts 상속
import type { Skill } from '../01_Skill/01_0_skill.js'; 
import { type Coin } from '../02_Coin/02_0_coin.js';

import { SinnerInfo, type IsinnerData } from './00_1_sinnerInfo.js';
import { BattleStateManager } from './00_2_BattleStateManager.js';
import { BattleUnitBufList } from './00_3_BufList.js';
import { calculateDamage } from './00_4_dmgCalc.js';
import { ProcessCoinEffects } from '../02_Coin/02_1_coinAbilityLogic.js';
import { ProcessMoveEffects } from '../01_Skill/01_3_skillAbilityLogic.js';
import { SkillManager } from '../01_Skill/01_1_SkillManager.js';


// "키는 DamageType 중 하나여야 하고, 값은 number다"

export interface Resist1 { [key: string]: number }

export interface Resist2 { [key: string]: number }


export class Character
{
    public name: string; // 인격 이름
    public id: number;
    public Stats: SinnerInfo;

    public Skills: SkillManager // 스킬 목록

    public lv: number = 1; // 레벨

    public BattleState: BattleStateManager;

    public parrycnt: number = 0;

    public bufList: BattleUnitBufList;

    // public Bpassive: Passive; // 전투 패시브
    // public Spassive: Passive; // 비전투 패시브

    constructor(name: string, id: number, data: IsinnerData)
    {
        this.name = name;
        this.id = id;
        // 기본 능력치
        this.Stats = new SinnerInfo(data, data.lv, this);
        this.BattleState = new BattleStateManager(this);

        this.Skills = new SkillManager(this);
        // this.EGO_Skills = [];

        // 버프 리스트
        this.bufList = new BattleUnitBufList(this);
        
    }
    Skill(i: number) : Skill
    {
        return this.Skills.GetSkill(i);
    }
    Attack(target: Character, atkSkill: Skill, coinList: Coin[]) // 아니 씨부레 이러면 코인 부서진거 반영을 못하잖아 아 결국엔 따로 받아오냐
    {
        if (this.BattleState.GetState() === "NORMAL")
            ProcessMoveEffects(atkSkill, target, this, "OnUse"); // 나중에는 switch로 사용불가/Onuse 발동x

        console.log(`[Attack]: 공격자: ${this.name}, 공격대상: ${target.name}, 스킬명: ${atkSkill.name}`);
        let Power = atkSkill.BasePower;
        console.log(`[Attack]: 기본위력: ${Power}`)
        let Side: boolean;
        for (const element of coinList) {
            this.bufList.OnCoinToss();
            if(100*Math.random() < (this.Stats.sp+50))
            {  
                console.log(`[Attack]: 앞면: + ${element.CoinPower}`);
                Power += element.CoinPower; 
                console.log(`[Attack]: 위력: ${Power}`);
                let damage = calculateDamage(this, target, atkSkill, element, Power);
                target.takeDamage(damage);
                target.bufList.OnHit(this, Math.floor(damage)); 
                ProcessCoinEffects(element, target, this, "OnHeadsHit"); 
            }
            else
            {
                console.log(`[Attack]: 뒷면: + 0`);
                console.log(`[Attack]: 위력: ${Power}`); 
                let damage = calculateDamage(this, target, atkSkill, element, Power);
                target.takeDamage(damage);
                target.bufList.OnHit(this, Math.floor(damage)); 
                ProcessCoinEffects(element, target, this, "OnTailsHit"); 
            }
            
            // setTimeout(ProcessCoinEffects, 1000, element, target, this, "OnHit"); 아 시발 setTimeOut은 병렬로 처리하네(대기시간동안 나머지 처리한단 뜻)
            ProcessCoinEffects(element, target, this, "OnHit"); // 이것도 OnHit/OnHeadsHit/OnTailsHit/OnCritHit/... 나눠야 함
        }
    }
    loseHP(amount: number)
    {
        this.Stats.LoseHP(amount);
    }
    loseSP(amount: number)
    {
        this.Stats.LoseSP(amount);
    }
    recoverSP(amount: number)
    {
        this.Stats.recoverSp(amount);
    }

    takeDamage(damage: number)
    {
        const result = this.Stats.takeDamage(damage);
        let staggerResult = result.StaggerState;
        switch(this.BattleState.GetState())
        {
            case "STAGGERED+": // 얘는 두번 증가시켜야되고
                staggerResult++; 
            case "STAGGERED":
                staggerResult++; // 얘는 한번 증가시키면 되니까 ㅇㅇ
        }
        if (staggerResult > 3)
            staggerResult = 3;
        
        switch(staggerResult)
        {
            case 1:
                this.BattleState.ChangeState("STAGGERED");
                console.log(`[takeDamage]: 흐트러짐!`);
                break;
            case 2:
                this.BattleState.ChangeState("STAGGERED+");
                console.log(`[takeDamage]: 흐트러짐+!!`);
                break;
            case 3: 
                this.BattleState.ChangeState("STAGGERED++");
                console.log(`[takeDamage]: 흐트러짐++!!!`);
                break;
        }

        if (result.isDead) {
            this.BattleState.ChangeState("DEAD");
        }
    }


    ResetCondition(): void {
        // (1) 체력, 정신력 초기화
        this.Stats.reset();
        this.BattleState.ChangeState("NORMAL");
        // >< 버프리스트 초기화
    }
    ClashWin()
    {
        this.recoverSP(10 + (this.parrycnt*2)); // 초상마냥 정신력조건 뒤집힌 애도 있고 필싱처럼 회복량 다른 경우도 있어서 나중에는 stat으로 보내야함...
        this.parrycnt = 0;
    }
    ClashLose()
    {
        this.parrycnt = 0;
    }
}

export function createSinnerFromData(id: number): Character 
{
    // 데이터에서 해당 수감자 정보 찾기
    const sinnerData = data.Identities.find(sinner => sinner.id === id);
    if (!sinnerData) {
        throw new Error(`수감자 ID ${id}에 해당하는 데이터를 찾을 수 없습니다.`);
    }
    return new Character(sinnerData.name, sinnerData.id, sinnerData);
}

