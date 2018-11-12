import { GameEngine, GameRandom } from "../Core/GameEngine";
import { NetWorker } from "../Core/Network/NetWorker";
import { GConfig } from "../Core/GlobalConfig";
import { NetConnection } from "../Core/Network/Connection";
import { MessageHead } from "../Core/Message";
import { InvalidUserId, ServerKind, InvalidServerId, IsValidServerId, IsValidUserId, GameErrors } from "../Common/GlobalDefines";
import { MainId_CS, 
	UserConnectionInfo, 
	SubId_CS_Register, 
	SubCSRegisterRep_RegisterSuccess, 
	SubCSRegisterRep_RegisterFailure, 
	SubId_CS_UserLogin, 
	SubCSUserLoginRep_LoginSuccess, 
	SubCSRegisterReq_RegisterGate, 
	SubCSRegisterReq_RegisterFight, 
    SubCSUserLoginReq_Login,
    SubCSUserLoginRep_LoginFailure,
    SubCSUserMatchingRep_NormalMatchingSuccess,
    SubId_CS_UserMatching,
    SubCSUserMatchingRep_NormalMatchingFailure,
    SubCSFightFrameReq_AllocateScene,
    SceneUserInfo,
    SubId_CS_FightFrame,
    SubCSFightFrameNotice_GameEnd,
    SubCSFightFrameNotice_Release,
    SubCSUserLoginReq_Logout} from "../Common/CMD_CenterServer";
import { GateServer } from "./GateServer";
import { FightServer } from "./FightServer";
import { GameUser, GGameUserManager, GameUserManager } from "./GameUser";
import { DBReq_UserLogin, DBRequestId, DBRep_UserLoginSuccess, DBResponseId, DBRep_UserLoginFailure, DBRep_LoadRanking, DBReq_WriteGameEnd, DBReq_ChangeGameGold } from "./DatabasePacket";
import { GameMatchingManager, GGameMatchingManager } from "./GameMatchingManager";
import { Database, DBConnection, DBRequest, DBResponse } from "../Core/Database/MSSQL";
import * as mssql from "mssql"
import { GGameSceneManager, GameSceneManager } from "./GameSceneManager";
import { GGameRankingManager, GameRankingManager } from "./GameRanking";


const Error_UnRegistered = 0;
const Error_UnHandle = 1;



interface BindParameter
{
    pNetConnection:                             NetConnection;
    nServerId:									number;
	eServerKind:								ServerKind;
    sServerName:                                string;
};

const TimerId_Matching: number					= 1;
const TimerId_UpdateRanking: number				= 2;

const Timeout_Matching: number					= 3;
const Timeout_UpdateRanking: number				= 60;


export class GameCenter extends GameEngine
{
    private m_pBindParameters:                  Array<BindParameter>;
    private m_pGateServers:						Array<GateServer>
	private m_pFightServers:					Array<FightServer>

    constructor()
    {
        super();

        this.m_pBindParameters = [];

        for(let i = 0; i < GConfig.ServerConfig.nMaxConnection; i++)
        {
            this.m_pBindParameters[i] = {
                pNetConnection: null,
                nServerId: InvalidServerId,
				eServerKind: ServerKind.Invalid,
				sServerName: ""
            };
        }

		this.m_pGateServers = new Array();
		this.m_pFightServers = new Array();

		new GameUserManager();
		new GameSceneManager();
		new GameMatchingManager();
		new GameRankingManager();
    }

    private GetBindParameter(nBindIndex: number)
    {
        const pBindParameter = this.m_pBindParameters[nBindIndex];

        if(pBindParameter === undefined || pBindParameter === null)
        {
            throw new Error("Invalid BindIndex:" + nBindIndex);
        }

        return pBindParameter;
    }

    protected CreateNetworker()
    {
        this.m_network = new NetWorker(
            GConfig.ServerConfig.sServiceAddr,
            GConfig.ServerConfig.nServicePort,
            GConfig.ServerConfig.nMaxConnection, 
            true, null, null);

        return true;
    }

	protected CreateDatabase()
	{
		this.m_db = new Database();

		return true;
	}

    public Start(): boolean
    {
		super.Start();

        this.m_network.Start();

		GGameRankingManager.LoadRanking();

		this.SetTimer(TimerId_Matching, Timeout_Matching*1000, -1, null);
		this.SetTimer(TimerId_UpdateRanking, Timeout_UpdateRanking*1000, -1, null);

		GGameUserManager.CreateAndroidUsers();

        return true;
    }

    //网络连接接口 监听
    public OnNetworkBind(pConn: NetConnection): boolean
    {
        const pBindParameter = this.GetBindParameter(pConn.GetConnectionIdR());

        if(pBindParameter === null)
        {
            return false;
        }

        pBindParameter.pNetConnection = pConn;
		pBindParameter.nServerId = 0;
		pBindParameter.eServerKind = ServerKind.Invalid;
		pBindParameter.sServerName = "";
		
        console.log("on client bind");
        return true;
    }

    public OnNetworkShut(pConn: NetConnection): void
    {
        const pBindParameter = this.GetBindParameter(pConn.GetConnectionIdR());

        if(pBindParameter === null)
        {
            return;
        }

		if (pBindParameter.eServerKind === ServerKind.GateServer)
		{
			this.m_pGateServers[pBindParameter.nServerId].OnShut();
		}
		else if (pBindParameter.eServerKind === ServerKind.FightServer)
		{
			this.m_pFightServers[pBindParameter.nServerId].OnShut();
		}

		pBindParameter.pNetConnection = null;
		pBindParameter.nServerId = 0;
		pBindParameter.eServerKind = ServerKind.Invalid;
		pBindParameter.sServerName = "";
		
        console.log("on client shut");
    }

    public OnNetworkRead(pConn: NetConnection, nMainId: number, nSubId: number, pData: any): boolean
    {
		const pBindParameter = this.GetBindParameter(pConn.GetConnectionIdR());

		let bSuccess = false;

		try
		{
			switch (pBindParameter.eServerKind)
			{
			case ServerKind.Invalid:
				{
					if (nMainId !== MainId_CS.Register)
					{
						throw Error_UnRegistered;
					}
					else
					{
						bSuccess = this.OnNetworkRegister(nSubId, pData, pBindParameter);
					}
				}
				break;
			case ServerKind.GateServer:
				{
					bSuccess = this.OnNetworkGate(nMainId, nSubId, pData, pBindParameter);
				}
				break;
			case ServerKind.FightServer:
				{
					bSuccess = this.OnTCPNetworkFight(nMainId, nSubId, pData, pBindParameter);
				}
				break;
			}
		}
		catch (err)
		{
			if(err === Error_UnRegistered)
			{
				console.log("OnNetworkRead: 消息处理异常：", nMainId, "-", nSubId, " 服务未注册！");
			}
			else if(err === Error_UnHandle)
			{
				console.log("OnNetworkRead: 消息处理异常：", nMainId, "-", nSubId, " 消息未处理，服务器类型：", pBindParameter.eServerKind, "！");
			}
			else
			{
				console.log("OnNetworkRead: 消息处理异常：", nMainId, "-", nSubId, " 服务器类型：%d！", pBindParameter.eServerKind, "，异常：", err);
			}
		
			return true;
		}
		
		if (!bSuccess)
		{
			console.log("OnNetworkRead: return false, ", nMainId, "-", nSubId, ".");
		}
	
		return true;
    }

    //网络连接接口 主动连接
    public OnSocketBind(pConn: NetConnection): boolean
    {
        return true;
    }

    public OnSocketShut(pConn: NetConnection): void
    {
        
    }

    public OnSocketRead(pConn: NetConnection, nMainId: number, nSubId: number, pData: any): boolean
    {
        return true;
    }

	public FindFightServer()
	{
		let pFightServer: FightServer = null;

		for(let i = 0; i < InvalidServerId; i++)
		{
			if(this.m_pFightServers[i] === undefined || this.m_pFightServers[i] === null) continue;

			if(this.m_pFightServers[i].IsOnline() === false) continue;

			pFightServer = this.m_pFightServers[i];
			break;
		}

		return pFightServer;
	}

     //定时器接口
    public OnTimer(nTimerId: number, pBindData: any): boolean
    {
        let bRet = false;

        switch(nTimerId)
        {
		case TimerId_Matching:
			{
				GGameMatchingManager.OnMatchingTimer();

				bRet = true;
			}
			break;
		case TimerId_UpdateRanking:
			{
				GGameRankingManager.LoadRanking();
				
				bRet = true;
			}
			break;
        }

        return bRet;
    }

	//数据库接口
    public OnDatabaseRequest(dbConn: DBConnection, dbReq: DBRequest): Promise<boolean>
    {
		switch(dbReq.nRequestId)
		{
		case DBRequestId.Req_LoadRanking:
			{
				return this.OnDBRLoadRanking(dbConn, dbReq.data);
			}
		case DBRequestId.Req_UserLogin:
			{
				return this.OnDBRUserLogin(dbConn, dbReq.data);
			}
		case DBRequestId.Req_WriteGameEnd:
			{
				return this.OnDBRWriteGameEnd(dbConn, dbReq.data);
			}
		case DBRequestId.Req_ChangeGameGold:
			{
				return this.OnDBRChangeGameGold(dbConn, dbReq.data);
			}
		}
        return Promise.resolve(true);
    }

    public OnDatabaseResponse(dbResp: DBResponse): boolean
    {
		switch(dbResp.nResponseId)
		{
		case DBResponseId.Rep_LoadRanking:
			{
				const pDBRepLoadRanking: DBRep_LoadRanking = dbResp.data;

				GGameRankingManager.OnDBLoadRanking(pDBRepLoadRanking);

				return true;
			}
			break;
		case DBResponseId.Rep_UserLoginSuccess:
			{
				const pDBLoginSuccess: DBRep_UserLoginSuccess = dbResp.data;

				let pGameUser = GGameUserManager.FindUserOnCreate(pDBLoginSuccess.nUserId, pDBLoginSuccess.sAccount);

				if(pGameUser === null)
				{
					throw new Error("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
				}
				else
				{
					if(pGameUser.IsOnline())
					{
						pGameUser.SendNoticeError("", GameErrors.LoginOtherPlace);
					}
				}

				pGameUser.OnUserOnlineEx(pDBLoginSuccess);
			}
			break;
		case DBResponseId.Rep_UserLoginFailure:
			{
				const pDBLoginFailure: DBRep_UserLoginFailure = dbResp.data;

				let pLoginFailure: SubCSUserLoginRep_LoginFailure = {
					nErrCode: 0,
					userConnInfo: pDBLoginFailure.userConnInfo
				};

				this.SendMessageToGateServer(pDBLoginFailure.userConnInfo.nServerId, MainId_CS.UserLogin, SubId_CS_UserLogin.Rep_LoginFailure, pLoginFailure);
			}
			break;
		}

        return true;
    }

	public OnDBRLoadRanking(dbConn: DBConnection, pLoadRanking: any): Promise<boolean>
	{
		dbConn.ResetParameter();

		return dbConn.Execute("LoadRanking").then((ret: number)=>{
			if(ret === 0)
			{
				let pDBRepRanking: DBRep_LoadRanking = {
					mapRankings: []
				};

				while(dbConn.IsRecordsetEnd() === false)
				{
					pDBRepRanking.mapRankings.push({
						nUserId: Number(dbConn.GetValue("UserId")),
						nRank: Number(dbConn.GetValue("Ranking")),
						nScore: Number(dbConn.GetValue("GameGold")),
						sUserName: dbConn.GetValue("UserName"),
						sUserPhoto: dbConn.GetValue("UserPhoto")
					});

					dbConn.MoveToNext();
				}

				this.m_db.SendResponse(DBResponseId.Rep_LoadRanking, pDBRepRanking, 0);
			}

			return Promise.resolve(true);
		}).catch((e)=>{
			return Promise.resolve(true);
		});
	}

	public OnDBRUserLogin(dbConn: DBConnection, pLogin: DBReq_UserLogin): Promise<boolean>
	{
		dbConn.ResetParameter();

		dbConn.AddParameter("UserAccount", mssql.NVarChar(32), pLogin.sAccount);
		dbConn.AddParameter("UserName", mssql.NVarChar(32), pLogin.sUserName);

		const sPhotoEncode = Buffer.from(pLogin.sUserPhoto).toString('hex');

		dbConn.AddParameter("UserPhoto", mssql.NVarChar(512), sPhotoEncode);

		return dbConn.Execute("UserLogin").then((ret: number)=>{
			if(ret === 0)
			{
				let pLoginSuccess: DBRep_UserLoginSuccess = {
					nUserId: Number(dbConn.GetValue("UserId")),
					nGameGold: Number(dbConn.GetValue("GameGold")),
					sAccount: pLogin.sAccount,
					sUserName: pLogin.sUserName,
					sUserPhoto: pLogin.sUserPhoto,
					sDevice: pLogin.sDevice,
					nExperience: Number(dbConn.GetValue("Experience")),
					nGameTimes: Number(dbConn.GetValue("GameTimes")),
					nWinTimes: Number(dbConn.GetValue("WinTimes")),
					nGinTimes: Number(dbConn.GetValue("GinTimes")),
					nBigGinTimes: Number(dbConn.GetValue("BigGinTimes")),
					nUndercutTimes: Number(dbConn.GetValue("UndercutTimes")),
					nMaxWinStreak: Number(dbConn.GetValue("MaxWinStreak")),
					userConnInfo: pLogin.userConnInfo
				};

				this.m_db.SendResponse(DBResponseId.Rep_UserLoginSuccess, pLoginSuccess, 0);
			}
			else
			{
				let pLoginFailure: DBRep_UserLoginFailure = {
					nErrCode: 0,
					userConnInfo: pLogin.userConnInfo
				};

				this.m_db.SendResponse(DBResponseId.Rep_UserLoginFailure, pLoginFailure, 0);
			}

			return Promise.resolve(true);
		}).catch((e)=>{
			return Promise.resolve(true);
		});
	}

	public OnDBRChangeGameGold(dbConn: DBConnection, pChangeGameGold: DBReq_ChangeGameGold): Promise<boolean>
	{
		dbConn.ResetParameter();

		dbConn.AddParameter("UserId", mssql.BigInt as any, pChangeGameGold.nUserId);
		dbConn.AddParameter("GoldChange", mssql.BigInt as any, pChangeGameGold.nChangeGold);

		return dbConn.Execute("ChangeGameGold").then((ret: number)=>{
			if(ret === 0)
			{
				
			}

			return Promise.resolve(true);
		}).catch((e)=>{
			return Promise.resolve(true);
		});
	}

	public OnDBRWriteGameEnd(dbConn: DBConnection, pWriteGameEnd: DBReq_WriteGameEnd): Promise<boolean>
	{
		dbConn.ResetParameter();

		dbConn.AddParameter("UserId", mssql.BigInt as any, pWriteGameEnd.nUserId);
		dbConn.AddParameter("Experience", mssql.Int as any, pWriteGameEnd.nExperience);
		dbConn.AddParameter("GameTimes", mssql.Int as any, pWriteGameEnd.nGameTimes);
		dbConn.AddParameter("WinTimes", mssql.Int as any, pWriteGameEnd.nWinTimes);
		dbConn.AddParameter("GinTimes", mssql.Int as any, pWriteGameEnd.nGinTimes);
		dbConn.AddParameter("BigGinTimes", mssql.Int as any, pWriteGameEnd.nBigGinTimes);
		dbConn.AddParameter("UndercutTimes", mssql.Int as any, pWriteGameEnd.nUndercutTimes);
		dbConn.AddParameter("MaxWinStreak", mssql.Int as any, pWriteGameEnd.nMaxWinStreak);

		return dbConn.Execute("WriteGameEnd").then((ret: number)=>{
			if(ret === 0)
			{
				
			}

			return Promise.resolve(true);
		}).catch((e)=>{
			return Promise.resolve(true);
		});
	}


	public OnNetworkRegister(nSubId: number, pData: any, pBindParameter: BindParameter): boolean
	{
		switch (nSubId)
		{
		case SubId_CS_Register.Req_RegisterGate:
			{
				const pRegister = pData as SubCSRegisterReq_RegisterGate;
				
				let pRegisterFailure: SubCSRegisterRep_RegisterFailure = {
					nErrCode: 0,
					sErrMsg: ""
				};

				if (pBindParameter.eServerKind !== ServerKind.Invalid)
				{
					pRegisterFailure.sErrMsg = "错误，登录服务器重复注册";

					this.SendMessageByParamerter(pBindParameter, MainId_CS.Register, SubId_CS_Register.Rep_RegisterFailure, pRegisterFailure);

					return false;
				}

				if (IsValidServerId(pRegister.nGateId) === false)
				{
					pRegisterFailure.sErrMsg = "错误，无效的服务器Id";

					this.SendMessageByParamerter(pBindParameter, MainId_CS.Register, SubId_CS_Register.Rep_RegisterFailure, pRegisterFailure);

					return false;
				}

				if (this.m_pGateServers[pRegister.nGateId] !== undefined && this.m_pGateServers[pRegister.nGateId] !== null)
				{
					if (this.m_pGateServers[pRegister.nGateId].IsOnline())
					{
						pRegisterFailure.sErrMsg = "已经存在相同标识的登录服务器，登录服务器注册失败";

						this.SendMessageByParamerter(pBindParameter, MainId_CS.Register, SubId_CS_Register.Rep_RegisterFailure, pRegisterFailure);

						return false;
					}
				}
				else
				{
					this.m_pGateServers[pRegister.nGateId] = new GateServer();
				}

				this.m_pGateServers[pRegister.nGateId].OnRegister(pRegister.nGateId, pBindParameter.pNetConnection.GetConnectionIdR());

				console.log("网关服务器[", pRegister.nGateId, "] 注册成功.");

				pBindParameter.nServerId = pRegister.nGateId;
				pBindParameter.eServerKind = ServerKind.GateServer;
				pBindParameter.sServerName = "";
				
				let pRegisterSuccess: SubCSRegisterRep_RegisterSuccess = {
				};

				this.SendMessageByParamerter(pBindParameter, MainId_CS.Register, SubId_CS_Register.Rep_RegisterSuccess, pRegisterSuccess);

				return true;
			}
		case SubId_CS_Register.Req_RegisterFight:
			{
				const pRegister = pData as SubCSRegisterReq_RegisterFight;
				
				let pRegisterFailure: SubCSRegisterRep_RegisterFailure = {
					nErrCode: 0,
					sErrMsg: ""
				};

				if (pBindParameter.eServerKind !== ServerKind.Invalid)
				{
					pRegisterFailure.sErrMsg = "错误，战斗服务器重复注册";

					this.SendMessageByParamerter(pBindParameter, MainId_CS.Register, SubId_CS_Register.Rep_RegisterFailure, pRegisterFailure);

					return false;
				}

				if (IsValidServerId(pRegister.nServerId) === false)
				{
					pRegisterFailure.sErrMsg = "错误，无效的服务器Id";

					this.SendMessageByParamerter(pBindParameter, MainId_CS.Register, SubId_CS_Register.Rep_RegisterFailure, pRegisterFailure);

					return false;
				}

				if (this.m_pFightServers[pRegister.nServerId] !== undefined && this.m_pFightServers[pRegister.nServerId] !== null)
				{
					if (this.m_pFightServers[pRegister.nServerId].IsOnline())
					{
						pRegisterFailure.sErrMsg = "已经存在相同标识的战斗服务器，战斗服务器注册失败";

						this.SendMessageByParamerter(pBindParameter, MainId_CS.Register, SubId_CS_Register.Rep_RegisterFailure, pRegisterFailure);

						return false;
					}
				}
				else
				{
					this.m_pFightServers[pRegister.nServerId] = new FightServer();
				}

				this.m_pFightServers[pRegister.nServerId].OnRegister(pData as SubCSRegisterReq_RegisterFight, pBindParameter.pNetConnection.GetConnectionIdR());

				pBindParameter.nServerId = pRegister.nServerId;
				pBindParameter.eServerKind = ServerKind.FightServer;
				pBindParameter.sServerName = pRegister.sServerName;

				console.log("战斗服务器[", pRegister.sServerName, "(", pRegister.sServerAddr, ":", pRegister.nServerPort, ")] 注册成功.");
				
				let pRegisterSuccess: SubCSRegisterRep_RegisterSuccess = {
				};

				this.SendMessageByParamerter(pBindParameter, MainId_CS.Register, SubId_CS_Register.Rep_RegisterSuccess, pRegisterSuccess);

				return true;
			}
		}

		return false;
	}

	public OnNetworkSubUserLogin(nSubId: number, pData: any, pBindParameter: BindParameter)
	{
		switch (nSubId)
		{
		case SubId_CS_UserLogin.Req_Login:
			{
				const pLogin: SubCSUserLoginReq_Login = pData as SubCSUserLoginReq_Login;
				
				let pGameUser = GGameUserManager.FindUserByAccount(pLogin.sUserAccount);

				if(pGameUser !== null)
				{
					if(pGameUser.IsAndroid())
					{
						let pLoginFailure: SubCSUserLoginRep_LoginFailure = {
							userConnInfo: pLogin.userConnInfo,
							nErrCode: GameErrors.InvalidAccount
						};

						this.SendMessageToGateServer(pLogin.userConnInfo.nServerId, MainId_CS.UserLogin, SubId_CS_UserLogin.Rep_LoginFailure, pLoginFailure);

						return true;
					}

					if(pGameUser.IsOnline())
					{
						pGameUser.SendNoticeError("", GameErrors.LoginOtherPlace);
					}

					pGameUser.OnUserOnline(pLogin);
				}
				else
				{
					let dbRequest: DBReq_UserLogin = {
						userConnInfo: {
							nUserId: pLogin.userConnInfo.nUserId,
							nServerId: pBindParameter.nServerId,
							nBindIndex: pLogin.userConnInfo.nBindIndex,
							nSessionId: pLogin.userConnInfo.nSessionId
						},
						sAccount: pLogin.sUserAccount,
						sUserName: pLogin.sUserName,
						sUserPhoto: pLogin.sUserPhoto,
						sDevice: pLogin.sDevice
					}

					this.SendDatabaseRequest(DBRequestId.Req_UserLogin, dbRequest, 0);
				}
				
				return true;
			}
			break;
		case SubId_CS_UserLogin.Req_Logout:
			{
				const pLogout: SubCSUserLoginReq_Logout = pData;
				
				let pGameUser = GGameUserManager.FindUserById(pLogout.userConnInfo.nUserId);

				if(pGameUser !== null)
				{
					if(pGameUser.IsAndroid())
					{
						return true;
					}

					if(pGameUser.IsSameConnection(pLogout.userConnInfo) === false)
					{
						return true;
					}

					pGameUser.OnUserLogout();
				}
				
				return true;
			}
			break;
		}

		return false;
	}

	public OnNetworkGate(nMainId: number, nSubId: number, pData: any, pBindParameter: BindParameter): boolean
	{
		let bSuccess: boolean = false;

		if((pData.userConnInfo as UserConnectionInfo).nServerId != pBindParameter.nServerId)
		{
			console.log("异常：连接信息附带的ID与网关ID不一致。");
			return false;
		}

		if (nMainId == MainId_CS.UserLogin)
		{
			bSuccess = this.OnNetworkSubUserLogin(nSubId, pData, pBindParameter);
		}
		else
		{
			let pGameUser: GameUser = null;

			switch (nMainId)
			{
			case MainId_CS.UserUpdate:
			case MainId_CS.UserNotice:
			case MainId_CS.UserMatching:
			case MainId_CS.UserRanking:
			case MainId_CS.UserShare:
				{
					const pUserConnectionInfo: UserConnectionInfo = pData.userConnInfo;

					if(IsValidUserId(pUserConnectionInfo.nUserId) === false)
					{
						console.log("OnNetworkGate: ", nMainId, "-", nSubId, " 玩家ID不正确！");
						return false;
					}

					pGameUser = GGameUserManager.FindUserById(pUserConnectionInfo.nUserId);
				
					if(pGameUser === null || pGameUser.IsOnline() === false)
					{
						console.log("OnNetworkGate: ", nMainId, "-", nSubId, " 玩家当前不在线！");
						return false;
					}
				}
				break;
			default:
				{
					throw Error_UnHandle;
				}
			}

			switch (nMainId)
			{
			case MainId_CS.UserUpdate:
				{
					//bSuccess = pGameUser->OnUserUpdate(pMsgHead);
				}
				break;
			case MainId_CS.UserNotice:
				{
					//bSuccess = pGameUser->OnUserNotice(pMsgHead);
				}
				break;
			case MainId_CS.UserMatching:
				{
					bSuccess = pGameUser.OnUserMatching(nSubId, pData);
				}
				break;
			case MainId_CS.UserRanking:
				{
					bSuccess = pGameUser.OnUserRanking(nSubId, pData);
				}
				break;
			case MainId_CS.UserShare:
				{
					bSuccess = pGameUser.OnUserShare(nSubId, pData);
				}
				break;
			}
		}

		return bSuccess;
	}

	public OnTCPNetworkFight(nMainId: number, nSubId: number, pData: any, pBindParameter: BindParameter): boolean
	{
		let bSuccess: boolean = false;

		switch (nMainId)
		{
		case MainId_CS.FightFrame:
			{
				bSuccess = this.OnNetworkFightFrame(nSubId, pData);
			}
			break;
		default:
			{
				throw Error_UnHandle;
			}
		}

		return bSuccess;
	}

	public OnNetworkFightFrame(nSubId: number, pData: any)
	{
		let bSuccess: boolean = false;

		switch(nSubId)
		{
		case SubId_CS_FightFrame.Notice_GameEnd:
			{
				let pGameEnd: SubCSFightFrameNotice_GameEnd = pData;

				let users: Array<number> = GGameSceneManager.GetSceneUsers(pGameEnd.nSceneIndex);

				for(let i = 0; i < users.length; i++)
				{
					let pGameUser = GGameUserManager.FindUserById(users[i]);

					for(let j = 0; j < pGameEnd.gameEndUserInfo.length; j++)
					{
						if(pGameUser.GetUserId() === pGameEnd.gameEndUserInfo[j].nUserId)
						{
							pGameUser.OnGameEnd(pGameEnd.gameEndUserInfo[j]);
							break;
						}
					}
				}
			}
			break;
		case SubId_CS_FightFrame.Notice_Release:
			{
				let pSceneRelease: SubCSFightFrameNotice_Release = pData;

				console.log("释放场景[", pSceneRelease.nSceneIndex, "]");

				let users: Array<number> = GGameSceneManager.GetSceneUsers(pSceneRelease.nSceneIndex);

				for(let i = 0; i < users.length; i++)
				{
					let pGameUser = GGameUserManager.FindUserById(users[i]);

					console.log("释放场景玩家[", users[i], "]");

					pGameUser.OnSceneRelease();
				}

				GGameSceneManager.ReleaseScene(pSceneRelease.nSceneIndex);
			}
			break;
		}

		return bSuccess;
	}

	public SendMessage(nBindIndex: number, nMainId: number, nSubId: number, pData: any): boolean
	{
		const pBindParameter = this.GetBindParameter(nBindIndex);

		if(pBindParameter === null) return false;

		pBindParameter.pNetConnection.SendMessage(nMainId, nSubId, pData);

		return true;
	}

	public SendMessageByParamerter(pBindParameter: BindParameter, nMainId: number, nSubId: number, pData: any): boolean
	{
		pBindParameter.pNetConnection.SendMessage(nMainId, nSubId, pData);

		return true;
	}

	public SendMessageToGateServer(nGateId: number, nMainId: number, nSubId: number, pData: any)
	{
		const pGate = this.m_pGateServers[nGateId];

		if(pGate === undefined || pGate === null)
		{
			return false;
		}

		return pGate.SendMessage(nMainId, nSubId, pData);
	}
}


export function CreateGameEngine()
{
    new GameCenter();
}