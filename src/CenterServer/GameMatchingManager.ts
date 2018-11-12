import { GameRandom, GGameEngine } from "../Core/GameEngine";
import { GGameUserManager } from "./GameUser";
import { InvalidUserId, IsValidUserId, GameErrors } from "../Common/GlobalDefines";
import { GConfig } from "../Core/GlobalConfig";
import { GameCenter } from "./main";
import { SubCSUserMatchingRep_NormalMatchingFailure, SubCSUserMatchingRep_NormalMatchingSuccess, SubCSFightFrameReq_AllocateScene, MainId_CS, SubId_CS_FightFrame, SubId_CS_UserMatching } from "../Common/CMD_CenterServer";
import { GGameSceneManager } from "./GameSceneManager";
import { worker } from "cluster";


export let GGameMatchingManager: GameMatchingManager	= null;



export class GameMatchingManager
{
	private m_mapMatchingRulesUsers:				Array<Array<number>>
	private m_mapMatchingUserTimes:					Array<number>

	constructor()
	{
		GGameMatchingManager = this;

		this.m_mapMatchingRulesUsers = [];
		this.m_mapMatchingUserTimes = [];

		for(let i = 0; i < GConfig.MatchingConfig.matchingRules.length; i++)
		{
			this.m_mapMatchingRulesUsers[i] = [];
		}
	}

	public OnMatchingTimer()
	{
		let nCount = 0;
		let nUsers = [];

		let nTimeCurr = process.uptime();

		for(let i = 0; i < this.m_mapMatchingRulesUsers.length; i++)
		{
			while(this.m_mapMatchingRulesUsers[i].length >= 2)
			{
				nUsers = [];

				nUsers[0] = this.m_mapMatchingRulesUsers[i].shift();
				nUsers[1] = this.m_mapMatchingRulesUsers[i].shift();

				this.m_mapMatchingUserTimes[nUsers[0]] = undefined;
				this.m_mapMatchingUserTimes[nUsers[1]] = undefined;

				this.OnMatchingDispatch(nUsers, i);
			}

			if(this.m_mapMatchingRulesUsers[i].length > 0)
			{
				nUsers = [];

				nUsers[0] = this.m_mapMatchingRulesUsers[i][0];

				let nRand = (GameRandom() % 5) + 15;

				if((this.m_mapMatchingUserTimes[nUsers[0]] + nRand) < nTimeCurr)
				{
					let nAndroidId = GGameUserManager.GetRandAndroidUser();

					if(IsValidUserId(nAndroidId))
					{
						nUsers.push(nAndroidId);

						this.m_mapMatchingUserTimes[nUsers[0]] = undefined;
						this.m_mapMatchingRulesUsers[i].shift();

						this.OnMatchingDispatch(nUsers, i);
					}
				}
			}
		}
	}

	public OnMatchingDispatch(nUsers: Array<number>, nMatchingRuleIndex: number)
	{
		const pGameCenter: GameCenter = GGameEngine as GameCenter;

		const pFightServer = pGameCenter.FindFightServer();

		if(pFightServer === null)
		{
			let pFailure: SubCSUserMatchingRep_NormalMatchingFailure = {
				nErrorCode: GameErrors.FightServerNotFound
			};

			for(let i = 0; i < nUsers.length; i++)
			{
				let pGameUser = GGameUserManager.FindUserById(nUsers[i]);

				pGameUser.OnMatchingFailure(pFailure);
			}

			return;
		}

		let pMatchingSuccess: SubCSUserMatchingRep_NormalMatchingSuccess = {
			nPort: pFightServer.GetPort(),
			sLoginKey: "",
			matchingUsers:[]
		};

		const nSceneId = GGameSceneManager.AllocateScene(nUsers, nMatchingRuleIndex);

		let pAllocateFightScene: SubCSFightFrameReq_AllocateScene = {
			nCellScore: GConfig.MatchingConfig.matchingRules[nMatchingRuleIndex].nCellScore,
			nCustomRule: GConfig.MatchingConfig.matchingRules[nMatchingRuleIndex].nCustomRule,
			//nEnterGoldMin: GConfig.MatchingConfig.matchingRules[nMatchingRuleIndex].nEnterGoldMin,
			//nEnterGoldMax: GConfig.MatchingConfig.matchingRules[nMatchingRuleIndex].nEnterGoldMax,
			nSceneIndex: nSceneId,
			sceneUsers: []
		};

		console.log("分配场景[", nSceneId, "]");

		for(let i = 0; i < nUsers.length; i++)
		{
			let pGameUser = GGameUserManager.FindUserById(nUsers[i]);

			pMatchingSuccess.matchingUsers[i] = {
				nUserId: pGameUser.GetUserId(),
				sUserName: pGameUser.GetUserName(),
				sUserPhoto: pGameUser.GetUserPhoto(),
				nGameGold: pGameUser.GetGameGold(),
				nExperience: pGameUser.GetExperience()
			};

			let sLoginKey = Buffer.from("" + pGameUser.GetUserId() + "_" + GameRandom() + "").toString("hex");

			pAllocateFightScene.sceneUsers[i] = {
				nUserId: pGameUser.GetUserId(),
				sUserName: pGameUser.GetUserName(),
				sUserPhoto: pGameUser.GetUserPhoto(),
				sLoginKey: sLoginKey,
				nGameGold: pGameUser.GetGameGold(),
				nExperience: pGameUser.GetExperience(),
				bAndroid: pGameUser.IsAndroid()
			};
			
			console.log("分配场景玩家[", pGameUser.GetUserId(), "]");
		}

		pFightServer.SendMessage(MainId_CS.FightFrame, SubId_CS_FightFrame.Req_AllocateScene, pAllocateFightScene);

		for(let i = 0; i < nUsers.length; i++)
		{
			let pGameUser = GGameUserManager.FindUserById(nUsers[i]);

			pMatchingSuccess.sLoginKey = pAllocateFightScene.sceneUsers[i].sLoginKey;

			pGameUser.OnMatchingSuccess(nSceneId, pMatchingSuccess.nPort, pMatchingSuccess.sLoginKey);

			pGameUser.SendMessage(MainId_CS.UserMatching, SubId_CS_UserMatching.Rep_NormalMatchingSuccess, pMatchingSuccess);
		}

		
	}

	public JoinMatching(nUserId: number, nMatchingRuleIndex: number)
	{
		if(this.m_mapMatchingUserTimes[nUserId] === undefined)
		{
			this.m_mapMatchingRulesUsers[nMatchingRuleIndex].push(nUserId);
		}

		this.m_mapMatchingUserTimes[nUserId] = process.uptime();
	}

	public CancelMatching(nUserId: number)
	{
		if(this.m_mapMatchingUserTimes[nUserId] !== undefined)
		{
			for(let i = 0; i < this.m_mapMatchingRulesUsers.length; i++)
			{
				for(let j = 0; j < this.m_mapMatchingRulesUsers[i].length; j++)
				{
					if(this.m_mapMatchingRulesUsers[i][j] === nUserId)
					{
						this.m_mapMatchingRulesUsers[i].splice(j, 1);
						this.m_mapMatchingUserTimes[nUserId] = undefined;
						return;
					}
				}
			}
		}
	}
}