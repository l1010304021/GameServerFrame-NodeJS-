
export enum WSCloseReason
{
    NormalClose                                 = 0x1000,                           //正常关闭，没有原因
    HeartBeat                                   = 0x1001,                           //心跳超时关闭
    ServerIsFull                                = 0x1002,                           //服务器已满
    PackageLarge                                = 0x1003,                           //数据包太大
};