import * as WebSocket from "ws";
import { MessageHead } from "../Message";
import { ErrCodes } from "../Errors";
import { ListHead } from "../ListHead";
import { NetWorker, GConnectionIdRemoteBegin } from "./NetWorker";
import { GConfig } from "../GlobalConfig";
import { ObjectClone, ObjectToString } from "../GameEngine";


export class NetConnection extends ListHead
{
    protected m_pWorker:                            NetWorker;

    protected m_socket:                             WebSocket;                                  //Socket
    protected m_nId:                                number;                                     //索引

    //protected m_bReading:                           boolean;                                    //是否正在读取

    protected m_msgRecvCaches:                      Array<MessageHead>;                         //消息缓存

    protected m_nRecvCacheLimit:                    number;                                     //接收缓存限制

    protected m_nHeartbeatTime:                     number;                                     //心跳时间
	protected m_nHeartbeatNextTime:					number;										//下次心跳时间
	protected m_nClosingTimeout:					number;										//连接关闭超时

    private m_onMessage:                            (data: WebSocket.Data)=>void;               //消息回调
	private m_onPing:								(data: Buffer)=>void;						//心跳回调
	private m_onPong:								(data: Buffer)=>void;						//心跳回调
    private m_onError:                              (err: Error) => void;                       //错误回调
    private m_onClose:                              (code: number, message: string) => void;    //关闭回调
    

    constructor(pWorker: NetWorker, nId: number)
    {
        super();

        this.m_pWorker = pWorker;

        this.m_socket = null;
        this.m_nId = nId;

        //this.m_bReading = false;

        this.m_msgRecvCaches = [];

        this.m_nRecvCacheLimit = 0;

        this.m_nHeartbeatTime = 0;
		this.m_nHeartbeatNextTime = 0;
		this.m_nClosingTimeout = 0;

        this.m_onMessage = (data: WebSocket.Data)=>{
            this.OnMessage(data);
        };

		this.m_onPing = (data: Buffer) =>{
			this.OnPing(data);
		}

		this.m_onPong = (data: Buffer) =>{
			this.OnPong(data);
		}

        this.m_onError = (err: Error)=>{
            //error 应该是异常发生了
            this.OnError(err);
        };

        this.m_onClose = (code: number, message: string) =>{
            //close
            this.OnClose();
        };
    }

    public Initialize(socket: WebSocket, nRecvCacheLimit?: number)
    {
        this.m_socket = socket;
        
        if(nRecvCacheLimit === undefined)
        {
            this.m_nRecvCacheLimit = 0;
        }
        else
        {
            this.m_nRecvCacheLimit = nRecvCacheLimit;
        }
    }

    public BindEvent()
    {
        this.m_socket.on("error", this.m_onError);

        this.m_socket.on("close", this.m_onClose);

        //this.m_bReading = true;

        this.m_socket.on("message", this.m_onMessage);

		this.m_socket.on("ping", this.m_onPing);
		this.m_socket.on("pong", this.m_onPong);

        this.m_nHeartbeatTime = process.uptime() + GConfig.HeartBeatTimeout;
		this.m_nHeartbeatNextTime = process.uptime() + GConfig.HeartBeatInterval;
    }

    private Reset()
    {
        this.m_socket = null;

        //this.m_bReading = false;

        this.m_msgRecvCaches = [];

        this.m_nRecvCacheLimit = 0;

		this.m_nHeartbeatTime = 0;
		this.m_nHeartbeatNextTime = 0;
    }

    public GetConnectionId()
    {
        return this.m_nId;
    }

    public GetConnectionIdR()
    {
        if(this.m_nId < GConnectionIdRemoteBegin)
        {
            return this.m_nId;
        }
        else
        {
            return (this.m_nId - GConnectionIdRemoteBegin);
        }
    }

    public IsConnected()
    {
        return (this.m_socket !== null && this.m_socket.readyState === WebSocket.OPEN);
    }

	public IsConnecting()
	{
		return (this.m_socket !== null && this.m_socket.readyState === WebSocket.CONNECTING);
	}

    public IsHeatbeatTimeout(nTimeCurr: number): boolean
    {
        if(nTimeCurr > this.m_nHeartbeatTime) return true;

        return false;
    }

	public IsClosingTimeout(nTimeCurr: number): boolean
	{
		if(nTimeCurr > this.m_nClosingTimeout) return true;

        return false;
	}

	public CheckNeedPing(nTimeCurr: number)
	{
		if(nTimeCurr > this.m_nHeartbeatNextTime)
		{
			this.m_socket.ping();
		}
	}

    public SendMessage(nMainId: number, nSubId: number, pData: any): void
    {
		if(this.IsConnected() === false) return;

		let pMsgHead: MessageHead = {
			nMainId: nMainId,
			nSubId: nSubId
		};

		pMsgHead.data = ObjectClone(pData);

		let jString = ObjectToString(pMsgHead);

        this.m_socket.send(jString);
    }

    public ReadMessage(): MessageHead
    {
        let oRet: MessageHead = null;

        const nLength: number = this.m_msgRecvCaches.length;

        if(nLength > 0)
        {
            oRet = this.m_msgRecvCaches.shift();
        }

        //if(this.m_bReading == false && nLength < this.m_nRecvCacheLimit)
        {
            //this.m_bReading = true;
            //this.m_socket.resume();
        }

        return oRet;
    }

    public ReadAllMessage(): Array<MessageHead>
    {
        let oRet = this.m_msgRecvCaches;
        this.m_msgRecvCaches = [];

        //if(this.m_bReading == false)
        {
            //this.m_bReading = true;
            //this.m_socket.resume();
        }

        return oRet;
    }

    private OnMessage(data: WebSocket.Data)
    {
		try
		{
			//if((data as string).length > 512) return;

			let msg = JSON.parse(data as string);

			this.m_msgRecvCaches.push(msg);

			if(this.m_nRecvCacheLimit > 0 && this.m_msgRecvCaches.length >= this.m_nRecvCacheLimit)
			{
				//this.m_socket.pause();
				//this.m_bReading = false;
			}

			this.m_nHeartbeatTime = process.uptime() + GConfig.HeartBeatTimeout;
		}
        catch(e)
		{
			console.log("RecvMessage: ", data);
		}
    }

	private OnPing(data: Buffer)
	{
		this.m_nHeartbeatNextTime = process.uptime() + GConfig.HeartBeatInterval;
		this.m_nHeartbeatTime = process.uptime() + GConfig.HeartBeatTimeout;
	}

	private OnPong(data: Buffer)
	{
		this.m_nHeartbeatNextTime = process.uptime() + GConfig.HeartBeatInterval;
		this.m_nHeartbeatTime = process.uptime() + GConfig.HeartBeatTimeout;
	}

    private OnError(err: Error)
    {
        //异常发生
        console.log(err);
    }

    public OnClose()
    {
        this.m_socket.removeListener("close", this.m_onClose);

        this.m_socket.removeListener("message", this.m_onMessage);

        this.m_socket.removeListener("error", this.m_onError);

        this.m_pWorker.OnConnectionClose(this);

        this.Reset();
    }

    public Close(eErr: ErrCodes)
    {
        if(eErr === ErrCodes.EC_NetworkHeartbeatTimeout)
        {
            console.log("connection closed by heartbeat.");
        }

        this.m_socket.close();

		this.m_nClosingTimeout = process.uptime() + 5;
    }
}