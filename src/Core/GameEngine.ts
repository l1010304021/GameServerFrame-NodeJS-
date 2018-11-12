import { Database, DBRequest, DBConnection, DBResponse } from "./Database/MSSQL";
import { NetWorker } from "./Network/NetWorker";
import { NetConnection } from "./Network/Connection";
import { MessageHead } from "./Message";
import { setInterval, clearInterval } from "timers";
import * as util from "util";


interface GameInterface
{
    //基础接口
    Start(): boolean;

    //网络连接接口 监听
    OnNetworkBind(pConn: NetConnection): boolean;
    OnNetworkShut(pConn: NetConnection): void;
    OnNetworkRead(pConn: NetConnection, nMainId: number, nSubId: number, pData: any): boolean;

    //网络连接接口 主动连接
    OnSocketBind(pConn: NetConnection): boolean;
    OnSocketShut(pConn: NetConnection): void;
    OnSocketRead(pConn: NetConnection, nMainId: number, nSubId: number, pData: any): boolean;

    //数据库接口
    OnDatabaseRequest(dbConn: DBConnection, dbReq: DBRequest): Promise<boolean>;
    OnDatabaseResponse(dbResp: DBResponse): boolean;

    //定时器接口
    OnTimer(nTimerId: number, pBindData: any): boolean;
};

interface Timer
{
    timer:                                                  NodeJS.Timer;           //定时器
    nId:                                                    number;                 //定时器ID
    nRepeat:                                                number;                 //重复次数-1无限
    nDelay:                                                 number;                 //延迟时间
    pBindData:                                              any;                    //绑定数据
}

export declare let GGameEngine: GameEngine;


const GRandValueMax:number									= 0x7fffffff;
let GRandSeed: number										= Math.floor((Math.random() * GRandValueMax * (new Date()).getMilliseconds())) % GRandValueMax;


export function GameRandom()
{
	GRandSeed = (GRandSeed * 214013 + 2531011) & GRandValueMax;

	return GRandSeed;
}

export function ObjectToString(pObject)
{
    try
	{
        return JSON.stringify(pObject);
    }
    catch (e) {
        return util.inspect(pObject, { depth: null });
    }
}

export function ObjectClone(pCloneObject: any) {

    if (pCloneObject === null || typeof pCloneObject !== "object") return pCloneObject;

	let pRetObject: any;
	
    
    if (pCloneObject instanceof Date)
	{
        pRetObject = new Date();

        pRetObject.setTime(pCloneObject.getTime());

        return pRetObject;
    }

    if (pCloneObject instanceof Array)
	{
        pRetObject = [];

		const nLength = pCloneObject.length;

        for (let i = 0; i < nLength; ++i)
		{
            pRetObject[i] = ObjectClone(pCloneObject[i]);
        }

        return pRetObject;
    }

    if (pCloneObject instanceof Object)
	{
        pRetObject = {};

        for (let objAttr in pCloneObject)
		{
            if (pCloneObject.hasOwnProperty(objAttr))
			{
				pRetObject[objAttr] = ObjectClone(pCloneObject[objAttr]);
			}
        }

        return pRetObject;
    }

	let sObjectString = ObjectToString(pCloneObject);

    throw new Error("不可拷贝的数据：" + sObjectString);
}

function GetDays()
{
	const tmNow = new Date();

	return Math.floor(tmNow.getTime() / (1000*3600*24));
}

const GKernelTimerMax: number								= 1000;
const TimerId_KernelUpdateDay: number						= 1;
const TimerTime_KernelUpdateDay: number						= 1;


export class GameEngine implements GameInterface
{
    protected m_db:                                         Database;               //数据库
    protected m_network:                                    NetWorker;              //网络
    protected m_timers:                                     Array<Timer>;
	protected m_nCurrentDays:								number;

    constructor()
    {
        this.m_timers = new Array();
		this.m_nCurrentDays = GetDays();

        GGameEngine = this;
        
        this.CreateDatabase();
        this.CreateNetworker();
    }

    protected CreateDatabase()
    {
        return true;
    }

    protected CreateNetworker()
    {
        return true;
    }

	public GetCurrentDay(): number
    {
		return this.m_nCurrentDays;
    }

    public Start(): boolean
    {
		this.SetTimer(TimerId_KernelUpdateDay, TimerTime_KernelUpdateDay*1000, -1, null, true);

        return true;
    }

    //网络连接接口 监听
    public OnNetworkBind(pConn: NetConnection): boolean
    {
        return true;
    }

    public OnNetworkShut(pConn: NetConnection): void
    {
        
    }

    public OnNetworkRead(pConn: NetConnection, nMainId: number, nSubId: number, pData: any): boolean
    {
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

    //数据库接口
    public OnDatabaseRequest(dbConn: DBConnection, dbReq: DBRequest): Promise<boolean>
    {
        return Promise.resolve(true);
    }

    public OnDatabaseResponse(dbResp: DBResponse): boolean
    {
        return true;
    }

    //定时器接口
    public OnTimer(nTimerId: number, pBindData: any): boolean
    {
        return true;
    }

	public OnKernelTimer(nTimerId: number, pBindData: any): boolean
	{
		if(nTimerId <= GKernelTimerMax)
		{
			switch(TimerId_KernelUpdateDay)
			{
			case TimerId_KernelUpdateDay:
				{
					let nDay = GetDays();

					if(this.m_nCurrentDays !== nDay) this.m_nCurrentDays = nDay;
				}
				break;
			}
		}

		return true;
	}
    
    public SetTimer(nTimerId: number, nDelay: number, nRepeat: number, pBindData: any, bKernelTimer?: boolean): boolean
    {
		if(bKernelTimer === true)
		{

		}
		else
		{
			bKernelTimer = false;
			nTimerId = GKernelTimerMax + nTimerId;
		}
		
        if(this.m_timers[nTimerId] !== undefined && this.m_timers[nTimerId] !== null)
        {
            //定时器已经存在
            return false;
        }

        let timer = setInterval((nTimerId: number, bKernelTimer: boolean)=>{
            let tm = this.m_timers[nTimerId];

            if(tm === undefined || tm === null)
            {
                //定时器不存在
                return false;
            }

            if(tm.nRepeat != -1)
            {
                tm.nRepeat--;

                if(tm.nRepeat <= 0)
                {
                    this.KillTimer(tm.nId, true);
                }
            }

			if(bKernelTimer === true)
			{
				let nTimerIdTemp = nTimerId;

				try
				{
					if(this.OnKernelTimer(nTimerIdTemp, tm.pBindData) === false)
					{
						console.log("Timer[", nTimerIdTemp, "] return false");
					}
				}
				catch(e)
				{
					console.log("Timer[", nTimerIdTemp, "] exception occur e:", e);
				}
			}
			else
			{
				let nTimerIdTemp = nTimerId - GKernelTimerMax;

				try
				{
					if(this.OnTimer(nTimerIdTemp, tm.pBindData) === false)
					{
						console.log("Timer[", nTimerIdTemp, "] return false.");
					}
				}
				catch(e)
				{
					console.log("Timer[", nTimerIdTemp, "] exception occur, e:", e);
				}
			}

			
        }, nDelay, nTimerId, bKernelTimer);

        //
        let tm: Timer = {
            timer: timer,
            nId: nTimerId,
            nDelay: nDelay,
            nRepeat: nRepeat,
            pBindData: pBindData
        };

        this.m_timers[nTimerId] = tm;

        return true;
    }

    public KillTimer(nTimerId: number, bKernelTimer?: boolean): boolean
    {
		if(bKernelTimer === true)
		{

		}
		else
		{
			bKernelTimer = false;
			nTimerId = GKernelTimerMax + nTimerId;
		}

        if(this.m_timers[nTimerId] === undefined || this.m_timers[nTimerId] === null)
        {
            //定时器不存在
            return false;
        }

        clearInterval(this.m_timers[nTimerId].timer);
        this.m_timers[nTimerId] = null;
    }

	public SendDatabaseRequest(nRequestId: number, oRequest: any, nContextId: number)
	{
		this.m_db.SendRequest(nRequestId, oRequest, nContextId);
	}
}