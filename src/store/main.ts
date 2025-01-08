import { createStore } from "vuex"
import { http请求 } from "@/api/请求"

interface State {
  [key: string]: any, // 允许其他任意属性的写法
}
interface Set_state {
  name: string,
  value: number
}
export type {
  State,
  Set_state,
}

// 枚举类型
export enum 功能 {
  // 下发按钮矩阵值 = '112',
  切换轮播图 = '124',
  控制窗帘 = '101'
}

export default createStore({
  state() {
    return {
      视窗宽度: 1,
      面板宽度: 1,
      视窗高度: 1,
      面板高度: 1,
      当前主页面: '', // 因为任意层级可以跳转主页面 因此设成全局属性
      通信数据: null,
      组件树: [],
      加载: false,
      工程ID: '',
      依赖数据: [], // 联动的组件数据存放在这
      用户名: '',
      密码: '',
      uuid: '',
      token: '',
      设备id: ''
    }
  },
  mutations: {
    set_state(state: State, args: Set_state): void {
      state[args.name] = args.value
    },
    获取主页面(state: State, name: string) {
      let t = state.组件树?.find((e: any) => e.pagename === name);
      // 保存当前面板宽度
      if (t) {
        state.面板宽度 = t.width
        state.面板高度 = t.height
        state.当前主页面 = t.pagename
      }
    },
    组件数据初始化(state: State, source) {// _占位符 表示该位置参数被忽略
      // 用层序遍历思路
      let result = [] // 结果数组
      let queue = [] // 辅助队列
      let 需要收集的组件 = []
      // 先将源数据中主页面装入队列
      for (let 页面 of source) {
        if (页面.ismainpage) {
          queue.push(页面)
          result.push(页面)
        }
        // 直接在 页面初始化 时将依赖数据收集好 免得组件异步初始化时
        // 不能及时收集到联动组件依赖的数据
        for (let 组件 of 页面.data) {
          switch (组件.property) {
            case 3:
              // 按钮 查看Data中是否有值
              if (组件.Data.length) {
                let t = 组件.Data.split(';')
                //#region
                // if (t[0] == 功能.下发按钮矩阵值) {
                //   // 说明依赖于矩阵组件的值 需要将对应组件添加到依赖
                //   // 根据找对应ID的多个组件
                //   需要收集的组件.find((e: any) => e.id == t[1]) == undefined && 需要收集的组件.push({
                //     条件类型: 'DeviceId-按钮矩阵',
                //     目标组件类型: 18,
                //     id: t[1],
                //     采集者: 组件.name,
                //     采集者所在页面: 页面.pagename
                //   })
                // } else
                //#endregion
                if (t[0] == 功能.切换轮播图) {
                  // 使用场景 多对一 因此根据目标组件去重
                  需要收集的组件.find((e: any) => e.目标页面 == t[1] && e.目标组件 == t[2]) == undefined && 需要收集的组件.push({
                    条件类型: '页面和组件-轮播',
                    目标组件类型: 26,
                    目标页面: t[1],
                    目标组件: t[2],
                  })
                }
              }
              break;
            case 7:
              // 滑块 看值是否共享给其他组件
              if (组件.device.length) {
                let t = 组件.device.split(';')
                if (t[0] == 功能.控制窗帘) {
                  // 控制窗帘 使用场景只考虑一对一 所以用同一目标组件去重
                  需要收集的组件.find((e: any) => e.目标页面 == t[1] && e.目标组件 == t[2]) == undefined && 需要收集的组件.push({
                    条件类型: '页面和组件-滑块窗帘',
                    目标组件类型: 7,
                    目标页面: t[1],
                    目标组件: t[2],
                    组件名: 组件.name,
                    页面名: 页面.pagename,
                  })
                }
              }
              break
          }
        }
      }
      for (let 目标 of 需要收集的组件) {
        for (let 页面 of source) {
          for (let 组件 of 页面.data) {
            if (目标.目标组件类型 == 组件.property) {
              // 是对应要添加的组件类型 根据不同类型匹配字段
              switch (目标.条件类型) {
                //#region
                // case 'DeviceId-按钮矩阵':
                //   if (目标.id == 组件.DeviceId) {
                //     // 一对多 将符合的组件全部加入依赖
                //     state.依赖数据.push({
                //       // 矩阵根据组件和页面定位依赖 存自身值
                //       组件名: 组件.name,
                //       页面名: 页面.pagename,
                //       激活序列: [],
                //       是否为输入端: 组件.IsIput,
                //       // 按钮下发指令时 根据这两个字段定位依赖 下发一或多个值
                //       采集者: 目标.采集者,
                //       采集者所在页面: 目标.采集者所在页面
                //     })
                //   }
                //   break;
                //#endregion
                case '页面和组件-滑块窗帘':
                  if (目标.组件名 == 组件.name && 目标.页面名 == 页面.pagename) {
                    // 根据使用场景 只存一个符合的组件
                    state.依赖数据.push({
                      // 滑块根据组件和页面 定义依赖 修改依赖值
                      组件名: 组件.name,
                      页面名: 页面.pagename,
                      最小值: 组件.SliderMin,
                      最大值: 组件.SliderMax,
                      值: 组件.SliderMin,
                      // 窗帘根据目标组件和页面 匹配自身 读取依赖值
                      目标页面: 目标.目标页面,
                      目标组件: 目标.目标组件,
                    })
                  }
                  break
                case '页面和组件-轮播':
                  if (目标.目标组件 == 组件.name && 目标.目标页面 == 页面.pagename) {
                    // 将轮播组件自身添加到依赖 在按钮下发指令时定位依赖
                    // 根据类型修改依赖值 从而改变轮播图
                    state.依赖数据.push({
                      // 按钮下发指令时 根据这两个字段 定位修改哪个依赖值
                      组件名: 组件.name,
                      页面名: 页面.pagename,
                      当前显示: 0, // 默认从第一张开始
                      // 控制按钮需要知道有几张图 增加到末尾时要停滞
                      total: 组件.loopmode == '图片循环' ? 组件.MutiPicturenames.length : 组件.MutiFontname.length,
                    })
                  }
                  break
              }
            }
          }
        }
      }
      console.log('收集的依赖', state.依赖数据)
      // 队列不为空 则一直循环
      while (queue.length) {
        // 出队列 将结果装入结果数组 并讲下一层节点添加到队列
        let node = queue.shift() // 从头部出队列 在尾部添加新元素
        for (let val of node.data || []) {
          if (val.RectText === "PAGECONTAINER") {
            for (let val2 of source) {
              if (val.ShowPage === val2.pagename) {
                // val = { ...val, ...val2 } // 将属性拼在一起 并保留data组件索引
                // 不能用 val = {...} 因为赋了新的对象地址 node.data中的该对象就与新的val没有关系了
                // 所以得在原对象上修改
                val['grondcolor'] = val2.grondcolor
                val['pagename'] = val2.pagename // 区分普通组件和容器
                val['data'] = val2.data || [] // 这里要保留data数组索引
              }
            }
            queue.push(val) // 将新构造的对象装入队列 作为下一层节点
          }
        }
      }
      state.组件树 = result
      console.log('组件树', JSON.parse(JSON.stringify(result)))
    }
  },
  actions: {
    async 获取界面(context: any) {
      // 优先读取本地文件
      context.commit('set_state', { name: '加载', value: true });
      let 页面数据 = await http请求('./config/config.json')
      !页面数据 && (页面数据 = { projectid: '', data: [] })
      console.log('获取界面', 页面数据)
      context.commit('set_state', { name: '工程ID', value: 页面数据.projectid })
      // 如果有登录控件 则删除首页 并设置当前页为登录跳转页
      // 如果没有登录控件 则不执行操作
      let 首页 = 0
      for (let page of 页面数据.data) {
        if (page.pagename == '首页') {
          break
        }
        首页++
      }
      let 登录控件 = 页面数据.data[首页].data.find((e: any) => e.property == 22)
      if (登录控件) {
        // 存在登录控件 则将新默认页 保存起来
        context.commit('set_state', { name: '当前主页面', value: 登录控件.JumpToPage });
        // 然后从数据中删除 首页
        页面数据.data.splice(首页, 1)
      }
      context.commit('组件数据初始化', 页面数据.data)
      context.commit('set_state', { name: '加载', value: false });

      // context.commit('组件数据初始化', [{
      //   "grondcolor": "#f0f0f0",
      //   "height": 1080,
      //   "ismainpage": true,
      //   "ismove": true,
      //   "pageid": "1735205118",
      //   "pagename": "首页",
      //   "property": 0,
      //   "showtime": 0,
      //   "width": 1920,
      //   data: []
      // }])
    }
  },
  getters: {
    缩放比(state: State): object {
      // console.log('计算缩放比例', state.视窗宽度, state.面板宽度)
      let w = Math.round((state.视窗宽度 / state.面板宽度) * 100) / 100
      let h = Math.round((state.视窗高度 / state.面板高度) * 100) / 100
      return {
        宽度比: w,
        高度比: h
      }
    }
  },
})