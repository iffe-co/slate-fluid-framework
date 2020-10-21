import { Editor, Operation } from 'slate';

type OperationResolver = Promise<Operation[]>;

class DDSChangesQueue {
  private apply: (op: Operation) => void;
  private editor: Editor;
  private resolverMap: Map<string, OperationResolver[]>;
  private currentKey: string;
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
    const resolvers = this.resolverMap.get(key);
    const operations = (await Promise.all(resolvers)).reduce(
      (p, c) => p.concat(c),
      [],
    );
    this.resolverMap.delete(key);
    return operations;
  }

  public async applyAsyncOps(key: string) {
    const ops = await this.resolveOperations(key);
    console.log(ops);
    Editor.withoutNormalizing(this.editor, () => {
      ops.forEach(op => {
        try {
          this.apply(op);
          console.log('apply op', op);
        } catch (e) {
          console.log(op);
          throw e;
        }
      });
    });
    console.log('apply ops: ', ops);
  }

  public init(
    apply: (op: Operation) => void,
    opIdMarker: (op: Operation) => Operation,
    editor: Editor,
  ) {
    this.apply = (op: Operation) => apply(opIdMarker(op));
    this.editor = editor;
  }
}

export const ddsChangesQueue = new DDSChangesQueue();
