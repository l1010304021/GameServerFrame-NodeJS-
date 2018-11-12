import { LoadConfigure, GConfig, LoadJsonFile } from "./Core/GlobalConfig";
import { GGameEngine, ObjectClone, ObjectToString, GameRandom } from "./Core/GameEngine";
import { GetCardData, GetCardGroups, CardsGroupInfo, GetCardValue, GetLayoffCards } from "./FightServer/GinRummy/CardAnalyse";
import { CardType, CardColor } from "./FightServer/GinRummy/GameDefines";
import { InvalidChairId } from "./FightServer/GameCommon/GameInterfaces";
import { SubGame_GameEnd } from "./FightServer/GinRummy/GameCMD";

/*
 * 规范：
 *      1.每一个异步函数，都需要自行处理try catch 避免异常导致程序中止.
 * 
 * 
 * 
 */

export let GApplication: Application;


class Application
{
    private m_sWorkDirectory:                       string;             //工作目录
    private m_sAppName:                             string;             //应用名

    constructor()
    {
        GApplication = null;

        this.m_sAppName = null;

        this.m_sWorkDirectory = null;

        this.Initialize();
    }

    private Initialize()
    {
        this.m_sAppName = process.argv[2];

        if(this.m_sAppName === undefined || this.m_sAppName === null || this.m_sAppName === "") throw new Error("未指定应用程序名");

        this.m_sWorkDirectory = process.cwd() + "\\" + this.m_sAppName;

        process.chdir(this.m_sWorkDirectory);

		console.log("正在加载配置...");
        LoadConfigure();

        require("./" + this.m_sAppName + "/main").CreateGameEngine();

        GApplication = this;
    }


    Run()
    {
		/*
        process.on("uncaughtException", (error: Error) =>{
            console.log("Uncaught Exception:", error);
        });
		*/

		console.log("正在启动[", GConfig.ServerConfig.sName ,"]...");
        GGameEngine.Start();
    }

}


new Application();

GApplication.Run();


/*
let cardsA = [
	GetCardData(CardType.Card5, CardColor.Clubs),
	GetCardData(CardType.Card4, CardColor.Clubs),
	GetCardData(CardType.Card3, CardColor.Clubs),
	GetCardData(CardType.CardA, CardColor.Diamonds),
	GetCardData(CardType.Card8, CardColor.Clubs),
	GetCardData(CardType.Card9, CardColor.Clubs),
	GetCardData(CardType.CardK, CardColor.Diamonds),
	GetCardData(CardType.Card9, CardColor.Diamonds),
	GetCardData(CardType.Card4, CardColor.Diamonds),
	GetCardData(CardType.Card9, CardColor.Hearts)
];

let cardsB = [
	GetCardData(CardType.Card2, CardColor.Clubs),
	GetCardData(CardType.Card2, CardColor.Diamonds),
	GetCardData(CardType.Card2, CardColor.Hearts),
	GetCardData(CardType.Card2, CardColor.Spades),
	GetCardData(CardType.Card3, CardColor.Spades),
	GetCardData(CardType.Card4, CardColor.Spades),
	GetCardData(CardType.Card5, CardColor.Spades),
	GetCardData(CardType.Card5, CardColor.Diamonds),
	GetCardData(CardType.Card5, CardColor.Hearts),
];

let cardsC = [
	17,18,19,20,21,22,23,24,25,26,18
];

let pGroup = GetCardGroups(cardsA);

console.log(pGroup);


/*

let o = Object;
let oo = [];

let GCount = 10;

for(let i = 0; i < GCount; i++)
{
	oo[i] = ""+ GameRandom() + "" + i + "" + GameRandom() + "" + GameRandom();
	o[oo[i]] = false;
}

delete o[oo[4]];


for(let i in o)
{
	if(o.hasOwnProperty(i))
	{
		console.log(o[i]);
	}
}

let tmLast = process.uptime();
console.log(":", tmLast);

for(let i = 0; i < 10000; i++)
{
	o[oo[GameRandom() % GCount]] = true;
}

let tmCur = process.uptime();
console.log(":", tmCur);
console.log(":", tmCur - tmLast);




/*
let o = [];
o["111"] = 1;
o["aaa"] = 2;

console.log(typeof o);
console.log(o.length);



let cardsRunSets = [
	[
		GetCardData(CardType.CardA, CardColor.Spades),
		GetCardData(CardType.Card2, CardColor.Spades),
		GetCardData(CardType.Card3, CardColor.Spades),
		GetCardData(CardType.Card4, CardColor.Spades),
	],
	[
		GetCardData(CardType.CardA, CardColor.Clubs),
		GetCardData(CardType.Card2, CardColor.Clubs),
		GetCardData(CardType.Card3, CardColor.Clubs),
		GetCardData(CardType.Card4, CardColor.Clubs),
		GetCardData(CardType.Card5, CardColor.Clubs)
	]
];


let cardsRunSets = [
	[
		20,36,52,68
	],
	[
		21,69,53
	],
	[
		26,58,42
	]
];

let cardsDeadwoods = [
	72,37,74,44,50,39,71,
];

let cardsLayoff = [];

GetLayoffCards(cardsRunSets, cardsDeadwoods, cardsLayoff);

console.log(cardsRunSets);
console.log(cardsDeadwoods);
console.log(cardsLayoff);

/*
let x = "djsfkljdlsjfljasfljasfjlasdfjlasjfljasdf";
let y = x;
x = "123213213213213213213123213";

console.log(x);
console.log(y);

/*
const sTestString = "https://docs.google.com/document/d/1Bd2wWE6oE0Fx6GGO8M2gns2dYm188r9qU8UwKLL2yWM/edit#";

const sPhotoEncode = Buffer.from(sTestString).toString('base64');
const sPhotoEncode1 = Buffer.from(sPhotoEncode, "base64").toString();
const sPhotoEncodeA = Buffer.from(sTestString).toString('hex');
const sPhotoEncodeB = Buffer.from(sPhotoEncodeA, "hex").toString('utf-8');

console.log(sPhotoEncode);
console.log(sPhotoEncode1);
console.log(sPhotoEncodeA);
console.log(sPhotoEncodeB);

/*
let cardsConfig = LoadJsonFile("./GinRummy/cardsconfig.json");

if(cardsConfig.cards !== undefined)
{
	//nCards = cardsConfig.cards;
}

/*


/*
let cardsA = [
	GetCardData(CardType.Card5, CardColor.Clubs),
	GetCardData(CardType.Card4, CardColor.Clubs),
	GetCardData(CardType.Card3, CardColor.Clubs),
	GetCardData(CardType.CardA, CardColor.Diamonds),
	GetCardData(CardType.Card8, CardColor.Clubs),
	GetCardData(CardType.Card9, CardColor.Clubs),
	GetCardData(CardType.CardK, CardColor.Diamonds),
	GetCardData(CardType.Card9, CardColor.Diamonds),
	GetCardData(CardType.Card4, CardColor.Diamonds),
	GetCardData(CardType.Card9, CardColor.Hearts)
];

let cardsB = [
	GetCardData(CardType.Card2, CardColor.Clubs),
	GetCardData(CardType.Card4, CardColor.Clubs),
	GetCardData(CardType.Card3, CardColor.Clubs),
	GetCardData(CardType.Card4, CardColor.Diamonds),
	GetCardData(CardType.Card8, CardColor.Clubs),
	GetCardData(CardType.Card8, CardColor.Clubs),
	GetCardData(CardType.Card3, CardColor.Diamonds),
	GetCardData(CardType.Card8, CardColor.Diamonds),
	GetCardData(CardType.Card4, CardColor.Diamonds),
	GetCardData(CardType.Card8, CardColor.Hearts)
];

const pGinDatas: Array<CardsGroupInfo> = [];

pGinDatas[0] = GetCardGroups(cardsA);
pGinDatas[1] = GetCardGroups(cardsB);

OnGameGin(pGinDatas, 0, false);

function OnGameGin(pGinsData: Array<CardsGroupInfo>, nGinChairId: number, bBigGin: boolean)
{
	let nScores: Array<number> = [];
	let nScoresGet: Array<number> = [];

	//check layoff.
		
	for(let i = 0; i < 2; i++)
	{
		nScores[i] = 0;

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

	nScoresGet[nGinChairId] = 0;

	let bUndercut = false;
	let bGin = false;

	for(let i = 0; i < 2; i++)
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
						nScoresGet[i] += 25;
					}

					bGin = true;
				}

				nScoresGet[nGinChairId] += (nScores[i] - nScores[nGinChairId]);
			}
			else
			{
				bUndercut = true;

				nScoresGet[i] += 25;
				nScoresGet[i] += (nScores[nGinChairId] - nScores[i]);

				nScoresGet[nGinChairId] -= nScoresGet[i];
			}
		}
	}

	let nTotalScore = [];

	for(let i = 0; i < 2; i++)
	{
		nTotalScore[i] = 0;

		if(nScoresGet[i] > 0)
		{
			nTotalScore[i] += nScoresGet[i];
		}
		else
		{
			nScoresGet[i] = 0;
		}
	}

	let pGameEnd: SubGame_GameEnd = {
		nCardLayoff: [],
		userGameEndInfo: [],
		bBigGin: bBigGin,
		bGin: bGin,
		bUndercut: bUndercut
	};
				
	for(let i = 0; i < 2; i++)
	{
		pGameEnd.userGameEndInfo[i] = {
			nUserId: i,
			nChairId: i,
			nScore: nScoresGet[i],
			nScoreTotal: nTotalScore[i],
			nRunSetCards: pGinsData[i].arrRunSets,
			nDeadwoodCards: pGinsData[i].arrDeadwoods
		}
	}

	console.log(pGameEnd);
}

/*

let i = [];

i[1000000000] = "12321312";
i[999999999] = "123123";
i[8888] = "aaaaaa";
i[999999999] = undefined;

let tmLast = process.uptime();
console.log(":", tmLast);

i.every((val, idx, array) => {
    // val: 当前值
    // idx：当前index
    // array: Array
	console.log(val);

	return true;
});

/*
for(let entry of i)
{
	console.log(entry);
}
*/
/*
let tmCur = process.uptime();
console.log(":", tmCur);
console.log(":", tmCur - tmLast);



/*
class tempt
{
    private m_sUserName:                                string;
    private m_sUserPhoto:                               string;
    private m_sUserId:                                  string;


    constructor(nTemp: number)
    {
        this.m_sUserId = "123456789012345" + nTemp +"6789012345678901";
        this.m_sUserPhoto = "12345678901234567890123" + nTemp + "4567890123456789012345678901234567890123456789" + nTemp + "0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567" + nTemp + "89012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234" + nTemp + "5678901234567890123456789012345678901234567890";
        this.m_sUserName = "12345678" + nTemp + "901234567890" + nTemp + "12345678901";
    }

	public ttt()
	{
		return "hello";
	}
}

let d = new tempt(0);

let x = "1231313123";
let y = {};
let z = new Date();

console.log( typeof x);
console.log( typeof y);
console.log( typeof z);
console.log( typeof d);

let m = ObjectClone(d);

console.log(JSON.stringify(m));


/*


let x = [];

x[999999999] = 1;


let tmLast = process.uptime();
console.log(":", tmLast);


for(let i = 0; i < 99999; i++)
{
    let j = x[i];
}

let tmCur = process.uptime();
console.log(":", tmCur);
console.log(":", tmCur - tmLast);

/*
for(let i = 0; i < 1000000; i++)
{
    x[i] = new tempt(i);
}

setTimeout(() =>
{
    console.log(x[100]);
},100000)

/*

import * as WebSocket from "ws";




var wss = new WebSocket.Server({
    port: 8888,
    host: '127.0.0.1'
}, function () {
    console.log("Now Server Listen On 3000");


    const ws = new WebSocket("ws://127.0.0.1:8888/");

    ws.on("open", ()=>{
        console.log("on connected");
    });

    ws.on("error", (err: Error)=>{
        console.log("on error:", err);
    });
});

wss.on('connection', function (socket) {
   
    socket.close(1, "server is busy");
    socket.on('close', (code, reason) =>{
        console.log("onclose", code, reason);
    });

    socket.on('error', () =>{
        console.log("onerror");
    });

    socket.on('message', () =>{
        console.log("onmessage");
    });
});

wss.on('error', function (e) {
    console.log("wss error", e);
});



/*

interface xxxxxxx
{
    x: number,
    y: number
};

let o: xxxxxxx = {
    x: 1,
    y: 2
};

let nCount = 0;

function tf()
{
    nCount++;
    console.log(process.uptime(), " ", nCount);
    
    process.nextTick(tf);
}

process.nextTick(tf);


function xxx(): Promise<void>
{
    return new Promise<void>((resolve, reject)=>{
        setTimeout(()=>{
            throw new Error("jdasfjasf");
            resolve()
        }, 2000);
    });
}

async function ttt()
{
    try
    {
        await xxx();
    }
    catch(e)
    {
        console.log(3);
    }
}
//ttt();



/*



var config = {
            user: 'sa',
            password: 'Test789456123',
            server: 'localhost',
            database: 'GameDB',
            port: 1433,
            options: {
                encrypt: false
            },
            pool: {
                min: 1,
                max: 1,
                idleTimeoutMillis: 15000
            }
        };

import * as mssql from "mssql";

new mssql.ConnectionPool(config).connect().then(pool => {

    console.log(pool.connected);

    let req = pool.request();

    req.parameters = {};
    req.input("Id", mssql.Int, 20002);
    req.input("Name", mssql.NVarChar(32), "TestName");

    req.execute("DBTest").then((ret: mssql.IProcedureResult<any>)=>{

        console.log(ret.recordset);
        console.log(ret.recordset.length);
        console.log(ret.recordsets);
        console.log(ret.recordsets.length);
        console.log(ret.returnValue);

        
    }).catch((err) =>{
        console.log(err);
    });

    //return pool.query`select COUNT(1) as n from TB_ADMINS  where  userName =${userName }`;
  })/*.then(result => {
    let n = result.recordset[0].n;
    console.log("hello");
  }).catch(err => {
    console.log("hello world", err);
  })















/*


import * as WebSocket from "ws";

//function ObjectToString(obj) {
//    try {
//        return JSON.stringify(obj);
//    }
//    catch (e) {
//        return util.inspect(obj, { depth: null });
//    }
//}

class TestObj
{
    public m_id:number;
    public m_name: string;

    public m_next: TestObj;
    public m_prev: TestObj;

    constructor(nId, sName)
    {
        this.m_id = nId;
        this.m_name = sName;
    }

    public GetId()
    {
        return {id: this.m_id, name: this.m_name};
    }
}

/*

var wss = new WebSocket.Server({
    port: 3000,
    host: '127.0.0.1'
}, function () {
    console.log("Now Server Listen On 3000");
});

var socketsArray = [];

wss.on('connection', function (socket) {
    socketsArray.push(socket);
    console.log("new client comming!", socket._socket.address().address);

    var socketIndex = socketsArray.indexOf(socket);

    socket.on('disconnect', function () {
        socketsArray.splice(socketIndex, 1);
    });
});

wss.on('error', function (e) {
});

var gValue = 1;

var bRun = false;

function xxx() {
    if (bRun) return;

    bRun = true;

    var dDateTime = new Date("1970-01-02 00:00:00");

    var year = dDateTime.getFullYear();
    var month = dDateTime.getMonth() + 1;
    var date = dDateTime.getDate();
    var hour = dDateTime.getHours();
    var minute = dDateTime.getMinutes();
    var second = dDateTime.getSeconds();

    console.log("Y:" + year.toString() + " M:" + month + " D:" + date + " H:" + hour + " M:" + minute + " S:" + second);
}

//数据广播进程:每1秒钟广播一次
setInterval(function () {
    xxx();

    //如果没有正在连接的socket，直接返回；
    if (socketsArray.length <= 0) return;

    var trends = "server send" + gValue++;

    for (var i in socketsArray) {
        socketsArray[i].emit('trends', trends);
    }
}, 1000);

*/
/*

let gx = [];

gx["" + 0] = new TestObj(0, "xxx" + 0);
gx["" + 0].m_prev = gx["" + 0];
gx["" + 0].m_next = gx["" + 0];

/*
for(let i = 1; i < 10000000; i++)
{
    gx["" + i] = new TestObj(i, "xxx"+ i);
}

let tmLast = process.uptime();
console.log(":", tmLast);


for(let i = 5000000; i < 5010000; i++)
{
    let obj = gx["" + i];

    //gx.splice(i, 1);
}

let tmCur = process.uptime();
console.log(":", tmCur);
console.log(":", tmCur - tmLast);
*/
/*

var config = {
            user: 'sa',
            password: 'Test789456123',
            server: 'localhost',
            database: 'GameDB',
            port: 1433,
            options: {
                encrypt: false
            },
            pool: {
                min: 1,
                max: 1,
                idleTimeoutMillis: 15000
            }
        };

import * as mssql from "mssql";
import { setTimeout } from "timers";
/*
let pool = new mssql.ConnectionPool(config, (err)=>{
    console.log("djsfjasdkfasd1");
});

pool.on('error', err => {
    // ... error handler
    console.log("djsfjasdkfasd2");
})

console.log("djsfjasdkfasd3");

pool.connect();

console.log("djsfjasdkfasd4");

while(true)
{

}
*/
/*
let pool = new mssql.ConnectionPool(config);
let req = pool.request();

req.input("Id", 1);

req.execute("DBTest").then((ret: mssql.IProcedureResult<any>)=>{
    console.log("hello");
}).catch((err) =>{
    console.log(err);
});*/
/*
let conn = [];

for(let i = 0; i < 15; i++)
{
    conn[i] = new mssql.ConnectionPool(config);
    console.log("isConnected:", conn[i].connected);
    conn[i].id = i;
}



console.log(conn[0] === conn[1]);
console.log(conn[0] === conn[2]);
console.log(conn[0] === conn[3]);
console.log(conn[0] === conn[4]);
console.log(conn[0] === conn[5]);
console.log(conn[0] === conn[6]);
console.log(conn[0] === conn[7]);

console.log(conn[2] === conn[1]);
console.log(conn[3] === conn[2]);
console.log(conn[4] === conn[3]);
console.log(conn[5] === conn[4]);
console.log(conn[6] === conn[5]);
console.log(conn[7] === conn[6]);
console.log(conn[8] === conn[7]);

let req: Array<mssql.Request> = [];

for(let i = 0; i < 15; i++)
{
    conn[i%15].connect().then((pool)=>{
        console.log("connected!", pool.id);
        req[i%15] = pool.request() as mssql.Request;
        req[i%15].input("Id", 1);
    }).catch((err)=>{
        console.log(err);
    });
}



setTimeout(xxx, 1000);

let i = 10000;

function xxx()
{
    //console.log(req[0].parameters);

    //req[0].input("Id", 1);
    req[0].parameters = {};
    req[0].input("Id", mssql.Int, i);
    req[0].input("Name", /*mssql.NVarChar(32), "TestName" + i);
    i++;
    console.log(req[0].parameters);
    
    req[0].execute("DBTest").then((ret: mssql.IProcedureResult<any>)=>{

        console.log(ret.recordset);
        console.log(ret.recordsets);
        console.log(ret.returnValue);

        setTimeout(xxx, 1000);
    }).catch((err) =>{
        console.log(err);
    });
}




/*
function create()
{
    if(i >= 15) return;

    setTimeout(()=>{
        
    }, 500);
}


/*
new mssql.ConnectionPool(config).connect().then(pool => {

    console.log(pool.connected);

    let req = pool.request();
    req.input("Id", 1);
    req.execute("DBTest").then((ret: mssql.IProcedureResult<any>)=>{
        console.log("hello");
    }).catch((err) =>{
        console.log(err);
    });
    
    let userName="test";

    //return pool.query`select COUNT(1) as n from TB_ADMINS  where  userName =${userName }`;
  })/*.then(result => {
    let n = result.recordset[0].n;
    console.log("hello");
  }).catch(err => {
    console.log("hello world", err);
  })
  */