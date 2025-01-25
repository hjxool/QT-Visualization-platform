// useStore只能在组件中调用 它是个钩子函数 因此无法在js/ts中使用
// import { useStore } from "vuex";
// 直接导入仓库使用
import store from '@/store/main'
import { http请求 } from "./请求";
import { http地址 } from "@/vue引入配置";

interface 指令参数 {
  组件名: string;
  页面名: string;
  [key: string]: any;
}
export type { 指令参数 };

// const store = useStore()

export function 发送指令(args: 指令参数) {
  // 接收 对象 对象中必须有 类型 组件名 页面名 以及 其他任意字段
  let order: any = {
    senderip: store.state.uuid,
    Username: store.state.用户名,
    Password: store.state.密码,
    cmd_type: 'ControlCommand',
    projectid: store.state.工程id,
    rectname: args.组件名,
    pagename: args.页面名,
    value: '',
    ispress: args.ispress,
    type: args.type,
    matrixvalues: [],
    sliderid: ''
  };
  // args.data中可能有与order相同的字段 会进行覆盖
  let body = {
    data: { ...order, ...args.data },
  };
  console.log('发送指令', body)
  return http请求(`${http地址}/api-device/device/panel/operation/8`, 'put', {
    contentType: 0,
    deviceId: store.state.设备id,
    attributeMap: {
      QTSYNData: JSON.stringify(body)
    }
  }, { Authorization: `Bearer ${store.state.token}` })
}