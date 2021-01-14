import { v4 } from 'uuid';
import { Subject } from 'rxjs';

type OperationResolver = {
  resolver: any[] | Promise<any[]>;
  changedObserver: Subject<any>;
};

type NotifyItem = {
  changedObserver: Subject<any>;
  ops: any[];
};

class DdsChangesQueue {
  private resolverMap: Map<string, OperationResolver[]>;
  private currentKey!: string;
  private keyQueue!: string[];
  private processing: boolean = false;

  constructor() {
    this.resolverMap = new Map<string, OperationResolver[]>();
    this.currentKey = v4();
    this.keyQueue = [];
    this.resolverMap.set(this.currentKey, []);
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

  private mergeTheSameSubjectOps = (
    notifyGroup: NotifyItem[],
  ): NotifyItem[] => {
    const broadcastLocalOpMap = new Map<Subject<any>, any[]>();
    notifyGroup.reduce((p: Map<Subject<any>, any[]>, c: NotifyItem) => {
      if (p.has(c.changedObserver)) {
        c.ops.forEach(op => {
          p.get(c.changedObserver)?.push(op);
        });
      } else {
        p.set(c.changedObserver, [...c.ops]);
      }
      return p;
    }, broadcastLocalOpMap);
    return [...broadcastLocalOpMap.keys()].map(k => ({
      changedObserver: k,
      ops: broadcastLocalOpMap.get(k) as any[],
    }));
  };

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
      const mergeNotifiableGroup = this.mergeTheSameSubjectOps(notifiableGroup);
      return mergeNotifiableGroup;
    } else {
      return [];
    }
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
          notifiableGroup.forEach(({ changedObserver, ops }) => {
            changedObserver.next({ ops, callerId: 'remote' });
          });
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
