

enum SceneStatus
{
	Idle,
	Gaming
};



interface GameSceneInfo
{
	eStatus:												SceneStatus;
	nUsers:													Array<number>;
	nMatchingRuleIndex:										number;
};

const GSceneIndexMax: number								= 1000;

export let GGameSceneManager: GameSceneManager				= null;

export class GameSceneManager
{
	private m_GameSceneInfo:								Array<GameSceneInfo>;

	constructor()
	{
		this.m_GameSceneInfo = [];

		for(let i = 0; i < GSceneIndexMax; i++)
		{
			this.m_GameSceneInfo[i] = {
				eStatus: SceneStatus.Idle,
				nUsers: [],
				nMatchingRuleIndex: 0
			};
		}

		GGameSceneManager = this;
	}

	public AllocateScene(nUsers: Array<number>, nMatchingRuleIndex: number): number
	{
		for(let i = 0; i < GSceneIndexMax; i++)
		{
			if(this.m_GameSceneInfo[i].eStatus !== SceneStatus.Idle) continue;

			for(let j = 0; j < nUsers.length; j++)
			{
				this.m_GameSceneInfo[i].nUsers[j] = nUsers[j];
			}

			this.m_GameSceneInfo[i].eStatus = SceneStatus.Gaming;
			this.m_GameSceneInfo[i].nMatchingRuleIndex = nMatchingRuleIndex;

			return i;
		}

		return GSceneIndexMax;
	}

	public ReleaseScene(nIndex: number)
	{
		this.m_GameSceneInfo[nIndex].eStatus = SceneStatus.Idle;
		this.m_GameSceneInfo[nIndex].nUsers = [];
		this.m_GameSceneInfo[nIndex].nMatchingRuleIndex = 0;
	}

	public GetSceneUsers(nIndex: number)
	{
		return this.m_GameSceneInfo[nIndex].nUsers;
	}

	public GetSceneRuleIndex(nIndex: number)
	{
		return this.m_GameSceneInfo[nIndex].nMatchingRuleIndex;
	}
}