import { InvalidUserId } from "../Common/GlobalDefines";
import { BindParameter } from "./main";
import { SceneUserInfo } from "../Common/CMD_CenterServer";
import { GameScene } from "./GameScene";
import { MainId_FS, SubId_FS_Frame, SubFSFrameNTC_Chat, SubFSFrameReq_Chat } from "../Common/CMD_FightServer";
import { InvalidChairId, GameUserStatus } from "./GameCommon/GameInterfaces";




export class GameUser
{
	private m_pBindParameter:						BindParameter;

	private m_nUserId:								number;
	private m_sUserName:							string;
	private m_sUserPhoto:							string;

	private m_sLoginKey:							string;

	private m_nGameGold:							number;
	private m_nExperience:							number;

	private m_pGameScene:							GameScene;

	private m_bOnline:								boolean;
	private m_bAndroid:								boolean;

	private m_eUserStatus:							GameUserStatus;

	private m_nChairId:								number;

	constructor()
	{
		this.m_pBindParameter = null;
		this.m_nUserId = InvalidUserId;
		this.m_sUserName = "";
		this.m_sUserPhoto = "";

		this.m_sLoginKey = "";

		this.m_nGameGold = 0;

		this.m_pGameScene = null;
		this.m_bOnline = false;
		this.m_bAndroid = false;

		this.m_eUserStatus = GameUserStatus.Idle;

		this.m_nChairId = InvalidChairId
	}

	public Release()
	{
		if(this.m_pBindParameter !== null)
		{
			this.m_pBindParameter.nUserId = InvalidUserId;
		}

		this.m_nUserId = InvalidUserId;
		this.m_sUserName = "";
		this.m_sUserPhoto = "";

		this.m_sLoginKey = "";

		this.m_nGameGold = 0;

		this.m_pGameScene = null;
		this.m_bOnline = false;
		this.m_bAndroid = false;

		this.m_eUserStatus = GameUserStatus.Idle;

		this.m_nChairId = InvalidChairId;
	}

	public SetFightInfo(pFightInfo: SceneUserInfo, pGameScene: GameScene, nChairId: number)
	{
		this.m_nUserId = pFightInfo.nUserId;
		this.m_sUserName = pFightInfo.sUserName;
		this.m_sUserPhoto = pFightInfo.sUserPhoto;
		this.m_sLoginKey = pFightInfo.sLoginKey;
		this.m_nGameGold = pFightInfo.nGameGold;
		this.m_nExperience = pFightInfo.nExperience;

		this.m_bAndroid = pFightInfo.bAndroid;

		this.m_pGameScene = pGameScene;

		this.m_bOnline = false;
		this.m_pBindParameter = null;

		this.m_eUserStatus = GameUserStatus.Idle;

		this.m_nChairId = nChairId;
	}

	public OnLogin(pBindParameter: BindParameter)
	{
		this.m_pBindParameter = pBindParameter;

		this.m_bOnline = true;

		this.m_pGameScene.OnUserStatus(this, true);
	}

	public OnOffline()
	{
		this.m_bOnline = false;

		this.m_pGameScene.OnUserStatus(this, false);

		if(this.m_pBindParameter !== null)
		{
			this.m_pBindParameter.nUserId = InvalidUserId;
		}

		this.m_pBindParameter = null;
	}

	public OnLeave()
	{
		this.m_pGameScene.OnUserStatus(this, false, false);
	}

	public OnReallyLeave()
	{
		this.m_bOnline = false;

		if(this.m_pBindParameter !== null)
		{
			this.m_pBindParameter.nUserId = InvalidUserId;
		}

		this.m_pBindParameter = null;
	}

	public GetUserId()
	{
		return this.m_nUserId;
	}

	public GetUserName()
	{
		return this.m_sUserName;
	}

	public GetUserPhoto()
	{
		return this.m_sUserPhoto;
	}

	public GetGameGold()
	{
		return this.m_nGameGold;
	}

	public GetExperience()
	{
		return this.m_nExperience;
	}

	public GetUserStatus()
	{
		return this.m_eUserStatus;
	}

	public SendGameMessage(nSubId: number, pData: any)
	{
		if(this.IsOnline() === false) return false;

		this.m_pBindParameter.pNetConnection.SendMessage(MainId_FS.Game, nSubId, pData);

		return true;
	}

	public SendFrameMessage(nSubId: number, pData: any)
	{
		if(this.IsOnline() === false) return false;

		this.m_pBindParameter.pNetConnection.SendMessage(MainId_FS.Frame, nSubId, pData);

		return true;
	}

	public CheckLoginKey(sLoginKey: string)
	{
		console.log("Kesy:", this.m_sLoginKey, " : ", sLoginKey);
		return (this.m_sLoginKey === sLoginKey);
	}

	public IsOnline()
	{
		return this.m_bOnline;
	}

	public IsAndroid()
	{
		return this.m_bAndroid;
	}

	public IsReady()
	{
		return this.m_eUserStatus === GameUserStatus.Ready;
	}

	public ChangeGameStatus(eStatus: GameUserStatus)
	{
		this.m_eUserStatus = eStatus;

		this.m_pGameScene.OnUserStatus(this, false);
	}

	public ChangeGameGold(nChange: number)
	{
		this.m_nGameGold += nChange;

		this.m_pGameScene.OnUserStatus(this, false);
	}

	public UpdateProperty(nGameGold: number, nExperience: number)
	{
		this.m_nGameGold = nGameGold;
		this.m_nExperience = nExperience;

		this.m_pGameScene.OnUserStatus(this, false);
	}

	public GetBindParameter()
	{
		return this.m_pBindParameter;
	}

	public OnFrameMessage(nSubId: number, pData: any)
	{
		let bRet = false;

		switch(nSubId)
		{
		case SubId_FS_Frame.SubId_FS_Frame_Req_GameScene:
			{
				this.m_pGameScene.OnGameScene(this.m_nChairId);
				
				if(this.m_eUserStatus === GameUserStatus.Idle)
				{
					this.ChangeGameStatus(GameUserStatus.Ready);
				}

				bRet = true;
			}
			break;
		case SubId_FS_Frame.SubId_FS_Frame_Req_Ready:
			{
				if(this.m_eUserStatus === GameUserStatus.Idle)
				{
					this.ChangeGameStatus(GameUserStatus.Ready);
				}

				bRet = true;
			}
			break;
		case SubId_FS_Frame.SubId_FS_Frame_Req_Chat:
			{
				let pReq: SubFSFrameReq_Chat = pData;

				let pChat: SubFSFrameNTC_Chat = {
					nUserId: this.m_nUserId,
					sMsg: pReq.sMsg
				};

				this.m_pGameScene.SendFrameMessage(InvalidChairId, SubId_FS_Frame.SubId_FS_Frame_Notice_Chat, pChat);
				
				bRet = true;
			}
			break;
		case SubId_FS_Frame.SubId_FS_Frame_Req_ForceQuit:
			{
				this.m_pGameScene.ForceEnd(this.m_nChairId);
				bRet = true;
			}
			break;
		}

		return bRet;
	}

	public OnGameMessage(nSubId: number, pData: any)
	{
		return this.m_pGameScene.OnGameMessage(this.m_nChairId, nSubId, pData);
	}
}



export let GGameUserManager: GameUserManager = null;


export class GameUserManager
{
	private m_mapUsers:									Array<GameUser>


	constructor()
	{
		this.m_mapUsers = [];

		GGameUserManager = this;
	}

	public FindUser(nUserId: number, bCreate: boolean)
	{
		let pGameUser = this.m_mapUsers[nUserId];

		if(pGameUser === undefined || pGameUser === null)
		{
			if(bCreate === true)
			{
				this.m_mapUsers[nUserId] = new GameUser();
				pGameUser = this.m_mapUsers[nUserId];
			}
			else
			{
				pGameUser = null;
			}
		}

		return pGameUser;
	}

	public ReleaseUser(nUserId)
	{
		let pGameUser = this.m_mapUsers[nUserId];

		if(pGameUser === undefined || pGameUser === null)
		{
			throw new Error("xxxxxxxxxxxxxxxxxxxxxxxxxxxx");
			return;
		}

		pGameUser.Release();

		this.m_mapUsers[nUserId] = null;
	}
}