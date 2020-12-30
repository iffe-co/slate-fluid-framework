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

abstract class BaseFluidModel<T, D = object, O extends IFluidObject = object>
  extends DataObject<O>
  implements IBaseFluidModel<T, D> {
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
  abstract getTargetSharedStringPath(target: SharedString): number[];
  abstract getTargetSharedMapPath(target: SharedMap): number[];
  abstract getTargetSharedObjectSequencePath(
    target: SharedObjectSequence<D>,
  ): number[];
  protected readonly processorGroup: {
    processor: EventProcessor<T, D>;
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
    const broadcastLocalOpMap = new Map<Subject<BroadcastOpsRes<T>>, T[]>();
    this.localOpsCache
      .reduce(
        (
          p: Map<Subject<BroadcastOpsRes<T>>, T[]>,
          c: {
            changedObserver: Subject<BroadcastOpsRes<T>>;
            operations: T[];
          },
        ) => {
          if (p.has(c.changedObserver)) {
            c.operations.forEach(op => {
              p.get(c.changedObserver)?.push(op);
            });
          } else {
            p.set(c.changedObserver, [...c.operations]);
          }
          return p;
        },
        broadcastLocalOpMap,
      )
      .forEach((v, k) => {
        k.next({ callerId, ops: v });
      });
    this.localOpsCache = [];
  };

  public bindEventProcessors = (
    eventProcessor: EventProcessor<T, D>,
  ): Observable<BroadcastOpsRes<T>> => {
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
        const targetPath = this.getTargetSharedMapPath(target);
        if (local) {
          this.processorGroup
            .map(item => ({
              changedObserver: item.changedObserver,
              operations: item.processor.local.SharedMap(
                event,
                op,
                target,
                root,
                { targetPath, model: this },
              ),
            }))
            .forEach(item => this.localOpsCache.push(item));
        } else {
          this.processorGroup.forEach(item => {
            ddsChangesQueue.addOperationResolver({
              resolver: item.processor.remote.SharedMap(
                event,
                op,
                target,
                root,
                { targetPath, model: this },
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
        const targetPath = this.getTargetSharedStringPath(target);
        if (event.isLocal) {
          this.processorGroup
            .map(item => ({
              changedObserver: item.changedObserver,
              operations: item.processor.local.SharedString(
                event,
                target,
                root,
                { targetPath, model: this },
              ),
            }))
            .forEach(item => this.localOpsCache.push(item));
        } else {
          this.processorGroup.forEach(item => {
            ddsChangesQueue.addOperationResolver({
              resolver: item.processor.remote.SharedString(
                event,
                target,
                root,
                { targetPath, model: this },
              ),
              changedObserver: item.changedObserver,
            });
          });
        }
      },
    );
  }

  public bindSharedObjectSequenceEvent(
    children: SharedObjectSequence<D>,
    root: SharedObjectSequence<D>,
  ) {
    if (children.listenerCount('sequenceDelta') !== 0) {
      return;
    }
    console.log('bind new event to []');
    children.on(
      'sequenceDelta',
      (event: SequenceDeltaEvent, target: SharedObjectSequence<D>) => {
        const targetPath = this.getTargetSharedObjectSequencePath(target);
        if (event.isLocal) {
          this.processorGroup
            .map(item => ({
              changedObserver: item.changedObserver,
              operations: item.processor.local.SharedObjectSequence(
                event,
                target,
                root,
                { targetPath, model: this },
              ),
            }))
            .forEach(item => this.localOpsCache.push(item));
        } else {
          this.processorGroup.forEach(item => {
            ddsChangesQueue.addOperationResolver({
              resolver: item.processor.remote.SharedObjectSequence(
                event,
                target,
                root,
                { targetPath, model: this },
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
