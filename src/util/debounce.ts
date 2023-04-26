export type DebounceDelay = {
  delay: number;
};

export function debounce<A extends unknown[], R>(fn: (...args: A) => R, options: DebounceDelay) {
  let timer: NodeJS.Timeout;
  return (...args: A): Promise<R> => {
    return new Promise((resolve) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        resolve(fn(...args));
      }, options.delay);
    });
  };
}
