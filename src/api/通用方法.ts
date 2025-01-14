export function 节流(fn: Function, delay: number) {
  let timer = false;
  return function (...args: any[]) {
    if (timer) {
      return;
    }
    timer = true;
    fn(...args); // 移到setTimeout外 立即执行
    setTimeout(() => {
      timer = false;
    }, delay);
  };
}