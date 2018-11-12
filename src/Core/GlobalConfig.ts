import * as mssql from "mssql";
import * as io from "fs";


interface ServerConfig
{
    sName:                              string;             //服务器名字
    sServiceAddr:                       string;             //服务地址
    nServicePort:                       number;             //服务端口
    nMaxConnection:                     number;             //最大连接

    sCenterServerAddr?:                 string;             //中心服务器地址
    nCenterServerPort?:                 number;             //中心服务器端口

	nServerId?:							number;				//服务器Id
	sSecretKey?:						string;				//SecretKey.

	nGameKind?:							number;				//游戏类型
	nSceneCount?:						number;				//场景数量
};

interface SQLConfig
{
    DBInfo:                             mssql.config;       //数据库配置
    ContextCount:                       number;             //Context数量
};

interface MatchingRule
{
	nEnterGoldMin:						number;				//进入金币最小
	nEnterGoldMax:						number;				//进入金币最大

	nCustomRule:						number;
	nCellScore:							number;
};

interface MatchingConfig
{
	matchingRules:						Array<MatchingRule>;
};

interface GlobalConfigure
{
    ServerConfig:                       ServerConfig;       //服务器配置信息
    HeartBeatTimeout:                   number;             //心跳超时时间
    HeartBeatInterval:                  number;             //心跳发送时间
    SQLConfig?:                         SQLConfig;          //数据库配置信息
	SSLKey?:							string;				//ssl
	SSLCert?:							string;				//ssl
	MatchingConfig?:					MatchingConfig;
};

/*
 * GConfig.ServerConfig 服务器配置信息
 * 
 * GConfig.SQLConfig 数据库配置信息
 * 
 */
export let GConfig: GlobalConfigure;


export function LoadConfigure()
{
	GConfig = LoadJsonFile("./config.json");
}

export function LoadJsonFile(sPath: string): any
{
	let buffer = io.readFileSync(sPath);

	if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        buffer = buffer.slice(3);
    }
	
    return JSON.parse(buffer.toString("utf-8"));
}