interface IBaseFluidModel<T> {
  subscribe(id: string): any; //TODO subscribe需要在确定
  unsubscribe(id: string): void;
  apply(op: T): void;
  fetch(): any;
}

export { IBaseFluidModel };
