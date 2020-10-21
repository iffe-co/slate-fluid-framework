import { Operation } from 'slate';

interface IBaseFluidModel<T> {
  subscribe(callback: (ops: Operation[]) => void): any; //TODO subscribe需要在确定
  unsubscribe(id: string): void;
  apply(op: T[]): void;
  fetch(): any;
}

export { IBaseFluidModel };
