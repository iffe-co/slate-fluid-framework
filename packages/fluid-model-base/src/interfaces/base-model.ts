import { Observable } from 'rxjs';

interface IBaseFluidModel<T> {
  subscribe(): Observable<T[]>;
  apply(ops: T[]): void;
  fetch(): any;
}

export { IBaseFluidModel };
