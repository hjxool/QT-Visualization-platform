import { ElMessage } from 'element-plus';
import type { MessageOptions } from 'element-plus'

type 消息类型 = 'success' | 'error' | 'warning' | 'info'
// 消息类型 必传 不传默认为success
export function 消息(msg: string, 消息类型: 消息类型 = 'success'): void {
  let options: MessageOptions = {
    message: msg,
    // elementUI中 type声明的类型不是string 而是基础类型别名
    type: 消息类型,
    center: true,
    showClose: true,
    duration: 5000,
    grouping: true,
  }
  ElMessage(options)
}
