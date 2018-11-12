import { ConnectionBase } from "./ConnectionBase";
import { InvalidServerId } from "../Common/GlobalDefines";
import { SubCSRegisterReq_RegisterFight } from "../Common/CMD_CenterServer";



export class FightServer extends ConnectionBase
{
	private m_nServerId:						number;
	private m_nGameKind:						number;

	private m_nServerPort:						number;
	private m_nSceneCount:						number;
	private m_nIdleSceneCount:					number;
	
	constructor()
	{
		super();

		this.m_nServerId = InvalidServerId;
		this.m_nGameKind = 0;

		this.m_nServerPort = 0;
		this.m_nSceneCount = 0;
		this.m_nIdleSceneCount = 0;
	}
	
	public OnRegister(pRegister: SubCSRegisterReq_RegisterFight, nBindIndex: number)
	{
		this.m_nServerId = pRegister.nServerId;
		this.m_nGameKind = pRegister.nGameKind;
		this.m_nServerPort = pRegister.nServerPort;
		this.m_nSceneCount = pRegister.nSceneCount;
		this.m_nIdleSceneCount = this.m_nSceneCount;
		
		this.OnLink(nBindIndex);
	}

	public GetPort()
	{
		return this.m_nServerPort;
	}
};
