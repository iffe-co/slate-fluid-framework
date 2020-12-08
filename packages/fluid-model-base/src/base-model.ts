import { DataObject, IDataObjectProps } from '@fluidframework/aqueduct';
import { IFluidObject } from '@fluidframework/core-interfaces';
import { IBaseFluidModel } from './interfaces';
import { Subject } from 'rxjs';

abstract class BaseFluidModel<T, O extends IFluidObject = object>
  extends DataObject<O>
  implements IBaseFluidModel<T> {
  private _changedObserver!: Subject<T[]>;
  get changedObserver() {
    if (!this._changedObserver) {
      this._changedObserver = new Subject<T[]>();
      this.notifyConsumer(this._changedObserver);
    }
    return this._changedObserver;
  }

  protected abstract notifyConsumer: (subscriber: Subject<T[]>) => void;
  abstract apply(op: T[]): void;
  abstract fetch(): any;
}

export { BaseFluidModel };
