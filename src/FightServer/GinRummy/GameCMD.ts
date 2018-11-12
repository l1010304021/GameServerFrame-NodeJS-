import { GameStage } from "./GameDefines";





enum SubId_Game
{
	GameStart								= 0x01,						//游戏开始

	DealCards								= 0x02,						//游戏发牌
	
	GamePass								= 0x03,						//Pass
	
	GetCard									= 0x04,						//摸牌
	OutCard									= 0x05,						//出牌

	GameGin									= 0x06,						//点GIN

	ErrorMsg								= 0x07,						//操作失败

	GameEnd									= 0x08,						//游戏结束

	GameEndAll								= 0x09,						//游戏总结算
};


interface SubGame_GameStart
{
	nLeftCards:								number;						//牌堆剩余牌数量

	nBankerChairId:							number;						//庄家
	nBankerUserId:							number;						//庄家

	nTimeOut:								number;						//倒计时
};

interface SceneUserGameInfo
{
	nUserId:								number;
	nChairId:								number;
	nScoreTotal:							number;
	nGameCards:								Array<number>;
};

interface SubGame_GameScene
{
	bGaming:								boolean;
	eGameStage:								GameStage;

	nCellScore:								number;
	nEndScore:								number;
	nGinRule:								number;

	nLeftCards:								number;
	nCardTop:								number;
	nCardsOut:								Array<number>;

	userGameInfo:							Array<SceneUserGameInfo>;

	nBankerChairId:							number;
	nBankerUserId:							number;

	nTimeOut:								number;

	nCurrentOpChairId:						number;						//当前操作玩家
	nCurrentOpUserId:						number;						//

	bCanPass:								boolean;					//是否可以PASS
	nPassTimes:								number;						//Pass次数

	nCurrentAction:							number;						//当前操作状态
};

interface SubGame_DealCards
{
	nCurrentOpChairId:						number;						//当前操作玩家
	nCurrentOpUserId:						number;						//

	bCanPass:								boolean;					//是否可以PASS

	nLeftCards:								number;						//牌堆剩余牌数量
	nCardTop:								number;						//牌堆顶上那张牌
	nCardOut:								number;						//出牌区第一张牌

	pGameCards:								Array<number>;				//自己手牌

	nTimeOut:								number;						//倒计时
};

interface SubGame_Pass_Req
{
	bTrustee:								boolean;
};

interface SubGame_Pass_Rep
{
	nOpChairId:								number;						//操作玩家椅子
	nOpUserId:								number;						//
	
	nCurrentOpChairId:						number;						//当前可以操作玩家
	nCurrentOpUserId:						number;						//

	bCanPass:								boolean;					//是否可以PASS
	nPassTimes:								number;						//次数

	nTimeOut:								number;						//倒计时
};

enum GetCardFrom
{
	LeftCards								= 0x01,						//牌堆
	OutCards								= 0x02						//出牌区
};

interface SubGame_GetCard_Req
{
	bTrustee:								boolean;
	eGetCardFrom:							GetCardFrom;				//从哪里摸牌
};

interface SubGame_GetCard_Rep
{
	nOpChairId:								number;						//操作玩家椅子
	nOpUserId:								number;						//

	eGetCardFrom:							GetCardFrom;				//从哪里摸牌
	nCard:									number;						//摸到的牌
	nCardTop:								number;						//牌堆顶那张牌
};

interface SubGame_OutCard_Req
{
	bTrustee:								boolean;
	nCard:									number;						//出的牌
};

interface SubGame_OutCard_Rep
{
	nOpChairId:								number;						//操作玩家椅子
	nOpUserId:								number;						//

	nCard:									number;						//出的牌
	nCardTop:								number;						//牌堆顶那张牌

	nCurrentOpChairId:						number;						//当前可以操作玩家
	nCurrentOpUserId:						number;						//
};

interface SubGame_GameGin_Req
{
	nCardsRunSet:							Array<Array<number>>;		//手牌分组信息
	nCardsDeadwood:							Array<number>;				//手牌分组信息
	nCardOut:								number;						//打出的牌，如果不出牌，填0
};

interface SubGame_GameGin_Rep
{
	nOpChairId:								number;						//操作玩家椅子
	nOpUserId:								number;						//

	nCardOut:								number;						//如果玩家没有打出牌，则显示0
}

enum GinErrors
{
	Game_Not_Start,
	Not_Your_Turn,
	Not_Support_Action,
	Can_Not_Out_Card,
	Not_Exist_Card,
	Not_Valid_RunSets,
	Can_Not_Gin
}

interface SubGame_ErrorMsg
{
	nActionType:							number;
	nErrCode:								number;
};

interface UserGameEndInfo
{
	nUserId:								number;
	nChairId:								number;
	nScore:									number;
	nScoreLast:								number;
	nScoreTotal:							number;
	nRunSetCards:							Array<Array<number>>;
	nDeadwoodCards:							Array<number>;
}

interface SubGame_GameEnd
{
	userGameEndInfo:						Array<UserGameEndInfo>;
	
	nCardLayoff:							Array<number>;
	bUndercut:								boolean;
	bBigGin:								boolean;
	bGin:									boolean;
}

interface UserGameEndAll
{
	nUserId:								number;
	nChairId:								number;
	nScoreTotal:							number;
	nGameGoldOld:							number;
	nGameGoldNew:							number;
	nGameGoldChange:						number;
};

interface SubGame_GameEndTotal
{
	userGameEndAll:							Array<UserGameEndAll>;
}


export{
	SubId_Game,

	SubGame_GameStart,
	SceneUserGameInfo,
	SubGame_GameScene,
	SubGame_DealCards,
	SubGame_Pass_Req,
	SubGame_Pass_Rep,
	GetCardFrom,
	SubGame_GetCard_Req,
	SubGame_GetCard_Rep,
	SubGame_OutCard_Req,
	SubGame_OutCard_Rep,
	SubGame_GameGin_Req,
	SubGame_GameGin_Rep,
	GinErrors,
	SubGame_ErrorMsg,
	UserGameEndInfo,
	SubGame_GameEnd,
	UserGameEndAll,
	SubGame_GameEndTotal
};