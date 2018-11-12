



export class GameUser
{
	private m_pCardsHand:								Array<number>;

	private m_nTotalScore:								number;

	private m_nTrusteeTimes:							number;

	private m_nGinTimes:								number;
	private m_nBigGinTimes:								number;
	private m_nUndercutTimes:							number;
	
	constructor()
	{
		this.Clear();
	}

	public Reset()
	{
		this.m_pCardsHand = [];

		this.AddTrusteeTimes(true);
	}

	public Clear()
	{
		this.Reset();

		this.ResetTotalScore();
		this.AddGinTimes(true);
		this.AddBigGinTimes(true);
		this.AddUndercutTimes(true);
	}

	public ResetTotalScore()
	{
		this.m_nTotalScore = 0;
	}

	public AddTotalScore(nScore: number)
	{
		this.m_nTotalScore += nScore;
	}

	public GetTotalScore()
	{
		return this.m_nTotalScore;
	}

	public AddGinTimes(bClear: boolean)
	{
		if(bClear === true)
		{
			this.m_nGinTimes = 0;
			return;
		}

		this.m_nGinTimes++;
	}

	public GetGinTimes()
	{
		return this.m_nGinTimes;
	}

	public AddBigGinTimes(bClear: boolean)
	{
		if(bClear === true)
		{
			this.m_nBigGinTimes = 0;
			return;
		}

		this.m_nBigGinTimes++;
	}

	public GetBigGinTimes()
	{
		return this.m_nBigGinTimes;
	}

	public AddUndercutTimes(bClear: boolean)
	{
		if(bClear === true)
		{
			this.m_nUndercutTimes = 0;
			return;
		}

		this.m_nUndercutTimes++;
	}

	public GetUndercutTimes()
	{
		return this.m_nUndercutTimes;
	}



	public AddTrusteeTimes(bClear: boolean)
	{
		if(bClear === true)
		{
			this.m_nTrusteeTimes = 0;
			return;
		}

		this.m_nTrusteeTimes++;
	}

	public GetTrusteeTimes()
	{
		return this.m_nTrusteeTimes;
	}

	public AddCardsHand(nCards: Array<number>, nOffset: number, nCount)
	{
		const nLength = this.m_pCardsHand.length;

		for(let i = 0; i < nCount; i++)
		{
			this.m_pCardsHand[nLength + i] = nCards[i + nOffset];
		}
	}

	public CheckCardExist(nCard: number, bRemove: boolean)
	{
		const nLength = this.m_pCardsHand.length;

		for(let i = 0; i < nLength; i++)
		{
			if(this.m_pCardsHand[i] === nCard)
			{
				if(bRemove === true) this.m_pCardsHand.splice(i, 1);

				return true;
			}
		}

		return false;
	}

	public IsCardsSame(nCardsCheck: Array<number>): boolean
	{
		let nCardsHand = this.m_pCardsHand.concat();
		let nCardsChk = nCardsCheck.concat();

		nCardsHand.sort();
		nCardsChk.sort();

		if(nCardsHand.length !== nCardsChk.length) return false;

		for(let i = 0; i < nCardsHand.length; i++)
		{
			if(nCardsHand[i] != nCardsChk[i]) return false;
		}

		return true;
	}

	public GetCardWithout(nCard: number)
	{
		let nRemove = 0;

		if(nCard === 0)
		{
			nRemove = this.m_pCardsHand[this.m_pCardsHand.length - 1];
		}
		else
		{
			for(let i = this.m_pCardsHand.length - 1; i >= 0; i--)
			{
				nRemove = this.m_pCardsHand[i];

				if(nRemove === nCard) continue;

				break;
			}
		}

		return nRemove;
	}

	public CopyHandCards(): Array<number>
	{
		let pCards = [];

		const nLength = this.m_pCardsHand.length;

		for(let i = 0; i < nLength; i++)
		{
			pCards[i] = this.m_pCardsHand[i];
		}

		return pCards;
	}
}