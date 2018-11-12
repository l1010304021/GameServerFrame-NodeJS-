import { GameEngine, GameRandom } from "../Core/GameEngine";
import { NetWorker } from "../Core/Network/NetWorker";
import { GConfig } from "../Core/GlobalConfig";
import { NetConnection } from "../Core/Network/Connection";
import { MessageHead } from "../Core/Message";
import { InvalidUserId, IsValidUserId, GameErrors } from "../Common/GlobalDefines";
import { MainId_FS, SubId_FS_Login, SubFSLoginReq_Login, SubFSLoginRep_LoginFailure, SubFSLoginRep_LoginSuccess } from "../Common/CMD_FightServer";
import { SubCSRegisterReq_RegisterFight, MainId_CS, SubId_CS_Register, SubCSRegisterRep_RegisterSuccess, SubCSRegisterRep_RegisterFailure, SubId_CS_FightFrame, SubCSFightFrameReq_AllocateScene, SubCSFightFrameReq_UserPropertyChange } from "../Common/CMD_CenterServer";
import { GGameUserManager } from "./GameUser";
import { GameUserManager } from "./GameUser";
import { GGameSceneManager, GameSceneManager } from "./GameScene";
import { GGameTimerIdBase, GGameTimerIdRange } from "./GameCommon/GameInterfaces";


const ConnectionId_CenterServer                 = 1;

const TimerId_ReconnectCenterServer             = 1;

const TimerId_StartCheck						= 10;

const TimerTimeout_ReconnectCenterServer        = 10;
const TimerTimeout_StartCheck					= 3;


export interface BindParameter
{
    pNetConnection:                             NetConnection;
    nUserId:                                    number;
};


export class FightServer extends GameEngine
{
    private m_pBindParameters:                  Array<BindParameter>;                   //连接
	private m_bReconnectCenterServer:			boolean;

    constructor()
    {
        super();

        this.m_pBindParameters = [];

        for(let i = 0; i < GConfig.ServerConfig.nMaxConnection; i++)
        {
            this.m_pBindParameters[i] = {
                pNetConnection: null,
                nUserId: InvalidUserId
            };
        }

		this.m_bReconnectCenterServer = false;

		new GameUserManager();
		new GameSceneManager();
    }

    private GetBindParameter(nId: number)
    {
        const pBindParameter = this.m_pBindParameters[nId];

        if(pBindParameter === undefined || pBindParameter === null)
        {
            throw new Error("Invalid Id:" + nId);
        }

        return pBindParameter;
    }

    protected CreateNetworker()
    {
        this.m_network = new NetWorker(
            GConfig.ServerConfig.sServiceAddr,
            GConfig.ServerConfig.nServicePort,
            GConfig.ServerConfig.nMaxConnection, 
            false, GConfig.SSLCert, GConfig.SSLKey);

        return true;
    }

    public ConnectCenterServer()
    {
        console.log("正在连接中心服务器...");

		this.m_bReconnectCenterServer = true;

        if(this.m_network.Connect(ConnectionId_CenterServer, GConfig.ServerConfig.sCenterServerAddr, GConfig.ServerConfig.nCenterServerPort) === false)
        {
            return false;
        }

        return true;
    }

	public SendMessageToCenterServer(nMaid: number, nSubId: number, pData: any)
	{
		this.m_network.SendMessage(ConnectionId_CenterServer, nMaid, nSubId, pData);
	}

    public RegisterCenterServer()
    {
		let pRegister: SubCSRegisterReq_RegisterFight = {
			nServerId: GConfig.ServerConfig.nServerId,
			nGameKind: GConfig.ServerConfig.nGameKind,
			sServerAddr: GConfig.ServerConfig.sServiceAddr,
			nServerPort: GConfig.ServerConfig.nServicePort,
			sServerName: GConfig.ServerConfig.sName,
			nSceneCount: GConfig.ServerConfig.nSceneCount
		};

		this.SendMessageToCenterServer(MainId_CS.Register, SubId_CS_Register.Req_RegisterFight, pRegister);
    }

    public Start(): boolean
    {
        //连接中心服务器，注册。
        this.ConnectCenterServer();

        this.m_network.Start();

		this.SetTimer(TimerId_StartCheck, TimerTimeout_StartCheck*1000, -1, null);

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
        pBindParameter.nUserId = InvalidUserId;

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

		if(IsValidUserId(pBindParameter.nUserId))
		{
			const pGameUser = GGameUserManager.FindUser(pBindParameter.nUserId, false);

			pGameUser.OnOffline();
		}

        pBindParameter.pNetConnection = null;
    }

    public OnNetworkRead(pConn: NetConnection, nMainId: number, nSubId: number, pData: any): boolean
    {
		const nBindIndex = pConn.GetConnectionIdR();
		const pBindParameter = this.GetBindParameter(nBindIndex);

        if(pBindParameter === null)
        {
            return false;
        }

		let bRet: boolean = false;

		if (IsValidUserId(pBindParameter.nUserId) === false)
		{
			if(nMainId !== MainId_FS.Login || nSubId !== SubId_FS_Login.Req_Login)
			{
				console.log("非法消息：[", nMainId, "-", nSubId,"]当前逻辑只支持登录操作！");
				return false;
			}

			const pMsg: SubFSLoginReq_Login = pData as SubFSLoginReq_Login;

			console.log("玩家请求登录:", pMsg.nUserId, " LoginKey:", pMsg.sLoginKey);

			let pGameUser = GGameUserManager.FindUser(pMsg.nUserId, false);

			if(pGameUser === null)
			{
				let pLoginFailure: SubFSLoginRep_LoginFailure = {
					nErrCode: GameErrors.UserNotFound
				};

				pConn.SendMessage(MainId_FS.Login, SubId_FS_Login.Rep_LoginFailure, pLoginFailure);

				return true;
			}

			if(pGameUser.IsAndroid() === true)
			{
				let pLoginFailure: SubFSLoginRep_LoginFailure = {
					nErrCode: GameErrors.InvalidUserId
				};

				pConn.SendMessage(MainId_FS.Login, SubId_FS_Login.Rep_LoginFailure, pLoginFailure);

				return true;
			}

			if(pGameUser.CheckLoginKey(pMsg.sLoginKey) === false)
			{
				let pLoginFailure: SubFSLoginRep_LoginFailure = {
					nErrCode: GameErrors.InvalidLoginKey
				};

				pConn.SendMessage(MainId_FS.Login, SubId_FS_Login.Rep_LoginFailure, pLoginFailure);

				return true;
			}

			if (pGameUser.IsOnline())
			{
				/*
				("你的帐号在其他地方登录，被迫下线！")
				pGameUser.SendFrameMessage();
				
				*/

				const pTempBindParameter: BindParameter = pGameUser.GetBindParameter();

				if(pTempBindParameter === null)
				{
					throw new Error("BindParameter Is not found.");
				}
				else
				{
					pTempBindParameter.nUserId = InvalidUserId;
				}
			}

			const pLoginSuccess: SubFSLoginRep_LoginSuccess = {
				
			};

			pConn.SendMessage(MainId_FS.Login, SubId_FS_Login.Rep_LoginSuccess, pLoginSuccess);

			pBindParameter.nUserId = pMsg.nUserId;

			pGameUser.OnLogin(pBindParameter);

			return true;
		}
		else
		{
			let pGameUser = GGameUserManager.FindUser(pBindParameter.nUserId, false);

			if (pGameUser === null)
			{
				pBindParameter.nUserId = InvalidUserId;
				throw new Error("GameUser not found.");
				return true;
			}
			else
			{
				switch (nMainId)
				{
				case MainId_FS.Frame:
					{
						bRet = pGameUser.OnFrameMessage(nSubId, pData);
					}
					break;
				case MainId_FS.Game:
					{
						bRet = pGameUser.OnGameMessage(nSubId, pData);
					}
					break;
				}
			}
		}

		if(bRet === false)
		{
			console.log("消息处理错误 return false：主命令[", nMainId, "],子命令[", nSubId, "]");
		}

		return bRet;
    }

    //网络连接接口 主动连接
    public OnSocketBind(pConn: NetConnection): boolean
    {
        let nId = pConn.GetConnectionId();

        if(nId === ConnectionId_CenterServer)
        {
            console.log("连接中心服务器[", GConfig.ServerConfig.sCenterServerAddr, ":", GConfig.ServerConfig.nCenterServerPort, "] 成功.");

            this.RegisterCenterServer();
        }
        
        return true;
    }

    public OnSocketShut(pConn: NetConnection): void
    {
        let nId = pConn.GetConnectionId();

        if(nId === ConnectionId_CenterServer)
        {
			if(this.m_bReconnectCenterServer === true)
			{
				console.log("连接中心服务器[", GConfig.ServerConfig.sCenterServerAddr, ":", GConfig.ServerConfig.nCenterServerPort, "] 失败, 等待 ", TimerTimeout_ReconnectCenterServer, " 秒后重连.");

				this.SetTimer(TimerId_ReconnectCenterServer, TimerTimeout_ReconnectCenterServer*1000, 1, null);
			}
			else
			{
				
			}
        }
    }

    public OnSocketRead(pConn: NetConnection, nMainId: number, nSubId: number, pData: any): boolean
    {
        let nId = pConn.GetConnectionId();

        let bRet: boolean = false;

       
	    if (nId === ConnectionId_CenterServer)
	    {
		    switch (nMainId)
		    {
		    case MainId_CS.Register:
			    {
				    bRet = this.OnSocketMainRegister(nSubId, pData);
			    }
			    break;
		    case MainId_CS.FightFrame:
			    {
					bRet = this.OnSocketMainFightFrame(nSubId, pData);
			    }
			    break;
		    }
	    }

	    if (!bRet)
	    {
		    console.log("OnEventTCPSocketRead: return false, [" + nMainId + "-" + nSubId + "]");
	    }

        return true;
    }

     //定时器接口
    public OnTimer(nTimerId: number, pBindData: any): boolean
    {
        let bRet = false;

		if(nTimerId >= GGameTimerIdBase)
		{
			let nTimerIdScene = (nTimerId - GGameTimerIdBase) % GGameTimerIdRange;
			let nSceneIndex = Math.floor((nTimerId - GGameTimerIdBase) / GGameTimerIdRange);

			return GGameSceneManager.OnSceneTimer(nSceneIndex, nTimerIdScene);
		}

        switch(nTimerId)
        {
        case TimerId_ReconnectCenterServer:
            {
                bRet = this.ConnectCenterServer();
                
                if(bRet === false)
                {
                    this.SetTimer(TimerId_ReconnectCenterServer, TimerTimeout_ReconnectCenterServer*1000, 1, null);
                    bRet = true;
                }
            }
            break;
		case TimerId_StartCheck:
			{
				GGameSceneManager.CheckSceneStart();
				bRet = true;
			}
			break;
        }

        return bRet;
    }

	//注册消息
	public OnSocketMainRegister(nSubId: number, pData: any): boolean
	{
		switch (nSubId)
		{
		case SubId_CS_Register.Rep_RegisterSuccess:
			{
				//变量定义
				const pRegisterSuccess = pData as SubCSRegisterRep_RegisterSuccess;

				console.log("游戏服务器注册成功!");

				return true;
			}
			break;
		case SubId_CS_Register.Rep_RegisterFailure:		//注册失败
			{
				//变量定义
				const pRegisterFailure = pData as SubCSRegisterRep_RegisterFailure;

				//关闭处理
				console.log("游戏服务器注册失败，错误信息：", pRegisterFailure.sErrMsg);
				
				//this.m_network.Close();
				
				return true;
			}
		}
	}

	public OnSocketMainFightFrame(nSubId: number, pData: any): boolean
	{
		switch (nSubId)
		{
		case SubId_CS_FightFrame.Req_AllocateScene:
			{
				//变量定义
				const pAllocateScene = pData as SubCSFightFrameReq_AllocateScene;

				const pGameScene = GGameSceneManager.Allocate();

				pGameScene.Allocate(pAllocateScene);

				return true;
			}
			break;
		case SubId_CS_FightFrame.Req_UserPropertyUpdate:
			{
				const pUpdate = pData as SubCSFightFrameReq_UserPropertyChange;

				let pGameUser = GGameUserManager.FindUser(pUpdate.nUserId, false);

				if(pGameUser === null) return true;
				
				pGameUser.UpdateProperty(pUpdate.nGameGold, pUpdate.nExperience);

				return true;
			}
			break;
		}

		return false;
	}
}


export function CreateGameEngine()
{
    new FightServer();
}