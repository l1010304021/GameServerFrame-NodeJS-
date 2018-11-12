import { GameEngine, GameRandom } from "../Core/GameEngine";
import { NetWorker } from "../Core/Network/NetWorker";
import { GConfig } from "../Core/GlobalConfig";
import { NetConnection } from "../Core/Network/Connection";
import { MessageHead } from "../Core/Message";
import { InvalidUserId, IsValidUserId, GameErrors } from "../Common/GlobalDefines";
import { MainId_CS, UserConnectionInfo, SubId_CS_Register, SubCSRegisterRep_RegisterSuccess, SubCSRegisterRep_RegisterFailure, SubId_CS_UserLogin, SubCSUserLoginRep_LoginSuccess, SubCSRegisterReq_RegisterGate, SubCSUserLoginReq_Login, SubCSUserLoginReq_Logout, SubId_CS_UserNotice, SubCSUserNotice_Error } from "../Common/CMD_CenterServer";
import { MainId_GS, SubId_GS_UserLogin, SubGSUserLoginReq_Login, SubGSUserLoginRep_LoginFailure, SubId_GS_UserNotice, SubId_GS_UserUpdate, SubId_GS_UserMatching, SubId_GS_UserRanking, SubId_GS_UserShare } from "../Common/CMD_GateServer";
import { CheckUserSignature } from "./Signature";


const ConnectionId_CenterServer                 = 1;

const TimerId_ReconnectCenterServer             = 1;

const TimerTimeout_ReconnectCenterServer        = 10;


interface BindParameter
{
    pNetConnection:                             NetConnection;
    nSessionId:									number;
    nUserId:                                    number;
    sUserName:                                  string;
	bLogining:									boolean;
};


class GateServer extends GameEngine
{
    private m_pBindParameters:                  Array<BindParameter>;                   //连接
    private m_mapUsers:                         Array<BindParameter>;                   //玩家
	private m_bReconnectCenterServer:			boolean;

    constructor()
    {
        super();

        this.m_pBindParameters = [];

        for(let i = 0; i < GConfig.ServerConfig.nMaxConnection; i++)
        {
            this.m_pBindParameters[i] = {
                pNetConnection: null,
				nSessionId: 0,
                nUserId: InvalidUserId,
                sUserName: "",
				bLogining: false
            };
        }

		this.m_bReconnectCenterServer = false;

		this.m_mapUsers = [];
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

	public SendMessageToCenterServer(nMainId: number, nSubId: number, pData: any)
	{
		this.m_network.SendMessage(ConnectionId_CenterServer, nMainId, nSubId, pData);
	}

    public RegisterCenterServer()
    {
		console.log("正在注册网关");

		let pRegister: SubCSRegisterReq_RegisterGate = {
			nGateId: GConfig.ServerConfig.nServerId
		};

		this.SendMessageToCenterServer(MainId_CS.Register, SubId_CS_Register.Req_RegisterGate, pRegister);
    }

    public Start(): boolean
    {
        //连接中心服务器，注册。
        this.ConnectCenterServer();

        this.m_network.Start();

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
		pBindParameter.nSessionId = GameRandom();
        pBindParameter.nUserId = InvalidUserId;
        pBindParameter.sUserName = "";
		pBindParameter.bLogining = false;

        return true;
    }

    public OnNetworkShut(pConn: NetConnection): void
    {
        const pBindParameter = this.GetBindParameter(pConn.GetConnectionIdR());

        if(pBindParameter === null)
        {
            return;
        }

		if(IsValidUserId(pBindParameter.nUserId) === true)
		{
			let pLogout: SubCSUserLoginReq_Logout = {
				userConnInfo: {
					nUserId: pBindParameter.nUserId,
					nSessionId: pBindParameter.nSessionId,
					nBindIndex: pBindParameter.pNetConnection.GetConnectionIdR(),
					nServerId: GConfig.ServerConfig.nServerId
				}
			};

			console.log("玩家下线:", pBindParameter.nUserId);

			this.SendMessageToCenterServer(MainId_CS.UserLogin, SubId_CS_UserLogin.Req_Logout, pLogout);

			this.OnUserOffline(pBindParameter.nUserId, pBindParameter);
		}

        pBindParameter.pNetConnection = null;
		pBindParameter.nSessionId = 0;
		pBindParameter.bLogining = false;
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
			if(nMainId !== MainId_GS.UserLogin || nSubId !== SubId_GS_UserLogin.Req_Login)
			{
				console.log("非法消息：[", nMainId, "-", nSubId,"]当前逻辑只支持登录操作！");
				return false;
			}

			if(pBindParameter.bLogining === true)
			{
				console.log("当前连接重复登陆，已经发送登陆请求！");
				return false;
			}

			const pMsg: SubGSUserLoginReq_Login = pData;

			let pLogin: SubCSUserLoginReq_Login = {
				userConnInfo: {
					nUserId: InvalidUserId,
					nBindIndex: nBindIndex,
					nServerId: GConfig.ServerConfig.nServerId,
					nSessionId: pBindParameter.nSessionId
				},
				sUserAccount: pMsg.sUserAccount,
				sSignature: pMsg.sSignature,
				sUserName: pMsg.sUserName,
				sUserPhoto: pMsg.sUserPhoto,
				sDevice: pMsg.sDevice
			};

			if(this.CheckAccountValid(pMsg) === false)
			{
				let pLoginFailure: SubGSUserLoginRep_LoginFailure = {
					nErrCode: GameErrors.InvalidAccount
				};

				pConn.SendMessage(MainId_GS.UserLogin, SubId_GS_UserLogin.Rep_LoginFailure, pLoginFailure);
				return true;
			}

			console.log("玩家请求登录:", pMsg.sUserAccount, " 名字:", pMsg.sUserName, " 连接Id:", nBindIndex);

			pBindParameter.bLogining = true;

			this.SendMessageToCenterServer(MainId_CS.UserLogin, SubId_CS_UserLogin.Req_Login, pLogin);

			bRet = true;
		}
		else
		{
			bRet = this.OnNetworkUserMessage(nMainId, nSubId, pData, pBindParameter);
		}

		if(bRet === false)
		{
			console.log("OnNetworkRead return false：主命令[", nMainId, "],子命令[", nSubId, "]");
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
		    case MainId_CS.UserLogin:
			    {
					const pUserConnectionInfo: UserConnectionInfo = pData.userConnInfo;
					
					const pBindParameter = this.GetBindParameter(pUserConnectionInfo.nBindIndex);

					if(pBindParameter.bLogining === false)
					{
						console.log("当前连接尚未发送登陆请求");
						return true;
					}

					if(pBindParameter.nSessionId != pUserConnectionInfo.nSessionId)
					{
						console.log("连接已经失效,SessionId[", pUserConnectionInfo.nSessionId, "-", pBindParameter.nSessionId, "]不一致.");
						return true;
					}

					if(IsValidUserId(pBindParameter.nUserId))
					{
						console.log("重复登陆请求，玩家已经登陆，UserId:[", pBindParameter.nUserId, "]");
						return true;
					}

					bRet = this.OnSocketMainUserLogin(pBindParameter, nSubId, pData);
			    }
			    break;
		    case MainId_CS.UserUpdate:
			case MainId_CS.UserNotice:
			case MainId_CS.UserMatching:
			case MainId_CS.UserRanking:
			case MainId_CS.UserShare:
				{
					const pUserConnectionInfo: UserConnectionInfo = pData.userConnInfo;
					
					const pBindParameter = this.GetBindParameter(pUserConnectionInfo.nBindIndex);

					if(pBindParameter.nSessionId != pUserConnectionInfo.nSessionId)
					{
						console.log("连接已经失效1,SessionId[", pUserConnectionInfo.nSessionId, "-", pBindParameter.nSessionId, "]不一致.");
						return true;
					}
					
					bRet = this.OnUserSocketMessage(pBindParameter, nMainId, nSubId, pData);
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
        }

        return bRet;
    }

    //玩家接口
	public OnUserOnline(nUserId: number, sUserName: string, pBindParameter: BindParameter)
	{
		if(IsValidUserId(nUserId) === false) return;

		pBindParameter.nUserId = nUserId;
		pBindParameter.sUserName = sUserName;
		
		this.m_mapUsers[nUserId] = pBindParameter;
	}

    public OnUserOffline(nUserId: number, pBindParameter: BindParameter)
    {
        if(IsValidUserId(nUserId) === false) return;

		pBindParameter.nUserId = InvalidUserId;
		pBindParameter.sUserName = "";

        this.m_mapUsers[nUserId] = null;
    }

	public OnNetworkUserMessage(nMainId: number, nSubId: number, pData: any, pBindParameter: BindParameter)
	{
		switch(nMainId)
		{
		case MainId_GS.UserUpdate:
			{
				switch(nSubId)
				{
				default:
					return false;
				}
			}
			break;
		case MainId_GS.UserNotice:
			{
				switch(nSubId)
				{
				default:
					return false;
				}
			}
			break;
		case MainId_GS.UserMatching:
			{
				switch(nSubId)
				{
				case SubId_GS_UserMatching.Req_NormalMatching:
				case SubId_GS_UserMatching.Req_NormalMatchingCancel:
					break;
				default:
					return false;
				}
			}
			break;
		case MainId_GS.UserRanking:
			{
				switch(nSubId)
				{
				case SubId_GS_UserRanking.Req_GetRanking:
					break;
				default:
					return false;
				}
			}
			break;
		case MainId_GS.UserShare:
			{
				switch(nSubId)
				{
				case SubId_GS_UserShare.Req_WatchVideo:
				case SubId_GS_UserShare.Req_InviteFriend:
				case SubId_GS_UserShare.Req_ShareToFriend:
				case SubId_GS_UserShare.Req_GetShareGift:
					break;
				default:
					return false;
				}
			}
			break;
		default:
			return false;
		}


		(pData.userConnInfo as UserConnectionInfo) = {
			nUserId: pBindParameter.nUserId,
			nSessionId: pBindParameter.nSessionId,
			nBindIndex: pBindParameter.pNetConnection.GetConnectionIdR(),
			nServerId: GConfig.ServerConfig.nServerId
		};

		this.SendMessageToCenterServer(nMainId, nSubId, pData);

		return true;
	}

	public CheckAccountValid(pMsg: SubGSUserLoginReq_Login): boolean
	{
		//需要校验参数长度

		if(CheckUserSignature(pMsg.sUserAccount, pMsg.sSignature) === false)
		{
			return false;
		}

		return true;
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

				console.log("网关服务器注册成功!");

				return true;
			}
			break;
		case SubId_CS_Register.Rep_RegisterFailure:		//注册失败
			{
				//变量定义
				const pRegisterFailure = pData as SubCSRegisterRep_RegisterFailure;

				//关闭处理
				console.log("网关服务器注册失败，错误信息：", pRegisterFailure.sErrMsg);
				
				//this.m_network.Close();
				
				return true;
			}
		}
	}

	//玩家登陆
	public OnSocketMainUserLogin(pBindParameter: BindParameter, nSubId: number, pData: any)
	{
		switch (nSubId)
		{
		case SubId_CS_UserLogin.Rep_LoginSuccess:
			{
				const pLoginSuccess = pData as SubCSUserLoginRep_LoginSuccess;
				
				this.OnUserOnline(pLoginSuccess.nUserId, pLoginSuccess.sUserName, pBindParameter);
				
				pLoginSuccess.userConnInfo = undefined;

				pBindParameter.pNetConnection.SendMessage(MainId_GS.UserLogin, nSubId, pLoginSuccess);

				pBindParameter.bLogining = false;
				
				return true;
			}
			break;
		case SubId_CS_UserLogin.Rep_LoginFailure:
			{
				const pLoginFailure = pData as SubCSUserLoginRep_LoginSuccess;

				pLoginFailure.userConnInfo = undefined;
				pBindParameter.pNetConnection.SendMessage(MainId_GS.UserLogin, nSubId, pLoginFailure);

				pBindParameter.bLogining = false;

				return true;
			}
			break;
		}

		return false;
	}

	//玩家消息
	public OnUserSocketMessage(pBindParameter: BindParameter, nMainId: number, nSubId: number, pData: any)
	{
		pData.userConnInfo = undefined;

		pBindParameter.pNetConnection.SendMessage(nMainId, nSubId, pData);

		switch(nMainId)
		{
		case MainId_CS.UserNotice:
			{
				if(nSubId === SubId_CS_UserNotice.Error)
				{
					let pMsg: SubCSUserNotice_Error = pData;

					if(pMsg.nErrCode === GameErrors.LoginOtherPlace)
					{
						console.log("玩家被挤下线:", pBindParameter.nUserId);
						pBindParameter.nUserId = InvalidUserId;
						pBindParameter.bLogining = false;
						pBindParameter.sUserName = "";
					}
				}
			}
			break;
		}

		return true;
	}
}


export function CreateGameEngine()
{
    new GateServer();
}