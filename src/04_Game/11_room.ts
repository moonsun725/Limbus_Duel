import { Server } from 'socket.io';
import { Player } from './10_Player.js'; // Player 내부엔 Character[]가 있다고 가정
import { buildParty } from './Utils/buildParty.js';
import { BattleManager, type BattleCallbacks } from '../03_BattleSystem/BattleManager.js'; // ★ 매니저 추가
import { ActManager } from '../03_BattleSystem/ActManager.js';
import { BattleSlot } from '../00_Sinner/00_4_Slot.js';

// 상태 머신: typescript에서는 enum보다 유니온 쓰는 게 낫대!
type RoomState = 'MOVE_SELECT' | 'TARGET_SELECT' | 'WAITING_OPPONENT' | 'BATTLE' | 'RESULT';
let lockOrder = 0;

// 행동 종류: 스킬 선택 / 타깃 선택 / 선택 완료 버튼 선택 / 수비 스킬 선택 / 에고 스킬 선택
export type ActionType = 'skillSelect' | 'targetSelect' | 'BattleStart';
// 행동 데이터 구조체
export interface BattleAction {
    type: ActionType;
    userIndex: number;
    actionIndex: number; // 시작 버튼(0), 슬롯 인덱스(0,1) 또는 타깃 인덱스(0~6), 에고(0,1,2,3,4)
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
    private p2Action: BattleAction[] | null = null;

    // ★ [New] 현재 방의 상태 (기본값: 전투 중)
    public gameState: RoomState = 'MOVE_SELECT';
    private battleManager: BattleManager;
    private actManager: ActManager;
    private ActorList: BattleSlot[] = [];

    // 준비 상태 체크 변수 (둘 다 준비해야 전투 시작 가능)
    private p1Ready: boolean = false;
    private p2Ready: boolean = false;

    // ★ [New] 누가 교체해야 하는지 기억해둘 변수 (기절한 플레이어 ID)
    public faintPlayerId: string | null = null;

    constructor(id: string, io: Server) {
        this.roomId = id;
        // ★ BattleManager 초기화 (콜백 주입 - 여기서 UI 갱신 로직 정의)
        this.battleManager = new BattleManager({
            onLog: (msg) => {
                console.log(`[Battle] ${msg}`);
                io.to(this.roomId).emit('chat message', msg);
            },
            onAttackStart: async (atkId, targetId, skillName) => {
                io.to(this.roomId).emit('anim_attack_start', { atkId, targetId, skillName });
                await this.sleep(1000); // 클라이언트 애니메이션 대기
            },
            onClashStart: async (slot1: BattleSlot, slot2: BattleSlot) => {
                // Slot이 있으니까 owner와 readySkill에 바로 접근 가능!
                const char1 = slot1.owner;
                const skill1 = slot1.readySkill; // 이제 굳이 char1.GetReadySkill() 안 해도 됨

                const char2 = slot2.owner;
                const skill2 = slot2.readySkill;

                // 클라이언트로 보낼 데이터 가공 (DTO)
                const clashData = {
                    p1: {
                        char: {
                            id: char1.id,
                            name: char1.name,
                            hp: char1.Stats.hp,
                            maxHp: char1.Stats.maxHp
                        },
                        // ★ 여기가 핵심: Slot에 있는 스킬 정보를 바로 사용
                        skill: {
                            name: skill1?.name || "스킬 없음",
                            coinCount: skill1?.coinlist.length || 0
                        },
                        power: skill1?.BasePower || 0,
                        coinPower: skill1?.coinlist[0]?.CoinPower || 0
                    },
                    p2: {
                        char: {
                            id: char2.id,
                            name: char2.name,
                            hp: char2.Stats.hp,
                            maxHp: char2.Stats.maxHp
                        },
                        skill: {
                            name: skill2?.name || "스킬 없음",
                            coinCount: skill2?.coinlist.length || 0
                        },
                        power: skill2?.BasePower || 0,
                        coinPower: skill2?.coinlist[0]?.CoinPower || 0
                    }
                };

                io.to(this.roomId).emit('anim_clash_start', clashData);
                await sleep(2000);
            },
            onCoinToss: async (isHeads) => {
                io.to(this.roomId).emit('indiviual_coin_result', { isHead: isHeads })
            },
            onClashResult: async (c1, p1, c2, p2, clashCount) => {
                // 합 도중 팅! 팅! 하는 연출 데이터 전송
                io.to(this.roomId).emit('anim_clash_coin', {
                    c1: { id: c1.id, power: p1 },
                    c2: { id: c2.id, power: p2 },
                    clashCount: clashCount
                });
                await this.sleep(500);
            },
            onCoinResult: async (isHeads, power) => {
                io.to(this.roomId).emit('anim_coin_toss', { isHeads, power });
                await this.sleep(300);
            },
            onDamage: (targetId, dmg, newHp) => {
                io.to(this.roomId).emit('update_hp', { targetId, dmg, newHp });
            }
        });
        this.actManager = new ActManager();
    }
    private sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    // 유저 입장 처리
    join(socketId: string, teamData?: any[]): 'p1' | 'p2' | 'spectator' {

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
            return 'p1';
        }
        else if (!this.p2) {
            this.p2 = setupPlayer('p2');
            console.log(`[Room] Player 2 입장 (ID: ${socketId})`);
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

            // (나중에 여기에 ActManager.StartCombat() 들어감)
        }
    }
    /*
    private handleBattleInput(socketId: string, action: BattleAction, io: Server) {
        const role = this.players[socketId];
        if (!role) return;

        // 1. 이미 선택한 사람이 또 보낸 경우 (WAITING 상태 방어)
        if (role === 'p1' && this.p1Action) return; 
        if (role === 'p2' && this.p2Action) return;

        // 2. 행동 저장
        if (role === 'p1') this.p1Action = action;
        if (role === 'p2') this.p2Action = action;
        
        // UI 잠금 (해당 유저에게만)
        io.to(socketId).emit('input_locked');
        console.log(`[room.ts]/[handleBattleInput]: ${socketId} 입력 잠금 (WAITING_OPPONENT 진입 예상)`);

        // 3. 상태 전이 판단
        if (this.p1Action && this.p2Action) {
            // 둘 다 준비 완료! -> 전투 개시
            this.gameState = 'BATTLE'; // 잠시 배틀 상태로 변경
            console.log(`[room.ts]/[handleBattleInput]: State (WAITING -> BATTLE) / 턴 계산 시작`);
            this.resolveTurn(io);      // 턴 계산 (여기서 다시 MOVE_SELECT나 FORCE_SWITCH로 바뀜)
        } else {
            // 한 명만 준비됨 -> 대기 상태
            console.log(`[room.ts]/[handleBattleInput]: State (MOVE_SELECT -> WAITING_OPPONENT) / 상대 대기 중`);
            this.gameState = 'WAITING_OPPONENT';
            const waiter = role === 'p1' ? 'P1' : 'P2';
            io.to(this.roomId).emit('chat message', `[시스템] ${waiter} 준비 완료!`);
        }
        console.log("[room.ts]/[handleBattleInput]: ",this.gameState);
    }

    private handleFaint(target: Player, deadindex: number, io: Server) {
        if (!target.isDefeated()) {
            // 1. 상태 변경
            console.log(`[room.ts]/[endTurn]: State (${this.gameState} -> FORCE_SWITCH)`);
            this.gameState = 'FORCE_SWITCH';
            
            // 2. ★ [중요] 누가 죽었는지 기억해야 함!
            this.faintPlayerId = target.id; 

            // 3. 요청 전송은 할 필요가 없다! 왜냐면 여기서는 자동 교체거든
            target.switchCharacter(deadindex);

            this.broadcastState(io); // >< 포켓몬이 기절했는데 UI 갱신 처리가 안 되어있었다...

        } else {
            // 전멸 -> 게임 종료 및 리셋
            io.to(this.roomId).emit('chat message', `🏆 ${target.id} 패배! 게임 종료.`);
            this.resetGame(io); 
        }
    }

    private sortActs(p1: Player, p2: Player, act1: BattleAction, act2: BattleAction) : { player: Player, act: BattleAction, speed: number, priority: number }[] 
    {
        const actions = [
            { player: p1, act: act1 },
            { player: p2, act: act2 }
        ];

        const turnOrder = actions.map(({ player, act }) => {
            let priority = 0;
            let speed = player.activePokemon.GetStat('spe');

            if (act.type === 'switch') {
                priority = 6; // 교체 우선도
            } else if (act.type === 'move') {
                // act.index가 기술 인덱스
                const move = player.activePokemon.moves.Get(act.index);
                if (move && move.def.priority) 
                    priority = move.def.priority;
            }

            return { player, act, speed, priority };
        });

        // 정렬 로직 (내림차순)
        turnOrder.sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority; // 우선도 높은 순
            }
            if (a.speed !== b.speed) {
                return b.speed - a.speed; // 스피드 빠른 순
            }
            return Math.random() - 0.5; // 동속 보정 (스피드 타이)
        });

        return turnOrder;
    }
    // 턴 계산 로직 (기존 함수 이식)
    private async resolveTurn(io: Server) 
    {
        if (this.gameState !== 'BATTLE') return;
        if (!this.p1 || !this.p2 || !this.p1Action || !this.p2Action) return;

        // 1️⃣ 순서 정렬
        const turnOrder = this.sortActs(this.p1, this.p2, this.p1Action, this.p2Action);

        // 2️⃣ 행동 실행
        for (const item of turnOrder) {
            const user = item.player;
            const enemy = (user === this.p1) ? this.p2 : this.p1;
            const action = item.act; // sortActs에서 act를 통째로 가져옴

            // ★ 기절 체크: 내 턴이 오기 전에 이미 기절했으면 행동 불가
            if (user.activePokemon.BattleState.Get() === "FNT") continue;

            // A. 교체 행동
            if (action.type === 'switch') {
                const success = user.switchPokemon(action.index); // index는 포켓몬 슬롯 번호
                if (success) {
                    io.to(this.roomId).emit('chat message', `🔄 ${user.id}는 ${user.activePokemon.name}(으)로 교체했다!`);
                    this.broadcastState(io);
                    await sleep(1000);
                }
            } 
            // B. 공격 행동 (교체가 아닐 때만 실행!)
            else if (action.type === 'move') {
                // 공격 실행 (메시지 출력 등은 useMove 내부나 이펙트 처리에서 담당한다고 가정)
                io.to(this.roomId).emit('chat message', `⚔️ ${user.activePokemon.name}의 공격!`);
                
                user.activePokemon.useMove(action.index, enemy.activePokemon);
                this.broadcastState(io); // HP 갱신
                await sleep(1000);

                // 상대 기절 체크
                if (enemy.activePokemon.BattleState.Get() === "FNT") {
                    io.to(this.roomId).emit('chat message', `💀 ${enemy.activePokemon.name}는 쓰러졌다!`);
                    await sleep(1000);
                    
                    // 게임 종료 또는 강제 교체 페이즈로 전환
                    this.handleFaint(enemy, io);
                    return; // ★ 누군가 쓰러지면 턴 종료 로직(날씨, 상태이상) 스킵하고 교체 화면으로
                }
            }
        }

        // 3️⃣ 턴 종료 페이즈 (날씨, 상태이상 데미지 등)
        this.endTurn(io);
    }
    */

    async StartCombat() // 비동기 함수
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
            if (tTarget && tTarget === user && tTarget.readySkill)
                await this.battleManager.Clash(user, uTarget); // await this.battleManager.handleskillActions() 나중에는 스킬의 종류에 따라 합이 가능한지 따지는 로직 
            else
                await this.battleManager.Attack(user.owner, uTarget.owner, user.readySkill, user.readySkill?.coinlist);
        }
    }
    // 턴 종료 시 공통 처리 (함수로 분리 추천)
    private endTurn(io: Server) {
        console.log("=== 턴 종료 ===");

        // 버프/상태이상 업데이트
        // p1.activePokemon.bufList.UpdateTurn()... 

        this.p1Ready = false;
        this.p2Ready = false;
        this.gameState = 'MOVE_SELECT';

        // UI 전체 갱신 (혹시 모를 싱크 맞추기)
        this.broadcastState(io);

        // 다음 턴 입력 시작 신호
        io.to(this.roomId).emit('turn_start_input');
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
        io.to(this.roomId).emit('update_ui', {
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
    /*
    resetGame(io: Server) {
        // 1. 공통 초기화 로직 (함수로 분리하여 중복 제거)
        const resetPlayerTeam = (player: Player | null) => {
            if (!player) return;

            // ★ forEach 사용법
            // player.party 배열의 모든 요소를 순회하며 'pokemon' 변수에 담아 실행
            player.party.forEach((pokemon)=>{pokemon.ResetCondition()});

            // (4) 선봉 초기화 (다시 1번 타자로 설정)
            // 게임이 리셋됐으니 다시 첫 번째 포켓몬이 나와야겠죠?
            if (player.party.length > 0) {
                player.activePokemon = player.party[0]!;
            }};

        // 2. 양쪽 플레이어 팀 리셋
        resetPlayerTeam(this.p1);
        resetPlayerTeam(this.p2);

        // 3. 행동 선택 정보 초기화
        this.p1Action = null;
        this.p2Action = null;

        this.gameState = 'MOVE_SELECT'; 
        this.faintPlayerId = null;

        // 4. UI 업데이트 및 알림
        io.to(this.roomId).emit('chat message', `🔄 게임이 재시작되었습니다. 모든 포켓몬이 회복되었습니다.`);
            
        // 정보 갱신 (이제 activePokemon이 0번으로 바뀌었으므로 갱신 필수)
        this.broadcastState(io);
            
        // 턴 시작 신호
        io.to(this.roomId).emit('turn_start');
    }
        */
}

