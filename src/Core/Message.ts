
//消息基础结构
export interface MessageHead
{
    nMainId:						number;							//消息主ID
    nSubId:							number;							//消息子ID
	data?:							any;
};
