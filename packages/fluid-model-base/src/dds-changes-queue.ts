import { Operation } from '@solidoc/slate';
import { v4 } from 'uuid';
import { Subject } from 'rxjs';

type OperationResolver = {
  key: string;
  resolver: any[] | Promise<any[]>;
  changedObserver: Subject<any>;
};

class DdsChangesQueue {
  private resolverMap: Map<string, OperationResolver[]>;
  private currentKey!: string;
  private keyQueue!: string[];
  private processing: boolean = false;
  private operationBroadcaster: { [key: string]: (ops: Operation[]) => void };

  constructor() {
    this.resolverMap = new Map<string, OperationResolver[]>();
    this.currentKey = v4();
    this.keyQueue = [];
    this.resolverMap.set(this.currentKey, []);
    this.operationBroadcaster = {};
  }

  public addOperationResolver(resolver: OperationResolver) {
    const currentKey = this.currentKey;
    const currentValue = this.resolverMap.get(currentKey);
    if (!currentValue) {
      console.log('no this.currentKey', currentKey);
      return;
    }
    console.log('add op to currentKey', currentKey);
    currentValue.push(resolver);
  }

  public async resolveOperations(key: string = '') {
    if (this.resolverMap.has(key)) {
      const resolvers = this.resolverMap.get(key) || [];

      const notifiableGroup = await Promise.all(
        resolvers.map(async r => {
          const ops =
            r.resolver instanceof Array ? r.resolver : await r.resolver;
          return { changedObserver: r.changedObserver, ops };
        }),
      );
      this.resolverMap.delete(key);
      return notifiableGroup;
    } else {
      return [];
    }
  }

  public logContent() {
    console.log(
      'start enqueue message',
      this.currentKey,
      this.resolverMap.get(this.currentKey),
    );
  }

  private startProcess() {
    this.processing = true;
    this.process();
  }

  public process() {
    if (this.processing) {
      const key = this.keyQueue.shift();
      if (!key) {
        this.processing = false;
        return;
      }
      this.resolveOperations(key)
        .then(notifiableGroup => {
          const uuid = v4();
          console.log('apply ops start ---', uuid, notifiableGroup);
          notifiableGroup.forEach(({ changedObserver, ops }) => {
            changedObserver.next({ ops, callerId: 'remote' });
          });
          console.log('apply ops end ---', uuid, notifiableGroup);
          this.process();
        })
        .catch(err => {
          throw Error(err);
        });
    }
  }

  public applyAsyncOps() {
    if (this.processing) {
      return;
    }
    let key = this.currentKey;
    const newKey = v4();
    this.resolverMap.set(newKey, []);
    this.currentKey = newKey;
    this.keyQueue.push(key);
    this.startProcess();
  }
}

export const ddsChangesQueue = new DdsChangesQueue();
