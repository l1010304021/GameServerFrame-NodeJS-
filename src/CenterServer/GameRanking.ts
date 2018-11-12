import { RankingItem, DBRep_LoadRanking, DBRequestId } from "./DatabasePacket";
import { GGameUserManager } from "./GameUser";
import { GGameEngine } from "../Core/GameEngine";









export let GGameRankingManager: GameRankingManager							= null;


export class GameRankingManager
{
	private m_mapRankings:											Array<RankingItem>;

	constructor()
	{
		this.m_mapRankings = [];

		GGameRankingManager = this;
	}

	public OnDBLoadRanking(pRanking: DBRep_LoadRanking)
	{
		this.m_mapRankings = [];

		for(let i = 0; i < pRanking.mapRankings.length; i++)
		{
			let pGameUser = GGameUserManager.FindUserById(pRanking.mapRankings[i].nUserId);

			if(pGameUser === null)
			{
				let sPhotoTemp = Buffer.from(pRanking.mapRankings[i].sUserPhoto, "hex").toString('utf-8');;

				this.m_mapRankings[i] = {
					nUserId: pRanking.mapRankings[i].nUserId,
					nScore: pRanking.mapRankings[i].nScore,
					nRank: pRanking.mapRankings[i].nRank,
					sUserName: pRanking.mapRankings[i].sUserName,
					sUserPhoto: sPhotoTemp
				};
			}
			else
			{
				this.m_mapRankings[i] = {
					nUserId: pRanking.mapRankings[i].nUserId,
					nScore: pRanking.mapRankings[i].nScore,
					nRank: pRanking.mapRankings[i].nRank,
					sUserName: pGameUser.GetUserName(),
					sUserPhoto: pGameUser.GetUserPhoto()
				};
			}
		}
	}

	public GetRanking(nCount: number): Array<RankingItem>
	{
		let ret: Array<RankingItem> = [];

		for(let i = 0; i < nCount; i++)
		{
			if(i >= this.m_mapRankings.length) break;

			ret[i] = this.m_mapRankings[i];
		}

		return ret;
	}

	public LoadRanking()
	{
		GGameEngine.SendDatabaseRequest(DBRequestId.Req_LoadRanking, {}, 0);
	}
}