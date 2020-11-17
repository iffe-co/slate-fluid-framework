import { DataObject, IDataObjectProps } from '@fluidframework/aqueduct';
import { IFluidObject } from '@fluidframework/core-interfaces';
import { IBaseFluidModel } from './interfaces';
import { Observable, Subscriber } from 'rxjs';

abstract class BaseFluidModel<T, O extends IFluidObject = object>
  extends DataObject<O>
  implements IBaseFluidModel<T> {
  private _changedObserver!: Observable<T[]>;
  get changedObserver() {
    if (!this._changedObserver) {
      this._changedObserver = new Observable(this.notifyConsumer);
    }
    return this._changedObserver;
  }

  protected abstract notifyConsumer: (subscriber: Subscriber<T[]>) => void;
  abstract apply(op: T[]): void;
  abstract fetch(): any;
}

export { BaseFluidModel };
