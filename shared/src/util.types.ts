export type Enum<T> = T[keyof T];

export namespace Common {
  export const LoadingStatus = {
    Pending: "pending",
    Loading: "loading",
    Success: "success",
    Error: "error",
  } as const;
  export type LoadingStatus = Enum<typeof LoadingStatus>;
}
