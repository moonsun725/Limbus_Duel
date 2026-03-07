import { Server } from 'socket.io';
import { Player } from './10_Player.js'; // Player 내부엔 Character[]가 있다고 가정
import { Character } from '../00_Sinner/00_0_sinner.js';
import { BattleSlot } from '../00_Sinner/00_4_Slot.js';
import type { BattleCallbacks } from './Events/BattleEvents.js';
import { BattleManager } from '../03_BattleSystem/BattleManager.js'; // ★ 매니저 추가
import { ActManager } from '../03_BattleSystem/ActManager.js';
import { buildParty } from './Utils/buildParty.js';

// 상태 머신: typescript에서는 enum보다 유니온 쓰는 게 낫대!
type RoomState = 'MOVE_SELECT' | 'TARGET_SELECT' | 'WAITING_OPPONENT' | 'BATTLE' | 'RESULT';
let lockOrder = 0;

// 행동 종류: 스킬 선택 / 타깃 선택 / 선택 완료 버튼 선택 / 수비 스킬 선택 / 에고 스킬 선택
export type ActionType = 'skillSelect' | 'targetSelect' | 'BattleStart';
// 행동 데이터 구조체
export interface BattleAction {
    type: ActionType;
    userIndex: number; // 어떤 캐릭터 슬롯에서 행동이 나왔는지 (0~5)
    actionIndex: number; // 시작 버튼(0), 슬롯 인덱스(0,1) 또는 타깃 인덱스(0~5), 에고(0,1,2,3,4)
}

// 딜레이 함수
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class GameRoom {
    public roomId: string;

    // 게임 상태 변수들 (server.ts의 전역 변수들이 멤버 변수가 됨)

    // 플레이어 객체 
    p1: Player | null = null;
    p2: Player | null = null;
    public players: { [socketId: string]: 'p1' | 'p2' } = {}; // 소켓ID -> 역할 매핑

    private p1Action: BattleAction[] | null = null; // 여러 슬롯을 지정할 수 있으므로 배열
    private p2Action: BattleAction[] | null = null; // >< 얘도 꼭 필요함?

    // ★ [New] 현재 방의 상태 (기본값: 전투 중)
    public gameState: RoomState = 'MOVE_SELECT';

    // 매니저 클래스
    private battleManager: BattleManager;
    private actManager: ActManager;

    // UI 동기화용 콜백
    private callbacks: BattleCallbacks;

    private ActorList: BattleSlot[] = []; //  >< 이거 꼭 필요하냐?

    // 준비 상태 체크 변수 (둘 다 준비해야 전투 시작 가능)
    private p1Ready: boolean = false;
    private p2Ready: boolean = false;

    // ★ [New] 누가 교체해야 하는지 기억해둘 변수 (기절한 플레이어 ID)
    public faintPlayerId: string | null = null;

    constructor(id: string, io: Server) {
        this.roomId = id;

        this.callbacks = {
            onLog: (msg) => {
                console.log(`[Battle] ${msg}`);
                io.to(this.roomId).emit('chat message', msg);
            },
            onAttackStart: async (attacker, target, skill, coins) => {
                const atkRole = this.getOwnerRole(attacker); // 'p1' or 'p2'
                const defRole = this.getOwnerRole(target);

                if (!atkRole || !defRole) return;

                io.to(this.roomId).emit('anim_attack_start', {
                    attacker: {
                        role: atkRole,
                        id: attacker.id,      // 이거 캐릭터 ID보다 player.party.getIndex하는게 나아
                        name: attacker.name,  // UI 표시용
                        skill: {
                            name: skill.name,
                            coinCount: coins.length // 남은 코인 개수
                        },
                        power: skill.BasePower, // (혹은 현재 누적된 power를 넘겨줘도 됨)
                        coinPower: coins[0]?.CoinPower || 0 // 첫 번째 코인의 위력 (있다면)
                    },
                    defender: {
                        role: defRole,
                        id: target.id,        // ★ [추가] 방어자도 누군지 알아야 함
                        name: target.name

                    }
                });

                // 공격 시작 전 '두근!' 하는 딜레이
                await sleep(300);
            },
            onClashStart: async (slot1: BattleSlot, slot2: BattleSlot) => {
                const char1 = slot1.owner;
                const skill1 = slot1.readySkill;

                // ★ [핵심] 1. char1이 누구 팀인지 확인 (이미 만든 메서드 활용)
                // char1이 P1 팀이면 'p1', P2 팀이면 'p2'가 나옴
                const role1 = this.getOwnerRole(char1);

                const char2 = slot2.owner;
                const skill2 = slot2.readySkill;

                // 2. 데이터를 만드는 함수 (내부에서만 쓸 거니 간단하게 정의)
                // 타입을 굳이 안 적어도 JS 객체로 잘 넘어갑니다.
                const createDto = (c: any, s: any) => ({
                    char: {
                        id: c.id,
                        name: c.name,
                        hp: c.Stats.hp,
                        maxHp: c.Stats.maxHp
                    },
                    skill: {
                        name: s?.name || "스킬 없음",
                        coinCount: s?.coinlist.length || 0
                    },
                    power: s?.BasePower || 0,
                    coinPower: s?.coinlist[0]?.CoinPower || 0
                });

                // 3. 데이터 생성
                const data1 = createDto(char1, skill1);
                const data2 = createDto(char2, skill2);

                // 4. ★ [핵심] 자리에 맞게 끼워넣기
                // role1이 'p1'이면 -> p1 자리에 data1 (char1)
                // role1이 'p2'이면 -> p1 자리에 data2 (char2) ... 즉, 진짜 P1을 찾아서 넣음
                const clashData = {
                    p1: (role1 === 'p1') ? data1 : data2,
                    p2: (role1 === 'p2') ? data1 : data2
                };

                io.to(this.roomId).emit('anim_clash_start', clashData);
                await sleep(500);
            },
            onCoinToss: async (char: Character, isHeads: boolean) => {
                const role = this.getOwnerRole(char);
                if (!role) return;

                // ★ 핵심: ID가 아니라 role('p1' or 'p2')을 보냄
                io.to(this.roomId).emit('individual_coin_result', {
                    role: role,
                    isHead: isHeads
                    // 이거 나중에 코인위력이 갱신될 수 있어서 봐야됨
                });

                // 원래는 요게 시간이 상수로 딱 정해져있고 코인개수에 따른 함수식으로 각 코인별 딜레이가 달라지긴 하는 것 같은데 잘 모르겠네
                await sleep(80);
            },
            onClashResult: async (c1, p1, count1, c2, p2, count2, clashCount) => {

                await sleep(1000); // 코인값은 다 더해진 상태
                const r1 = this.getOwnerRole(c1);
                const r2 = this.getOwnerRole(c2);
                if (!r1 || !r2) return;
                io.to(this.roomId).emit('anim_clash_result', {
                    c1: { role: r1, power: p1, remainCoins: count1 }, // ★ 남은 코인 추가
                    c2: { role: r2, power: p2, remainCoins: count2 },
                    clashCount: clashCount
                });
                await sleep(500); // 초기화됐으니까 잠깐 멈춤
            },
            onCoinResult: async (char: Character, isHeads: boolean) => { // 이거는 Ondamage의 딜레이도 있어서 조금 빨라도 됨. 지금은 없어서 느리게 만듦.
                const role = this.getOwnerRole(char);
                if (!role) return;

                // ★ 핵심: ID가 아니라 role('p1' or 'p2')을 보냄
                io.to(this.roomId).emit('individual_coin_result', {
                    role: role,
                    isHead: isHeads
                    // 여기도 코인위력 생각
                });

                await sleep(1000); // 연출 딜레이: 사실 coinToss랑 똑같지만 콜백 따로쓰기
            },
            onGetHit: async (target, motionType) => {
                const role = this.getOwnerRole(target); // 맞는 쪽(Target) 찾기
                if (!role) return;

                io.to(this.roomId).emit('anim_hit_reaction', {
                    role: role,
                    motion: motionType
                });

                // ★ 타격감의 핵심! 쾅! 하고 0.4초 멈춥니다.
                await sleep(400);
            },

            // 2. 데미지 UI: 딜레이 없이 바로 쏴줍니다.
            onDamage: async (target, damage) => {
                const role = this.getOwnerRole(target);
                if (!role) return;

                io.to(this.roomId).emit('anim_damage_ui', {
                    role: role,
                    damage: damage,
                    hp: target.Stats.hp,
                    maxHp: target.Stats.maxHp
                });

                // ★ 여기는 sleep 없음! (화상/독 데미지 등도 빠르게 처리 가능)
            },
            onAttackEnd: async (attacker, target) => {
                const atkRole = this.getOwnerRole(attacker); // 'p1' or 'p2'
                const defRole = this.getOwnerRole(target);

                if (!atkRole || !defRole) return;
                io.to(this.roomId).emit('anim_attack_end', {
                    atkRole: atkRole,
                    defRole: defRole
                });
            },

        }
        // ★ BattleManager 초기화 (콜백 주입 - 여기서 UI 갱신 로직 정의)

        this.battleManager = new BattleManager(this.callbacks);
        this.actManager = new ActManager();
    }
    private sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    // [Helper] 캐릭터가 P1 소속인지 P2 소속인지 객체 주소로 비교
    private getOwnerRole(char: Character): 'p1' | 'p2' | null {

        // 1. P1 파티 확인
        if (this.p1 && this.p1.party.includes(char)) return 'p1';

        // 2. P2 파티 확인
        if (this.p2 && this.p2.party.includes(char)) return 'p2';

        console.warn(`[getOwnerRole] Role Not Found for ${char.name}`);
        return null;
    }

    // 유저 입장 처리
    join(socketId: string, io: Server, teamData?: any[]): 'p1' | 'p2' | 'spectator' {

        // 헬퍼 함수: 플레이어 세팅 (P1, P2 공통 로직)
        const setupPlayer = (pid: 'p1' | 'p2'): Player => {
            const party = buildParty(teamData);
            const player = new Player(socketId, party); // 

            this.players[socketId] = pid; // 'p1' or 'p2' 저장
            return player;
        };

        if (!this.p1) {
            this.p1 = setupPlayer('p1');
            console.log(`[Room] Player 1 입장 (ID: ${socketId})`);
            if(this.p1 && this.p2) {
                // this.resetGame();
                this.startTurn(io);
            }
            return 'p1';
        }
        else if (!this.p2) {
            this.p2 = setupPlayer('p2');
            console.log(`[Room] Player 2 입장 (ID: ${socketId})`);
            if(this.p1 && this.p2) {
                // this.resetGame();
                // 이제 둘 다 들어왔으니까 턴 시작 이벤트 실행해도 되겠지?
                this.startTurn(io);
            }

            return 'p2';

            
        }

        return 'spectator';
    }

    // 유저 퇴장 처리
    leave(socketId: string) {
        const role = this.players[socketId];

        // socketId 매핑 정보 삭제
        delete this.players[socketId];

        if (role === 'p1') {
            this.p1 = null; // 자리 비우기 (객체 삭제)
            this.p1Action = null; // 선택 정보 초기화
            console.log(`[Room: ${this.roomId}] Player 1 퇴장. 자리가 비었습니다.`);
        } else if (role === 'p2') {
            this.p2 = null;
            this.p2Action = null;
            console.log(`[Room: ${this.roomId}] Player 2 퇴장. 자리가 비었습니다.`);
        }

        return role; // 누가 나갔는지 반환 (로그용)
    }

    // 행동 분할: 공격 and 교체
    handleAction(socketId: string, action: BattleAction, io: Server) {
        // FSM: 현재 상태에 따라 처리 로직을 완전히 분리

        console.log(`[room.ts]/[handleAction]: User(${socketId}) Action: ${action.type}, Current State: ${this.gameState}`);

        switch (this.gameState) {
            case 'MOVE_SELECT':
                this.handleMoveSelect(socketId, action, io);
            case 'TARGET_SELECT':
                this.handleTargetSelect(socketId, action, io);
            case 'WAITING_OPPONENT': // 전투 시작까지 눌렀으면 낙장불입이제
                this.handleBattleStart(socketId, io);
                break;
            case 'BATTLE': // 이때는 씬 전환이 있을 예정이에요
                break;

            case 'RESULT': // 기절 교체 대기 중
                break;

            case 'BATTLE': // 연산 중일 때는 입력 차단
                return;
        }
    }

    handleMoveSelect(socketId: string, action: BattleAction, io: Server) {
        const role = this.players[socketId];
        if (!role) return;

        const player = (role === 'p1') ? this.p1 : this.p2;
        if (!player) return;

        // action.userIndex: 캐릭터 슬롯 번호 (0~5)
        // action.actionIndex: 스킬 슬롯 번호 (0: 위, 1: 아래)
        const userChar = player.battleEntry[action.userIndex];
        if (!userChar) return;

        // [Source 5] room의 actManager에 의해 맵에 할당 (스킬 장착)
        this.actManager.SkillSelect(userChar, action.actionIndex as 0 | 1);

        // [UI Sync] 해당 유저에게만 "선택됨" 신호 전송 (하이라이트 표시용)
        io.to(socketId).emit('ui_move_selected', {
            userIndex: action.userIndex,
            skillSlot: action.actionIndex
        });

        console.log(`[Room] ${role}: Skill Selected: Unit ${action.userIndex}, Skill ${action.actionIndex}`);
    }

    // 2. 타겟 선택 핸들러
    handleTargetSelect(socketId: string, action: BattleAction, io: Server) {
        const role = this.players[socketId];
        if (!role) return;

        // 아군(Attacker)과 적군(Target) 구분
        const me = (role === 'p1') ? this.p1 : this.p2;
        const opp = (role === 'p1') ? this.p2 : this.p1;
        if (!me || !opp) return;

        const userChar = me.battleEntry[action.userIndex];      // 공격자
        const targetChar = opp.battleEntry[action.actionIndex]; // 방어자 (actionIndex를 타겟 유닛 인덱스로 사용)

        if (!userChar || !targetChar) return;

        // [Source 5] ActManager에 타겟 매핑
        // (주의: SkillSelect가 선행되어야 함)
        this.actManager.TargetLock(userChar, targetChar);

        // [UI Sync] 방 전체에 "타겟 지정됨" 신호 전송 (화살표 그리기용)
        io.to(this.roomId).emit('ui_target_locked', {
            srcPlayer: role,        // 누가 (p1 or p2)
            srcIndex: action.userIndex,  // 몇 번 유닛이
            targetIndex: action.actionIndex // 몇 번 유닛을
        });

        console.log(`[Room] Target Locked: ${role}: Unit ${action.userIndex + 1}(${userChar.name}) -> Enemy Unit ${action.actionIndex + 1}(${targetChar.name})`);
    }

    // 시작 버튼
    handleBattleStart(socketId: string, io: Server) {
        // ... (준비 체크 로직 기존과 동일) ...
        const role = this.players[socketId];
        if (!role) return;

        console.log(`[Room] ${role} Ready!`);

        // UI 잠금 (해당 유저에게만)
        io.to(socketId).emit('input_locked');
        if (role === 'p1') this.p1Ready = true;
        if (role === 'p2') this.p2Ready = true;
        // 양쪽 플레이어가 모두 준비되었다면?
        if (this.p1Ready && this.p2Ready) {
            console.log("All Ready! Switching to Battle Screen.");

            // ★ [이거 추가] 양쪽 클라이언트에게 "화면 바꿔라" 신호 전송
            io.to(this.roomId).emit('battle_start_confirmed');

            this.ActorList = this.actManager.orderSort(); // ★ 순서 정렬 먼저 필수!
            this.ActorList.forEach((element, i) => {
                console.log("[플레이어]", this.getOwnerRole(element.owner), "[순서]:", i, '번', element.owner.name, "[속도]:", element.speed, "[선택 스킬]:", element.readySkill?.name);
            });
            this.StartCombat(io);          // ★ 전투 루프 실행
        }
    }

    async StartCombat(io: Server) // 비동기 함수
    {
        for (let user of this.actManager.turnOrder) {
            // 1. 이미 행동을 마친 경우(나보다 빠른 대상에 의해 합이 걸려왔다든지) 스킵
            console.log("************************", user.owner.name, "차례");

            if (!user.readySkill) {
                console.log("이미 스킬 사용됨");
                continue;
            }

            // 나중에는 수비 스킬 여부도 체크

            // 2. 타겟이 없는 경우 스킵
            let uTarget = this.actManager.ActorList.get(user);
            if (!uTarget) {
                console.log("타겟 없음");
                continue;
            }

            let tTarget = uTarget.targetSlot
            console.log(`${user.owner.name}의 타겟: ${uTarget.owner.name}, ${uTarget.owner.name}의 타겟: ${tTarget?.owner.name || "없음"}`);
            if (tTarget && tTarget === user && tTarget.readySkill && uTarget.readySkill) {
                    await this.battleManager.Clash(user, uTarget); 
                }// await this.battleManager.handleskillActions() 나중에는 스킬의 종류에 따라 합이 가능한지 따지는 로직 
            else
                await this.battleManager.Attack(user, uTarget, user.readySkill?.coinlist);
        }
        // 루프 다 돌았으니 
        this.endTurn(io); // 턴 종료 처리 (버프/상태이상 업데이트, UI 갱신, 다음 턴 신호 등)
    }

    // 턴 종료 시 공통 처리 (함수로 분리 추천)
    private endTurn(io: Server) {
        console.log("=== 턴 종료 ===");

        // 버프/상태이상 업데이트
        // p1.activePokemon.bufList.UpdateTurn()...
        if (!this.p1 || !this.p2) return;
        for (let char of this.p1.battleEntry) {
            if (char) {
                char.BattleState.ChangeState('TURNEND');
            }
        }
        for (let char of this.p2.battleEntry) {
            if (char) {
                char.BattleState.ChangeState('TURNEND');
            }
        }

        this.p1Ready = false;
        this.p2Ready = false;
        this.gameState = 'MOVE_SELECT';

        // UI 전체 갱신 (싱크 맞추기)
        this.startTurn(io);
    }

    private startTurn(io: Server) {
        console.log("=== 턴 시작 ===");
        this.gameState = 'MOVE_SELECT';
        if (!this.p1 || !this.p2) return; // 여기에서 없으면 나갔다는 뜻이라, 화면에 알림 같은 걸 띄울수도 있을거임

        console.log('p1 파티 속도 갱신');
        for (let char of this.p1.battleEntry) {
            if (char) {
                char.BattleState.ChangeState('TURNSTART');
            }
        }
        console.log('p2 파티 속도 갱신');
        for (let char of this.p2.battleEntry) {
            if (char) {
                char.BattleState.ChangeState('TURNSTART');
            }
        }
        // 위의 과정에서 개별 속도 정리는 했을거고
        this.p1.battleEntry.sort((a,b) => b.speed - a.speed);
        this.p2.battleEntry.sort((a,b) => b.speed - a.speed);

        this.broadcastState(io);
    }

    // 행동 취소 반영 함수
    cancelAction(socketId: string, io: Server) {
        if (this.gameState !== 'WAITING_OPPONENT') return; // 아마 이 상황을 볼 일은 없을겁니다(왜냐하면 button.disabled에서 처리를 해주고 있으니 최소한의 안전장치라 생각)

        const role = this.players[socketId];
        if (!role) return;

        // 1. 행동 데이터 삭제
        if (role === 'p1') this.p1Action = null;
        if (role === 'p2') this.p2Action = null;

        // 2. 로그 출력 (선택사항)
        console.log(`[Cancel] ${role} 행동 취소`);

        // 3. (중요) 상대방에게 알림?
        // 보통 포켓몬 쇼다운에서는 상대가 취소했는지 안 알려줍니다. (심리전)
        // 하지만 나한테는 "취소되었습니다"라고 확실히 알려주는 게 좋습니다.
        io.to(socketId).emit('chat message', '✅ 행동을 취소했습니다.');
        this.gameState = 'MOVE_SELECT';
    }

    // UI 업데이트 헬퍼
    // UI는 턴 시작시 갱신하도록 하자
    broadcastState(io: Server) {
        // [Helper] 플레이어의 battleEntry(출전 캐릭터들)를 UI 데이터로 변환하는 함수
        // toData() 메서드가 없다면 여기서 직접 객체를 만들어줍니다.
        const getEntryData = (player: Player | null) => {
            if (!player || !player.battleEntry) return [];

            return player.battleEntry.map(char => {
                // 빈 슬롯이거나 없는 경우 처리
                if (!char) return null;

                // ★ [수정] 직접 매핑하지 말고, Character 클래스의 toData()를 사용하세요.
                // toData() 내부에서 순환 참조를 피해 안전한 데이터만 뽑아주도록 구현되어 있습니다.
                return char.toData();
            });
        };

        // 1. 데이터 안전하게 준비 (activePokemon -> battleEntry로 변경)
        const entry1Data = getEntryData(this.p1);
        const entry2Data = getEntryData(this.p2);

        // (파티 정보는 대기열 멤버를 보여줄 때 필요하므로 유지)
        const p1PartyData = this.p1 ? this.p1.party.map(p => p.toData ? p.toData() : p) : null;
        const p2PartyData = this.p2 ? this.p2.party.map(p => p.toData ? p.toData() : p) : null;

        // 2. 클라이언트로 전송
        io.to(this.roomId).emit('turn_start', { // 매핑 해제는 플레이어가 얼마든지 할 수 있
            p1: {
                active: entry1Data, // 이제 배열([])이 전송됩니다.
                party: p1PartyData 
            },

            p2: {
                active: entry2Data,
                party: p2PartyData
            },

            gameState: this.gameState,
            faintPlayerId: this.faintPlayerId
        });
    }

    resetGame()
    {
        this.p1?.reset();
        this.p2?.reset();
    }
}