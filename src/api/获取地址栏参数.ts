export function 获取地址栏参数() {
  let query参数: string[] = location.search.substring(1).split('&')
  console.log('地址栏参数', query参数)
  return query参数.map((e: string) => {
    let t = e.split('=')
    return {
      key: t[0],
      value: t[1]
    }
  })
}