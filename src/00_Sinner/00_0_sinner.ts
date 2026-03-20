import data from '../06_Data/IdentityData/10_personalities_LCB.json' with {type: 'json'};
import { GetMoves } from '../01_Skill/01_2_skillLoader.js';
// skill.ts 상속
import type { Skill } from '../01_Skill/01_0_skill.js';

import { SinnerInfo, type IsinnerData } from './00_1_sinnerInfo.js';
import { BattleStateManager } from './00_2_BattleStateManager.js';
import { BattleUnitBufList } from './00_3_BufList.js';
import { SkillManager } from '../01_Skill/01_1_skillManager.js';
import { BattleSlot } from './00_4_Slot.js';


// "키는 DamageType 중 하나여야 하고, 값은 number다"
type color = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'indigo' | 'violet';
type skilltype = 'atk' | 'def';

export class Character {
    public name: string; // 인격 이름
    public id: number; // 인격 id(데이터 식별용)
    public partyID: number;
    public minSpeed;
    public maxSpeed;
    public speed: number;

    public Stats: SinnerInfo;

    public Skills: SkillManager // 스킬 목록

    public BattleState: BattleStateManager; // 상태 판별/변경

    public bufList: BattleUnitBufList;

    // public Bpassive: Passive; // 전투 패시브
    // public Spassive: Passive; // 비전투 패시브
    public deck: Skill[];
    public readyDeck: Skill[];

    public Slots: BattleSlot[] = [];

    constructor(name: string, id: number, data: IsinnerData, ptIdx: number) {
        this.name = name;
        this.id = id;
        this.partyID = ptIdx;
        // 기본 능력치
        this.Stats = new SinnerInfo(data, data.lv, this);
        this.BattleState = new BattleStateManager(this);

        this.Skills = new SkillManager(this);
        // this.EGO_Skills = [];

        // 버프 리스트
        this.bufList = new BattleUnitBufList(this);

        // 속도는 객체랑 같이 다녀야지
        this.speed = data.minSpeed;
        this.minSpeed = data.minSpeed;
        this.maxSpeed = data.maxSpeed;

        this.deck = [];
        this.deck.push(this.Skill(0)); // 참조 복사라 여러 개 넣어도 괜찮아요
        this.deck.push(this.Skill(0));
        this.deck.push(this.Skill(0));
        this.deck.push(this.Skill(1));
        this.deck.push(this.Skill(1));
        this.deck.push(this.Skill(2));
        this.readyDeck = [...this.deck]; // 아니 근데 레디덱을 돌리면 전략성이란게 너무 없어지잖아 그러면 당장은 덱 하나로 하자

        this.shuffleDeck(this.deck);
        this.shuffleDeck(this.readyDeck); // 일단은 더미로 남겨놓긴 했음 ㅇㅇ
        this.Slots.push(new BattleSlot(this));
    }
    Skill(i: number): Skill {
        return this.Skills.GetSkill(i);
    }
    loseHP(amount: number) {
        this.Stats.LoseHP(amount);
    }
    loseSP(amount: number) {
        this.Stats.LoseSP(amount);
    }
    recoverSP(amount: number) {
        this.Stats.recoverSp(amount);
    }
    takeDamage(damage: number) {
        const result = this.Stats.takeDamage(damage);
        let staggerResult = result.StaggerState;
        switch (this.BattleState.GetState()) {
            case "STAGGERED+": // 얘는 두번 증가시켜야되고
                staggerResult++;
            case "STAGGERED":
                staggerResult++; // 얘는 한번 증가시키면 되니까 ㅇㅇ
        }
        if (staggerResult > 3)
            staggerResult = 3;

        switch (staggerResult) {
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
    takeStagger(damage: number)
    {
        const result = this.Stats.takeStaggerDamage(damage);
        
    }
    SpeedSetting()
    {
        const minSpeed = this.minSpeed;
        const maxSpeed = this.maxSpeed;
        this.speed = Math.floor(Math.random()*(maxSpeed-minSpeed+1)) + minSpeed; // 스피드 세팅
        this.speed += 0; // 당장은 더미로 남겨놓고(신속, 속박 처리)
        if (this.speed <= 0)
            this.speed = 1;
        console.log(`${this.name}의 속도: ${this.speed}`);
    }

    ResetCondition(): void {
        // (1) 체력, 정신력 초기화
        this.Stats.reset();
        this.BattleState.ChangeState("NORMAL");
        // >< 버프리스트 초기화
        // (3) 스킬슬롯에서 스킬 빼내기
        this.Slots.forEach((element) =>{
            element.readySkill = null;
        });
        // 덱 섞기
        this.shuffleDeck(this.deck);
        this.shuffleDeck(this.readyDeck);
    }

    // 슬롯 관리
    SkillSelect(deckIndex: 0 | 1, index: number = 0) {
        if (this.deck[deckIndex]) {
            this.Slots[index]?.skillSelect(this.deck[deckIndex], deckIndex);
        }
    }
    AddSlot(): number {
        this.Slots.push(new BattleSlot(this));
        const newLen = this.Slots.length;
        return newLen - 1; // 인덱스 접근할 거니까 이게 맞아 ㅇㅇ
    }

    // 이벤트 관리들

    CoinToss() {
        this.bufList.OnCoinToss();
    }
    ClashWin(clashCount: number) {
        this.recoverSP(10 + (clashCount * 2)); // 초상마냥 정신력조건 뒤집힌 애도 있고 필싱처럼 회복량 다른 경우도 있어서 나중에는 stat으로 보내야함...
        this.BattleState.ChangeState('CLASHWIN');
    }
    ClashLose() {
        // 나중에 추가   
        this.BattleState.ChangeState('CLASHLOSE');
    }

    shuffleDeck(deck: Skill[]) {
        deck.sort(() => Math.random() - 0.5);
    }

    useSkill(choice: 0 | 1): Skill | void {
        if (this.deck[choice]) {
            if (choice === 0) {
                this.deck.push(this.deck[choice]); // 맨 뒤로 보내고
                this.deck.shift(); // 1칸 민다
            }
            else // choice === 1
            {
                let tmp = this.deck[0]; // 사실 얘는 무조건 있는거긴함
                this.deck.push(this.deck[choice]); // 밀고
                this.deck.shift();
                if (tmp)
                    this.deck[0] = tmp;
            }
            return this.deck[choice];
        }
    }


    // 클라이언트 전달용 데이터 변환 함수
    public toData() {
        return {
            // 1. 기본 스탯 정보
            id: this.id, // (선택) 클라에서 유닛 구분할 때 ID가 있으면 편함
            lv: this.Stats.lv,
            name: this.name,
            hp: this.Stats.hp,
            maxHp: this.Stats.maxHp, 
            sp: this.Stats.sp,
            speed: this.speed,
            
            // 흐트랑 내성
            stagger: [...this.Stats.stagger], 
            resistP: { ...this.Stats.resistP }, 
            resistS: { ...this.Stats.resistS },

           // 3. 하단 스킬 패널 (deck)
            // ★ 헬퍼 함수 덕분에 한 줄로 끝!
            skills: this.deck.map(skill => this.serializeSkill(skill)),

            // 4. 상단 장착 슬롯 (Slots)
            // ★ Slots 배열 전체를 돌면서 readySkill을 빼와서 헬퍼 함수에 던짐!
            slots: this.Slots.map(slot => this.serializeSkill(slot.readySkill))
        };
    }

    // ★ [추가] 스킬 데이터를 클라이언트용으로 포장해주는 헬퍼 함수 (DRY 원칙 적용!)
    private serializeSkill(skill: Skill | null ) {
        if (!skill) return null; // 스킬이 없으면 null 반환

        return {
            name: skill.name,
            color: skill.color, 
            desc: skill.desc,
            basePower: skill.BasePower,
            coinPower: skill.coinlist[0]?.CoinPower || 0,
            coinNum: skill.coinlist.length,
            coinDescs: skill.coinlist.map(coin => {
                if (coin.coindescs && Array.isArray(coin.coindescs)) {
                    return coin.coindescs.map((d: any) => d.desc).join(', ');
                }
                return "";
            })
        };
    }
}

export function createSinnerFromData(id: number, partyID: number = 0): Character {
    // 데이터에서 해당 수감자 정보 찾기
    const sinnerData = data.Identities.find(sinner => sinner.id === id);
    if (!sinnerData) {
        throw new Error(`수감자 ID ${id}에 해당하는 데이터를 찾을 수 없습니다.`);
    }
    return new Character(sinnerData.name, sinnerData.id, sinnerData, partyID);
}

