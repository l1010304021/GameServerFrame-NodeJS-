

export enum ServerKind
{
	Invalid												= 0x00,
	GateServer											= 0x01,
	FightServer											= 0x02
};

export const InvalidUserId: number                      = 0;
export const InvalidServerId: number					= 1000;
export const InvalidSceneId: number						= -1;

export function IsValidUserId(nUserId: number)
{
    return (nUserId > InvalidUserId);
}

export function IsValidServerId(nServerId: number)
{
	return (nServerId > 0 && nServerId < InvalidServerId);
}


export enum GameErrors
{
	Success												= 0x0000,						//成功
	UnknowError											= 0x0001,						//未知错误
	InvalidParameter									= 0x0002,						//非法参数
	InvalidAccount										= 0x0003,						//非法账号
	LoginOtherPlace										= 0x0004,						//在其他地方登陆
	FightServerNotFound									= 0x0005,						//没有可用的战斗服务器
	RuleNotMatch										= 0x0006,						//规则不匹配
	IsGaming											= 0x0007,						//正在游戏中
	IsMatching											= 0x0008,						//正在匹配中
	NotMatching											= 0x0009,						//没有在匹配
	TimesNotEnough										= 0x000A,						//次数不足
	HasInvited											= 0x000B,						//已经邀请过了
	HasShared											= 0x000C,						//已经分享过了
	HasGeted											= 0x000D,						//已经领取过了

	InvalidLoginKey										= 0x0100,						//登陆密钥失效
	UserNotFound										= 0x0101,						//玩家未找到
	InvalidUserId										= 0x0102,						//非法账号
	
}