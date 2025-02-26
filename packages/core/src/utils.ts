export const isBrowser = () => typeof document !== "undefined";

export const assertCallbackType = (cb: unknown, message: string) => {
  if (typeof cb !== "function") {
    throw new TypeError(`ClientSocketManager: ${message}`);
  }

  return true;
};

export const warnDisposedClient = (isDisposed: boolean) => {
  if (!isDisposed) return;

  // eslint-disable-next-line no-console
  console.warn(
    [
      "ClientSocketManager: Attempted to use a disposed client.",
      "Please reassign the client with a new instance.",
    ].join(" "),
  );
};
