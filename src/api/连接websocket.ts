import { http请求 } from './请求'
import { http地址, stomp连接, websocket地址 } from '@/vue引入配置'
import { 消息 } from './消息'
// import { useStore } from "vuex";
import store from '@/store/main'

// const store = useStore()

export async function 连接websocket() {
  let res = await http请求(`${http地址}/api-auth/oauth/userinfo`, {}, { Authorization: `Bearer ${store.state.token}` })
  if (res.head.code != 200) {
    消息('无法获取用户信息', 'error')
    return
  }
  let 用户名: string = res.data.mqUser
  let 密码: string = res.data.mqPassword
  store.commit('set_state', { name: '用户名', value: 用户名 })
  store.commit('set_state', { name: '密码', value: 密码 })
  let 用户id: string = res.data.id
  let link: WebSocket = new WebSocket(`${websocket地址}`)
  let stomp_link = stomp连接.over(link)
  stomp_link.debug = null;
  stomp_link.connect(用户名, 密码, () => {
    stomp_link.subscribe(
      `/exchange/device-report/device-report.${store.state.设备id}`,
      (res2: any) => {
        let t = JSON.parse(res2.body);
        let { data } = JSON.parse(t.contents[0].attributes['QTSYNData']);
        console.log('通信', data);
        if (data.projectid === store.state.工程ID) {
          // 工程id对应才解析
          switch (data.type) {
            case 'btn':
              break;
            default:
              // senderip是本机uuid 不解析数据 说明是本机发下去的数据
              if (store.state.uuid == data.senderip) return;
              break;
          }
          store.commit('set_state', {
            name: '通信数据',
            value: { 类型: '更新', data },
          });
        }
      },
      { 'auto-delete': true }
    );
    stomp_link.subscribe(
      `/exchange/web-socket/tenant.user.${用户id}.#`,
      (res3: any) => {
        let data = JSON.parse(res3.body);
        // 0等待 1成功 2断开 3超时 4拒绝
        switch (data.replyType) {
          case 0:
            消息('等待连接', 'info');
            break;
          case 1:
            消息('连接成功');
            break;
          case 2:
            消息('断开连接', 'error');
            break;
          case 3:
            消息('连接超时', 'info');
            break;
          case 4:
            消息('连接被拒', 'error');
            break;
        }
      },
      { 'auto-delete': true }
    );
  }, () => {

  }, '/');
}