interface http请求参数 {
  // get请求
  (url: string): Promise<any>;
  (url: string, query: object): Promise<any>;
  (url: string, query: object, 认证: object): Promise<any>;
  (url: string, query: object, 认证: object, 回调方法: Function): Promise<any>;
  // 其他类型请求
  (url: string, method: string, body: object): Promise<any>
  (url: string, method: string, body: object, 认证: object): Promise<any>
  (url: string, method: string, body: object, 认证: object, 回调方法: Function): Promise<any>
}
// 要用 重载 必须用这种形式 先声明变量 再赋值函数
export const http请求: http请求参数 = function (param1: string, param2?: object | string, param3?: object, param4?: object | Function, param5?: Function): Promise<any> {
  let options: any = {}
  let 回调方法: Function[] = []
  if (typeof param2 === 'string') {
    options['method'] = param2
    options['body'] = JSON.stringify(param3 || {})
    let headers = {
      // 有 body 时不能省略
      'Content-Type': 'application/json',
    }
    if (param4 && typeof param4 === 'object') {
      headers = { ...headers, ...param4 }
    }
    options['headers'] = headers
    if (param5 && typeof param5 === 'function') {
      try {
        回调方法 = [param5]
      } catch (error) {
        console.log('http请求回调err', error)
      }
    }
  } else {
    options['method'] = 'get'
    if (param2 && typeof param2 === 'object') {
      let queue = Object.entries(param2)
      queue.length && (param1 += '?')
      while (queue.length) {
        if (queue.length > 1) {
          let [key, value] = queue.shift() as string[]
          param1 += `${key}=${value}&`
        } else {
          let [key, value] = queue.shift() as string[]
          param1 += `${key}=${value}`
        }
      }
    }
    if (param3 && typeof param3 === 'object') {
      options['headers'] = {
        'Content-Type': 'application/json',
        ...param3
      }
    }
    if (param4 && typeof param4 === 'function') {
      try {
        回调方法 = [param4]
      } catch (error) {
        console.log('http请求回调err', error)
      }
    }
  }
  let p = fetch(param1, options).then(res => res.json())
  for (let fn of 回调方法) {
    p = p.then((res: any) => {
      return fn(res)
    })
  }
  return p.catch(err => { console.log('http请求err', err, param1, options) })
}
