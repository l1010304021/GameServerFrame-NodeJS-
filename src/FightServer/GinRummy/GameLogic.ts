import { CardType, CardColor, GameRule, GinType, ActionType, GameStage } from "./GameDefines";
import { SubGame_GameStart, SubId_Game, SubGame_DealCards, SubGame_Pass_Rep, SubGame_GameGin_Req, SubGame_GetCard_Req, GetCardFrom, SubGame_GetCard_Rep, SubGame_Pass_Req, SubGame_OutCard_Req, SubGame_OutCard_Rep, GinErrors, SubGame_ErrorMsg, SubGame_GameScene, SubGame_GameGin_Rep, SubGame_GameEnd, SubGame_GameEndTotal } from "./GameCMD";
import { InvalidChairId, IDLLScene, IEXEScene, GameEndReason } from "../GameCommon/GameInterfaces";
import { GameRandom } from "../../Core/GameEngine";
import { GameUser } from "./GameUser";
import { InvalidUserId } from "../../Common/GlobalDefines";
import { GetCardData, GetCardValue, GetCardGroups, IsCardGroupValid, GetCardColor, GetCardType, CardsGroupInfo, IsRunSetsValid, GetLayoffCards, FindGetCard } from "./CardAnalyse";
import { LoadJsonFile } from "../../Core/GlobalConfig";
import { join } from "path";











const GCards = [
	GetCardData(CardType.CardA, CardColor.Hearts),
	GetCardData(CardType.Card2, CardColor.Hearts),
	GetCardData(CardType.Card3, CardColor.Hearts),
	GetCardData(CardType.Card4, CardColor.Hearts),
	GetCardData(CardType.Card5, CardColor.Hearts),
	GetCardData(CardType.Card6, CardColor.Hearts),
	GetCardData(CardType.Card7, CardColor.Hearts),
	GetCardData(CardType.Card8, CardColor.Hearts),
	GetCardData(CardType.Card9, CardColor.Hearts),
	GetCardData(CardType.Card10,CardColor.Hearts),
	GetCardData(CardType.CardJ, CardColor.Hearts),
	GetCardData(CardType.CardQ, CardColor.Hearts),
	GetCardData(CardType.CardK, CardColor.Hearts),

	GetCardData(CardType.CardA, CardColor.Diamonds),
	GetCardData(CardType.Card2, CardColor.Diamonds),
	GetCardData(CardType.Card3, CardColor.Diamonds),
	GetCardData(CardType.Card4, CardColor.Diamonds),
	GetCardData(CardType.Card5, CardColor.Diamonds),
	GetCardData(CardType.Card6, CardColor.Diamonds),
	GetCardData(CardType.Card7, CardColor.Diamonds),
	GetCardData(CardType.Card8, CardColor.Diamonds),
	GetCardData(CardType.Card9, CardColor.Diamonds),
	GetCardData(CardType.Card10,CardColor.Diamonds),
	GetCardData(CardType.CardJ, CardColor.Diamonds),
	GetCardData(CardType.CardQ, CardColor.Diamonds),
	GetCardData(CardType.CardK, CardColor.Diamonds),

	GetCardData(CardType.CardA, CardColor.Spades),
	GetCardData(CardType.Card2, CardColor.Spades),
	GetCardData(CardType.Card3, CardColor.Spades),
	GetCardData(CardType.Card4, CardColor.Spades),
	GetCardData(CardType.Card5, CardColor.Spades),
	GetCardData(CardType.Card6, CardColor.Spades),
	GetCardData(CardType.Card7, CardColor.Spades),
	GetCardData(CardType.Card8, CardColor.Spades),
	GetCardData(CardType.Card9, CardColor.Spades),
	GetCardData(CardType.Card10,CardColor.Spades),
	GetCardData(CardType.CardJ, CardColor.Spades),
	GetCardData(CardType.CardQ, CardColor.Spades),
	GetCardData(CardType.CardK, CardColor.Spades),

	GetCardData(CardType.CardA, CardColor.Clubs),
	GetCardData(CardType.Card2, CardColor.Clubs),
	GetCardData(CardType.Card3, CardColor.Clubs),
	GetCardData(CardType.Card4, CardColor.Clubs),
	GetCardData(CardType.Card5, CardColor.Clubs),
	GetCardData(CardType.Card6, CardColor.Clubs),
	GetCardData(CardType.Card7, CardColor.Clubs),
	GetCardData(CardType.Card8, CardColor.Clubs),
	GetCardData(CardType.Card9, CardColor.Clubs),
	GetCardData(CardType.Card10,CardColor.Clubs),
	GetCardData(CardType.CardJ, CardColor.Clubs),
	GetCardData(CardType.CardQ, CardColor.Clubs),
	GetCardData(CardType.CardK, CardColor.Clubs)
];








const TimerId_Timeout								= 1;



interface CurrentAction
{
	nActionChairId:									number,
	eActionType:									ActionType,

	eSupportActionType:								number;

	nGetCard:										number;
	eGetCardFrom:									GetCardFrom;

	nTimeOut:										number;
	nPassTimes:										number;
};



class GameLogic implements IDLLScene
{
	private m_pGameScene:							IEXEScene;
	private m_pGameUsers:							Array<GameUser>;

	private m_nEndScore:							number;
	private m_eGinRule:								GinType;

	private m_nCardsOffset:							number;
	private m_pCardsLeft:							Array<number>;
	private m_pCardsOut:							Array<number>;
	private m_bFirstGet:							boolean;

	private m_eGameStage:							GameStage;

	private m_nBankerChairId:						number;
	
	private m_CurrentAction:						CurrentAction;

	private m_pEndInfo:								SubGame_GameEnd;

	constructor(pGameScene: IEXEScene, nUserCount: number)
	{
		this.m_pGameScene = pGameScene;

		this.m_pCardsLeft = [];

		for(let i = 0; i < GCards.length; i++)
		{
			this.m_pCardsLeft[i] = GCards[i];
		}

		this.m_pGameUsers = [];

		for(let i = 0; i < nUserCount; i++)
		{
			this.m_pGameUsers[i] = new GameUser();
		}

		(this.m_CurrentAction as any) = {};

		this.Clear();
	}

	public InitScene()
	{
		this.Clear();

		this.InitGameRule();
	}

	public InitGameRule()
	{
		const nGameRule = this.m_pGameScene.GetCustomRule();

		if(nGameRule & GameRule.EndScore_50)
		{
			this.m_nEndScore = 50;
		}
		else
		{
			this.m_nEndScore = 100;
		}

		if(nGameRule & GameRule.GameGin_Straight)
		{
			this.m_eGinRule = GinType.Straight;
		}
		else
		{
			this.m_eGinRule = GinType.Knock;
		}
	}

	public Reset()
	{
		this.m_nCardsOffset = 0;
		this.m_pCardsOut = [];
		this.m_bFirstGet = true;

		for(let i = 0; i < this.m_pGameUsers.length; i++)
		{
			this.m_pGameUsers[i].Reset();
		}

		this.m_eGameStage = GameStage.WaitingStart;

		this.ResetAction();

		this.m_pGameScene.KillGameTimer(TimerId_Timeout);
	}

	public Clear()
	{
		this.m_nEndScore = 0;
		this.m_eGinRule = 0;

		this.Reset();

		for(let i = 0; i < this.m_pGameUsers.length; i++)
		{
			this.m_pGameUsers[i].Clear();
		}

		this.m_nBankerChairId = InvalidChairId;

		this.m_pGameScene.KillGameTimer(TimerId_Timeout);
	}

	public OnReset()
	{
		this.Reset();
	}

	public OnClear()
	{
		this.Clear();
	}

	public ResetAction()
	{
		this.m_CurrentAction.nActionChairId = InvalidChairId;
		this.m_CurrentAction.eActionType = ActionType.None;

		this.m_CurrentAction.eSupportActionType = 0;

		this.m_CurrentAction.nGetCard = 0;
		this.m_CurrentAction.eGetCardFrom = 0;

		this.m_CurrentAction.nTimeOut = 0;
		this.m_CurrentAction.nPassTimes = 0;
	}

	public HasNextInning()
	{
		for(let i = 0; i < this.m_pGameUsers.length; i++)
		{
			let nScore = this.m_pGameUsers[i].GetTotalScore();

			if(nScore >= this.m_nEndScore) return false;
		}

		return true;
	}

	public SetStageTimeout()
	{
		switch(this.m_eGameStage)
		{
		case GameStage.WaitingStart:
			{
				this.m_CurrentAction.nTimeOut = 1;
			}
			break;
		case GameStage.DealCards:
			{
				this.m_CurrentAction.nTimeOut = 8;
			}
			break;
		case GameStage.Passing:
			{
				this.m_CurrentAction.nTimeOut = 25;
			}
			break;
		case GameStage.Gaming:
			{
				this.m_CurrentAction.nTimeOut = 25;
			}
			break;
		case GameStage.Ending:
			{
				let nAniTime = 2200;

				nAniTime += 1200*this.m_pEndInfo.nCardLayoff.length;

				for(let i = 0; i < this.m_pEndInfo.userGameEndInfo.length; i++)
				{
					if(this.m_pEndInfo.userGameEndInfo[i].nScoreLast !== this.m_pEndInfo.userGameEndInfo[i].nScoreTotal)
					{
						nAniTime += (1500 + 500 + 1500);
						break;
					}
				}

				if(this.m_pEndInfo.bBigGin === true ||
					this.m_pEndInfo.bGin === true ||
					this.m_pEndInfo.bUndercut === true)
				{
					nAniTime += 2500;
				}

				nAniTime = Math.floor(nAniTime / 1000);
				
				this.m_CurrentAction.nTimeOut = nAniTime + 8;
			}
			break;
		}
	}

	public ChangeGameStage(eGameStage: GameStage)
	{
		this.m_eGameStage = eGameStage;
		this.SetStageTimeout();

		switch(this.m_eGameStage)
		{
		case GameStage.WaitingStart:
			{
				
			}
			break;
		case GameStage.DealCards:
			{
				this.DealCards();
				this.ChangeGameStage(GameStage.Passing);
				return;
			}
			break;
		case GameStage.Passing:
			{
				
			}
			break;
		case GameStage.Gaming:
			{
				
			}
			break;
		case GameStage.Ending:
			{
				
			}
			break;
		}
	}

	public OnGameStart()
	{
		if(this.m_nBankerChairId === InvalidChairId)
		{
			this.m_nBankerChairId = GameRandom() % this.m_pGameUsers.length;
		}
		else
		{
			this.m_nBankerChairId = (this.m_nBankerChairId + 1) % this.m_pGameUsers.length;
		}

		this.ChangeGameStage(GameStage.WaitingStart);

		let pGameStart: SubGame_GameStart = {
			nBankerChairId: this.m_nBankerChairId,
			nBankerUserId: this.GetChairUserId(this.m_nBankerChairId),
			nLeftCards: this.GetLeftCardsCount(),
			nTimeOut: this.m_CurrentAction.nTimeOut
		};

		this.m_pGameScene.SendMessage(InvalidChairId, SubId_Game.GameStart, pGameStart);

		this.RandCards();

		this.m_pGameScene.SetGameTimer(TimerId_Timeout, 1000, -1);
	}

	public OnGameConclude(nChairId: number, eGameEndReason:GameEndReason)
	{
		if(eGameEndReason === GameEndReason.ForceQuit)
		{
			for(let i = 0; i < this.m_pGameUsers.length; i++)
			{
				if(i === nChairId) continue;

				if(this.m_pGameUsers[i].GetTotalScore() < this.m_nEndScore)
				{
					//this.m_pGameUsers[i].ResetTotalScore();
					this.m_pGameUsers[i].AddTotalScore(this.m_nEndScore);
				}
			}

			//总结算
			let totalResult = this.GameTotalResult();

			this.m_pGameScene.OnGameEnd(totalResult.nGoldChanges, totalResult.nGinTimes, totalResult.nBigGinTimes, totalResult.nUndercutTimes, GameEndReason.ForceQuit);
		}
	}

	public OnGameScene(nChairId: number)
	{
		let pScene: SubGame_GameScene = {
			bGaming: this.m_eGameStage > 0,
			eGameStage: this.m_eGameStage,

			nCellScore: this.m_pGameScene.GetCellScore(),
			nEndScore: this.m_nEndScore,
			nGinRule: this.m_eGinRule,

			nLeftCards: this.GetLeftCardsCount(),
			nCardTop: this.m_pCardsLeft[this.m_nCardsOffset],
			nCardsOut: this.m_pCardsOut,
			
			userGameInfo: [],

			nBankerChairId: this.m_nBankerChairId,
			nBankerUserId: this.GetChairUserId(this.m_nBankerChairId),

			nTimeOut: this.m_CurrentAction.nTimeOut,

			nCurrentOpChairId: this.m_CurrentAction.nActionChairId,
			nCurrentOpUserId: this.GetChairUserId(this.m_CurrentAction.nActionChairId),

			bCanPass: ((this.m_CurrentAction.eSupportActionType & ActionType.Pass) > 0),
			nPassTimes: this.m_CurrentAction.nPassTimes,

			nCurrentAction: this.m_CurrentAction.eActionType
		};

		if(this.m_CurrentAction.nActionChairId !== nChairId)
		{
			pScene.nCardTop = 0;
		}

		for(let i = 0; i < this.m_pGameUsers.length; i++)
		{
			pScene.userGameInfo[i] = {
				nUserId: this.GetChairUserId(i),
				nChairId: i,
				nScoreTotal: this.m_pGameUsers[i].GetTotalScore(),
				nGameCards: []
			};

			if(i === nChairId)
			{
				pScene.userGameInfo[i].nGameCards = this.m_pGameUsers[i].CopyHandCards();
			}
		}

		this.m_pGameScene.SendGameScene(nChairId, pScene);
	}

	public OnGameMessage(nSubId: number, pData: any, nChairId: number)
	{
		let eActionType = ActionType.None;
	
		switch(nSubId)
		{
		case SubId_Game.GamePass:
			{
				eActionType = ActionType.Pass;
			}
			break;
		case SubId_Game.GetCard:
			{
				eActionType = ActionType.GetCard;
			}
			break;
		case SubId_Game.OutCard:
			{
				eActionType = ActionType.OutCard;
			}
			break;
		case SubId_Game.GameGin:
			{
				eActionType = ActionType.GameGin;
			}
			break;
		}

		if (this.m_eGameStage !== GameStage.Gaming && this.m_eGameStage !== GameStage.Passing)
		{
			this.SendErrorMsg(nChairId, GinErrors.Game_Not_Start, eActionType);
			return true;
		}

		if(this.m_CurrentAction.nActionChairId != nChairId)
		{
			this.SendErrorMsg(nChairId, GinErrors.Not_Your_Turn, eActionType);
			return true;
		}

		if((this.m_CurrentAction.eSupportActionType & eActionType) === 0)
		{
			this.SendErrorMsg(nChairId, GinErrors.Not_Support_Action, eActionType);
			return true;
		}

		switch(eActionType)
		{
		case ActionType.Pass:
			{
				const pPassReq: SubGame_Pass_Req = pData;
				
				if(pPassReq.bTrustee === true)
				{
					this.m_pGameUsers[nChairId].AddTrusteeTimes(false);
				}
				else
				{
					this.m_pGameUsers[nChairId].AddTrusteeTimes(true);
				}
				
				this.SetActionInfo(eActionType, 0, 0);
				
				let pPass: SubGame_Pass_Rep = {
					bCanPass: ((this.m_CurrentAction.eSupportActionType & ActionType.Pass) > 0),
					nPassTimes: this.m_CurrentAction.nPassTimes,
					nOpChairId: nChairId,
					nOpUserId: this.GetChairUserId(nChairId),
					nCurrentOpChairId: this.m_CurrentAction.nActionChairId,
					nCurrentOpUserId: this.GetChairUserId(this.m_CurrentAction.nActionChairId),
					nTimeOut: this.m_CurrentAction.nTimeOut
				};

				this.m_pGameScene.SendMessage(InvalidChairId, SubId_Game.GamePass, pPass);
				
				return true;
			}
			break;
		case ActionType.GetCard:
			{
				const pGetCard: SubGame_GetCard_Req = pData;

				let nCard = 0;

				if(this.m_eGameStage === GameStage.Passing && this.m_CurrentAction.nPassTimes < 2 && pGetCard.eGetCardFrom === GetCardFrom.LeftCards)
				{
					this.SendErrorMsg(nChairId, GinErrors.Not_Support_Action, eActionType);
					return true;
				}

				if(this.m_eGameStage === GameStage.Gaming && pGetCard.eGetCardFrom === GetCardFrom.OutCards && this.m_bFirstGet === true)
				{
					this.SendErrorMsg(nChairId, GinErrors.Not_Support_Action, eActionType);
					return true;
				}

				if(pGetCard.bTrustee === true)
				{
					this.m_pGameUsers[nChairId].AddTrusteeTimes(false);
				}
				else
				{
					this.m_pGameUsers[nChairId].AddTrusteeTimes(true);
				}
				
				if(pGetCard.eGetCardFrom == GetCardFrom.LeftCards)
				{
					nCard = this.m_pCardsLeft[this.m_nCardsOffset];
					this.m_nCardsOffset++;
				}
				else
				{
					nCard = this.m_pCardsOut[this.m_pCardsOut.length - 1];
				}

				this.m_pGameUsers[nChairId].AddCardsHand([nCard], 0, 1);
				
				this.SetActionInfo(eActionType, nCard, pGetCard.eGetCardFrom);

				let pRep: SubGame_GetCard_Rep = {
					nCard: nCard,
					eGetCardFrom: pGetCard.eGetCardFrom,
					nCardTop: this.m_pCardsLeft[this.m_nCardsOffset],
					nOpChairId: this.m_CurrentAction.nActionChairId,
					nOpUserId: this.GetChairUserId(this.m_CurrentAction.nActionChairId)
				};

				for(let i = 0; i < this.m_pGameUsers.length; i++)
				{
					if(i === this.m_CurrentAction.nActionChairId)
					{
						pRep.nCard = nCard;
					}
					else
					{
						pRep.nCard = 0;
					}

					this.m_pGameScene.SendMessage(i, SubId_Game.GetCard, pRep);
				}

				this.m_bFirstGet = false;
				
				return true;
			}
			break;
		case ActionType.OutCard:
			{
				const pOutCard: SubGame_OutCard_Req = pData;
				
				if(this.m_CurrentAction.eGetCardFrom === GetCardFrom.OutCards)
				{
					if(pOutCard.nCard === this.m_CurrentAction.nGetCard)
					{
						this.SendErrorMsg(nChairId, GinErrors.Can_Not_Out_Card, eActionType);
						return true;
					}
				}
				
				if(this.m_pGameUsers[nChairId].CheckCardExist(pOutCard.nCard, true) === false)
				{
					this.SendErrorMsg(nChairId, GinErrors.Not_Exist_Card, eActionType);
					return true;
				}
				
				if(pOutCard.bTrustee === true)
				{
					this.m_pGameUsers[nChairId].AddTrusteeTimes(false);
				}
				else
				{
					this.m_pGameUsers[nChairId].AddTrusteeTimes(true);
				}

				this.SetActionInfo(ActionType.OutCard, 0, 0);
				this.m_pCardsOut[this.m_pCardsOut.length] = pOutCard.nCard;
				
				const nCardTop = this.m_pCardsLeft[this.m_nCardsOffset];
				
				let pRep: SubGame_OutCard_Rep = {
					nCard: pOutCard.nCard,
					nCardTop: 0,
					nOpChairId: nChairId,
					nOpUserId: this.GetChairUserId(nChairId),
					nCurrentOpChairId: this.m_CurrentAction.nActionChairId,
					nCurrentOpUserId: this.GetChairUserId(this.m_CurrentAction.nActionChairId)
				};

				for(let i = 0; i < this.m_pGameUsers.length; i++)
				{
					if(i === this.m_CurrentAction.nActionChairId)
					{
						pRep.nCardTop = nCardTop;
					}
					else
					{
						pRep.nCardTop = 0;
					}

					this.m_pGameScene.SendMessage(i, SubId_Game.OutCard, pRep);
				}

				if(this.m_nCardsOffset >= (this.m_pCardsLeft.length - 2))
				{
					const pGinDatas: Array<CardsGroupInfo> = [];

					for(let i = 0; i < this.m_pGameUsers.length; i++)
					{
						let pCardsTemp = this.m_pGameUsers[i].CopyHandCards();

						pGinDatas[i] = GetCardGroups(pCardsTemp);
					}

					this.OnGameGin(pGinDatas, [], InvalidChairId, false);
				}

				return true;
			}
			break;
		case ActionType.GameGin:
			{
				const pGameGin: SubGame_GameGin_Req = pData;
				
				let nCards = [];

				for(let i = 0; i < pGameGin.nCardsRunSet.length; i++)
				{
					for(let j = 0; j < pGameGin.nCardsRunSet[i].length; j++)
					{
						nCards.push(pGameGin.nCardsRunSet[i][j]);
					}
				}

				for(let i = 0; i < pGameGin.nCardsDeadwood.length; i++)
				{
					nCards.push(pGameGin.nCardsDeadwood[i]);
				}

				if(pGameGin.nCardOut !== 0)
				{
					if(this.m_pGameUsers[this.m_CurrentAction.nActionChairId].CheckCardExist(pGameGin.nCardOut, true) === false)
					{
						this.SendErrorMsg(nChairId, GinErrors.Not_Exist_Card, eActionType);
						return true;
					}
				}
				
				if(this.m_pGameUsers[this.m_CurrentAction.nActionChairId].IsCardsSame(nCards) !== true)
				{
					if(pGameGin.nCardOut !== 0)
					{
						this.m_pGameUsers[this.m_CurrentAction.nActionChairId].AddCardsHand([pGameGin.nCardOut], 0, 1);
					}

					this.SendErrorMsg(nChairId, GinErrors.Not_Exist_Card, eActionType);
					return true;
				}
				
				if(IsRunSetsValid(pGameGin.nCardsRunSet) !== true)
				{
					if(pGameGin.nCardOut !== 0)
					{
						this.m_pGameUsers[this.m_CurrentAction.nActionChairId].AddCardsHand([pGameGin.nCardOut], 0, 1);
					}

					this.SendErrorMsg(nChairId, GinErrors.Not_Valid_RunSets, eActionType);
					return true;
				}

				let nScore = 0;

				for(let i = 0; i < pGameGin.nCardsDeadwood.length; i++)
				{
					nScore += GetCardValue(pGameGin.nCardsDeadwood[i]);
				}
				
				if(nScore > 10 || (this.m_eGinRule === GinType.Straight && nScore != 0))
				{
					if(pGameGin.nCardOut !== 0)
					{
						this.m_pGameUsers[this.m_CurrentAction.nActionChairId].AddCardsHand([pGameGin.nCardOut], 0, 1);
					}

					this.SendErrorMsg(nChairId, GinErrors.Can_Not_Gin, eActionType);
					return true;
				}
				
				const pGinDatas: Array<CardsGroupInfo> = [];
				
				let pRunSets: Array<Array<number>> = [[]];
				let pDeadwoods = [];
				let pLayoff = [];

				for(let i = 0; i < this.m_pGameUsers.length; i++)
				{
					if(i === this.m_CurrentAction.nActionChairId)
					{
						pGinDatas[i] = {
							arrRunSets: pGameGin.nCardsRunSet,
							arrDeadwoods: pGameGin.nCardsDeadwood
						};

						pRunSets = pGameGin.nCardsRunSet;
					}
					else
					{
						let pCardsTemp = this.m_pGameUsers[i].CopyHandCards();

						pGinDatas[i] = GetCardGroups(pCardsTemp);

						pDeadwoods = pGinDatas[i].arrDeadwoods;
					}
				}

				if(nScore != 0)
				{
					GetLayoffCards(pRunSets, pDeadwoods, pLayoff);
				}

				let pGameGinRep: SubGame_GameGin_Rep = {
					nOpChairId: this.m_CurrentAction.nActionChairId,
					nOpUserId: this.GetChairUserId(this.m_CurrentAction.nActionChairId),
					nCardOut: pGameGin.nCardOut
				};

				this.m_pGameScene.SendMessage(InvalidChairId, SubId_Game.GameGin, pGameGinRep);
				
				let bBigGin = pGameGin.nCardOut === 0;
				
				this.OnGameGin(pGinDatas, pLayoff, this.m_CurrentAction.nActionChairId, bBigGin);

				return true;
			}
			break;
		}

		return false;
	}

	public OnGameTimer(nTimerId: number)
	{
		let bRet = false;

		switch(nTimerId)
		{
		case TimerId_Timeout:
			{
				if(this.m_CurrentAction.nTimeOut > 0)
				{
					this.m_CurrentAction.nTimeOut--;
				}
				
				switch(this.m_eGameStage)
				{
				case GameStage.WaitingStart:
					{
						if(this.m_CurrentAction.nTimeOut <= 0)
						{
							this.ChangeGameStage(GameStage.DealCards);
						}
					}
					break;
				case GameStage.DealCards:
					{
						
					}
					break;
				case GameStage.Passing:
					{
						if(this.m_pGameScene.GetChairUserAndroid(this.m_CurrentAction.nActionChairId))
						{
							if((((GameRandom() % 100) < 90) || this.m_CurrentAction.nTimeOut <= 8) && this.m_CurrentAction.nTimeOut <= 12)
							{
								this.OnAndroidAction();
							}
						}
						else if(this.m_CurrentAction.nTimeOut <= 0)
						{
							this.OnUserTrustee();
						}
						else if(this.m_pGameScene.GetChairUserOnline(this.m_CurrentAction.nActionChairId) === false && this.m_CurrentAction.nTimeOut <= 15)
						{
							this.OnUserTrustee();
						}
					}
					break;
				case GameStage.Gaming:
					{
						if(this.m_pGameScene.GetChairUserAndroid(this.m_CurrentAction.nActionChairId))
						{
							if(((GameRandom() % 100) < 90) || this.m_CurrentAction.nTimeOut <= 15)
							{
								this.OnAndroidAction();
							}
						}
						else if(this.m_CurrentAction.nTimeOut <= 0)
						{
							this.OnUserTrustee();
						}
						else if(this.m_pGameScene.GetChairUserOnline(this.m_CurrentAction.nActionChairId) === false && this.m_CurrentAction.nTimeOut <= 15)
						{
							if(this.m_pGameUsers[this.m_CurrentAction.nActionChairId].GetTrusteeTimes() >= 5)
							{
								this.OnGameConclude(this.m_CurrentAction.nActionChairId, GameEndReason.ForceQuit);
							}
							else
							{
								this.OnUserTrustee();
							}
							
						}
					}
					break;
				case GameStage.Ending:
					{
						if(this.m_CurrentAction.nTimeOut <= 0)
						{
							if(this.HasNextInning())
							{
								this.m_pGameScene.OnGameEnd([], [], [], [], GameEndReason.Normal);
							}
							else
							{
								//总结算
								let totalResult = this.GameTotalResult();

								this.m_pGameScene.OnGameEnd(totalResult.nGoldChanges, totalResult.nGinTimes, totalResult.nBigGinTimes, totalResult.nUndercutTimes, GameEndReason.Normal);
							}
						}
					}
					break;
				}

				bRet = true;
			}
		}

		return bRet;
	}

	public OnGameGin(pGinsData: Array<CardsGroupInfo>, nLayoff: Array<number>, nGinChairId: number, bBigGin: boolean)
	{
		let nScores: Array<number> = [];
		let nScoresGet: Array<number> = [];

		//check layoff.

		if(nGinChairId != InvalidChairId)
		{
			pGinsData[nGinChairId].arrRunSets
		}
		
		for(let i = 0; i < this.m_pGameUsers.length; i++)
		{
			nScores[i] = 0;

			if(nGinChairId === InvalidChairId) continue;

			if(i === nGinChairId)
			{
				for(let j = 0; j < pGinsData[i].arrDeadwoods.length; j++)
				{
					nScores[i] += GetCardValue(pGinsData[i].arrDeadwoods[j]);
				}
			}
			else
			{
				for(let j = 0; j < pGinsData[i].arrDeadwoods.length; j++)
				{
					nScores[i] += GetCardValue(pGinsData[i].arrDeadwoods[j]);
				}
			}
		}

		if(nGinChairId !== InvalidChairId)
		{
			for(let i = 0; i < nLayoff.length; i++)
			{
				nScores[(nGinChairId + 1) % 2] -= GetCardValue(nLayoff[i]);
			}
		}

		nScoresGet[nGinChairId] = 0;

		let bUndercut = false;
		let bGin = false;
		let nUndercutChairId = 0;

		for(let i = 0; i < this.m_pGameUsers.length; i++)
		{
			if(i === nGinChairId)
			{
				continue;
			}
			else
			{
				nScoresGet[i] = 0;

				if(nGinChairId === InvalidChairId) continue;

				if(nScores[nGinChairId] === 0 || nScores[nGinChairId] < nScores[i])
				{
					if(nScores[nGinChairId] === 0)
					{
						if(bBigGin)
						{
							nScoresGet[nGinChairId] += 50;
						}
						else
						{
							nScoresGet[nGinChairId] += 25;
						}

						bGin = true;
					}

					nScoresGet[nGinChairId] += (nScores[i] - nScores[nGinChairId]);
				}
				else
				{
					bUndercut = true;
					nUndercutChairId = i;

					nScoresGet[i] += 25;
					nScoresGet[i] += (nScores[nGinChairId] - nScores[i]);

					nScoresGet[nGinChairId] -= nScoresGet[i];
				}
			}
		}

		let nScoreLast = [];

		for(let i = 0; i < this.m_pGameUsers.length; i++)
		{
			nScoreLast[i] = this.m_pGameUsers[i].GetTotalScore();

			if(nScoresGet[i] > 0)
			{
				this.m_pGameUsers[i].AddTotalScore(nScoresGet[i]);
			}
			else
			{
				nScoresGet[i] = 0;
			}
		}

		if(bUndercut === true)
		{
			this.m_pGameUsers[nUndercutChairId].AddUndercutTimes(false);
		}

		if(bBigGin === true)
		{
			this.m_pGameUsers[nGinChairId].AddBigGinTimes(false);
		}
		else if(bGin === true)
		{
			this.m_pGameUsers[nGinChairId].AddGinTimes(false);
		}

		let pGameEnd: SubGame_GameEnd = {
			nCardLayoff: nLayoff,
			userGameEndInfo: [],
			bBigGin: bBigGin,
			bGin: bGin,
			bUndercut: bUndercut
		};
				
		for(let i = 0; i < this.m_pGameUsers.length; i++)
		{
			pGameEnd.userGameEndInfo[i] = {
				nUserId: this.GetChairUserId(i),
				nChairId: i,
				nScore: nScores[i],
				nScoreLast: nScoreLast[i],
				nScoreTotal: this.m_pGameUsers[i].GetTotalScore(),
				nRunSetCards: pGinsData[i].arrRunSets,
				nDeadwoodCards: pGinsData[i].arrDeadwoods
			}
		}

		this.m_pEndInfo = pGameEnd;

		this.m_pGameScene.SendMessage(InvalidChairId, SubId_Game.GameEnd, pGameEnd);

		this.ChangeGameStage(GameStage.Ending);
	}

	public GameTotalResult(): {nGoldChanges: Array<number>, nGinTimes: Array<number>, nBigGinTimes: Array<number>, nUndercutTimes: Array<number>}
	{
		let nGameScores: Array<number> = [];
		let nGameGoldOld: Array<number> = [];
		let nGameGoldChange: Array<number> = [];
		let nGameGoldNew: Array<number> = [];

		let nGinTimes: Array<number> = [];
		let nBigGinTimes: Array<number> = [];
		let nUndercutTimes: Array<number> = [];

		//find win user.
		let nScoreMax = -1;
		let nScoreMaxIndex = -1;

		const nCellScore = this.m_pGameScene.GetCellScore();

		for(let i = 0; i < this.m_pGameUsers.length; i++)
		{
			nGameGoldOld[i] = this.m_pGameScene.GetChairUserGameGold(i);
			nGameGoldChange[i] = 0;
			nGameGoldNew[i] = nGameGoldOld[i];

			nGameScores[i] = this.m_pGameUsers[i].GetTotalScore();

			if(nScoreMax < nGameScores[i])
			{
				nScoreMax = nGameScores[i];
				nScoreMaxIndex = i;
			}
		}

		for(let i = 0; i < this.m_pGameUsers.length; i++)
		{
			const nScoreDis = nScoreMax - nGameScores[i];
			const nGold = nScoreDis * nCellScore;

			if(nScoreDis > 0)
			{
				nGameGoldChange[i] = -1 * nGold;
				nGameGoldChange[nScoreMaxIndex] += nGold;

				nGameGoldNew[i] -= nGold;
				nGameGoldNew[nScoreMaxIndex] += nGold;
			}
		}

		let pEndAll: SubGame_GameEndTotal = {
			userGameEndAll: []
		};

		for(let i = 0; i < this.m_pGameUsers.length; i++)
		{
			pEndAll.userGameEndAll[i] = {
				nUserId: this.GetChairUserId(i),
				nChairId: i,
				nGameGoldOld: nGameGoldOld[i],
				nGameGoldNew: nGameGoldNew[i],
				nGameGoldChange: nGameGoldChange[i],
				nScoreTotal: nGameScores[i]
			}

			nGinTimes[i] = this.m_pGameUsers[i].GetGinTimes();
			nBigGinTimes[i] = this.m_pGameUsers[i].GetBigGinTimes();
			nUndercutTimes[i] = this.m_pGameUsers[i].GetUndercutTimes();
		}

		this.m_pGameScene.SendMessage(InvalidChairId, SubId_Game.GameEndAll, pEndAll);

		return {nGoldChanges: nGameGoldChange, nGinTimes: nGinTimes, nBigGinTimes: nBigGinTimes, nUndercutTimes: nUndercutTimes};
	}

	public SendErrorMsg(nChairId: number, nErrCode, nActionType: ActionType)
	{
		const pErr: SubGame_ErrorMsg = {
			nErrCode: nErrCode,
			nActionType: nActionType
		};

		this.m_pGameScene.SendMessage(nChairId, SubId_Game.ErrorMsg, pErr);
	}


	public SetActionInfo(eActionType: ActionType, nActionCard: number, eCardFrom: GetCardFrom)
	{
		switch(eActionType)
		{
		case ActionType.None:
			{
				this.m_CurrentAction.nActionChairId = this.m_nBankerChairId;
				
				this.m_CurrentAction.eActionType = ActionType.None;

				this.m_CurrentAction.eSupportActionType = ActionType.GetCard | ActionType.Pass;
				this.m_CurrentAction.nPassTimes = 0;
			}
			break;
		case ActionType.Pass:
			{
				this.m_CurrentAction.nActionChairId = (this.m_CurrentAction.nActionChairId + 1) % this.m_pGameUsers.length;
				
				this.m_CurrentAction.eActionType = ActionType.Pass;

				this.m_CurrentAction.eSupportActionType = ActionType.GetCard;
				this.m_CurrentAction.nPassTimes++;
				
				if(this.m_CurrentAction.nPassTimes < 2)
				{
					this.m_CurrentAction.eSupportActionType |= ActionType.Pass;
				}
				else
				{
					if(this.m_eGameStage == GameStage.Passing)
					{
						this.ChangeGameStage(GameStage.Gaming);
					}
				}
			}
			break;
		case ActionType.GetCard:
			{
				this.m_CurrentAction.eActionType = ActionType.GetCard;
				this.m_CurrentAction.eSupportActionType = ActionType.OutCard | ActionType.GameGin;
				
				this.m_CurrentAction.nGetCard = nActionCard;
				this.m_CurrentAction.eGetCardFrom = eCardFrom;

				if(this.m_eGameStage == GameStage.Passing)
				{
					this.ChangeGameStage(GameStage.Gaming);
				}
			}
			break;
		case ActionType.OutCard:
			{
				this.m_CurrentAction.nActionChairId = (this.m_CurrentAction.nActionChairId + 1) % this.m_pGameUsers.length;

				this.m_CurrentAction.eActionType = ActionType.OutCard;
				this.m_CurrentAction.eSupportActionType = ActionType.GetCard;
				
				this.m_CurrentAction.nGetCard = 0;
				this.m_CurrentAction.eGetCardFrom = 0;
			}
			break;
		case ActionType.GameGin:
			{
				this.m_CurrentAction.eActionType = ActionType.GameGin;
				this.m_CurrentAction.eSupportActionType = ActionType.GetCard;
			}
			break;
		}

		this.SetStageTimeout();
	}

	public OnUserTrustee()
	{
		if((this.m_CurrentAction.eSupportActionType & ActionType.Pass) > 0)
		{
			let pMsg: SubGame_Pass_Req = {
				bTrustee: true
			};

			this.OnGameMessage(SubId_Game.GamePass, pMsg, this.m_CurrentAction.nActionChairId);
		}
		else if((this.m_CurrentAction.eSupportActionType & ActionType.GetCard) > 0)
		{
			let pMsg: SubGame_GetCard_Req = {
				bTrustee: true,
				eGetCardFrom: GetCardFrom.LeftCards
			};

			this.OnGameMessage(SubId_Game.GetCard, pMsg, this.m_CurrentAction.nActionChairId);
		}
		else if((this.m_CurrentAction.eSupportActionType & ActionType.OutCard) > 0)
		{
			let nOutCard = 0;

			if(this.m_CurrentAction.eGetCardFrom === GetCardFrom.OutCards)
			{
				nOutCard = this.m_CurrentAction.nGetCard;
			}

			const nCard = this.m_pGameUsers[this.m_CurrentAction.nActionChairId].GetCardWithout(nOutCard);

			let pMsg: SubGame_OutCard_Req = {
				bTrustee: true,
				nCard: nCard
			};

			this.OnGameMessage(SubId_Game.OutCard, pMsg, this.m_CurrentAction.nActionChairId);
		}
	}

	public OnAndroidAction()
	{
		if((this.m_CurrentAction.eSupportActionType & ActionType.Pass) > 0)
		{
			let pMsg: SubGame_Pass_Req = {
				bTrustee: false
			};

			this.OnGameMessage(SubId_Game.GamePass, pMsg, this.m_CurrentAction.nActionChairId);
		}
		else if((this.m_CurrentAction.eSupportActionType & ActionType.GetCard) > 0)
		{
			let nHandCards = this.m_pGameUsers[this.m_CurrentAction.nActionChairId].CopyHandCards();

			let nCardLeft = this.m_pCardsLeft[this.m_nCardsOffset];
			let nCardOut = this.m_pCardsOut[this.m_pCardsOut.length - 1];

			let eCardFrom: any = {};

			eCardFrom.eCardFrom = GetCardFrom.LeftCards;

			if(this.m_eGameStage === GameStage.Gaming && this.m_bFirstGet === true)
			{
				nCardOut = 0;
			}
			else
			{
				eCardFrom = FindGetCard(nHandCards, nCardLeft, nCardOut);
			}
			
			let pMsg: SubGame_GetCard_Req = {
				bTrustee: false,
				eGetCardFrom: eCardFrom.eCardFrom
			};

			this.OnGameMessage(SubId_Game.GetCard, pMsg, this.m_CurrentAction.nActionChairId);
		}
		else if((this.m_CurrentAction.eSupportActionType & ActionType.OutCard) > 0)
		{
			let nOutCard = 0;

			if(this.m_CurrentAction.eGetCardFrom === GetCardFrom.OutCards)
			{
				nOutCard = this.m_CurrentAction.nGetCard;
			}

			let nHandCards = this.m_pGameUsers[this.m_CurrentAction.nActionChairId].CopyHandCards();

			let nCardsGroups = GetCardGroups(nHandCards);
			nCardsGroups.arrDeadwoods.sort();

			if(nCardsGroups.arrDeadwoods.length === 0)
			{
				let pMsg: SubGame_GameGin_Req = {
					nCardOut: 0,
					nCardsDeadwood: nCardsGroups.arrDeadwoods,
					nCardsRunSet: nCardsGroups.arrRunSets
				};

				this.OnGameMessage(SubId_Game.GameGin, pMsg, this.m_CurrentAction.nActionChairId);
			}
			else if(nCardsGroups.arrDeadwoods.length === 1 && nCardsGroups.arrDeadwoods[0] !== nOutCard)
			{
				let pMsg: SubGame_GameGin_Req = {
					nCardOut: nCardsGroups.arrDeadwoods[0],
					nCardsDeadwood: [],
					nCardsRunSet: nCardsGroups.arrRunSets
				};

				this.OnGameMessage(SubId_Game.GameGin, pMsg, this.m_CurrentAction.nActionChairId);
			}
			else
			{
				if(nCardsGroups.arrDeadwoods.length === 1)
				{
					const nCard = this.m_pGameUsers[this.m_CurrentAction.nActionChairId].GetCardWithout(nOutCard);

					let pMsg: SubGame_OutCard_Req = {
						bTrustee: false,
						nCard: nCard
					};

					this.OnGameMessage(SubId_Game.OutCard, pMsg, this.m_CurrentAction.nActionChairId);
				}
				else
				{
					let nDeadwoodsScore = 0;
					let nCard = 0;
	
					if(nCardsGroups.arrDeadwoods[nCardsGroups.arrDeadwoods.length - 1] !== nOutCard)
					{
						nCard = nCardsGroups.arrDeadwoods.pop();
					}
					else
					{
						nCard = nCardsGroups.arrDeadwoods[nCardsGroups.arrDeadwoods.length - 2];
						nCardsGroups.arrDeadwoods.splice(nCardsGroups.arrDeadwoods.length - 2, 1);
					}

					for(let i = 0; i < nCardsGroups.arrDeadwoods.length; i++)
					{
						nDeadwoodsScore += GetCardValue(nCardsGroups.arrDeadwoods[i]);
					}

					if(nDeadwoodsScore <= 10)
					{
						let pMsg: SubGame_GameGin_Req = {
							nCardOut: nCard,
							nCardsDeadwood: nCardsGroups.arrDeadwoods,
							nCardsRunSet: nCardsGroups.arrRunSets
						};

						this.OnGameMessage(SubId_Game.GameGin, pMsg, this.m_CurrentAction.nActionChairId);
					}
					else
					{
						let pMsg: SubGame_OutCard_Req = {
							bTrustee: false,
							nCard: nCard
						};

						this.OnGameMessage(SubId_Game.OutCard, pMsg, this.m_CurrentAction.nActionChairId);
					}
				}
			}
		}
	}

	public RandCards()
	{
		this.m_pCardsOut = [];
		this.m_nCardsOffset = 0;

		const nCardCount = this.m_pCardsLeft.length;

		for (let i = 0; i < nCardCount; i++)
		{
			let nPos = GameRandom() % nCardCount;
			let nCardTemp = this.m_pCardsLeft[i];
			this.m_pCardsLeft[i] = this.m_pCardsLeft[nPos];
			this.m_pCardsLeft[nPos] = nCardTemp;
		}

		//=====================================================================================================
		let nCards = [];
		try
		{
			let cardsConfig = LoadJsonFile("./GinRummy/cardsconfig.json");

			if(cardsConfig.cards !== undefined)
			{
				nCards = cardsConfig.cards;
			}
		}
		catch(e)
		{
			nCards = [];
		}
		
		if(nCards.length === nCardCount)
		{
			for(let i = 0; i < nCardCount; i++)
			{
				this.m_pCardsLeft[i] = nCards[i];
			}
		}
	}

	public DealCards()
	{
		for (let i = 0; i < this.m_pGameUsers.length; i++)
		{
			this.m_pGameUsers[i].AddCardsHand(this.m_pCardsLeft, this.m_nCardsOffset, 10);

			this.m_nCardsOffset += 10;
		}
		
		this.m_pCardsOut[this.m_pCardsOut.length] = this.m_pCardsLeft[this.m_nCardsOffset];
		this.m_nCardsOffset += 1;

		this.SetActionInfo(ActionType.None, 0, 0);

		let pDealCards: SubGame_DealCards = {
			nCurrentOpChairId: this.m_CurrentAction.nActionChairId,
			nCurrentOpUserId: this.GetChairUserId(this.m_CurrentAction.nActionChairId),
			bCanPass: true,

			nLeftCards: this.GetLeftCardsCount(),
			nCardTop: this.m_pCardsLeft[this.m_nCardsOffset],
			nCardOut: this.m_pCardsOut[this.m_pCardsOut.length - 1],

			pGameCards: [],

			nTimeOut: this.m_CurrentAction.nTimeOut
		};

		for(let i = 0; i < this.m_pGameUsers.length; i++)
		{
			pDealCards.pGameCards = this.m_pGameUsers[i].CopyHandCards();

			this.m_pGameScene.SendMessage(i, SubId_Game.DealCards, pDealCards);
		}
	}

	public GetLeftCardsCount(): number
	{
		return (this.m_pCardsLeft.length - this.m_nCardsOffset);
	}

	public GetChairUserId(nChairId: number): number
	{
		if(nChairId === InvalidChairId) return InvalidUserId;

		return this.m_pGameScene.GetChairUserId(nChairId);
	}
}


export function CreateGameLogic(pIEXEGameScene: IEXEScene, nUserCount: number): IDLLScene
{
	return new GameLogic(pIEXEGameScene, nUserCount);
}