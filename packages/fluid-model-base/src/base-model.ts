import { DataObject } from '@fluidframework/aqueduct';
import { IBaseFluidModel } from './interfaces';

abstract class BaseFluidModel<T>
  extends DataObject
  implements IBaseFluidModel<T> {
  abstract subscribe(): any;

  abstract unsubscribe(): void;

  abstract apply(op: T): void;
  abstract fetch(): any;
}

export { BaseFluidModel };
