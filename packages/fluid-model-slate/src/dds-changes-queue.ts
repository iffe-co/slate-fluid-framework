import { Operation } from 'slate';
import { v4 } from 'uuid';

type OperationResolver = Promise<Operation[]>;

class DdsChangesQueue {
  private apply!: (ops: Operation[]) => void;
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

  public async resolveOperations(key: string = '') {
    if (this.resolverMap.has(key)) {
      const resolvers = this.resolverMap.get(key) || [];
      const operations = (await Promise.all(resolvers)).reduce(
        (p, c) => p.concat(c),
        [],
      );
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
          if (ops.length !== 0) {
            const udd = v4();
            console.log('apply ops start ---', udd, ops);
            this.apply(ops);
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

  public init(apply: (ops: Operation[]) => void) {
    this.apply = apply;
  }
}

export const ddsChangesQueue = new DdsChangesQueue();
