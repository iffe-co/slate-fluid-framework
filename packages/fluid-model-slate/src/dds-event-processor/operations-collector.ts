import { Operation } from '@solidoc/slate';

class OperationCollector {
  private data: { [key: string]: Operation[] } = {};
  private constructor() {}
  public static create() {
    return new OperationCollector();
  }

  public add(key: string, operations: Operation[]) {
    if (this.data[key]) {
      operations.forEach(op => this.data[key].push(op));
    } else {
      this.data[key] = [...operations];
    }
  }

  public take(key: string) {
    const ops = this.data[key] || [];
    delete this.data[key];
    return ops;
  }
}
export const operationCollector = OperationCollector.create();
