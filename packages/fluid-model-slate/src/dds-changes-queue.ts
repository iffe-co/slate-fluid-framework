import { Operation } from '@solidoc/slate';
import { v4 } from 'uuid';

type OperationResolver = { key: string; resolver: Promise<Operation[]> };

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

      const operations: { [key: string]: Operation[] } = (
        await Promise.all(
          resolvers.map(async r => {
            const ops = await r.resolver;
            return { key: r.key, ops };
          }),
        )
      ).reduce((p, { key, ops }) => {
        if (p[key]) {
          return { ...p, [key]: p[key].concat(ops) };
        } else {
          return { ...p, [key]: ops };
        }
      }, {});
      this.resolverMap.delete(key);
      return operations;
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
        .then(ops => {
          const keys = Object.keys(ops);
          if (keys.length !== 0) {
            const udd = v4();
            console.log('apply ops start ---', udd, ops);
            keys.forEach(k => {
              this.operationBroadcaster[k](ops[k]);
            });
            console.log('apply ops end ---', udd, ops);
          }
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
    console.log('applyAsyncOps-------------------');
    this.startProcess();
  }

  registerOperationsBroadcast(id: string, apply: (ops: Operation[]) => void) {
    this.operationBroadcaster[id] = apply;
  }
}

export const ddsChangesQueue = new DdsChangesQueue();
