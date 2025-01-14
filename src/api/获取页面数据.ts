import { http地址 } from "@/vue引入配置";
import { http请求 } from "./请求";
// import { useStore } from "vuex";
import store from '@/store/main'

// const store = useStore()

export async function 获取页面数据() {
  let res = await http请求(`${http地址}/api-device/device/status/${store.state.设备id}`, {}, { Authorization: `Bearer ${store.state.token}` })
  if (res.head.code != 200) {
    return
  }
  // // 获取ip 进行保存
  // let ip = res.data.properties['ip'].propertyValue
  // if (ip) {
  //   store.commit('set_state', {
  //     name: 'uuid',
  //     value: ip,
  //   });
  // }
  if (res.data.properties['QTInitStatus'].propertyValue) {
    let { data } = JSON.parse(res.data.properties['QTInitStatus'].propertyValue);
    console.log('初始化数据', data)
    // 初始化没有uuid
    store.commit('set_state', {
      name: '通信数据',
      value: { 类型: '初始化', data },
    });
  }
}