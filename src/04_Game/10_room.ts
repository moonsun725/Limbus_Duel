// room.ts
import { Server } from 'socket.io';
import { Player } from './11_Player.js';
import { Character, createSinnerFromData } from '../00_Sinner/00_0_sinner.js';
import { type Skill } from '../01_Skill/01_0_skill.js';

import type { Move } from '../Scripts/Game/pokemon.js';


/*
변수/함수 목록


*/


// 행동의 종류: 기술(move) or 교체(switch)
export type ActionType = 'atk' | 'def' | 'ego';

// 상태 머신
type RoomState = 'MOVE_SELECT' | 'BATTLE' | 'FORCE_SWITCH' | 'WAITING_OPPONENT';

// 행동 데이터 구조체
export interface BattleAction {
    type: ActionType;
    index: number; // 기술 번호(0~3) 혹은 파티 번호(0~5)
}

export class GameRoom {
    public roomId: string;
    
    // 게임 상태 변수들 (server.ts의 전역 변수들이 멤버 변수가 됨)
    
    // 플레이어 / 수감자 객체 생성 
    p1: Player | null = null; // >< 의미: "p1 변수는 Player 객체일 수도 있고, 아무도 안 들어와서 null일 수도 있다. 그리고 시작할 때는 null이다."
    p2: Player | null = null;
    public players: { [socketId: string]: 'p1' | 'p2' } = {}; // 소켓ID -> 역할 매핑
    
    private p1Action: BattleAction | null = null;
    private p2Action: BattleAction | null = null;

    // ★ [New] 현재 방의 상태 (기본값: 전투 중)
    public gameState: RoomState = 'MOVE_SELECT'; 
    
    // ★ [New] 누가 교체해야 하는지 기억해둘 변수 (기절한 플레이어 ID)
    public faintPlayerId: string | null = null;

    constructor(id: string) {
        this.roomId = id;
    }
    // entry : Pokemon[] = [createPokemon("피카츄"), createPokemon("이상해씨")]; // 당장은 더미로 만들어
    // >< 이렇게 만들면 레퍼런스 복사라 플레이어별로 따로 만들어줘야 함

    // 유저 입장 처리
    join(socketId: string): 'p1' | 'p2' | 'spectator' // 유니온 연산 사용
    {
        if (!this.p1) {
            const newParty = [createSinnerFromData(10101), createSinnerFromData(10201), createSinnerFromData(10301), createSinnerFromData(10401), createSinnerFromData(10501), createSinnerFromData(10601), createSinnerFromData(10701), createSinnerFromData(10801), createSinnerFromData(10901), createSinnerFromData(11001), createSinnerFromData(11101), createSinnerFromData(11201)];
            // 이것도 하드코딩이라 고쳐야 함
            this.p1 = new Player(socketId, newParty)
            this.p1.activeSinner = this.p1.party[this.p1.getCount()]!; // 림버스는 그래도 newParty 서순 그대로 들고가면 될듯...
            this.players[socketId] = 'p1';
            return 'p1';
        } else if (!this.p2) {
            const newParty2  = [createSinnerFromData(10101), createSinnerFromData(10201), createSinnerFromData(10301), createSinnerFromData(10401), createSinnerFromData(10501), createSinnerFromData(10601), createSinnerFromData(10701), createSinnerFromData(10801), createSinnerFromData(10901), createSinnerFromData(11001), createSinnerFromData(11101), createSinnerFromData(11201)];
            this.p2 = new Player(socketId, newParty2)
            this.p2.activeSinner = this.p2.party[this.p2.getCount()]!; // 야 시발 근데 나중에 6대6까진 만들거잖아 active하나만 만든다고 될게 아닌데??????
            this.players[socketId] = 'p2';
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

    }

    private handleBattleInput(socketId: string, action: BattleAction, io: Server) {

    }

    private handleFaint(target: Player, io: Server) {

    }


    // 턴 계산 로직 (기존 함수 이식)
    private resolveTurn(io: Server) {
        
    }

    // 턴 종료 시 공통 처리 (함수로 분리 추천)
    private endTurn(io: Server) {
 
    }


    // 행동 취소 반영 함수
    cancelAction(socketId: string, io: Server)
    {
        
    }

    // UI 업데이트 헬퍼
    broadcastState(io: Server) {
        if (!this.p1 || !this.p2) return;
        let poke1 = this.p1.activeSinner;
        let poke2 = this.p2.activeSinner;

        io.to(this.roomId).emit('update_ui', {
            
            p1: { 
                active : poke1,
                party : this.p1.party
             },

            p2: { active : poke2,
                party : this.p2.party 
            },
            gameState: this.gameState,
            faintPlayerId: this.faintPlayerId
        });
    }

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
                player.activeSinner = player.party[0]!;
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
        io.to(this.roomId).emit('chat message', `🔄 게임이 재시작되었습니다. 모든 수감자가 회복되었습니다.`);
            
        // 정보 갱신 (이제 activeSinner이 0번으로 바뀌었으므로 갱신 필수)
        this.broadcastState(io);
            
        // 턴 시작 신호
        io.to(this.roomId).emit('turn_start');
    }
}