import { Operation } from 'slate';

type OperationResolver = Promise<Operation[]>;

class DdsChangesQueue {
  private apply!: (ops: Operation[]) => void;
  private resolverMap: Map<string, OperationResolver[]>;
  private currentKey!: string;
  constructor() {
    this.resolverMap = new Map<string, OperationResolver[]>();
  }

  public startRecord(key: string) {
    this.currentKey = key;
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

  public async applyAsyncOps(key: string) {
    const ops = await this.resolveOperations(key);
    console.log(ops);
    this.apply(ops);
  }

  public init(apply: (ops: Operation[]) => void) {
    this.apply = apply;
  }
}

export const ddsChangesQueue = new DdsChangesQueue();
