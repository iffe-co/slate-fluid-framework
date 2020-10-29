import { DataObject } from '@fluidframework/aqueduct';
import { IBaseFluidModel } from './interfaces';
import { Operation } from 'slate';

abstract class BaseFluidModel<T>
  extends DataObject
  implements IBaseFluidModel<T> {
  abstract subscribe(callback: (ops: Operation[]) => void): void;
  abstract unsubscribe(): void;
  abstract apply(op: T[]): void;
  abstract fetch(): any;
}

export { BaseFluidModel };
