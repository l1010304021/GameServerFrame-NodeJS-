import * as crypto from "crypto";
import { GConfig } from "../Core/GlobalConfig";


const Base64AddPadding = function(sEncoded: string): string
{
    return sEncoded + Array((4 - sEncoded.length % 4) % 4 + 1).join('=');
}

function CheckSignatureValid(sUID: string, sSignature: string, sAppSecret: string): string
{
    if(sSignature === undefined || sSignature === null || sSignature === "")
    {
        return "Null or Empty Facebook Signature."
    }

    //将Signature分割 Facebook Signature以 '.' 分隔
    const arrParts: Array<string> = sSignature.split(".");

    if (arrParts.length !== 2) {
        return "Invalid Facebook Signature."
    }

    //第一部分为Encoded Signature. 以base64url编码
    const sEncodedSignature: string = arrParts[0];
    //第二部分为Response Payload. 以base64url编码
    const sResponsePayload: string = arrParts[1];

    //将Encoded Signature 解码为Buffer结构，并且返回Hex字符串.
    const sHexSignature: string = Buffer.from(Base64AddPadding(sEncodedSignature), "base64").toString("hex");

    //将Response Payload以SHA256编码
    const hmac: crypto.Hmac = crypto.createHmac("sha256", sAppSecret);
    hmac.update(sResponsePayload);
    //编码完成输出Hex字符串
    const sEncodedResponsePayload = hmac.digest("hex");

    //比较第一部分与第二部分是否一致，第一部分为第二部分经过SHA256编码后的结果。
    if (sHexSignature !== sEncodedResponsePayload) {
        return "Signature Is Not Correct.";
    }

    //将第二部分以Base64解码为Buffer结构，并且返回Ascii字符串。
    const sAsciiResponsePayload: string = Buffer.from(Base64AddPadding(sResponsePayload), "base64").toString('ascii');

    //转换为Object.结构为：
    //          algorithm
    //          issued_at
    //          player_id
    //          request_payload

    const oPayload: any = JSON.parse(sAsciiResponsePayload);

    if (sUID !== oPayload.player_id) {
        return "Player ID Is Not Match to Response Payload."
    }

    return "";
}

function CheckUserSignature(sAccount: string, sSignature: string): boolean
{
    //如果是测试AccessToken，那么直接通过，注意，这里只能在测试时使用，正式上线这段代码必须去掉。
    if(sSignature === "signed.test")
    {
        return true;
    }

    //检查AccessToken是否有效。
    const sResult: string = CheckSignatureValid(sAccount, sSignature, GConfig.ServerConfig.sSecretKey);

    if(sResult === "")
    {
        return true;
    }

	console.log("玩家", sAccount, ":",sSignature," 校验错误：", sResult);

	return false;
}

export {
    CheckUserSignature
};