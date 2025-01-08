// 因为是在main.ts中引入 因此是应用全局样式
import './style.less';
import { createApp } from "vue"; // 引入 createApp 方法
import element from 'element-plus'; // 引入 elementUI
import 'element-plus/dist/index.css'; // 引入 elementUI 样式文件
import App from './App.vue'; // 引入 根组件
import store from '@/store/main' // 引入Vuex仓库

// 根据根组件 创建app实例
const app = createApp(App)
app.use(element) // 全局应用elementUI
app.use(store) // 应用Vuex仓库配置
// 挂载到 index.html门户页 的 <div id="app"></div>根元素 上
app.mount('#app')