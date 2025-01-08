// import { useStore } from "vuex";
import store from '@/store/main'

// const store = useStore()

export function 生成uuid(): string {
  // 基于 时间戳 和 随机数 组合生成
  // 时间戳 和 随机数 都用 toString(36) 转换成 36进制 字符串
  let 时间戳 = Date.now().toString(36);
  let 随机数 = Math.random().toString(36).substring(2, 11); // 截取一部分字符串即可
  let uuid = `${时间戳}-${随机数}`
  store.commit('set_state', {
    name: 'uuid',
    value: uuid
  })
  return uuid;
}