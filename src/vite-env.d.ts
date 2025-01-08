/// <reference types="vite/client" />
// 声明 .vue类型文件 是模块
declare module '*.vue' {
  // 引入DefineComponent类
  import { DefineComponent } from "vue";
  // 声明常量component 类型 为 DefineComponent类
  // 泛型 指定DefineComponent类传入参数类型分别为 {} {} 任意
  const component: DefineComponent<{}, {}, any>
  // 将 component 作为默认导出
  // 使得 TS 项目中导入 .vue 文件时能够正确识别其类型
  export default component
}