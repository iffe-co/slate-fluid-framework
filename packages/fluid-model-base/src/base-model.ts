import { DataObject } from '@fluidframework/aqueduct';
import { IBaseFluidModel } from './interfaces';
import { Observable } from 'rxjs';

abstract class BaseFluidModel<T>
  extends DataObject
  implements IBaseFluidModel<T> {
  abstract subscribe(): Observable<T[]>;
  abstract apply(op: T[]): void;
  abstract fetch(): any;
}

export { BaseFluidModel };
