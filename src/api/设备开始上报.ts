import { http地址 } from "@/vue引入配置";
import { http请求 } from "./请求";
// import { useStore } from "vuex";
import store from '@/store/main'

// const store = useStore()

export function 设备开始上报() {
  return http请求(`${http地址}/api-device/device/panel/switch/${store.state.设备id}`, 'put', {}, { Authorization: `Bearer ${store.state.token}` })
}