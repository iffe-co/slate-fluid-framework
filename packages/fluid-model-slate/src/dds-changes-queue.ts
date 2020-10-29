import { Operation } from 'slate';
import { v4 } from 'uuid';

type OperationResolver = Promise<Operation[]>;

class DdsChangesQueue {
  private apply!: (ops: Operation[]) => void;
  private resolverMap: Map<string, OperationResolver[]>;
  private currentKey!: string;
  constructor() {
    this.resolverMap = new Map<string, OperationResolver[]>();
    this.currentKey = v4();
    this.resolverMap.set(this.currentKey, []);
  }

  public addOperationResolver(resolver: OperationResolver) {
    let newVar = this.resolverMap.get(this.currentKey);
    if (!newVar) {
      console.log('no this.currentKey', this.currentKey);
      return;
    }
    newVar.push(resolver);
  }

  public async resolveOperations(key: string) {
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

  public async applyAsyncOps() {
    const key = this.currentKey;
    const newKey = v4();
    this.resolverMap.set(newKey, []);
    this.currentKey = newKey;

    console.log('previous currentKey ', key, 'current key ', this.currentKey);
    const ops = await this.resolveOperations(key);
    if (ops.length === 0) {
      return;
    }
    console.log('fluid change to slate op', ops);
    this.apply(ops);
  }

  public init(apply: (ops: Operation[]) => void) {
    this.apply = apply;
  }
}

export const ddsChangesQueue = new DdsChangesQueue();
