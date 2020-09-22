import { IOperation } from './operations';

interface IBaseFluidModel {
  subscribe(id: string): any; //TODO subscribe需要在确定
  unsubscribe(id: string): void;
  apply<T extends IOperation>(op: T): void;
}

export { IBaseFluidModel };
