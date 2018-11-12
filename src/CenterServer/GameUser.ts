import { InvalidUserId, InvalidServerId, IsValidUserId, InvalidSceneId, GameErrors } from "../Common/GlobalDefines";
import { MessageHead } from "../Core/Message";
import { UserConnectionInfo, MainId_CS, SubCSUserLoginRep_LoginSuccess, SubId_CS_UserLogin, SubCSUserNotice_Error, SubId_CS_UserNotice, SubId_CS_UserMatching, SubCSUserMatchingRep_NormalMatchingSuccess, SubCSUserMatchingRep_NormalMatchingFailure, SubCSUserMatchingRep_NormalMatching, SubCSUserUpdateRep_GameGold, SubId_CS_UserUpdate, SubCSUserUpdateRep_GamingInfo, SubCSUserMatchingRep_NormalMatchingCancel, SubCSUserMatchingReq_NormalMatching, GameEndUserInfo, SubCSUserUpdateRep_GameUserInfo, SubId_CS_UserRanking, SubCSUserRankingRep_GetRanking, SubCSUserNotice_LevelUpReward, SubCSFightFrameReq_UserPropertyChange, SubId_CS_FightFrame, SubId_CS_UserShare, SubCSUserUpdateRep_GameShareInfo, SubCSUserShareRep_WatchVideoFailure, SubCSUserShareRep_WatchVideoSuccess, SubCSUserShareRep_InviteFriendFailure, SubCSUserShareReq_InviteFriend, SubCSUserShareRep_InviteFriendSuccess, SubCSUserShareReq_ShareToFriend, SubCSUserShareRep_ShareToFriendFailure, SubCSUserShareRep_ShareToFriendSuccess, SubCSUserShareReq_GetShareGift, SubCSUserShareRep_GetShareGiftFailure, SubCSUserShareRep_GetShareGiftSuccess, SubCSUserShareRep_ShareGiftItem, SubCSUserShareRep_ShareGiftList } from "../Common/CMD_CenterServer";
import { ConnectionBase } from "./ConnectionBase";
import { SubCSUserLoginReq_Login } from "../Common/CMD_CenterServer";
import { GGameEngine, GameRandom } from "../Core/GameEngine";
import { GameCenter } from "./main";
import { GGameMatchingManager } from "./GameMatchingManager";
import { DBRep_UserLoginSuccess, DBReq_ChangeGameGold, DBRequestId, DBReq_WriteGameEnd } from "./DatabasePacket";
import { GGameSceneManager } from "./GameSceneManager";
import { MatchingUserInfo, GamingUserInfo, ShareGiftUser } from "../Common/CMD_GateServer";
import { GConfig } from "../Core/GlobalConfig";
import { GGameRankingManager } from "./GameRanking";




interface UserGamingInfo
{
	nSceneIndex:								number;
	nPort:										number;
	sLoginKey:									string;
}

interface UserGiftInfo
{
	nUserId:									number;
	nCount:										number;
	nLastRecvDay:								number;
};

const GWatchVideoRewardGold: number				= 5000;
const GInviteFriendRewardGold: number			= 500;
const GShareGiftShareRewardGold: number			= 3000;
const GShareGiftGetRewardGold: number			= 5000;


export class GameUser extends ConnectionBase
{
	private m_nUserId:							number;							//玩家Id
	private m_sUserName:						string;							//玩家名字
	private m_sUserPhoto:						string;							//玩家头像

	private m_bAndroid:							boolean;						//是否为机器人

	private m_sUserDevice:						string;							//玩家设备

	private m_nGameGold:						number;							//玩家金币

	private m_nExperience:						number;
	private m_nGameTimes:						number;
	private m_nWinTimes:						number;
	private m_nGinTimes:						number;
	private m_nBigGinTimes:						number;
	private m_nUndercutTimes:					number;
	private m_nMaxWinStreak:					number;
	private m_nCurWinStreak:					number;



	private m_nLastResetDay:					number;

	private m_nWatchVideoTimesLeft:				number;
	private m_nInviteFriendTimesLeft:			number;
	private m_nShareToFriendTimesLeft:			number;

	private m_mapInviteFriends:					Object;
	private m_mapShareToFriends:				Object;

	private m_mapRecvGifts:						Object;


	private m_userConnInfo:						UserConnectionInfo;				//连接信息

	private m_bMatching:						boolean;						//正在匹配
	private m_GamingInfo:						UserGamingInfo;					//玩家游戏信息


	constructor()
	{
		super();

		this.m_userConnInfo = {
			nServerId: InvalidServerId,
			nUserId: InvalidUserId,
			nBindIndex: -1,
			nSessionId: 0
		};

		this.m_nUserId = InvalidUserId;
		this.m_sUserName = "";
		this.m_sUserPhoto = "";

		this.m_bAndroid = false;

		this.m_sUserDevice = "";

		this.m_nGameGold = 0;

		this.m_nExperience = 0;
		this.m_nGameTimes = 0;
		this.m_nWinTimes = 0;
		this.m_nGinTimes = 0;
		this.m_nBigGinTimes = 0;
		this.m_nUndercutTimes = 0;
		this.m_nMaxWinStreak = 0;
		this.m_nCurWinStreak = 0;

		this.m_nLastResetDay = 0;

		this.m_nWatchVideoTimesLeft = 0;
		this.m_nInviteFriendTimesLeft = 0;
		this.m_nShareToFriendTimesLeft = 0;

		this.m_mapInviteFriends = {};
		this.m_mapShareToFriends = {};

		this.m_mapRecvGifts = {};

		this.m_GamingInfo = {
			nSceneIndex: InvalidSceneId,
			nPort: 0,
			sLoginKey: ""
		};

		this.m_bMatching = false;
	}

	public IsSameConnection(uConnectionInfo: UserConnectionInfo)
	{
		if(this.m_userConnInfo.nUserId !== uConnectionInfo.nUserId ||
			this.m_userConnInfo.nServerId !== uConnectionInfo.nServerId ||
			this.m_userConnInfo.nBindIndex !== uConnectionInfo.nBindIndex ||
			this.m_userConnInfo.nSessionId !== uConnectionInfo.nSessionId) return false;

		return true;
	}

	public OnUserOnlineAndroid(nUserId: number, nGameGold: number, sUserName: string, sUserPhoto: string)
	{
		this.m_userConnInfo.nServerId = InvalidServerId;
		this.m_userConnInfo.nSessionId = 0;
		this.m_userConnInfo.nBindIndex = 0;
		this.m_nUserId = nUserId;

		this.m_bAndroid = true;

		this.m_sUserName = sUserName;
		this.m_sUserPhoto = sUserPhoto;
		this.m_sUserDevice = "";

		this.m_nGameGold = nGameGold;
		this.m_nExperience = 0;
		this.m_nGameTimes = 0;
		this.m_nWinTimes = 0;
		this.m_nGinTimes = 0;
		this.m_nBigGinTimes = 0;
		this.m_nUndercutTimes = 0;
		this.m_nMaxWinStreak = 0;
		this.m_nCurWinStreak = 0;
	}

	public OnUserOnline(pLogin: SubCSUserLoginReq_Login)
	{
		this.m_userConnInfo.nServerId = pLogin.userConnInfo.nServerId;
		this.m_userConnInfo.nSessionId = pLogin.userConnInfo.nSessionId;
		this.m_userConnInfo.nBindIndex = pLogin.userConnInfo.nBindIndex;
		this.m_userConnInfo.nUserId = this.m_nUserId;
		
		this.m_sUserName = pLogin.sUserName;
		this.m_sUserPhoto = pLogin.sUserPhoto;
		this.m_sUserDevice = pLogin.sDevice;

		this.OnLink(pLogin.userConnInfo.nServerId);

		this.OnUserLogin();
	}

	public OnUserOnlineEx(pLogin: DBRep_UserLoginSuccess)
	{
		this.m_userConnInfo.nServerId = pLogin.userConnInfo.nServerId;
		this.m_userConnInfo.nSessionId = pLogin.userConnInfo.nSessionId;
		this.m_userConnInfo.nBindIndex = pLogin.userConnInfo.nBindIndex;
		this.m_userConnInfo.nUserId = pLogin.nUserId;

		this.m_nUserId = pLogin.nUserId;
		
		this.m_sUserName = pLogin.sUserName;
		this.m_sUserPhoto = pLogin.sUserPhoto;
		this.m_sUserDevice = pLogin.sDevice;

		this.m_nGameGold = pLogin.nGameGold;

		this.m_nExperience = pLogin.nExperience;
		this.m_nGameTimes = pLogin.nGameTimes;
		this.m_nWinTimes = pLogin.nWinTimes;
		this.m_nGinTimes = pLogin.nGinTimes;
		this.m_nBigGinTimes = pLogin.nBigGinTimes;
		this.m_nUndercutTimes = pLogin.nUndercutTimes;
		this.m_nMaxWinStreak = pLogin.nMaxWinStreak;
		this.m_nCurWinStreak = 0;

		this.OnLink(pLogin.userConnInfo.nServerId);

		this.OnUserLogin();
	}

	public OnUserLogin()
	{
		let nCurrentDay = GGameEngine.GetCurrentDay();

		if(this.m_nLastResetDay !== nCurrentDay)
		{
			this.m_nLastResetDay = nCurrentDay;

			this.OnUpdateByDay();
		}

		let pLoginSuccess: SubCSUserLoginRep_LoginSuccess = {
			nUserId: this.m_nUserId,
			sUserName: this.m_sUserName,
			sUserPhoto: this.m_sUserPhoto,
			nGameGold: this.m_nGameGold
		};

		this.SendMessage(MainId_CS.UserLogin, SubId_CS_UserLogin.Rep_LoginSuccess, pLoginSuccess);

		this.SendGamingInfo();
		this.SendUserGameInfo();
		this.SendShareTimes();

		this.SendShareGiftList();
	}

	public OnUserLogout()
	{
		this.m_userConnInfo.nServerId = InvalidServerId;
		this.m_userConnInfo.nSessionId = 0;
		this.m_userConnInfo.nBindIndex = 0;
		this.m_userConnInfo.nUserId = this.m_nUserId;

		this.OnShut();

		if(this.m_bMatching === true)
		{
			this.m_bMatching = false;

			GGameMatchingManager.CancelMatching(this.m_nUserId);
		}
	}

	public OnUpdateByDay()
	{
		this.m_nWatchVideoTimesLeft = 1000;
		this.m_nInviteFriendTimesLeft = 1000;
		this.m_nShareToFriendTimesLeft = 5;

		this.m_mapInviteFriends = {};
		this.m_mapShareToFriends = {};
	}

	public OnMatchingSuccess(nSceneIndex: number, nPort: number, sLoginKey: string)
	{
		this.m_bMatching = false;
		this.m_GamingInfo.nSceneIndex = nSceneIndex;
		this.m_GamingInfo.nPort = nPort;
		this.m_GamingInfo.sLoginKey = sLoginKey;
	}

	public OnMatchingFailure(pFailure: SubCSUserMatchingRep_NormalMatchingFailure)
	{
		this.m_bMatching = false;

		this.SendMessage(MainId_CS.UserMatching, SubId_CS_UserMatching.Rep_NormalMatchingFailure, pFailure);
	}

	public IsAndroid()
	{
		return this.m_bAndroid;
	}

	public GetUserId()
	{
		return this.m_nUserId;
	}

	public GetUserName()
	{
		return this.m_sUserName;
	}

	public GetUserPhoto()
	{
		return this.m_sUserPhoto;
	}

	public GetGameGold()
	{
		return this.m_nGameGold;
	}

	public GetExperience()
	{
		return this.m_nExperience;
	}

	public IsPlaying()
	{
		return (this.m_GamingInfo.nSceneIndex !== InvalidSceneId);
	}

	public SendNoticeError(sErrMsg: string, nErrCode: number)
	{
		let pNoticeError: SubCSUserNotice_Error = {
			nErrCode: nErrCode
		};

		this.SendMessage(MainId_CS.UserNotice, SubId_CS_UserNotice.Error, pNoticeError);
	}

	public SendMessage(nMainId: number, nSubId: number, pData: any): boolean
	{
		if (this.IsOnline() === false || this.IsAndroid() === true) return false;

		(pData.userConnInfo as UserConnectionInfo) = {
			nBindIndex: this.m_userConnInfo.nBindIndex,
			nServerId: this.m_userConnInfo.nServerId,
			nSessionId: this.m_userConnInfo.nSessionId,
			nUserId: this.m_userConnInfo.nUserId
		};

		(GGameEngine as GameCenter).SendMessageToGateServer(this.m_userConnInfo.nServerId, nMainId, nSubId, pData);
	}

	public OnUserMatching(nSubId: number, pData: any): boolean
	{
		switch(nSubId)
		{
		case SubId_CS_UserMatching.Req_NormalMatching:
			{
				console.log("收到玩家[", this.m_nUserId, "]匹配消息, 当前场景[",this.m_GamingInfo.nSceneIndex, "]");

				let pMatchingReq: SubCSUserMatchingReq_NormalMatching = pData;

				if(pMatchingReq.nMatchingIndex <= 0 || pMatchingReq.nMatchingIndex > GConfig.MatchingConfig.matchingRules.length)
				{
					console.log("匹配失败，非法消息，玩家[", this.m_nUserId, "]");

					const pMatchingFailure: SubCSUserMatchingRep_NormalMatchingFailure = {
						nErrorCode: GameErrors.InvalidParameter
					};

					this.SendMessage(MainId_CS.UserMatching, SubId_CS_UserMatching.Rep_NormalMatchingFailure, pMatchingFailure);
					return true;
				}

				let nMatchingRuleIndex = pMatchingReq.nMatchingIndex - 1;

				let pConfig = GConfig.MatchingConfig.matchingRules[nMatchingRuleIndex];
				
				if((pConfig.nEnterGoldMin > 0 && this.m_nGameGold < pConfig.nEnterGoldMin) ||
					(pConfig.nEnterGoldMax > 0 && this.m_nGameGold > pConfig.nEnterGoldMax))
				{
					console.log("匹配失败，条件不满足，玩家[", this.m_nUserId, "]");

					const pMatchingFailure: SubCSUserMatchingRep_NormalMatchingFailure = {
						nErrorCode: GameErrors.RuleNotMatch
					};

					this.SendMessage(MainId_CS.UserMatching, SubId_CS_UserMatching.Rep_NormalMatchingFailure, pMatchingFailure);
					return true;
				}

				if(this.m_GamingInfo.nSceneIndex != InvalidSceneId)
				{
					console.log("匹配失败，正在游戏中，玩家[", this.m_nUserId, "]");

					const pMatchingFailure: SubCSUserMatchingRep_NormalMatchingFailure = {
						nErrorCode: GameErrors.IsGaming
					};

					this.SendMessage(MainId_CS.UserMatching, SubId_CS_UserMatching.Rep_NormalMatchingFailure, pMatchingFailure);
					return true;
				}

				if(this.m_bMatching === true)
				{
					console.log("匹配失败，正在匹配中，玩家[", this.m_nUserId, "]");

					const pMatchingFailure: SubCSUserMatchingRep_NormalMatchingFailure = {
						nErrorCode: GameErrors.IsMatching
					};

					this.SendMessage(MainId_CS.UserMatching, SubId_CS_UserMatching.Rep_NormalMatchingFailure, pMatchingFailure);
					return true;
				}

				this.m_bMatching = true;

				GGameMatchingManager.JoinMatching(this.m_nUserId, nMatchingRuleIndex);

				const pMatching: SubCSUserMatchingRep_NormalMatching = {
					nMatchingSuccessTime: 0
				};

				this.SendMessage(MainId_CS.UserMatching, SubId_CS_UserMatching.Rep_NormalMatching, pMatching);

				return true;
			}
			break;
		case SubId_CS_UserMatching.Req_NormalMatchingCancel:
			{
				console.log("收到玩家[", this.m_nUserId, "]取消匹配消息, 当前场景[",this.m_GamingInfo.nSceneIndex, "]");
				
				if(this.m_GamingInfo.nSceneIndex !== InvalidSceneId)
				{
					let pMatchingCancel: SubCSUserMatchingRep_NormalMatchingCancel = {
						nErrorCode: GameErrors.IsGaming
					};

					this.SendMessage(MainId_CS.UserMatching, SubId_CS_UserMatching.Rep_NormalMatchingCancel, pMatchingCancel);

					console.log("取消匹配失败，正在游戏中，玩家[", this.m_nUserId, "]");

					return true;
				}
				
				if(this.m_bMatching === false)
				{
					console.log("取消匹配失败，当前没有匹配，玩家[", this.m_nUserId, "]");

					const pMatchingCancel: SubCSUserMatchingRep_NormalMatchingCancel = {
						nErrorCode: GameErrors.NotMatching
					};

					this.SendMessage(MainId_CS.UserMatching, SubId_CS_UserMatching.Rep_NormalMatchingCancel, pMatchingCancel);

					return true;
				}
				else
				{
					this.m_bMatching = false;

					GGameMatchingManager.CancelMatching(this.m_nUserId);

					const pMatchingCancel: SubCSUserMatchingRep_NormalMatchingCancel = {
						nErrorCode: GameErrors.Success
					};

					this.SendMessage(MainId_CS.UserMatching, SubId_CS_UserMatching.Rep_NormalMatchingCancel, pMatchingCancel);

					return true;
				}
			}
			break;
		}

		return false;
	}

	public OnUserRanking(nSubId: number, pData: any): boolean
	{
		switch(nSubId)
		{
		case SubId_CS_UserRanking.Req_GetRanking:
			{
				let pRepRanking: SubCSUserRankingRep_GetRanking = {
					rankings: []
				};

				pRepRanking.rankings = GGameRankingManager.GetRanking(100);
				
				this.SendMessage(MainId_CS.UserRanking, SubId_CS_UserRanking.Rep_GetRanking, pRepRanking);

				return true;
			}
			break;
		}

		return false;
	}

	public OnUserShare(nSubId: number, pData: any): boolean
	{
		switch(nSubId)
		{
		case SubId_CS_UserShare.Req_WatchVideo:
			{
				if(this.m_nWatchVideoTimesLeft <= 0)
				{
					const pWatchVideoFailure: SubCSUserShareRep_WatchVideoFailure = {
						nErrorCode: GameErrors.TimesNotEnough
					};

					this.SendMessage(MainId_CS.UserShare, SubId_CS_UserShare.Rep_WatchVideoFailure, pWatchVideoFailure);
					return true;
				}

				this.m_nWatchVideoTimesLeft--;
				
				const pWatchVideoSuccess: SubCSUserShareRep_WatchVideoSuccess = {
					nRewardGold: GWatchVideoRewardGold
				};

				this.SendMessage(MainId_CS.UserShare, SubId_CS_UserShare.Rep_WatchVideoSuccess, pWatchVideoSuccess);

				this.OnGoldChange(GWatchVideoRewardGold);

				this.SendShareTimes();
				return true;
			}
			break;
		case SubId_CS_UserShare.Req_InviteFriend:
			{
				let pReq: SubCSUserShareReq_InviteFriend = pData;

				if(pReq.sContextId === undefined || pReq.sContextId === "" || pReq.sContextId.length > 64)
				{
					const pInviteFriend: SubCSUserShareRep_InviteFriendFailure = {
						nErrorCode: GameErrors.InvalidParameter
					};

					this.SendMessage(MainId_CS.UserShare, SubId_CS_UserShare.Rep_InviteFriendFailure, pInviteFriend);
					return true;
				}

				if(this.m_nInviteFriendTimesLeft <= 0)
				{
					const pInviteFriend: SubCSUserShareRep_InviteFriendFailure = {
						nErrorCode: GameErrors.TimesNotEnough
					};

					this.SendMessage(MainId_CS.UserShare, SubId_CS_UserShare.Rep_InviteFriendFailure, pInviteFriend);
					return true;
				}

				if(this.m_mapInviteFriends[pReq.sContextId] !== undefined && this.m_mapInviteFriends[pReq.sContextId] !== null)
				{
					const pInviteFriend: SubCSUserShareRep_InviteFriendFailure = {
						nErrorCode: GameErrors.HasInvited
					};

					this.SendMessage(MainId_CS.UserShare, SubId_CS_UserShare.Rep_InviteFriendFailure, pInviteFriend);
					return true;
				}

				this.m_mapInviteFriends[pReq.sContextId] = true;
				this.m_nInviteFriendTimesLeft--;

				const pInviteSuccess: SubCSUserShareRep_InviteFriendSuccess = {
					nRewardGold: GInviteFriendRewardGold
				};

				this.SendMessage(MainId_CS.UserShare, SubId_CS_UserShare.Rep_InviteFriendSuccess, pInviteSuccess);

				this.OnGoldChange(GInviteFriendRewardGold);

				this.SendShareTimes();
				
				return true;
			}
			break;
		case SubId_CS_UserShare.Req_ShareToFriend:
			{
				let pReq: SubCSUserShareReq_ShareToFriend = pData;

				if(pReq.sContextId === undefined || pReq.sContextId === "" || pReq.sContextId.length > 64)
				{
					const pShareFailure: SubCSUserShareRep_ShareToFriendFailure = {
						nErrorCode: GameErrors.InvalidParameter
					};

					this.SendMessage(MainId_CS.UserShare, SubId_CS_UserShare.Rep_ShareToFriendFailure, pShareFailure);
					return true;
				}

				if(this.m_nShareToFriendTimesLeft <= 0)
				{
					const pShareFailure: SubCSUserShareRep_ShareToFriendFailure = {
						nErrorCode: GameErrors.TimesNotEnough
					};

					this.SendMessage(MainId_CS.UserShare, SubId_CS_UserShare.Rep_ShareToFriendFailure, pShareFailure);
					return true;
				}

				if(this.m_mapShareToFriends[pReq.sContextId] !== undefined && this.m_mapShareToFriends[pReq.sContextId] !== null)
				{
					const pShareFailure: SubCSUserShareRep_ShareToFriendFailure = {
						nErrorCode: GameErrors.HasShared
					};

					this.SendMessage(MainId_CS.UserShare, SubId_CS_UserShare.Rep_ShareToFriendFailure, pShareFailure);
					return true;
				}

				this.m_mapShareToFriends[pReq.sContextId] = true;
				this.m_nShareToFriendTimesLeft--;

				const pShareSuccess: SubCSUserShareRep_ShareToFriendSuccess = {
					nRewardGold: GShareGiftShareRewardGold
				};

				this.SendMessage(MainId_CS.UserShare, SubId_CS_UserShare.Rep_ShareToFriendSuccess, pShareSuccess);

				this.OnGoldChange(GShareGiftShareRewardGold);

				this.SendShareTimes();

				if(pReq.sUserAccount !== undefined && typeof pReq.sUserAccount === "string" && pReq.sUserAccount !== "" && pReq.sUserAccount.length < 32)
				{
					let pGameUser = GGameUserManager.FindUserByAccount(pReq.sUserAccount);

					if(pGameUser === null) return true;

					pGameUser.OnFriendShare(this.m_nUserId, this.m_sUserName, this.m_sUserPhoto);
				}

				return true;
			}
			break;
		case SubId_CS_UserShare.Req_GetShareGift:
			{
				let pReq: SubCSUserShareReq_GetShareGift = pData;
				
				let sUID = "" + pReq.nUseId;
				
				let recvGift: UserGiftInfo = this.m_mapRecvGifts[sUID];

				if(recvGift === undefined || recvGift === null)
				{
					const pGetShareGiftFailure: SubCSUserShareRep_GetShareGiftFailure = {
						nErrorCode: GameErrors.InvalidParameter
					};

					this.SendMessage(MainId_CS.UserShare, SubId_CS_UserShare.Rep_GetShareGiftFailure, pGetShareGiftFailure);
					return true;
				}

				if(recvGift.nCount <= 0)
				{
					const pGetShareGiftFailure: SubCSUserShareRep_GetShareGiftFailure = {
						nErrorCode: GameErrors.HasGeted
					};

					this.SendMessage(MainId_CS.UserShare, SubId_CS_UserShare.Rep_GetShareGiftFailure, pGetShareGiftFailure);
					return true;
				}

				recvGift.nCount--;
				
				const pGetShareGiftSuccess: SubCSUserShareRep_GetShareGiftSuccess = {
					nUserId: recvGift.nUserId
				};

				this.SendMessage(MainId_CS.UserShare, SubId_CS_UserShare.Rep_GetShareGiftSuccess, pGetShareGiftSuccess);

				this.OnGoldChange(GShareGiftGetRewardGold);

				return true;
			}
			break;
		}

		return false;
	}

	public OnFriendShare(nUserId: number, sUserName: string, sUserPhoto: string)
	{
		let sUID = "" + nUserId;

		let pRecvGift: UserGiftInfo = this.m_mapRecvGifts[sUID];

		if(pRecvGift === undefined || pRecvGift === null)
		{
			this.m_mapRecvGifts[sUID] = {
				nUserId: nUserId,
				nCount: 0,
				nLastRecvDay: 0
			};

			pRecvGift = this.m_mapRecvGifts[sUID];
		}

		let nDay = GGameEngine.GetCurrentDay();

		if(pRecvGift.nLastRecvDay !== nDay)
		{
			pRecvGift.nLastRecvDay = nDay;
			pRecvGift.nCount++;

			let pShareItem: SubCSUserShareRep_ShareGiftItem = {
				giftUser: {
					nUserId: nUserId,
					sUserName: sUserName,
					sUserPhoto: sUserPhoto,
					nGiftGold: GShareGiftGetRewardGold
				}
			}

			this.SendMessage(MainId_CS.UserShare, SubId_CS_UserShare.Rep_ShareGiftItem, pShareItem);
		}
	}

	public OnGoldChange(nChange: number)
	{
		this.m_nGameGold += nChange;

		let pUpdateGold: SubCSUserUpdateRep_GameGold = {
			nGold: this.m_nGameGold
		};

		this.SendMessage(MainId_CS.UserUpdate, SubId_CS_UserUpdate.Rep_GameGold, pUpdateGold);

		let pDBChangeGold: DBReq_ChangeGameGold = {
			nUserId: this.m_nUserId,
			nChangeGold: nChange
		};

		GGameEngine.SendDatabaseRequest(DBRequestId.Req_ChangeGameGold, pDBChangeGold, 0);
	}

	public OnExperienceChange(nAdd: number): number
	{
		let nExpOld = this.m_nExperience;
		this.m_nExperience += nAdd;

		if(this.m_nExperience >= GExperienceLevelLimit) return 0;

		let nLevelOldConfig = GExperienceLevelMap[nExpOld];
		let nLevelNewConfig = GExperienceLevelMap[this.m_nExperience];

		if(nLevelNewConfig.nLevel > nLevelOldConfig.nLevel)
		{
			let pNoticeLevelReward: SubCSUserNotice_LevelUpReward = {
				nExpOld: nExpOld,
				nExpNew: this.m_nExperience,
				nRewardGold: nLevelNewConfig.nReward
			};

			this.SendMessage(MainId_CS.UserNotice, SubId_CS_UserNotice.LevelUpReward, pNoticeLevelReward);

			return nLevelNewConfig.nReward;
		}

		return 0;
	}

	public OnGameEnd(endInfo: GameEndUserInfo)
	{
		if(endInfo.bWin)
		{
			this.m_nCurWinStreak++;

			if(this.m_nCurWinStreak > this.m_nMaxWinStreak)
			{
				this.m_nMaxWinStreak = this.m_nCurWinStreak;
			}

			this.m_nWinTimes++;
		}
		else
		{
			this.m_nCurWinStreak = 0;
		}

		let nGoldAdd = this.OnExperienceChange(10);
		this.m_nGameTimes++;
		
		this.m_nGinTimes += endInfo.nGinTimes;
		this.m_nBigGinTimes += endInfo.nBigGinTimes;
		this.m_nUndercutTimes += endInfo.nUndercutTimes;

		let pGameUserInfo: SubCSUserUpdateRep_GameUserInfo = {
			nExperience: this.m_nExperience,
			nWinTimes: this.m_nWinTimes,
			nGameTimes: this.m_nGameTimes,
			nGinTimes: this.m_nGinTimes,
			nBigGinTimes: this.m_nBigGinTimes,
			nUndercutTimes: this.m_nUndercutTimes,
			nMaxWinStreak: this.m_nMaxWinStreak
		};

		this.SendMessage(MainId_CS.UserUpdate, SubId_CS_UserUpdate.Rep_GameUserInfo, pGameUserInfo);


		let pDBWriteGameEnd: DBReq_WriteGameEnd = {
			nUserId: this.m_nUserId,
			nExperience: this.m_nExperience,
			nWinTimes: this.m_nWinTimes,
			nGameTimes: this.m_nGameTimes,
			nGinTimes: this.m_nGinTimes,
			nBigGinTimes: this.m_nBigGinTimes,
			nUndercutTimes: this.m_nUndercutTimes,
			nMaxWinStreak: this.m_nMaxWinStreak
		};

		GGameEngine.SendDatabaseRequest(DBRequestId.Req_WriteGameEnd, pDBWriteGameEnd, 0);

		let nGoldTotalAdd = nGoldAdd + endInfo.nGameGoldChange;
		this.OnGoldChange(nGoldTotalAdd);

		this.SendFightPropertyUpdate();
	}

	public SendFightPropertyUpdate()
	{
		let pUpdate: SubCSFightFrameReq_UserPropertyChange = {
			nUserId: this.m_nUserId,
			nSceneIndex: this.m_GamingInfo.nSceneIndex,
			nGameGold: this.m_nGameGold,
			nExperience: this.m_nExperience
		};

		const pFightServer = (GGameEngine as GameCenter).FindFightServer();

		pFightServer.SendMessage(MainId_CS.FightFrame, SubId_CS_FightFrame.Req_UserPropertyUpdate, pUpdate);
	}

	public OnSceneRelease()
	{
		this.m_GamingInfo.nPort = 0;
		this.m_GamingInfo.nSceneIndex = -1;
		this.m_GamingInfo.sLoginKey = "";

		this.SendGamingInfo();
	}

	public SendGamingInfo()
	{
		let pUpdateGamingInfo: SubCSUserUpdateRep_GamingInfo = {
			nPort: this.m_GamingInfo.nPort,
			sLoginKey: this.m_GamingInfo.sLoginKey,
			gamingUsers: []
		};

		if(this.m_GamingInfo.nSceneIndex != -1)
		{
			let nUsers = GGameSceneManager.GetSceneUsers(this.m_GamingInfo.nSceneIndex);

			let gamingUsers: Array<GamingUserInfo> = [];

			for(let i = 0; i < nUsers.length; i++)
			{
				let pGameUser = GGameUserManager.FindUserById(nUsers[i]);

				gamingUsers[i] = {
					nUserId: nUsers[i],
					sUserName: pGameUser.GetUserName(),
					sUserPhoto: pGameUser.GetUserPhoto(),
					nGameGold: pGameUser.GetGameGold()
				};
			}

			pUpdateGamingInfo.gamingUsers = gamingUsers;
		}

		this.SendMessage(MainId_CS.UserUpdate, SubId_CS_UserUpdate.Rep_GamingInfo, pUpdateGamingInfo);
	}

	public SendUserGameInfo()
	{
		let pGameInfo: SubCSUserUpdateRep_GameUserInfo = {
			nExperience: this.m_nExperience,
			nGameTimes: this.m_nGameTimes,
			nWinTimes: this.m_nWinTimes,
			nGinTimes: this.m_nGinTimes,
			nBigGinTimes: this.m_nBigGinTimes,
			nUndercutTimes: this.m_nUndercutTimes,
			nMaxWinStreak: this.m_nMaxWinStreak
		};

		this.SendMessage(MainId_CS.UserUpdate, SubId_CS_UserUpdate.Rep_GameUserInfo, pGameInfo);
	}

	public SendShareTimes()
	{
		let pShareInfo: SubCSUserUpdateRep_GameShareInfo = {
			nWatchVideoTimes: this.m_nWatchVideoTimesLeft,
			nInviteFriendTimes: this.m_nInviteFriendTimesLeft,
			nShareToFriendTimes: this.m_nShareToFriendTimesLeft
		};

		this.SendMessage(MainId_CS.UserUpdate, SubId_CS_UserUpdate.Rep_GameShareInfo, pShareInfo);
	}

	public SendShareGiftList()
	{
		let pRecvGift: SubCSUserShareRep_ShareGiftList = {
			giftUsers: []
		};

		for(let i in this.m_mapRecvGifts)
		{
			if(this.m_mapRecvGifts.hasOwnProperty(i))
			{
				let p: UserGiftInfo = this.m_mapRecvGifts[i];

				if(p.nCount <= 0) continue;

				let pGameUser = GGameUserManager.FindUserById(p.nUserId);

				if(pGameUser === null) continue;
			
				for(let nCount = 0; nCount < p.nCount; nCount++)
				{
					let shareInfo: ShareGiftUser = {
						nUserId: p.nUserId,
						sUserName: pGameUser.GetUserName(),
						sUserPhoto: pGameUser.GetUserPhoto(),
						nGiftGold: GShareGiftGetRewardGold
					};

					pRecvGift.giftUsers.push(shareInfo);
				}
			}
		}

		this.SendMessage(MainId_CS.UserShare, SubId_CS_UserShare.Rep_ShareGiftList, pRecvGift);
	}
}

export let GGameUserManager: GameUserManager = null;

let GGameAndroidUserCount: number									= 1000;


interface ExperienceLevelInfo
{
	nLevel:				number;
	nReward:			number;
}

let GExperienceLevelMap: Array<ExperienceLevelInfo>					= [];
const GExperienceLevelLimit: number									= 100000;


export class GameUserManager
{
	private m_userMapAccount:										Array<GameUser>;
	private m_userMapId:											Array<GameUser>;

	constructor()
	{
		this.m_userMapAccount = new Array();
		this.m_userMapId = new Array();


		this.InitializeExperienceLevelConfig();

		GGameUserManager = this;
	}

	public FindUserById(nUserId: number)
	{
		let pGameUser: GameUser = null;

		if (IsValidUserId(nUserId) === true)
		{
			pGameUser = this.m_userMapId[nUserId];

			if(pGameUser === undefined)
			{
				pGameUser = null;
			}
		}

		return pGameUser;
	}

	public FindUserByAccount(sAccount: string)
	{
		let pGameUser: GameUser = this.m_userMapAccount[sAccount];

		if(pGameUser === undefined)
		{
			pGameUser = null;
		}

		return pGameUser;
	}

	public FindUserOnCreate(nUserId: number, sAccount: string)
	{
		let pGameUser = new GameUser();

		this.m_userMapAccount[sAccount] = pGameUser;
		this.m_userMapId[nUserId] = pGameUser;

		return pGameUser;
	}

	public CreateAndroidUsers()
	{
		const gFirstNameStore: Array<string> = [
			"Jacob",
			"Joshua",
			"William",
			"Daniel",
			"Michael",
			"Ethan",
			"Matthew",
			"James",
			"Joseph",
			"Alexander",
			"Noah",
			"Ryan",
			"Jack",
			"Andrew",
			"Benjamin",
			"Samuel",
			"Christopher",
			"David",
			"Anthony",
			"Dylan",
			"Logan",
			"Thomas",
			"Tyler",
			"John",
			"Mason",
			"Nathan",
			"Nicholas",
			"Jayden",
			"Jordan",
			"Elijah",
			"Jonathan",
			"Christian",
			"Gabriel",
			"Luke",
			"Liam",
			"Brandon",
			"Cameron",
			"Aiden",
			"Oliver",
			"Zachary"
		];
		

		const gLastNameStore: Array<string> = [
			"Aaron",
			"Abel",
			"Abraham",
			"Adam",
			"Adrian",
			"Alva",
			"Alex",
			"Alexander",
			"Alan",
			"Albert",
			"Alfred",
			"Andrew",
			"Andy",
			"Angus",
			"Anthony",
			"Arthur",
			"Austin",
			"Ben",
			"Benson",
			"Bill",
			"Bob",
			"Brandon",
			"Brant",
			"Brent",
			"Brian",
			"Bruce",
			"Carl",
			"Cary",
			"Caspar",
			"Charles",
			"Cheney",
			"Chris",
			"Christian",
			"Christopher",
			"Colin",
			"Cosmo",
			"Daniel",
			"Dennis",
			"Derek",
			"Donald",
			"Douglas",
			"David",
			"Denny",
			"Edgar",
			"Edward",
			"Edwin",
			"Elliott",
			"Elvis",
			"Eric",
			"Evan",
			"Francis",
			"Frank",
			"Franklin",
			"Fred",
			"Gabriel",
			"Gaby",
			"Garfield",
			"Gary",
			"Gavin",
			"George",
			"Gino",
			"Glen",
			"Glendon",
			"Harrison",
			"Hugo",
			"Hunk",
			"Howard",
			"Henry"
		];

		const nFirstNameStoreLength = gFirstNameStore.length;
		const nLastNameStoreLength = gLastNameStore.length;

		GGameAndroidUserCount = nFirstNameStoreLength * nLastNameStoreLength;

		let nFirstNameIndex = 0;
		let nLastNameIndex = 0;

		for(let i = 1; i <= GGameAndroidUserCount; i++)
		{
			let pGameUser = new GameUser();

			let sAndroidAccount = "AndroidUser_" + i;
			let sAndroidName = gFirstNameStore[nFirstNameIndex] + " " + gLastNameStore[nLastNameIndex];
			let sAndroidPhoto = "robotphoto_" + ((i % 2) + 1) + "_png";
			let nGameGold = (GameRandom() % 100) * 100 + 10000;

			pGameUser.OnUserOnlineAndroid(i, nGameGold, sAndroidName, sAndroidPhoto);

			this.m_userMapAccount[sAndroidAccount] = pGameUser;
			this.m_userMapId[i] = pGameUser;

			nLastNameIndex++;
			if(nLastNameIndex >= nLastNameStoreLength)
			{
				nLastNameIndex = 0;

				nFirstNameIndex++;

				if(nFirstNameIndex >= nFirstNameStoreLength)
				{
					nFirstNameIndex = 0;
				}
			}
		}
	}

	public GetRandAndroidUser(): number
	{
		let nIndex = GameRandom() % GGameAndroidUserCount;

		for(let i = 0; i < GGameAndroidUserCount; i++)
		{
			let nUserId = (nIndex + i) % GGameAndroidUserCount + 1;

			let pGameUser = this.FindUserById(nUserId);

			if(pGameUser === null)
			{
				continue;
			}

			if(pGameUser.IsAndroid() === false || pGameUser.IsPlaying()) continue;

			return nUserId;
		}
		
		return InvalidUserId;
	}

	public InitializeExperienceLevelConfig()
	{
		let nLevel = 0;

		let nLevelExp = 5 * nLevel * (nLevel + 1);

		let nLevelReward = nLevel * 5000;

		for(let i = 0; i < GExperienceLevelLimit; i++)
		{
			while(i >= nLevelExp)
			{
				nLevel++;

				nLevelExp = 5 * nLevel * (nLevel + 1);
				nLevelReward = 2000;
			}

			GExperienceLevelMap[i] = {
				nLevel: nLevel,
				nReward: nLevelReward
			};
		}
	}
}