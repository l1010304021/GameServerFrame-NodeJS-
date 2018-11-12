import * as https from "https";
import * as io from "fs";
import * as WebSocket from "ws";

import { setTimeout } from "timers";
import { NetConnection } from "./Connection";
import { ErrCodes } from "../Errors";
import { ListHead, ListDel, ListAddTail } from "../ListHead";
import { MessageHead } from "../Message";
import { GGameEngine } from "../GameEngine";




enum ServiceStatus
{
    Initializing,
    Running,
    Stoping,
    Stoped
};

export const GConnectionIdRemoteBegin: number           = 10000;
const GHeartbeatTimerTimeout: number                    = 1000;
const GLowerLevelConnTimerTimeout: number               = 1;
const GHighLevelConnTimerTimeout: number                = 1;




export class NetWorker
{
    private m_eStatus:                                  ServiceStatus;                  //服务状态

    private m_lhIdleConn:                               ListHead;                       //空闲连接
	private m_lhClosingConn:							ListHead;						//等待关闭连接
    private m_lhLowerLevelConn:                         ListHead;                       //低优先级连接
    private m_lhHighLevelConn:                          ListHead;                       //高优先级连接
    private m_lhLocalConn:                              ListHead;                       //主动发起连接

    private m_sAddress:                                 string;                         //地址
    private m_nPort:                                    number;                         //端口
    private m_nMaxConnections:                          number;                         //最大连接

    private m_bDealAllMessage:                          boolean;                        //处理所有消息

    private m_sSSLCert:                                 string;                         //ssl cert文件
    private m_sSSLKey:                                  string;                         //ssl key文件

    private m_wsServer:                                 WebSocket.Server;               //ws Server.
    private m_httsServer:                               https.Server;                   //https Server.

    constructor(sAddress: string, nPort: number, nMaxConnections: number, bDealAllMessage: boolean, sSSLCert: string, sSSLKey: string)
    {
        this.m_eStatus = ServiceStatus.Stoped;

        this.m_lhIdleConn = new ListHead();
		this.m_lhClosingConn = new ListHead();
        this.m_lhLowerLevelConn = new ListHead();
        this.m_lhHighLevelConn = new ListHead();
        this.m_lhLocalConn = new ListHead();

        this.m_sAddress = sAddress;
        this.m_nPort = nPort;

        this.m_nMaxConnections = nMaxConnections;

        this.m_bDealAllMessage = bDealAllMessage;

        this.m_sSSLCert = sSSLCert;
        this.m_sSSLKey = sSSLKey;

        this.m_httsServer = null;
        this.m_wsServer = null;

        for(let i = 0; i < this.m_nMaxConnections; i++)
        {
            let pConnection = new NetConnection(this, GConnectionIdRemoteBegin + i);

            this.ReleaseIdleConnection(pConnection);
        }
    }

    protected AllocateIdleConnection(): NetConnection
    {
        let pConnection = null;

        let lhTemp = this.m_lhIdleConn.Next;

        if (lhTemp !== this.m_lhIdleConn)
        {
            ListDel(lhTemp);
            pConnection = lhTemp;
        }
        
        return pConnection;
    }

    protected ReleaseIdleConnection(pConnection: NetConnection)
    {
        ListDel(pConnection);

        ListAddTail(this.m_lhIdleConn, pConnection);
    }

    public OnConnectionLink(pConn: NetConnection): boolean
    {
        let bResult = false;
        let sInterface = "";

        try
        {
            if(pConn.GetConnectionId() < GConnectionIdRemoteBegin)
            {
                sInterface = "OnSocketBind";
                bResult = GGameEngine.OnSocketBind(pConn);
            }
            else
            {
                sInterface = "OnNetworkBind";
                bResult = GGameEngine.OnNetworkBind(pConn);
            }
        }
        catch(e)
        {
            console.log(sInterface, " exception occur, e:", e);
            return false;
        }

        if(bResult === false)
        {
            console.log(sInterface, "return false.");
        }

        return bResult;
    }

    public OnConnectionClose(pConn: NetConnection)
    {
        let sInterface = "";

        try
        {
            if(pConn.GetConnectionId() < GConnectionIdRemoteBegin)
            {
                sInterface = "OnSocketShut";
                GGameEngine.OnSocketShut(pConn);
            }
            else
            {
                sInterface = "OnNetworkShut";
                GGameEngine.OnNetworkShut(pConn);
                this.ReleaseIdleConnection(pConn);
            }
        }
        catch(e)
        {
            console.log(sInterface, " exception occur, e:", e);
        }
    }

    public GetLocalConnection(nConnectionId: number, bAllocate: boolean): NetConnection
    {
        let lhTemp = this.m_lhLocalConn.Next;

        while(lhTemp !== this.m_lhLocalConn)
        {
            let tmp = lhTemp as NetConnection;
            lhTemp = lhTemp.Next;

            if(tmp.GetConnectionId() === nConnectionId) return tmp;
        }

        if(bAllocate === true)
        {
            let pConn = new NetConnection(this, nConnectionId);
            ListAddTail(this.m_lhLocalConn, pConn);
            return pConn;
        }

        return null;
    }

    public Connect(nConnectionId: number, sAddress: string, nPort: number): boolean
    {
        if(nConnectionId >= GConnectionIdRemoteBegin)
        {
            throw new Error("Connect: Connection id invalid, id:" + nConnectionId);
            return false;
        }

        let pConn = this.GetLocalConnection(nConnectionId, true);
        
        if(pConn.IsConnected() || pConn.IsConnecting())
        {
            throw new Error("Connect: Connection is connected" + nConnectionId);
            return false;
        }
        else
        {
            const sUrl = "ws://" + sAddress + ":" + nPort + "/";
            const socket = new WebSocket(sUrl);

            pConn.Initialize(socket);

            let err = (err)=>{
                pConn.OnClose();
            }

            socket.on("open", ()=>{
                socket.removeListener("error", err);
                
                pConn.BindEvent();

                if(this.OnConnectionLink(pConn) === false)
                {
                    socket.close();
                }
            });

            socket.on("error", err);
        }

        return true;
    }

	public SendMessage(nConnectionId: number, nMainId: number, nSubId: number, pData: any)
	{
		if(nConnectionId >= GConnectionIdRemoteBegin)
        {
            throw new Error("SendMessage: Connection id invalid, id:" + nConnectionId);
        }

		let pConn = this.GetLocalConnection(nConnectionId, true);
        
        if(pConn.IsConnected() === false)
        {
            throw new Error("SendMessage: Connection is not connected" + nConnectionId);
        }

		pConn.SendMessage(nMainId, nSubId, pData);
	}

    public Start()
    {
        if(this.m_sSSLKey !== undefined && this.m_sSSLCert !== undefined &&
            this.m_sSSLKey !== null && this.m_sSSLCert !== null)
        {
            this.m_httsServer = https.createServer({
                cert: io.readFileSync(this.m_sSSLCert),
                key: io.readFileSync(this.m_sSSLKey)
            });
        }

        if(this.m_httsServer === null)
        {
            this.m_wsServer = new WebSocket.Server({
                host: this.m_sAddress,
                port: this.m_nPort
            });
        }
        else
        {
            this.m_wsServer = new WebSocket.Server({
                server: this.m_httsServer
            });
        }

        this.m_wsServer.on("connection", (socket: WebSocket)=>{
            const pConnection = this.AllocateIdleConnection();

            if(pConnection === null)
            {
                socket.close();
                return;
            }

            pConnection.Initialize(socket);

            if(this.OnConnectionLink(pConnection) === false)
            {
                socket.close();
                this.ReleaseIdleConnection(pConnection);
                return;
            }

            pConnection.BindEvent();

			ListAddTail(this.m_lhLowerLevelConn, pConnection);
        });

        this.m_wsServer.on("error", (error: Error)=>{
            console.log("Websocket server error:", error);
        });

        if(this.m_httsServer !== null)
        {
            this.m_httsServer.listen({
                host: this.m_sAddress,
                port: this.m_nPort
            });
        }

        setTimeout(()=>{
            this.TimerHeartbeat();
        }, GHeartbeatTimerTimeout);

        setTimeout(()=>{
            this.TimerLowerLevelConn();
        }, GLowerLevelConnTimerTimeout);

        setTimeout(()=>{
            this.TimerHigherLevelConn();
        }, GHighLevelConnTimerTimeout);
    }

    private TimerHeartbeat()
    {
        const nTimeCur = process.uptime();

		let lhTemp = this.m_lhClosingConn.Next;

        while(lhTemp !== this.m_lhClosingConn)
        {
            let tmp = lhTemp as NetConnection;
			lhTemp = lhTemp.Next;

			if(tmp.IsClosingTimeout(nTimeCur))
			{
				tmp.OnClose();
			}
        }
		
		lhTemp = this.m_lhLowerLevelConn.Next;

        while(lhTemp !== this.m_lhLowerLevelConn)
        {
            let tmp = lhTemp as NetConnection;
			lhTemp = lhTemp.Next;

			if(tmp.IsConnected() === false) continue;

            if(tmp.IsHeatbeatTimeout(nTimeCur))
            {
                tmp.Close(ErrCodes.EC_NetworkHeartbeatTimeout);
				ListDel(tmp);
				ListAddTail(this.m_lhClosingConn, tmp);
            }
			else
			{
				tmp.CheckNeedPing(nTimeCur);
			}
        }

        lhTemp = this.m_lhHighLevelConn.Next;

        while(lhTemp !== this.m_lhHighLevelConn)
        {
            let tmp = lhTemp as NetConnection;
            lhTemp = lhTemp.Next;

			if(tmp.IsConnected() === false) continue;

            if(tmp.IsHeatbeatTimeout(nTimeCur))
            {
                tmp.Close(ErrCodes.EC_NetworkHeartbeatTimeout);
				ListDel(tmp);
				ListAddTail(this.m_lhClosingConn, tmp);
            }
			else
			{
				tmp.CheckNeedPing(nTimeCur);
			}
        }

        lhTemp = this.m_lhLocalConn.Next;

        while(lhTemp !== this.m_lhLocalConn)
        {
            let tmp = lhTemp as NetConnection;
            lhTemp = lhTemp.Next;

			if(tmp.IsConnected() === false) continue;

            if(tmp.IsHeatbeatTimeout(nTimeCur))
            {
                tmp.Close(ErrCodes.EC_NetworkHeartbeatTimeout);
            }   
        }

        setTimeout(()=>{
            this.TimerHeartbeat();
        }, GHeartbeatTimerTimeout);
    }

    private TimerLowerLevelConn()
    {
        const nTimeCur = process.uptime();

        let lhTemp = this.m_lhLowerLevelConn.Next;

		let msgs: Array<MessageHead> = [];

        while(lhTemp !== this.m_lhLowerLevelConn)
        {
            let tmp = lhTemp as NetConnection;

            lhTemp = lhTemp.Next;

			msgs = [];
            
            if(this.m_bDealAllMessage)
            {
                msgs = tmp.ReadAllMessage();
            }
            else
            {
                let tmpMsg = tmp.ReadMessage();

                if(tmpMsg != null)
                {
                    msgs.push(tmpMsg);
                }
            }

			const nLength = msgs.length;

            for(let i = 0; i < nLength; i++)
            {
                try
                {
                    let bRet = GGameEngine.OnNetworkRead(tmp, msgs[i].nMainId, msgs[i].nSubId, msgs[i].data);

                    if(bRet === false)
                    {
                        console.log("OnNetworkRead[", msgs[i].nMainId, "-", msgs[i].nSubId ,"] return false.");
                    }
                }
                catch(e)
                {
                    console.log("OnNetworkRead[", msgs[i].nMainId, "-", msgs[i].nSubId ,"] exception occur, e:", e);
                }
            }
        }

        setTimeout(()=>{
            this.TimerLowerLevelConn();
        }, GLowerLevelConnTimerTimeout);
    }

    private TimerHigherLevelConn()
    {
        const nTimeCur = process.uptime();

        let lhTemp = this.m_lhHighLevelConn.Next;

        let msgs: Array<MessageHead> = [];

        while(lhTemp !== this.m_lhHighLevelConn)
        {
            let tmp = lhTemp as NetConnection;
			lhTemp = lhTemp.Next;

            msgs = [];
            
            if(this.m_bDealAllMessage)
            {
                msgs = tmp.ReadAllMessage();
            }
            else
            {
                let tmpMsg = tmp.ReadMessage();

                if(tmpMsg != null)
                {
                    msgs.push(tmpMsg);
                }
            }

			const nLength = msgs.length;

            for(let i = 0; i < nLength; i++)
            {
                try
                {
                    let bRet = GGameEngine.OnNetworkRead(tmp, msgs[i].nMainId, msgs[i].nSubId, msgs[i].data);

                    if(bRet === false)
                    {
                        console.log("OnNetworkRead[", msgs[i].nMainId, "-", msgs[i].nSubId ,"] return false.");
                    }
                }
                catch(e)
                {
                    console.log("OnNetworkRead[", msgs[i].nMainId, "-", msgs[i].nSubId ,"] exception occur, e:", e);
                }
            }
        }

        lhTemp = this.m_lhLocalConn.Next;

        while(lhTemp !== this.m_lhLocalConn)
        {
            let tmp = lhTemp as NetConnection;
            lhTemp = lhTemp.Next;

            msgs = tmp.ReadAllMessage();

			const nLength = msgs.length;

            for(let i = 0; i < nLength; i++)
            {
                try
                {
                    let bRet = GGameEngine.OnSocketRead(tmp, msgs[i].nMainId, msgs[i].nSubId, msgs[i].data);

                    if(bRet === false)
                    {
                        console.log("OnSocketRead[", msgs[i].nMainId, "-", msgs[i].nSubId ,"] return false.");
                    }
                }
                catch(e)
                {
                    console.log("OnSocketRead[", msgs[i].nMainId, "-", msgs[i].nSubId ,"] exception occur, e:", e);
                }
            }
        }

        setTimeout(()=>{
            this.TimerHigherLevelConn();
        }, GHighLevelConnTimerTimeout);
    }
}