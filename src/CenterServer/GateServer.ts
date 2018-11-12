import { ConnectionBase } from "./ConnectionBase";
import { InvalidServerId } from "../Common/GlobalDefines";




export class GateServer extends ConnectionBase
{
	private m_nServerId:						number;

	constructor()
	{
		super();

		this.m_nServerId = InvalidServerId;
	}

	public OnRegister(nServerId: number, nBindIndex: number): void
	{
		this.m_nServerId = nServerId;

		this.OnLink(nBindIndex);
	}
}