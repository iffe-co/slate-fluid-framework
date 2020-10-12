import { DataObject } from '@fluidframework/aqueduct';
import { IBaseFluidModel } from './interfaces';
import { Operation } from 'slate';

abstract class BaseFluidModel<T>
  extends DataObject
  implements IBaseFluidModel<T> {
  subscribe(callback: (op: Operation) => void) {
    this.onModelChanged(callback);
  }

  abstract unsubscribe(): void;

  abstract onModelChanged(callback: (op: Operation) => void): void;

  abstract apply(op: T): Promise<void>;
  abstract fetch(): any;
}

export { BaseFluidModel };
