




enum MainId_FS
{
	Login													= 0x0001,				//玩家登录
	Frame													= 0x0002,				//框架消息
	Game													= 0x0003,				//游戏消息
};


enum SubId_FS_Login
{
	Req_Login												= 0x0001,				//登录消息

	Rep_LoginSuccess										= 0x1001,				//登录成功
	Rep_LoginFailure										= 0x1002,				//登录失败
};

interface SubFSLoginReq_Login
{
	nUserId:						number;
	sLoginKey:						string;
};


interface SubFSLoginRep_LoginSuccess
{
	
}

interface SubFSLoginRep_LoginFailure
{
	nErrCode:						number;
};


enum SubId_FS_Frame
{
	SubId_FS_Frame_Req_Ready								= 0x0011,				//准备
	SubId_FS_Frame_Req_GameScene							= 0x0021,				//游戏场景
	SubId_FS_Frame_Req_Chat									= 0x0031,				//聊天消息
	SubId_FS_Frame_Req_ForceQuit							= 0x0041,				//强退

	SubId_FS_Frame_Notice_UserStatus						= 0x1001,				//玩家状态通知
	SubId_FS_Frame_Rep_GameScene							= 0x2001,				//游戏场景
	SubId_FS_Frame_Notice_Chat								= 0x3001,				//游戏聊天通知
};

interface SubFSFrameReq_Ready
{

};

interface SubFSFrameReq_GameScene
{
	
};

interface SubFSFrameReq_Chat
{
	sMsg:							string;
};


interface SubFSFrameNTC_Chat
{
	nUserId:						number;
	sMsg:							string;
}

interface SubFSFrameNTC_UserStatus
{
//Idle			(0x00)
//Ready			(0x01)
//Playing		(0x02)
	nUserId:						number;
	sUserName:						string;
	sUserPhoto:						string;
	nGameGold:						number;
	nExperience:					number;
	nStatus:						number;
	bOnline:						boolean;
};



export
{
	MainId_FS,

	SubId_FS_Login,
	SubFSLoginReq_Login,
	SubFSLoginRep_LoginSuccess,
	SubFSLoginRep_LoginFailure,

	SubId_FS_Frame,
	SubFSFrameReq_Ready,
	SubFSFrameReq_Chat,
	SubFSFrameReq_GameScene,

	SubFSFrameNTC_Chat,
	SubFSFrameNTC_UserStatus
}