import { MessageHead } from "../Core/Message";
import {
	MainId_GS,

	SubId_GS_UserLogin,
	SubGSUserLoginReq_Login,
	SubGSUserLoginRep_LoginFailure,
	SubGSUserLoginRep_LoginSuccess,

	SubId_GS_UserUpdate,
	SubGSUserUpdateRep_GameGold, 

	SubId_GS_UserNotice,
	SubGSUserNotice_Error,

    SubId_GS_UserMatching,
    SubGSUserMatchingReq_NormalMatching,
	SubGSUserMatchingRep_NormalMatching,
	SubGSUserMatchingRep_NormalMatchingSuccess,
	SubGSUserMatchingRep_NormalMatchingFailure,
    SubGSUserUpdateRep_GamingInfo,
    SubGSUserMatchingReq_NormalMatchingCancel,
    SubGSUserMatchingRep_NormalMatchingCancel,
    SubGSUserUpdateRep_GameUserInfo,
    SubId_GS_UserRanking,
    SubGSUserRankingReq_GetRanking,
    SubGSUserRankingRep_GetRanking,
    SubGSUserNotice_LevelUpReward,
    SubGSUserUpdateRep_GameShareInfo,
    SubId_GS_UserShare,
    SubGSUserShareReq_WatchVideo,
	SubGSUserShareReq_InviteFriend,
	SubGSUserShareReq_ShareToFriend,
	SubGSUserShareReq_GetShareGift,
	SubGSUserShareRep_WatchVideoSuccess,
	SubGSUserShareRep_WatchVideoFailure,
	SubGSUserShareRep_InviteFriendSuccess,
	SubGSUserShareRep_InviteFriendFailure,
	SubGSUserShareRep_ShareToFriendSuccess,
	SubGSUserShareRep_ShareToFriendFailure,
	SubGSUserShareRep_GetShareGiftSuccess,
	SubGSUserShareRep_GetShareGiftFailure,
	ShareGiftUser,
	SubGSUserShareRep_ShareGiftList,
	SubGSUserShareRep_ShareGiftItem
    
	} from "./CMD_GateServer";

/*
 * 消息定义
 */


export enum MainId_CS
{
	//注册消息
	Register							= 0x0001,									//服务注册消息

	//玩家相关
	UserLogin							= MainId_GS.UserLogin,						//玩家登录消息
	UserUpdate							= MainId_GS.UserUpdate,						//玩家更新消息
	UserNotice							= MainId_GS.UserNotice,						//玩家通知消息
	UserMatching						= MainId_GS.UserMatching,					//玩家匹配消息
	UserRanking							= MainId_GS.UserRanking,					//玩家排行榜
	UserShare							= MainId_GS.UserShare,						//玩家分享消息

	//战斗服务器相关
	FightFrame							= 0x1001,									//战斗服务器框架消息
};

////////////////////////////////////////////////////////////////////////////////////////
//服务器注册
export enum SubId_CS_Register
{
	Req_RegisterGate					= 0x0001,									//注册登录
	Req_RegisterFight					= 0x0002,									//注册战斗

	Rep_RegisterSuccess					= 0x1001,									//注册成功
	Rep_RegisterFailure					= 0x1002,									//注册失败
};

export interface SubCSRegisterReq_RegisterGate
{
	nGateId:							number;
};

export interface SubCSRegisterReq_RegisterFight
{
	nServerId:							number;										//战斗服务器ID
	nGameKind:							number;										//战斗服务器类型

	sServerAddr:						string;										//战斗服务器地址
	nServerPort:						number;										//战斗服务器端口
	sServerName:						string;										//战斗服务器名字
	
	nSceneCount:						number;										//战场数量
};

export interface SubCSRegisterRep_RegisterSuccess
{
	
};

export interface SubCSRegisterRep_RegisterFailure
{
	nErrCode:							number;
	sErrMsg:							string;
};


//玩家消息
export interface UserConnectionInfo
{
	nUserId:							number;
	nBindIndex:							number;
	nServerId:							number;
	nSessionId:							number;
};

////////////////////////////////////////////////////////////////////////////////////////
//玩家登陆消息
export enum SubId_CS_UserLogin
{
	Req_Login							= SubId_GS_UserLogin.Req_Login,				//玩家登陆
	Req_Logout,																		//玩家离线

	Rep_LoginSuccess					= SubId_GS_UserLogin.Rep_LoginSuccess,		//登陆成功
	Rep_LoginFailure					= SubId_GS_UserLogin.Rep_LoginFailure,		//登陆失败
};

export interface SubCSUserLoginReq_Login extends SubGSUserLoginReq_Login
{
	userConnInfo?:						UserConnectionInfo;
};

export interface SubCSUserLoginReq_Logout
{
	userConnInfo?:						UserConnectionInfo;
}

export interface SubCSUserLoginRep_LoginSuccess extends SubGSUserLoginRep_LoginSuccess
{
	userConnInfo?:						UserConnectionInfo;
};

export interface SubCSUserLoginRep_LoginFailure extends SubGSUserLoginRep_LoginFailure
{
	userConnInfo?:						UserConnectionInfo;
};


////////////////////////////////////////////////////////////////////////////////////////
//玩家更新消息
export enum SubId_CS_UserUpdate
{
	Rep_GameGold						= SubId_GS_UserUpdate.Rep_GameGold,			//金币更新
	Rep_GamingInfo						= SubId_GS_UserUpdate.Rep_GamingInfo,		//游戏状态更新
	Rep_GameUserInfo					= SubId_GS_UserUpdate.Rep_GameUserInfo,		//游戏玩家信息
	Rep_GameShareInfo					= SubId_GS_UserUpdate.Rep_GameShareInfo,	//游戏分享信息
};

export interface SubCSUserUpdateRep_GameGold extends SubGSUserUpdateRep_GameGold
{
	userConnInfo?:						UserConnectionInfo;
}

export interface SubCSUserUpdateRep_GamingInfo extends SubGSUserUpdateRep_GamingInfo
{
	userConnInfo?:						UserConnectionInfo;
}

export interface SubCSUserUpdateRep_GameUserInfo extends SubGSUserUpdateRep_GameUserInfo
{
	userConnInfo?:						UserConnectionInfo;
}

export interface SubCSUserUpdateRep_GameShareInfo extends SubGSUserUpdateRep_GameShareInfo
{
	userConnInfo?:						UserConnectionInfo;
}



////////////////////////////////////////////////////////////////////////////////////////
//玩家通知消息
export enum SubId_CS_UserNotice
{
	Error								= SubId_GS_UserNotice.Error,				//错误消息
	LevelUpReward						= SubId_GS_UserNotice.LevelUpReward,		//升级奖励
};

export interface SubCSUserNotice_Error extends SubGSUserNotice_Error
{
	userConnInfo?:						UserConnectionInfo;
}

export interface SubCSUserNotice_LevelUpReward extends SubGSUserNotice_LevelUpReward
{
	userConnInfo?:						UserConnectionInfo;
}



///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///玩家匹配消息
export enum SubId_CS_UserMatching
{
	Req_NormalMatching					= SubId_GS_UserMatching.Req_NormalMatching,			//正常匹配消息
	Req_NormalMatchingCancel			= SubId_GS_UserMatching.Req_NormalMatchingCancel,	//取消匹配

	Rep_NormalMatching					= SubId_GS_UserMatching.Rep_NormalMatching,			//匹配中
	Rep_NormalMatchingSuccess			= SubId_GS_UserMatching.Rep_NormalMatchingSuccess,	//匹配成功
	Rep_NormalMatchingFailure			= SubId_GS_UserMatching.Rep_NormalMatchingFailure,	//匹配失败
	Rep_NormalMatchingCancel			= SubId_GS_UserMatching.Rep_NormalMatchingCancel,	//匹配取消
};

export interface SubCSUserMatchingReq_NormalMatching extends SubGSUserMatchingReq_NormalMatching
{
	
}

export interface SubCSUserMatchingReq_NormalMatchingCancel extends SubGSUserMatchingReq_NormalMatchingCancel
{
	
}

export interface SubCSUserMatchingRep_NormalMatching extends SubGSUserMatchingRep_NormalMatching
{
	
}

export interface SubCSUserMatchingRep_NormalMatchingSuccess extends SubGSUserMatchingRep_NormalMatchingSuccess
{
	
}

export interface SubCSUserMatchingRep_NormalMatchingFailure extends SubGSUserMatchingRep_NormalMatchingFailure
{
	
}

export interface SubCSUserMatchingRep_NormalMatchingCancel extends SubGSUserMatchingRep_NormalMatchingCancel
{
	
}

export enum SubId_CS_UserRanking
{
	Req_GetRanking						= SubId_GS_UserRanking.Req_GetRanking,	//获取排行榜

	Rep_GetRanking						= SubId_GS_UserRanking.Rep_GetRanking,	//获取排行榜结果
};


export interface SubCSUserRankingReq_GetRanking extends SubGSUserRankingReq_GetRanking
{

};

export interface SubCSUserRankingRep_GetRanking extends SubGSUserRankingRep_GetRanking
{
	
}



export enum SubId_CS_UserShare
{
	Req_WatchVideo						= SubId_GS_UserShare.Req_WatchVideo,			//观看视频
	Req_InviteFriend					= SubId_GS_UserShare.Req_InviteFriend,			//邀请好友
	Req_ShareToFriend					= SubId_GS_UserShare.Req_ShareToFriend,			//分享礼物
	Req_GetShareGift					= SubId_GS_UserShare.Req_GetShareGift,			//领取分享礼物

	Rep_WatchVideoSuccess				= SubId_GS_UserShare.Rep_WatchVideoSuccess,		//观看成功
	Rep_WatchVideoFailure				= SubId_GS_UserShare.Rep_WatchVideoFailure,		//观看失败

	Rep_InviteFriendSuccess				= SubId_GS_UserShare.Rep_InviteFriendSuccess,	//邀请成功
	Rep_InviteFriendFailure				= SubId_GS_UserShare.Rep_InviteFriendFailure,	//邀请失败

	Rep_ShareToFriendSuccess			= SubId_GS_UserShare.Rep_ShareToFriendSuccess,	//分享成功
	Rep_ShareToFriendFailure			= SubId_GS_UserShare.Rep_ShareToFriendFailure,	//分享失败

	Rep_GetShareGiftSuccess				= SubId_GS_UserShare.Rep_GetShareGiftSuccess,	//领取分享礼物成功
	Rep_GetShareGiftFailure				= SubId_GS_UserShare.Rep_GetShareGiftFailure,	//领取分享礼物失败

	Rep_ShareGiftList					= SubId_GS_UserShare.Rep_ShareGiftList,			//玩家收到的礼物列表
	Rep_ShareGiftItem					= SubId_GS_UserShare.Rep_ShareGiftItem,			//玩家收到的礼物（单条更新）
};


export interface SubCSUserShareReq_WatchVideo extends SubGSUserShareReq_WatchVideo
{
	
};

export interface SubCSUserShareReq_InviteFriend extends SubGSUserShareReq_InviteFriend
{

}

export interface SubCSUserShareReq_ShareToFriend extends SubGSUserShareReq_ShareToFriend
{
	
};

export interface SubCSUserShareReq_GetShareGift extends SubGSUserShareReq_GetShareGift
{
	
};

export interface SubCSUserShareRep_WatchVideoSuccess extends SubGSUserShareRep_WatchVideoSuccess
{
	
};

export interface SubCSUserShareRep_WatchVideoFailure extends SubGSUserShareRep_WatchVideoFailure
{
	
};

export interface SubCSUserShareRep_InviteFriendSuccess extends SubGSUserShareRep_InviteFriendSuccess
{
	
};

export interface SubCSUserShareRep_InviteFriendFailure extends SubGSUserShareRep_InviteFriendFailure
{
	
};

export interface SubCSUserShareRep_ShareToFriendSuccess extends SubGSUserShareRep_ShareToFriendSuccess
{
	
};

export interface SubCSUserShareRep_ShareToFriendFailure extends SubGSUserShareRep_ShareToFriendFailure
{
	
};

export interface SubCSUserShareRep_GetShareGiftSuccess extends SubGSUserShareRep_GetShareGiftSuccess
{
	
};

export interface SubCSUserShareRep_GetShareGiftFailure extends SubGSUserShareRep_GetShareGiftFailure
{
	
};

export interface SubCSUserShareRep_ShareGiftList extends SubGSUserShareRep_ShareGiftList
{
	
};

export interface SubCSUserShareRep_ShareGiftItem extends SubGSUserShareRep_ShareGiftItem
{
	
};






export enum SubId_CS_FightFrame
{
	Req_AllocateScene					= 0x0001,									//分配场景
	Req_UserPropertyUpdate				= 0x0011,									//玩家属性更新

	Rep_AllocateSceneSuccess			= 0x1001,									//分配场景成功
	Rep_AllocateSceneFailure			= 0x1002,									//分配场景失败

	Notice_GameEnd						= 0x2001,									//游戏结束
	Notice_Release						= 0x2002,									//释放场景
}



export interface SceneUserInfo
{
	nUserId:							number;
	sUserName:							string;
	sUserPhoto:							string;

	sLoginKey:							string;

	nGameGold:							number;
	nExperience:						number;
	bAndroid:							boolean;
};

export interface SubCSFightFrameReq_AllocateScene
{
	nSceneIndex:						number;
	sceneUsers:							Array<SceneUserInfo>;
	nCellScore:							number;
	nCustomRule:						number;
};

export interface SubCSFightFrameReq_UserPropertyChange
{
	nSceneIndex:						number;
	nUserId:							number;
	nGameGold:							number;
	nExperience:						number;
};

export interface SubCSFightFrameRep_AllocateSceneSuccess
{
	nSceneIndex:						number;
};

export interface SubCSFightFrameRep_AllocateSceneFailure
{
	nSceneIndex:						number;
};

export interface GameEndUserInfo
{
	nUserId:							number;
	nGameGoldChange:					number;

	bWin:								boolean;

	nGinTimes:							number;
	nBigGinTimes:						number;
	nUndercutTimes:						number;
};

export interface SubCSFightFrameNotice_GameEnd
{
	nSceneIndex:						number;
	gameEndUserInfo:					Array<GameEndUserInfo>;					
}

export interface SubCSFightFrameNotice_Release
{
	nSceneIndex:						number;			
}