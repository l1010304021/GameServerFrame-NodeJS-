import { MessageHead } from "../Core/Message";
import { GGameEngine } from "../Core/GameEngine";
import { GameCenter } from "./main";




enum ConnectionStatus
{
	Invalid,
	Online,
	Offline
};


export class ConnectionBase
{
	private m_eConnStatus:							ConnectionStatus;
	private m_nBindIndex:							number;
	
	constructor()
	{
		this.SetConnectionStatus(ConnectionStatus.Invalid);
	}

	public SetConnectionStatus(eCS: ConnectionStatus): void
	{
		this.m_eConnStatus = eCS;
	}

	public IsOnline()
	{
		return (this.m_eConnStatus === ConnectionStatus.Online);
	}

	public SendMessage(nMainId: number, nSubId: number, pData: any): boolean
	{
		if (this.IsOnline() === false) return false;

		return (GGameEngine as GameCenter).SendMessage(this.m_nBindIndex, nMainId, nSubId, pData);
	}

	public PostDataBaseRequest(nRequestId: number, oRequest: any)
	{
		return (GGameEngine as GameCenter).SendDatabaseRequest(nRequestId, oRequest, 0);
	}

	public OnLink(nBindIndex: number): void
	{
		this.m_nBindIndex = nBindIndex;

		this.SetConnectionStatus(ConnectionStatus.Online);
	}

	public OnShut(): void
	{
		this.SetConnectionStatus(ConnectionStatus.Offline);
	}
};