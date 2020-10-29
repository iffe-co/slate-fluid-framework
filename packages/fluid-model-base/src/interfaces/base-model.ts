import { Operation } from 'slate';

interface IBaseFluidModel<T> {
  subscribe(callback: (ops: Operation[]) => void): any;
  unsubscribe(id: string): void;
  apply(op: T[]): void;
  fetch(): any;
}

export { IBaseFluidModel };
