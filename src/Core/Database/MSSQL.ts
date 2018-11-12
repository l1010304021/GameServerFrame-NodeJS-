import * as mssql from "mssql";
import { GConfig } from "../GlobalConfig";
import { List } from "../ListHead";
import { GGameEngine, ObjectClone } from "../GameEngine";



export interface DBRequest
{
    nContextId:                                                     number;                             //ContextId
    nRequestId:                                                     number;                             //RequestId
    data?:                                                          any;
};

export interface DBResponse
{
    nContextId:                                                     number;                             //ContextId
    nResponseId:                                                    number;                             //RequestId
    data?:                                                          any;
}

export class DBConnection
{
    private m_dbConnPool:                                           mssql.ConnectionPool;               //连接
    private m_dbRequest:                                            mssql.Request;                      //请求
    private m_dbProcedureResult:                                    mssql.IProcedureResult<any>;        //执行结果
    private m_nRecordSetIndex:                                      number;                             //记录索引
    private m_bExecuting:                                           boolean;                            //是否正在请求

    private m_sCurrentProcedure:                                    string;                             //当前请求

    constructor()
    {
        this.m_dbConnPool = new mssql.ConnectionPool(GConfig.SQLConfig.DBInfo);

        this.m_bExecuting = false;

		this.m_nRecordSetIndex = 0;

		this.m_dbRequest = null;

		this.m_dbProcedureResult = null;

		this.m_sCurrentProcedure = "";
    }

    public async CheckConnection() : Promise<any>
    {
        if(this.m_dbConnPool.connected === false)
        {
            try
            {
                this.m_dbConnPool = await this.m_dbConnPool.connect();
                
                this.m_dbRequest = this.m_dbConnPool.request();
            }
            catch(e)
            {
                return Promise.reject(e);
            }
        }

        return Promise.resolve();
    }

    public IsExecuting(): boolean
    {
        return this.m_bExecuting;
    }

    public SetExecuting(bExecuting: boolean)
    {
        this.m_bExecuting = bExecuting;
    }

    public ResetParameter()
    {
        this.m_dbRequest.parameters = {};
        this.m_sCurrentProcedure = "";
		this.m_nRecordSetIndex = 0;
    }

    public AddParameter(key: string, type: mssql.ISqlType, value: any)
    {
        this.m_dbRequest.input(key, type, value);
    }

    public AddParameterOutput(key: string, type: mssql.ISqlType)
    {
        this.m_dbRequest.output(key, type);
    }

    public async Execute(sProcedure: string): Promise<number>
    {
        this.m_sCurrentProcedure = sProcedure

        return this.m_dbRequest.execute(sProcedure).then((ret)=>{
			this.m_dbProcedureResult = ret;

            return Promise.resolve(this.m_dbProcedureResult.returnValue);
        }).catch((e)=>{
			console.log("DBExecute [", this.m_sCurrentProcedure, "] Failed, err:", e);
            return Promise.reject({name: this.m_sCurrentProcedure, err: e});
        });
    }

    public IsRecordsetEnd(): boolean
    {
        if(this.m_nRecordSetIndex >= this.m_dbProcedureResult.recordset.length)
        {
            return true;
        }
        
        return false;
    }

    public MoveToNext()
    {
        if(this.m_nRecordSetIndex >= this.m_dbProcedureResult.recordset.length)
        {
            throw new Error("Record is move to end, procedure[" + this.m_sCurrentProcedure + "]");
        }

        this.m_nRecordSetIndex++;
    }

    public GetValue(sKey: string): any
    {
        let record = this.m_dbProcedureResult.recordset[this.m_nRecordSetIndex];

        if(record === undefined)
        {
            throw new Error("Record is not found, procedure[" + this.m_sCurrentProcedure + "]");
        }

        let ret = record[sKey];

        if(ret === undefined)
        {
            throw new Error("Key:[" + sKey + "] is not found, procedure[" + this.m_sCurrentProcedure + "]");
        }
        
        return ret;
    }
};


export class Database
{
    private m_dbRequests:                                           List<DBRequest>;                    //数据库请求
    private m_dbResponses:                                          List<DBResponse>;                   //数据库回复
    private m_dbConnection:                                         DBConnection;                       //数据库连接
    
    constructor()
    {
        this.m_dbRequests = new List();
        this.m_dbResponses = new List();
        this.m_dbConnection = new DBConnection();
    }

    /*
     * 将请求加入缓存队列
     */
    public SendRequest(nRequestId: number, oRequestData: any, nContextId: number): void
    {
        let dbRequest: DBRequest = {
            nContextId: nContextId,
            nRequestId: nRequestId
        };

        dbRequest.data = ObjectClone(oRequestData);

        if(dbRequest.nContextId >= GConfig.SQLConfig.ContextCount)
        {
            dbRequest.nContextId = 0;
        }

        this.m_dbRequests.Push(dbRequest);

        if(this.m_dbConnection.IsExecuting())
        {
            return;
        }

        this.OnNextRequest();
    }

    /*
     * 将回复加入缓存队列
     */
    public SendResponse(nResponseId: number, oResponseData: any, nContextId: number)
    {
        let dbResponse: DBResponse = {
            nContextId: nContextId,
            nResponseId: nResponseId
        };

        dbResponse.data = ObjectClone(oResponseData);

        this.m_dbResponses.Push(dbResponse);

        process.nextTick(()=>{
            this.OnResponse();
        });
    }

    public OnNextRequest()
    {
        if(this.m_dbConnection.IsExecuting()) return;

        if(this.m_dbRequests.Count() <= 0) return;

        this.m_dbConnection.SetExecuting(true);

        this.m_dbConnection.CheckConnection().then(()=>{

            const dbRequest = this.m_dbRequests.PopHead();

            if(dbRequest === null)
            {
                return;
            }

            GGameEngine.OnDatabaseRequest(this.m_dbConnection, dbRequest).then((ret)=>{
                if(ret === false)
                {
                    console.log("OnDatabaseRequest[", dbRequest.nRequestId, "] return false.");
                }

                this.m_dbConnection.SetExecuting(false);
                this.OnNextRequest();
            }).catch((err)=>{
                console.log("OnDatabaseRequest[", dbRequest.nRequestId, "] exception occured, e:", err);
                this.m_dbConnection.SetExecuting(false);
                this.OnNextRequest();
            });
        }).catch((e)=>{
            console.log("DB CheckConnection failed, e:", e);

            this.m_dbConnection.SetExecuting(false);
            this.OnNextRequest();
        });
    }

    public OnResponse()
    {
        const dbResponse = this.m_dbResponses.PopHead();

        try
        {
            let ret = GGameEngine.OnDatabaseResponse(dbResponse);

            if(ret === false)
            {
                console.log("OnDatabaseRequest[", dbResponse.nResponseId, "] return false.");
            }
        }
        catch(e)
        {
            console.log("OnDatabaseRequest[", dbResponse.nResponseId, "] exception occured, e:", e);
        }
    }
}



