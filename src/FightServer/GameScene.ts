import { GameUser, GGameUserManager } from "./GameUser";
import { GameRandom, GGameEngine } from "../Core/GameEngine";
import { IEXEScene, InvalidChairId, IDLLScene, GGameTimerIdRange, GGameTimerIdBase, GameUserStatus, GameEndReason } from "./GameCommon/GameInterfaces";
import { FightServer } from "./main";
import { MainId_FS, SubFSFrameNTC_UserStatus, SubId_FS_Frame } from "../Common/CMD_FightServer";
import { SubCSFightFrameReq_AllocateScene, SubCSFightFrameNotice_GameEnd, MainId_CS, SubId_CS_FightFrame, SubCSFightFrameNotice_Release } from "../Common/CMD_CenterServer";
import { GConfig } from "../Core/GlobalConfig";
import { CreateGameLogic } from "./GinRummy/GameLogic";













export enum SceneStatus
{
	Idle,
	Waiting,
	Gaming,
};



export class GameScene implements IEXEScene
{
	private m_nId:								number;
	private m_eSceneStatus:						SceneStatus;
	private m_pGameLogic:						IDLLScene;

	private m_pGameUsers:						Array<GameUser>;
	private m_nCustomRule:						number;
	private m_nCellScore:						number;
	
	private m_nSceneIndex:						number;

	private m_nTimeout:							number;
	private m_bCanRelease:						boolean;

	constructor(nId: number)
	{
		this.m_nId = nId;
		this.m_eSceneStatus = SceneStatus.Idle;

		this.m_pGameUsers = [];

		this.m_nCustomRule = 0;
		this.m_nCellScore = 0;

		this.m_nSceneIndex = -1;

		this.m_pGameLogic = CreateGameLogic(this, 2);

		this.m_nTimeout = 0;
		this.m_bCanRelease = false;
	}

	public IsIdle()
	{
		return this.m_eSceneStatus === SceneStatus.Idle;
	}

	public IsWaiting()
	{
		return this.m_eSceneStatus === SceneStatus.Waiting;
	}

	public Allocate(pAllocateInfo: SubCSFightFrameReq_AllocateScene)
	{
		this.m_eSceneStatus = SceneStatus.Waiting;

		this.m_nSceneIndex = pAllocateInfo.nSceneIndex;
		this.m_nCustomRule = pAllocateInfo.nCustomRule;
		this.m_nCellScore = pAllocateInfo.nCellScore;

		for(let i = 0; i < pAllocateInfo.sceneUsers.length; i++)
		{
			let pGameUser = GGameUserManager.FindUser(pAllocateInfo.sceneUsers[i].nUserId, true);

			this.m_pGameUsers[i] = pGameUser;

			pGameUser.SetFightInfo(pAllocateInfo.sceneUsers[i], this, i);

			if(pGameUser.IsAndroid())
			{
				pGameUser.ChangeGameStatus(GameUserStatus.Ready);
			}
		}

		this.m_pGameLogic.InitScene();

		this.m_nTimeout = process.uptime() + 60;

		this.m_bCanRelease = false;
	}

	public Release()
	{
		this.m_eSceneStatus = SceneStatus.Idle;

		this.m_pGameUsers = [];
		this.m_nCustomRule = 0;
		this.m_nCellScore = 0;
		this.m_nSceneIndex = -1;

		this.m_pGameLogic.OnClear();
		this.m_nTimeout = 0;

		this.m_bCanRelease = false;
	}

	public GetChairUserId(nChairId: number): number
	{
		return this.m_pGameUsers[nChairId].GetUserId();
	}

	public GetChairUserGameGold(nChairId: number): number
	{
		return this.m_pGameUsers[nChairId].GetGameGold();
	}

	public GetChairUserOnline(nChairId: number): boolean
	{
		return this.m_pGameUsers[nChairId].IsOnline();
	}

	public GetChairUserAndroid(nChairId: number): boolean
	{
		return this.m_pGameUsers[nChairId].IsAndroid();
	}

	public GetCustomRule(): number
	{
		return this.m_nCustomRule;
	}

	public GetCellScore(): number
	{
		return this.m_nCellScore;
	}

	public SendMessage(nChairId: number, nSubId: number, pData: any)
	{
		if(nChairId >= this.m_pGameUsers.length)
		{
			for(let i = 0; i < this.m_pGameUsers.length; i++)
			{
				this.m_pGameUsers[i].SendGameMessage(nSubId, pData);
			}
		}
		else
		{
			this.m_pGameUsers[nChairId].SendGameMessage(nSubId, pData);
		}
	}

	public SendFrameMessage(nChairId: number, nSubId: number, pData: any)
	{
		if(nChairId >= this.m_pGameUsers.length)
		{
			for(let i = 0; i < this.m_pGameUsers.length; i++)
			{
				this.m_pGameUsers[i].SendFrameMessage(nSubId, pData);
			}
		}
		else
		{
			this.m_pGameUsers[nChairId].SendFrameMessage(nSubId, pData);
		}
	}

	public SendGameScene(nChairId: number, pScene: any)
	{
		if(nChairId >= this.m_pGameUsers.length)
		{
			return;
		}
		else
		{
			this.m_pGameUsers[nChairId].SendFrameMessage(SubId_FS_Frame.SubId_FS_Frame_Rep_GameScene, pScene);
		}
	}

	public SetGameTimer(nTimerId: number, nDelay: number, nTimes: number)
	{
		if(nTimerId >= GGameTimerIdRange)
		{
			throw new Error("xxxxxxxxxxxxxxxxxxxxxxxxxxx");
			return false;
		}

		let nTimerIdReally = GGameTimerIdBase + this.m_nId * GGameTimerIdRange + nTimerId;

		return (GGameEngine as FightServer).SetTimer(nTimerIdReally, nDelay, nTimes, null);
	}

	public KillGameTimer(nTimerId: number)
	{
		if(nTimerId >= GGameTimerIdRange)
		{
			throw new Error("xxxxxxxxxxxxxxxxxxxxxxxxxxx");
			return false;
		}

		let nTimerIdReally = GGameTimerIdBase + this.m_nId * GGameTimerIdRange + nTimerId;

		return (GGameEngine as FightServer).KillTimer(nTimerIdReally);
	}

	public OnUserStatus(pGameUser: GameUser, bLogin: boolean, bOnline?: boolean)
	{
		let onLine = pGameUser.IsOnline();

		if(bOnline === false)
		{
			onLine = bOnline;
		}
		let pUserStatus: SubFSFrameNTC_UserStatus = {
			nUserId: pGameUser.GetUserId(),
			sUserName: pGameUser.GetUserName(),
			sUserPhoto: pGameUser.GetUserPhoto(),
			nGameGold: pGameUser.GetGameGold(),
			nExperience: pGameUser.GetExperience(),
			nStatus: pGameUser.GetUserStatus(),
			bOnline: onLine
		};

		let pOtherStatus: SubFSFrameNTC_UserStatus;

		for(let i = 0; i < this.m_pGameUsers.length; i++)
		{
			let pGameUserOther = this.m_pGameUsers[i];

			if(pGameUserOther === null || pGameUserOther === undefined) continue;
			
			if(bLogin === true && pGameUserOther !== pGameUser)
			{
				pOtherStatus = {
					nUserId: pGameUserOther.GetUserId(),
					sUserName: pGameUserOther.GetUserName(),
					sUserPhoto: pGameUserOther.GetUserPhoto(),
					nGameGold: pGameUserOther.GetGameGold(),
					nExperience: pGameUserOther.GetExperience(),
					nStatus: pGameUserOther.GetUserStatus(),
					bOnline: pGameUserOther.IsOnline()
				}

				pGameUser.SendFrameMessage(SubId_FS_Frame.SubId_FS_Frame_Notice_UserStatus, pOtherStatus);
			}

			pGameUserOther.SendFrameMessage(SubId_FS_Frame.SubId_FS_Frame_Notice_UserStatus, pUserStatus)
		}
	}

	public OnGameScene(nChairId: number)
	{
		this.m_pGameLogic.OnGameScene(nChairId);
	}

	public OnStartCheck(nTimeCurr: number)
	{
		if(this.m_eSceneStatus === SceneStatus.Gaming) return;

		for(let i = 0; i < this.m_pGameUsers.length; i++)
		{
			if(this.m_pGameUsers[i].IsReady() === false)
			{
				if(this.m_nTimeout < nTimeCurr)
				{
					this.ReleaseScene();
				}

				return;
			}
		}
		
		this.m_pGameLogic.OnGameStart();

		this.m_bCanRelease = false;

		for(let i = 0; i < this.m_pGameUsers.length; i++)
		{
			this.m_pGameUsers[i].ChangeGameStatus(GameUserStatus.Gaming);
		}

		this.m_eSceneStatus = SceneStatus.Gaming;
	}

	public OnGameEnd(nGoldChanges: Array<number>, nGinTimes: Array<number>, nBigGinTimes: Array<number>, nUndercutTimes: Array<number>, nEndReason: GameEndReason)
	{
		this.m_eSceneStatus = SceneStatus.Waiting;

		if(this.m_pGameLogic.HasNextInning() && nEndReason !== GameEndReason.ForceQuit)
		{
			for(let i = 0; i < this.m_pGameUsers.length; i++)
			{
				this.m_pGameUsers[i].ChangeGameStatus(GameUserStatus.Ready);
			}

			this.m_pGameLogic.OnReset();

			this.m_nTimeout = process.uptime() + 0;
		}
		else
		{
			for(let i = 0; i < this.m_pGameUsers.length; i++)
			{
				this.m_pGameUsers[i].ChangeGameStatus(GameUserStatus.Idle);
				this.m_pGameUsers[i].ChangeGameGold(nGoldChanges[i]);
			}

			this.m_pGameLogic.OnClear();

			this.m_bCanRelease = true;

			this.SendGameEndMessage(nGoldChanges, nGinTimes, nBigGinTimes, nUndercutTimes);

			if(nEndReason === GameEndReason.ForceQuit)
			{
				this.ReleaseScene();
			}
			else
			{
				this.m_nTimeout = process.uptime() + 60;
			}
		}
	}

	public SendGameEndMessage(nGoldChanges: Array<number>, nGinTimes: Array<number>, nBigGinTimes: Array<number>, nUndercutTimes: Array<number>)
	{
		let pGameEnd: SubCSFightFrameNotice_GameEnd = {
			nSceneIndex: this.m_nSceneIndex,
			gameEndUserInfo: []
		}

		for(let i = 0; i < this.m_pGameUsers.length; i++)
		{
			pGameEnd.gameEndUserInfo[i] = {
				nUserId: this.m_pGameUsers[i].GetUserId(),
				nGameGoldChange: nGoldChanges[i],
				bWin: (nGoldChanges[i] > 0) ? true : false,
				nGinTimes: nGinTimes[i],
				nBigGinTimes: nBigGinTimes[i],
				nUndercutTimes: nUndercutTimes[i]
			};
		}

		(GGameEngine as FightServer).SendMessageToCenterServer(MainId_CS.FightFrame, SubId_CS_FightFrame.Notice_GameEnd, pGameEnd);
	}

	public ReleaseScene()
	{
		//清空玩家
		//清空场景
		//发送消息

		let pGameRelease: SubCSFightFrameNotice_Release = {
			nSceneIndex: this.m_nSceneIndex
		};

		(GGameEngine as FightServer).SendMessageToCenterServer(MainId_CS.FightFrame, SubId_CS_FightFrame.Notice_Release, pGameRelease);

		for(let i = 0; i < this.m_pGameUsers.length; i++)
		{
			this.m_pGameUsers[i].OnLeave();
		}

		for(let i = 0; i < this.m_pGameUsers.length; i++)
		{
			this.m_pGameUsers[i].OnReallyLeave();
		}
		
		for(let i = 0; i < this.m_pGameUsers.length; i++)
		{
			GGameUserManager.ReleaseUser(this.m_pGameUsers[i].GetUserId());
		}

		GGameSceneManager.Release(this.m_nId);
	}

	public ForceEnd(nChairId: number)
	{
		if(this.m_bCanRelease === true)
		{
			this.ReleaseScene();
			return;
		}

		if(this.m_eSceneStatus === SceneStatus.Gaming)
		{
			this.m_pGameLogic.OnGameConclude(nChairId, GameEndReason.ForceQuit);
		}
		else
		{
			//this.ReleaseScene();
		}
	}

	public OnGameTimer(nTimerId: number): boolean
	{
		return this.m_pGameLogic.OnGameTimer(nTimerId);
	}

	public OnGameMessage(nChairId: number, nSubId: number, pData: any)
	{
		return this.m_pGameLogic.OnGameMessage(nSubId, pData, nChairId);
	}
}


export let GGameSceneManager: GameSceneManager = null;


export class GameSceneManager
{
	private m_GameScenes:									Array<GameScene>;

	constructor()
	{
		GGameSceneManager = this;

		this.m_GameScenes = [];

		for(let i = 0; i < GConfig.ServerConfig.nSceneCount; i++)
		{
			this.m_GameScenes[i] = new GameScene(i);
		}
	}

	public Allocate(): GameScene
	{
		for(let i = 0; i < GConfig.ServerConfig.nSceneCount; i++)
		{
			if(this.m_GameScenes[i].IsIdle() === false) continue;

			return this.m_GameScenes[i];
		}

		return null;
	}

	public Release(nId: number)
	{
		this.m_GameScenes[nId].Release();
	}

	public CheckSceneStart()
	{
		const nTimeCurr: number = process.uptime();

		for(let i = 0; i < GConfig.ServerConfig.nSceneCount; i++)
		{
			if(this.m_GameScenes[i].IsIdle() === true) continue;

			if(this.m_GameScenes[i].IsWaiting() === false) continue;

			this.m_GameScenes[i].OnStartCheck(nTimeCurr);
		}
	}

	public OnSceneTimer(nSceneIndex: number, nGameTimerId: number): boolean
	{
		const pGameScene = this.m_GameScenes[nSceneIndex];

		if(pGameScene === undefined || pGameScene === null)
		{
			throw new Error("xxxxxxxxxxxxxxxxxxxxxxxx");
			return false;
		}

		return pGameScene.OnGameTimer(nGameTimerId);
	}
}