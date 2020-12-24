import { DataObject } from '@fluidframework/aqueduct';
import { IFluidObject } from '@fluidframework/core-interfaces';
import { BroadcastOpsRes, IBaseFluidModel } from './interfaces';
import { Observable, Subject } from 'rxjs';
import { EventProcessor } from './interfaces';
import { SharedMap } from '@fluidframework/map';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { SharedObjectSequence, SharedString } from '@fluidframework/sequence';
import { IDataObjectProps } from '@fluidframework/aqueduct';
import { IValueChanged } from '@fluidframework/map';
import { ISequencedDocumentMessage } from '@fluidframework/protocol-definitions';
import { SequenceDeltaEvent } from '@fluidframework/sequence';
import { ddsChangesQueue } from './dds-changes-queue';

abstract class BaseFluidModel<T, O extends IFluidObject = object>
  extends DataObject<O>
  implements IBaseFluidModel<T> {
  public constructor(props: IDataObjectProps<O>) {
    super(props);
    this.changedObserver = this.bindDefaultEventProcessor
      ? this.bindDefaultEventProcessor()
      : new Subject<BroadcastOpsRes<T>>();
  }
  changedObserver: Observable<BroadcastOpsRes<T>>;
  abstract apply(callerId: string, op: T[]): void;
  abstract fetch(): any;
  abstract bindDefaultEventProcessor(): Observable<BroadcastOpsRes<T>>;
  protected readonly processorGroup: {
    processor: EventProcessor<T>;
    changedObserver: Subject<BroadcastOpsRes<T>>;
  }[] = [];
  protected localOpsCache: {
    changedObserver: Subject<BroadcastOpsRes<T>>;
    operations: T[];
  }[] = [];

  protected notifyConsumer = (callerId: string, ops: T[]): void => {
    if (this.processorGroup.length === 0) {
      (this.changedObserver as Subject<BroadcastOpsRes<T>>).next({
        callerId,
        ops,
      });
    } else {
      this.processorGroup.forEach(({ changedObserver }) =>
        changedObserver.next({ callerId, ops }),
      );
    }
  };

  protected broadcastLocalOp = (callerId: string): void => {
    this.localOpsCache.forEach(({ changedObserver, operations }) =>
      changedObserver.next({ callerId, ops: operations }),
    );
    this.localOpsCache = [];
  };

  public bindEventProcessors = (
    eventProcessor: EventProcessor<T>,
  ): Observable<BroadcastOpsRes<T>> => {
    console.log('bindEventProcessors');
    const subject = new Subject<BroadcastOpsRes<T>>();
    this.processorGroup.push({
      processor: eventProcessor,
      changedObserver: subject,
    });
    return subject;
  };

  public bindSharedMapEvent(
    fluidNode: SharedMap,
    root: SharedObjectSequence<IFluidHandle<SharedMap>>,
  ) {
    if (fluidNode.listenerCount('valueChanged') !== 0) {
      return;
    }
    console.log('bind new event to map');
    fluidNode.on(
      'valueChanged',
      (
        event: IValueChanged,
        local: boolean,
        op: ISequencedDocumentMessage,
        target: SharedMap,
      ) => {
        if (local) {
          this.processorGroup
            .map(item => ({
              changedObserver: item.changedObserver,
              operations: item.processor.local.SharedMap(
                event,
                op,
                target,
                root,
              ),
            }))
            .forEach(item => this.localOpsCache.push(item));
        } else {
          this.processorGroup.forEach(item => {
            ddsChangesQueue.addOperationResolver({
              key: root.id,
              resolver: item.processor.remote.SharedMap(
                event,
                op,
                target,
                root,
              ),
              changedObserver: item.changedObserver,
            });
          });
        }
      },
    );
  }

  public bindSharedStringEvent(
    fluidText: SharedString,
    root: SharedObjectSequence<IFluidHandle<SharedMap>>,
  ) {
    if (fluidText.listenerCount('sequenceDelta') !== 0) {
      return;
    }
    console.log('bind new event to string');
    fluidText.on(
      'sequenceDelta',
      (event: SequenceDeltaEvent, target: SharedString) => {
        if (event.isLocal) {
          this.processorGroup
            .map(item => ({
              changedObserver: item.changedObserver,
              operations: item.processor.local.SharedString(
                event,
                target,
                root,
              ),
            }))
            .forEach(item => this.localOpsCache.push(item));
        } else {
          this.processorGroup.forEach(item => {
            ddsChangesQueue.addOperationResolver({
              key: root.id,
              resolver: item.processor.remote.SharedString(event, target, root),
              changedObserver: item.changedObserver,
            });
          });
        }
      },
    );
  }

  public bindSharedObjectSequenceEvent(
    children: SharedObjectSequence<IFluidHandle<SharedMap>>,
    root: SharedObjectSequence<IFluidHandle<SharedMap>>,
  ) {
    if (children.listenerCount('sequenceDelta') !== 0) {
      return;
    }
    console.log('bind new event to []');
    children.on(
      'sequenceDelta',
      (
        event: SequenceDeltaEvent,
        target: SharedObjectSequence<IFluidHandle<SharedMap>>,
      ) => {
        if (event.isLocal) {
          this.processorGroup
            .map(item => ({
              changedObserver: item.changedObserver,
              operations: item.processor.local.SharedObjectSequence(
                event,
                target,
                root,
              ),
            }))
            .forEach(item => this.localOpsCache.push(item));
        } else {
          this.processorGroup.forEach(item => {
            ddsChangesQueue.addOperationResolver({
              key: root.id,
              resolver: item.processor.remote.SharedObjectSequence(
                event,
                target,
                root,
                this,
              ),
              changedObserver: item.changedObserver,
            });
          });
        }
      },
    );
  }
}

export { BaseFluidModel };
