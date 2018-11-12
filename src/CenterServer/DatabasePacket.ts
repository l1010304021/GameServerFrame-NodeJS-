import { UserConnectionInfo } from "../Common/CMD_CenterServer";



export enum DBRequestId
{
	Req_LoadUsers								= 0x0001,					//加载玩家

	Req_LoadRanking,														//加载排行榜


	Req_UserLogin								= 0x1001,					//玩家登陆

	Req_WriteGameEnd,														//游戏结束
	Req_ChangeGameGold,														//改变金币
};






export interface DBReq_UserLogin
{
	userConnInfo:								UserConnectionInfo;
	sAccount:									string;
	sUserName:									string;
	sUserPhoto:									string;
	sDevice:									string;
};




export interface DBReq_WriteGameEnd
{
	nUserId:									number;

	nExperience:								number;
	nGameTimes:									number;
	nWinTimes:									number;
	nGinTimes:									number;
	nBigGinTimes:								number;
	nUndercutTimes:								number;
	nMaxWinStreak:								number;
};

export interface DBReq_ChangeGameGold
{
	nUserId:									number;

	nChangeGold:								number;
}












export enum DBResponseId
{
	Rep_LoadUsers								= 0x0001,					//加载玩家成功

	Rep_LoadRanking,														//加载排行榜

	Rep_UserLoginSuccess						= 0x1001,					//登陆成功
	Rep_UserLoginFailure,													//登陆失败
};




export interface RankingItem
{
	nUserId:									number;
	nScore:										number;
	nRank:										number;
	sUserName:									string;
	sUserPhoto:									string;
};



export interface DBRep_LoadRanking
{
	mapRankings:								Array<RankingItem>;
};

export interface DBRep_UserLoginSuccess
{
	userConnInfo:								UserConnectionInfo;
	sAccount:									string;
	nUserId:									number;
	sUserName:									string;
	sUserPhoto:									string;
	sDevice:									string;
	nGameGold:									number;

	nExperience:								number;
	nGameTimes:									number;
	nWinTimes:									number;
	nGinTimes:									number;
	nBigGinTimes:								number;
	nUndercutTimes:								number;
	nMaxWinStreak:								number;
};

export interface DBRep_UserLoginFailure
{
	userConnInfo:								UserConnectionInfo;
	nErrCode:									number;
};