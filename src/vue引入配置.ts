// 注意 TS中使用全局引入的变量 需 声明 名称 及 类型
// declare const 运维配置IP: string
declare const 我是接口地址: string
declare const 我是websocket地址: string
declare const Stomp: any

// 注意！/配置.js 已经在 index.html 中引入 因此 配置.js 中的变量已经声明为 全局变量
// 此处 export const 不能！再声明 同名变量 会 覆盖同名全局变量
// 且报 使用前需声明 的错误
// export const IP = 运维配置IP;
// let reg = /http[s]?:\/\/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/
// let r: any = location.href.match(reg)
// let url: string = 'http://localhost'
// if (r) {
//   url = r[0]
// }
export const http地址 = `${我是接口地址}`;
// export const http地址 = '';

export const websocket地址 = `${我是websocket地址}`;
// export const websocket地址 = ``;

export const stomp连接 = Stomp
// export const stomp连接: any = { over: () => { } }