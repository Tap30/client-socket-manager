export const isBrowser = () => typeof document !== "undefined";

export const assertCallbackType = (cb: unknown, message: string) => {
  if (typeof cb !== "function") throw new TypeError(message);

  return true;
};
