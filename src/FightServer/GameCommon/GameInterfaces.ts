

export const InvalidChairId: number						= 0xffff;



export const GGameTimerIdBase							= 1000;
export const GGameTimerIdRange							= 50;



export enum GameUserStatus
{
	Idle												= 0x01,
	Ready												= 0x02,
	Gaming												= 0x03
}


export enum GameEndReason
{
	Normal												= 0x01,
	ForceQuit											= 0x02
};




export interface IEXEScene
{
	GetChairUserId(nChairId: number): number;
	GetChairUserGameGold(nChairId: number): number;
	GetChairUserOnline(nChairId: number): boolean;
	GetChairUserAndroid(nChairId: number): boolean;

	GetCustomRule(): number;
	GetCellScore(): number;

	SendMessage(nChairId: number, nSubId: number, pData: any);
	SendGameScene(nChairId: number, pScene: any);
	SetGameTimer(nTimerId: number, nDelay: number, nTimes: number);
	KillGameTimer(nTimerId);

	OnGameEnd(nGoldChanges: Array<number>, nGinTimes: Array<number>, nBigGinTimes: Array<number>, nUndercutTimes: Array<number>, nEndReason: GameEndReason);
}

export interface IDLLScene
{
	InitScene();
	HasNextInning();

	OnReset();
	OnClear();

	OnGameStart();
	OnGameScene(nChairId: number);

	OnGameMessage(nSubId: number, pData: any, nChairId: number);
	OnGameTimer(nTimerId: number);

	OnGameConclude(nChairId: number, eGameEndReason:GameEndReason);
}