import { RankingItem } from "../CenterServer/DatabasePacket";


enum MainId_GS
{
	UserLogin						= 0x0101,										//玩家登录
	UserUpdate						= 0x0102,										//玩家信息更新
	UserNotice						= 0x0103,										//玩家通知消息
	UserMatching					= 0x0104,										//玩家匹配
	UserRanking						= 0x0105,										//玩家排行榜
	UserShare						= 0x0106,										//玩家分享
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///玩家登陆消息

enum SubId_GS_UserLogin
{
	Req_Login						= 0x0001,										//登录消息

	Rep_LoginSuccess				= 0x1001,										//登录成功
	Rep_LoginFailure				= 0x1002,										//登录失败
};

interface SubGSUserLoginReq_Login
{
	sUserAccount:					string;											//玩家账号
	sSignature:						string;											//校验密钥
	sUserName:						string;											//玩家名字
	sUserPhoto:						string;											//玩家头像
	sDevice:                        string											//玩家设备类型（ANDROID, IOS, WEB, MOBILE_WEB, UNKNOW）
};

interface SubGSUserLoginRep_LoginSuccess
{
	//玩家信息
	nUserId:						number;
	sUserName:						string;
	sUserPhoto:						string;
	nGameGold:						number;
};

interface SubGSUserLoginRep_LoginFailure
{
	nErrCode:						number;											//错误码
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///玩家数据更新
enum SubId_GS_UserUpdate
{
	Rep_GameGold					= 0x0001,										//游戏金币变更
	Rep_GamingInfo					= 0x0002,										//游戏状态变更
	Rep_GameUserInfo				= 0x0003,										//游戏玩家信息
	Rep_GameShareInfo				= 0x0004,										//游戏分享信息
};

interface SubGSUserUpdateRep_GameGold
{
	nGold:							number;
};

interface GamingUserInfo
{
	nUserId:							number;
	sUserName:							string;
	sUserPhoto:							string;

	nGameGold:							number;
};

interface SubGSUserUpdateRep_GamingInfo
{
	nPort:								number;
	sLoginKey:							string;
	gamingUsers:						Array<GamingUserInfo>;
};

interface SubGSUserUpdateRep_GameUserInfo
{
	nExperience:						number;
	nGameTimes:							number;
	nWinTimes:							number;
	nGinTimes:							number;
	nBigGinTimes:						number;
	nUndercutTimes:						number;
	nMaxWinStreak:						number;
};

interface SubGSUserUpdateRep_GameShareInfo
{
	nWatchVideoTimes:					number;
	nInviteFriendTimes:					number;
	nShareToFriendTimes:				number;
};




///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///玩家通知消息
enum SubId_GS_UserNotice
{
	Error								= 0x0001,										//错误消息
	LevelUpReward						= 0x0010,										//升级奖励通知
};

interface SubGSUserNotice_Error
{
	nErrCode:							number;
};

interface SubGSUserNotice_LevelUpReward
{
	nExpOld:							number;
	nExpNew:							number;
	nRewardGold:						number;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///玩家匹配消息
enum SubId_GS_UserMatching
{
	Req_NormalMatching					= 0x0001,										//正常匹配消息
	Req_NormalMatchingCancel			= 0x0002,										//取消匹配

	Rep_NormalMatching					= 0x1001,										//匹配中
	Rep_NormalMatchingSuccess			= 0x1002,										//匹配成功
	Rep_NormalMatchingFailure			= 0x1003,										//匹配失败
	Rep_NormalMatchingCancel			= 0x1004,										//匹配取消
};

interface SubGSUserMatchingReq_NormalMatching
{
	nMatchingIndex:						number;
}

interface SubGSUserMatchingReq_NormalMatchingCancel
{

}

interface SubGSUserMatchingRep_NormalMatching
{
	nMatchingSuccessTime:				number;
}

interface SubGSUserMatchingRep_NormalMatchingCancel
{
	nErrorCode:							number;
}

interface MatchingUserInfo
{
	nUserId:							number;
	sUserName:							string;
	sUserPhoto:							string;

	nGameGold:							number;
	nExperience:						number;
}

interface SubGSUserMatchingRep_NormalMatchingSuccess
{
	nPort:								number;
	sLoginKey:							string;
	matchingUsers:						Array<MatchingUserInfo>;
}

interface SubGSUserMatchingRep_NormalMatchingFailure
{
	nErrorCode:							number;
}


enum SubId_GS_UserRanking
{
	Req_GetRanking						= 0x0001,										//获取排行榜

	Rep_GetRanking						= 0x1001,										//获取排行榜结果
};


interface SubGSUserRankingReq_GetRanking
{

};

interface SubGSUserRankingRep_GetRanking
{
	rankings:							Array<RankingItem>;
}



enum SubId_GS_UserShare
{
	Req_WatchVideo						= 0x0001,										//观看视频
	Req_InviteFriend					= 0x0002,										//邀请好友
	Req_ShareToFriend					= 0x0003,										//分享礼物
	Req_GetShareGift					= 0x0004,										//领取分享礼物

	Rep_WatchVideoSuccess				= 0x1001,										//观看成功
	Rep_WatchVideoFailure				= 0x1002,										//观看失败

	Rep_InviteFriendSuccess				= 0x1003,										//邀请成功
	Rep_InviteFriendFailure				= 0x1004,										//邀请失败

	Rep_ShareToFriendSuccess			= 0x1005,										//分享成功
	Rep_ShareToFriendFailure			= 0x1006,										//分享失败

	Rep_GetShareGiftSuccess				= 0x1007,										//领取分享礼物成功
	Rep_GetShareGiftFailure				= 0x1008,										//领取分享礼物失败

	Rep_ShareGiftList					= 0x1009,										//玩家收到的礼物列表
	Rep_ShareGiftItem					= 0x100A,										//玩家收到的礼物（单条更新）
};


interface SubGSUserShareReq_WatchVideo
{
	
};

interface SubGSUserShareReq_InviteFriend
{
	sContextId:							string;
	sUserAccount:						string;
}

interface SubGSUserShareReq_ShareToFriend
{
	sContextId:							string;
	sUserAccount:						string;
};

interface SubGSUserShareReq_GetShareGift
{
	nUseId:								number;
};

interface SubGSUserShareRep_WatchVideoSuccess
{
	nRewardGold:						number;
};

interface SubGSUserShareRep_WatchVideoFailure
{
	nErrorCode:							number;
};

interface SubGSUserShareRep_InviteFriendSuccess
{
	nRewardGold:						number;
};

interface SubGSUserShareRep_InviteFriendFailure
{
	nErrorCode:							number;
};

interface SubGSUserShareRep_ShareToFriendSuccess
{
	nRewardGold:						number;
};

interface SubGSUserShareRep_ShareToFriendFailure
{
	nErrorCode:							number;
};

interface SubGSUserShareRep_GetShareGiftSuccess
{
	nUserId:							number;
};

interface SubGSUserShareRep_GetShareGiftFailure
{
	nErrorCode:							number;
};

interface ShareGiftUser
{
	nUserId:							number;
	sUserName:							string;
	sUserPhoto:							string;
	nGiftGold:							number;
}

interface SubGSUserShareRep_ShareGiftList
{
	giftUsers:							Array<ShareGiftUser>
};

interface SubGSUserShareRep_ShareGiftItem
{
	giftUser:							ShareGiftUser;
};



export
{
	MainId_GS,

	SubId_GS_UserLogin,
	SubGSUserLoginReq_Login,
	SubGSUserLoginRep_LoginSuccess,
	SubGSUserLoginRep_LoginFailure,

	SubId_GS_UserUpdate,
	SubGSUserUpdateRep_GameGold,
	GamingUserInfo,
	SubGSUserUpdateRep_GamingInfo,
	SubGSUserUpdateRep_GameUserInfo,
	SubGSUserUpdateRep_GameShareInfo,

	SubId_GS_UserNotice,
	SubGSUserNotice_Error,
	SubGSUserNotice_LevelUpReward,

	SubId_GS_UserMatching,
	SubGSUserMatchingReq_NormalMatching,
	SubGSUserMatchingReq_NormalMatchingCancel,
	SubGSUserMatchingRep_NormalMatching,
	MatchingUserInfo,
	SubGSUserMatchingRep_NormalMatchingSuccess,
	SubGSUserMatchingRep_NormalMatchingFailure,
	SubGSUserMatchingRep_NormalMatchingCancel,

	SubId_GS_UserRanking,
	SubGSUserRankingReq_GetRanking,
	SubGSUserRankingRep_GetRanking,

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
};