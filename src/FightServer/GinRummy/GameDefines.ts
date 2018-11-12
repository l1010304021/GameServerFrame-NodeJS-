



enum CardType
{
    CardA									= 0x01,
    Card2									= 0x02,
    Card3									= 0x03,
    Card4									= 0x04,
    Card5									= 0x05,
    Card6									= 0x06,
    Card7									= 0x07,
    Card8									= 0x08,
    Card9									= 0x09,
    Card10									= 0x0A,
    CardJ									= 0x0B,
    CardQ									= 0x0C,
    CardK									= 0x0D
};

enum CardColor
{
    Hearts									= 0x01,                                 //红桃
    Diamonds								= 0x02,                                 //方块
    Spades									= 0x03,                                 //黑桃
    Clubs									= 0x04                                  //梅花
};


enum GameRule
{
	EndScore_50								= 0x0001,
	EndScore_100							= 0x0002,

	GameGin_Knock							= 0x0100,
	GameGin_Straight						= 0x0200
}


enum GinType
{
	Knock,
	Straight
}

enum ActionType
{
	None									= 0x0000,
	Pass									= 0x0001,
	GetCard									= 0x0002,
	OutCard									= 0x0004,
	GameGin									= 0x0008
};


enum GameStage
{
	WaitingStart,							//等待开始
	DealCards,								//发牌
	Passing,								//Pass
	Gaming,									//正常游戏
	Ending									//结束，继续下一局
};


export{
	CardType,
	CardColor,
	GameRule,
	GinType,
	ActionType,
	GameStage
}


