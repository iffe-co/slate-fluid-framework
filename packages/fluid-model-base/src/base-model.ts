import { DataObject } from '@fluidframework/aqueduct';
import { IFluidObject } from '@fluidframework/core-interfaces';
import { IBaseFluidModel } from './interfaces';
import { Subject } from 'rxjs';

abstract class BaseFluidModel<T, O extends IFluidObject = object>
  extends DataObject<O>
  implements IBaseFluidModel<T> {
  public changedObserver = new Subject<T[]>();
  protected notifyConsumer(ops: T[]): void {
    this.changedObserver.next(ops);
  }
  abstract apply(op: T[]): void;
  abstract fetch(): any;
}

export { BaseFluidModel };
