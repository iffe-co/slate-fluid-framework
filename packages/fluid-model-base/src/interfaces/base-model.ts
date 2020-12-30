import { Observable } from 'rxjs';
import { EventProcessor } from './event-processor';

interface BroadcastOpsRes<T> {
  callerId: string;
  ops: T[];
}

interface IBaseFluidModel<T, D = object> {
  changedObserver: Observable<BroadcastOpsRes<T>>;
  bindEventProcessors(
    eventProcessor: EventProcessor<T, D>,
  ): Observable<BroadcastOpsRes<T>>;
  apply(callerId: string, ops: T[]): void;
  fetch(): any;
}

export { IBaseFluidModel, BroadcastOpsRes };
