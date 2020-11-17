import { Observable } from 'rxjs';

interface IBaseFluidModel<T> {
  changedObserver: Observable<T[]>;
  apply(ops: T[]): void;
  fetch(): any;
}

export { IBaseFluidModel };
