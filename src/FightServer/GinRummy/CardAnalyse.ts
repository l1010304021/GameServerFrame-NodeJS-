import { CardType, CardColor } from "./GameDefines";
import { ObjectClone } from "../../Core/GameEngine";
import { ok } from "assert";
import { GetCardFrom } from "./GameCMD";





function GetCardData(eType: CardType, eColor: CardColor)
{
    return ((eColor << 4) | eType);
}

function GetCardColor(nCard: number)
{
    return ((nCard & 0xF0) >> 4);
}

function GetCardType(nCard: number)
{
    return (nCard & 0x0F);
}

function GetCardValue(nCard: number)
{
    let eType: CardType = nCard & 0x0F;

    if(eType >= 10) return 10;
    else return eType;
}

function IsSameColor(nCardA: number, nCardB: number): boolean
{
	const nColorA = GetCardColor(nCardA);
	const nColorB = GetCardColor(nCardB);

	if (nColorA === nColorB) return true;

	return false;
}

function IsLine(arrCards: Array<number>)
{
    //至少3张才能连接
    if(arrCards.length < 3) return false;

    let eCardTypeLast = GetCardType(arrCards[0]);
    let eCardColorLast = GetCardColor(arrCards[0]);

    for(let i = 1; i < arrCards.length; i++)
    {
        let eCardType = GetCardType(arrCards[i]);
        let eCardColor = GetCardColor(arrCards[i]);

        if((eCardTypeLast + i) != eCardType || eCardColorLast != eCardColor)
        {
            //断裂
            return false;
        }
    }

    return true;
}

function IsSame(arrCards: Array<number>)
{
    //至少3张才能算
    if(arrCards.length < 3) return false;

    let eCardTypeLast = GetCardType(arrCards[0]);

    for(let i = 1; i < arrCards.length; i++)
    {
        let eCardType = GetCardType(arrCards[i]);

        if(eCardTypeLast != eCardType)
        {
            //不一致
            return false;
        }
    }

    return true;
}

function MyBeLine(arrCards: Array<number>): boolean
{
	const bSameColor = IsSameColor(arrCards[0], arrCards[1]);

	return bSameColor;
}

function MyBeSame(arrCards: Array<number>): boolean
{
	const bSameColor = IsSameColor(arrCards[0], arrCards[1]);

	return (bSameColor === false);
}

function IsCardGroupValid(arrCards: Array<number>): boolean
{
	if(arrCards.length < 3) return false;

	const bSameColor = IsSameColor(arrCards[0], arrCards[1]);

	if(bSameColor)
	{
		let tmpCards: Array<number> = arrCards.concat();
		tmpCards.sort(); //ok.

		return IsLine(tmpCards);
	}
	else
	{
		return IsSame(arrCards);
	}
}

function IsRunSetsValid(arrRunSets: Array<Array<number>>): boolean
{
	for(let i = 0; i < arrRunSets.length; i++)
	{
		if(IsCardGroupValid(arrRunSets[i]) === false) return false;
	}

	return true;
}

interface CardsGroupInfo
{
	arrRunSets:									Array<Array<number>>;
	arrDeadwoods:								Array<number>;
}

function GetCardGroupsLine(arrCards: Array<number>): CardsGroupInfo
{
	let tmpCards: Array<number> = arrCards.concat();
	tmpCards.sort();

	if(tmpCards.length < 3)
	{
		return {arrRunSets: [], arrDeadwoods: tmpCards};
	}

	let arrRunSets: Array<Array<number>> = [];
	let arrDeadwoods: Array<number> = [];

	let eCardTypeLast = GetCardType(tmpCards[0]);
    let eCardColorLast = GetCardColor(tmpCards[0]);
	let nCount = 1;
	let nBeginIndex = 0;
	let nGroupIndex = 0;

	for(let i = 1; i < tmpCards.length; i++)
	{
		let eCardType = GetCardType(tmpCards[i]);
        let eCardColor = GetCardColor(tmpCards[i]);

        if((eCardTypeLast + nCount) != eCardType || eCardColorLast != eCardColor)
        {
            //断裂
            if(nCount >= 3)
			{
				arrRunSets[nGroupIndex] = [];

				for(let j = nBeginIndex; j < (nBeginIndex + nCount); j++)
				{
					arrRunSets[nGroupIndex].push(tmpCards[j]);
				}

				nGroupIndex++;
			}
			else
			{
				for(let j = nBeginIndex; j < (nBeginIndex + nCount); j++)
				{
					arrDeadwoods.push(tmpCards[j]);
				}
			}

			nBeginIndex = i;
			nCount = 1;

			eCardTypeLast = eCardType;
			eCardColorLast = eCardColor;
        }
		else
		{
			nCount++;
		}
	}

	if(nCount > 0)
	{
		if(nCount >= 3)
		{
			arrRunSets[nGroupIndex] = [];

			for(let j = nBeginIndex; j < (nBeginIndex + nCount); j++)
			{
				arrRunSets[nGroupIndex].push(tmpCards[j]);
			}

			nGroupIndex++;
		}
		else
		{
			for(let j = nBeginIndex; j < (nBeginIndex + nCount); j++)
			{
				arrDeadwoods.push(tmpCards[j]);
			}
		}
	}

	return {arrRunSets: arrRunSets, arrDeadwoods: arrDeadwoods};
}


function GetCardGroupsSame(arrCards: Array<number>): CardsGroupInfo
{
	let tmpCards: Array<number> = arrCards.concat();
	
	if(tmpCards.length < 3)
	{
		tmpCards.sort();
		return {arrRunSets: [], arrDeadwoods: tmpCards};
	}

	tmpCards.sort((nCardA: number, nCardB: number)=>{
		let eCardTypeA = GetCardType(nCardA);
		let eCardTypeB = GetCardType(nCardB);

		if(eCardTypeA > eCardTypeB) return 1;
		else if (eCardTypeA === eCardTypeB) return 0;
		else return -1;
	});

	let arrRunSets: Array<Array<number>> = [];
	let arrDeadwoods: Array<number> = [];

	let eCardTypeLast = GetCardType(tmpCards[0]);
	let nCount = 1;
	let nBeginIndex = 0;
	let nGroupIndex = 0;

	eCardTypeLast = GetCardType(tmpCards[0]);

	for(let i = 1; i < tmpCards.length; i++)
	{
		let eCardType = GetCardType(tmpCards[i]);

		if((eCardTypeLast) != eCardType)
		{
			//断裂
			if(nCount >= 3)
			{
				arrRunSets[nGroupIndex] = [];

				for(let j = nBeginIndex; j < (nBeginIndex + nCount); j++)
				{
					arrRunSets[nGroupIndex].push(tmpCards[j]);
				}

				nGroupIndex++;
			}
			else
			{
				for(let j = nBeginIndex; j < (nBeginIndex + nCount); j++)
				{
					arrDeadwoods.push(tmpCards[j]);
				}
			}

			nBeginIndex = i;
			nCount = 1;

			eCardTypeLast = eCardType;
		}
		else
		{
			nCount++;
		}
	}

	if(nCount > 0)
	{
		if(nCount >= 3)
		{
			arrRunSets[nGroupIndex] = [];

			for(let j = nBeginIndex; j < (nBeginIndex + nCount); j++)
			{
				arrRunSets[nGroupIndex].push(tmpCards[j]);
			}

			nGroupIndex++;
		}
		else
		{
			for(let j = nBeginIndex; j < (nBeginIndex + nCount); j++)
			{
				arrDeadwoods.push(tmpCards[j]);
			}
		}
	}
	
	return {arrRunSets: arrRunSets, arrDeadwoods: arrDeadwoods};
}

interface AnalyseInfo
{
	bExist:					boolean;
	nLeft:					number;
	nRight:					number;
}

function AnalyseGet(analyseInfo: Array<Array<AnalyseInfo>>, nType: number, nCount: number, nrunset: Array<number>)
{
	let nGetCount = 0;

	for(let x = 1; x <= 4; x++)
	{
		if(analyseInfo[x][nType].bExist === false) continue;

		analyseInfo[x][nType].bExist = false;
		analyseInfo[x][nType].nLeft = 0;
		analyseInfo[x][nType].nRight = 0;

		for(let i = nType + 1; i < 0x0F; i++)
		{
			if(analyseInfo[x][nType].bExist === false) break;

			analyseInfo[x][nType].nLeft = i - (nType + 1);
		}

		for(let i = nType - 1; i > 0; i--)
		{
			if(analyseInfo[x][nType].bExist === false) break;

			analyseInfo[x][nType].nLeft = i - (nType + 1);
		}

		nGetCount++;

		nrunset.push(GetCardData(nType, x));

		if(nGetCount >= nCount) break;
	}
}

function AnalyseGetEx(analyseInfo: Array<Array<AnalyseInfo>>, nIndex: number, nType: number, nrunset: Array<number>)
{
	analyseInfo[nIndex][nType].bExist = false;
	analyseInfo[nIndex][nType].nLeft = 0;
	analyseInfo[nIndex][nType].nRight = 0;

	for(let i = nType + 1; i < 0x0F; i++)
	{
		if(analyseInfo[nIndex][nType].bExist === false) break;

		analyseInfo[nIndex][nType].nLeft = i - (nType + 1);
	}

	for(let i = nType - 1; i > 0; i--)
	{
		if(analyseInfo[nIndex][nType].bExist === false) break;

		analyseInfo[nIndex][nType].nLeft = i - (nType + 1);
	}

	nrunset.push(GetCardData(nType, nIndex));
}

function AnalyseGameCards(arrCards: Array<number>)
{
	let analyseInfo: Array<Array<AnalyseInfo>> = [];

	for(let i = 1; i <= 4; i++)
	{
		analyseInfo[i] = [];
		
		for(let j = 0; j < 0x0F; j++)
		{
			analyseInfo[i][j] = {
				bExist: false,
				nLeft: 0,
				nRight: 0
			};
		}
	}

	let nCount = [];

	for(let i = 0; i < 0x0F; i++)
	{
		nCount[i] = 0;
	}

	for(let i = 0; i < arrCards.length; i++)
	{
		let nIndex = GetCardType(arrCards[i]);
		nCount[nIndex]++;
	}

	let pGroupLineA = GetCardGroupsLine(arrCards);
	let pGroupSameA = GetCardGroupsSame(pGroupLineA.arrDeadwoods);

	for(let i = 0; i < pGroupLineA.arrRunSets.length; i++)
	{
		let nIndex = GetCardColor(pGroupLineA.arrRunSets[i][0]);

		for(let j = 0; j < pGroupLineA.arrRunSets[i].length; j++)
		{
			let nType = GetCardType(pGroupLineA.arrRunSets[i][j]);
			
			analyseInfo[nIndex][nType].bExist = true;
			analyseInfo[nIndex][nType].nLeft = j;
			analyseInfo[nIndex][nType].nRight = pGroupLineA.arrRunSets[i].length - (j + 1);
		}
	}

	let nDeadwoods: Array<number> = [];
	let nRunSet: Array<Array<number>> = [];
	let nMayRunset: Array<Array<number>> = [];

	for(let i = 0; i < pGroupSameA.arrRunSets.length; i++)
	{
		nRunSet.push(pGroupSameA.arrRunSets[i].concat());
	}

	let nLastType = GetCardType(pGroupSameA.arrDeadwoods[0]);
	let nIndex = 0;
	nMayRunset[nIndex] = [];

	for(let i = 0; i < pGroupSameA.arrDeadwoods.length; i++)
	{
		let nType = GetCardType(pGroupSameA.arrDeadwoods[i]);

		if(nCount[nType] < 3)
		{
			nDeadwoods.push(pGroupSameA.arrDeadwoods[i]);
		}
		else
		{
			if(nLastType !== nType)
			{
				nIndex++;
				nMayRunset[nIndex] = [];
			}

			nMayRunset[nIndex].push(pGroupSameA.arrDeadwoods[i]);
		}
	}

	for(let i = 0; i < nMayRunset.length; i++)
	{
		if(nMayRunset[i].length <= 0) continue;

		let nType = GetCardType(nMayRunset[i][0]);

		if(nMayRunset[i].length == 1)
		{
			let nLCount = 0;
			let nRCount = 0;

			for(let j = 1; j <= 4; j++)
			{
				if((analyseInfo[j][nType].nLeft > 0 && analyseInfo[j][nType].nLeft < 3))
				{
					nLCount += analyseInfo[1][nType].nLeft;
				}

				if((analyseInfo[j][nType].nRight > 0 && analyseInfo[j][nType].nRight < 3))
				{
					nRCount += analyseInfo[1][nType].nRight;
				}
			}

			if((nLCount + nRCount) > 1)
			{
				nDeadwoods.push(nMayRunset[i][0]);
			}
			else
			{
				//make new.
				AnalyseGet(analyseInfo, nType, 2, nMayRunset[i]);
			}
		}
		else if(nMayRunset[i].length === 2)
		{
			for(let j = 1; j <= 4; j++)
			{
				if((analyseInfo[j][nType].nLeft === 0 && analyseInfo[j][nType].nRight >= 3) ||
					(analyseInfo[j][nType].nRight === 0 && analyseInfo[j][nType].nLeft >= 3))
				{
					AnalyseGetEx(analyseInfo, j, nType, nMayRunset[i]);
					break;
				}
			}
		}
	}

	let nLeftCards: Array<number> = [];

	for(let i = 1; i <= 4; i++)
	{
		for(let j = 0; j < 0x0F; j++)
		{
			if(analyseInfo[i][j].bExist === false) continue;

			nLeftCards.push(GetCardData(j, i));
		}
	}

	let pGroupLine = GetCardGroupsLine(nLeftCards);

	for(let i = 0; i < pGroupLine.arrRunSets.length; i++)
	{
		nRunSet.push(pGroupLine.arrRunSets[i].concat());
	}

	for(let i = 0; i < pGroupLine.arrDeadwoods.length; i++)
	{
		nDeadwoods.push(pGroupLine.arrDeadwoods[i]);
	}

	for(let i = 0; i < nMayRunset.length; i++)
	{
		for(let j = 0; j < nMayRunset[i].length; j++)
		{
			nDeadwoods.push(nMayRunset[i][j]);
		}
	}
	
	let pGroupSame = GetCardGroupsSame(nDeadwoods);

	let arrRunSet = nRunSet.concat(pGroupSame.arrRunSets);
	let arrDeadwood = pGroupSame.arrDeadwoods.concat();

	return {arrRunSets: arrRunSet, arrDeadwoods: arrDeadwood};
}


function GetCardGroups(arrCards: Array<number>): CardsGroupInfo
{
	return AnalyseGameCards(arrCards);
}

function GetLayoffCards(arrRunsets: Array<Array<number>>, arrDeadWoods: Array<number>, arrLayoff: Array<number>)
{
	const nLen = arrRunsets.length;

	for(let i = 0; i < nLen; i++)
	{
		const bSameColor = IsSameColor(arrRunsets[i][0], arrRunsets[i][1]);

		if(bSameColor === true)
		{
			let t = arrRunsets[i];
			arrRunsets[i] = arrRunsets[nLen - 1];
			arrRunsets[nLen - 1] = t;
		}
	}

	let arrDeadWoodsTemp = arrDeadWoods.concat();

	for(let i = 0; i < arrRunsets.length; i++)
	{
		for(let j = 0; j < arrDeadWoodsTemp.length; j++)
		{
			arrRunsets[i].push(arrDeadWoodsTemp[j]);

			if(IsCardGroupValid(arrRunsets[i]) === false)
			{
				arrRunsets[i].pop();
			}
			else
			{
				arrRunsets[i].sort();
				arrLayoff.push(arrDeadWoodsTemp[j]);
				arrDeadWoodsTemp.splice(j, 1);
				break;
			}
		}
	}
}

function FindGetCard(arrCards: Array<number>, nCardLeft: number, nCardOut: number): {eCardFrom: GetCardFrom}
{
	let arrCardsTemp = arrCards.concat();
	
	arrCardsTemp.push(nCardLeft);
	let groupLeft = GetCardGroups(arrCards);

	arrCardsTemp = arrCards.concat();
	arrCardsTemp.push(nCardOut);
	let groupOut = GetCardGroups(arrCards);

	let nDeadwoodsScore: Array<number> = [];

	groupLeft.arrDeadwoods.sort();
	groupOut.arrDeadwoods.sort();

	if(groupLeft.arrDeadwoods.length === 0)
	{
		return {eCardFrom: GetCardFrom.LeftCards};
	}

	if(groupLeft.arrDeadwoods.length === 1)
	{
		return {eCardFrom: GetCardFrom.LeftCards};
	}

	nDeadwoodsScore[0] = 0;

	for(let i = groupLeft.arrDeadwoods.length - 1; i > 0; i--)
	{
		nDeadwoodsScore[0] += GetCardValue(groupLeft.arrDeadwoods[i - 1]);
	}

	if(groupOut.arrDeadwoods.length === 0)
	{
		return {eCardFrom: GetCardFrom.OutCards}
	}

	if(groupOut.arrDeadwoods.length === 1 && groupOut.arrDeadwoods[0] !== nCardOut)
	{
		return {eCardFrom: GetCardFrom.OutCards}
	}

	if(groupOut.arrDeadwoods.length === 1)
	{
		return {eCardFrom: GetCardFrom.LeftCards};
	}

	nDeadwoodsScore[1] = 0;
	
	if(groupOut.arrDeadwoods[groupOut.arrDeadwoods.length - 1] !== nCardOut)
	{
		groupOut.arrDeadwoods.pop();
	}
	else
	{
		groupOut.arrDeadwoods.splice(groupOut.arrDeadwoods.length - 2, 1);
	}

	for(let i = 0; i < groupOut.arrDeadwoods.length; i++)
	{
		nDeadwoodsScore[1] += GetCardValue(groupOut.arrDeadwoods[i]);
	}

	if(nDeadwoodsScore[0] > nDeadwoodsScore[1])
	{
		return {eCardFrom: GetCardFrom.OutCards};
	}
	else
	{
		return {eCardFrom: GetCardFrom.LeftCards};
	}
}




export {
	GetCardData,
	GetCardColor,
	GetCardType,
	GetCardValue,
	IsLine,
	IsSame,
	IsCardGroupValid,
	IsRunSetsValid,
	CardsGroupInfo,
	GetCardGroups,
	GetLayoffCards,
	FindGetCard
};