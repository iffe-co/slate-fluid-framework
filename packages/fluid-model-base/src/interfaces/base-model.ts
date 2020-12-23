import { Observable } from 'rxjs';
import { EventProcessor } from './event-processor';

interface IBaseFluidModel<T> {
  changedObserver: Observable<T[]>;
  bindEventProcessors(eventProcessor: EventProcessor<T>): Observable<T[]>;
  apply(ops: T[]): void;
  fetch(): any;
}

export { IBaseFluidModel };
