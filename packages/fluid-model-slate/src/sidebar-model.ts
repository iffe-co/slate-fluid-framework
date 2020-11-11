import { SharedMap } from '@fluidframework/map';
import {
  SequenceDeltaEvent,
  SharedObjectSequence,
  SharedString,
} from '@fluidframework/sequence';
import { Operation, InsertNodeOperation, RemoveNodeOperation } from 'slate';

import { IFluidHandle } from '@fluidframework/core-interfaces';
import { Observable } from 'rxjs';

type RootType = SharedObjectSequence<IFluidHandle<SharedMap>>;
type NodeType = { title: string; icon: string; src: string };
class SidebarModel {
  public id: string;

  private readonly observable: Observable<Operation[]>;
  private onSidebarChange!: (ops: Operation[]) => void;

  private currentData!: NodeType[];
  processing: boolean = false;

  private constructor(
    private root: RootType,
    private children: SharedMap[],
    private applyToDocModel: (op: Operation) => void,
  ) {
    this.id = root.id;
    const _this = this;
    this.observable = new Observable(subscriber => {
      _this.onSidebarChange = (ops: Operation[]) => {
        subscriber.next(ops);
      };
    });
  }

  bindRootChangedEvent() {
    this.root.on(
      'sequenceDelta',
      (event: SequenceDeltaEvent, target: RootType) => {
        this.onChange();
      },
    );
  }

  onChange() {
    if (!this.currentData || this.processing) {
      return;
    }

    this.processing = true;
    this.fetch().then(newData => {
      const currentData = this.currentData;
      this.currentData = newData;

      const ops = this.diffData(currentData, newData);
      this.onSidebarChange(ops);
      this.processing = false;
    });
  }

  createRemoveNodeOp(index: number, node: NodeType): Operation {
    return ({
      type: 'remove_node',
      path: [index],
      node,
    } as unknown) as Operation;
  }

  createInsertNodeOp(index: number, node: NodeType): Operation {
    return ({
      type: 'insert_node',
      path: [index],
      node,
    } as unknown) as Operation;
  }

  diffData(nodes1: NodeType[], nodes2: NodeType[]) {
    const rangeSize =
      nodes1.length > nodes2.length ? nodes1.length : nodes2.length;
    const { removeOps, nodesAfterApplyOps } = this.diffRemove(nodes1, nodes2);
    const insertOps = this.diffInsert(nodes1, nodes2);
    const setNodeOps = this.diffSetNode(nodes1, nodes2);
    return removeOps.concat(insertOps).concat(setNodeOps);
  }

  diffRemove(originNodes: NodeType[], newNodes: NodeType[]) {
    const removeOps = originNodes
      .map((n, i) => ({ index: i, value: n }))
      .filter(v => !newNodes.find(newNode => newNode.src === v.value.src))
      .map(({ index, value }) => this.createRemoveNodeOp(index, value));

    const nodesAfterApplyOps = originNodes.filter(n =>
      newNodes.find(newNode => newNode.src === n.src),
    );

    return { removeOps, nodesAfterApplyOps };
  }

  diffInsert(originNodes: NodeType[], newNodes: NodeType[]) {
    const insertOps = newNodes
      .map((n, i) => ({ index: i, value: n }))
      .filter(
        v => !originNodes.find(originNodes => originNodes.src === v.value.src),
      )
      .map(({ index, value }) => this.createInsertNodeOp(index, value));

    return insertOps;
  }

  diffSetNode(originNodes: NodeType[], newNodes: NodeType[]) {
    const setNodeOps = newNodes
      .map((n, i) => ({ index: i, value: n }))
      .filter(v =>
        originNodes.find(originNodes => originNodes.src === v.value.src),
      )
      .map(({ index, value }, originIndex) =>
        this.diffNode(originNodes[originIndex], value, index),
      )
      .filter(op => op);

    return setNodeOps as any;
  }

  diffNode(originNode: NodeType, newNode: NodeType, index: number) {
    if (originNode.title === newNode.title && originNode.src === newNode.src) {
      return;
    } else {
      return {
        type: 'set_node',
        path: [index],
        newProperties: newNode,
        properties: originNode,
      };
    }
  }

  isSubPageNode(node: SharedMap) {
    return node.get('type') === 'page';
  }

  getNodeValue(node: SharedMap) {
    const src = node.get('src');
    const subPage: { title: string; icon: string } = this.getSubPageFromManager(
      '',
    );
    return { title: subPage.title, icon: subPage.icon, src };
  }

  getSubPageFromManager(id: string) {
    return {} as any;
  }

  async getChildren(root: RootType) {
    return Promise.all(root.getRange(0).map(h => h.get()));
  }

  async getPageChildren(root: RootType) {
    return (await this.getChildren(root)).filter(this.isSubPageNode);
  }

  async fetch() {
    const children = (await this.getPageChildren(this.root)).map(
      this.getNodeValue,
    );
    if (!this.currentData) {
      this.currentData = children;
    }
    return children;
  }

  subscribe(): Observable<Operation[]> {
    return this.observable;
  }

  apply(ops: Operation[]) {
    ops.forEach(op => {
      if (this.applier[op.type]) {
        this.applier[op.type](op);
      }
    });
  }

  applier = {
    move_node: async (op: InsertNodeOperation) => {
      const children = await this.getChildren(this.root);
      let [index] = op.path;
      let [targetIndex] = op.newPath as number[];

      let trueIndex = 0;
      let trueTargetIndex = 0;
      for (let i = 0; i < children.length; i++) {
        if (this.isSubPageNode(children[i])) {
          --index;
          --targetIndex;
        }
        if (index === -1) {
          trueIndex = i;
        }
        if (targetIndex === -1) {
          trueTargetIndex = i;
        }
      }
      this.applyToDocModel({
        ...op,
        path: [trueIndex],
        newPath: [trueTargetIndex],
      });
    },
    remove_node: async (op: InsertNodeOperation) => {
      const children = await this.getChildren(this.root);
      let [index] = op.path;
      let i = 0;
      for (; i < children.length; ++i) {
        if (index === -1) {
          break;
        }
        if (this.isSubPageNode(children[i])) {
          --index;
        }
      }
      const trueIndex = i;
      this.applyToDocModel({ ...op, path: [trueIndex] });
    },
    insert_node: async (op: InsertNodeOperation) => {
      const children = await this.getChildren(this.root);
      let [index] = op.path;
      let i = 0;
      for (; i < children.length; ++i) {
        if (index === 0) {
          break;
        }
        if (this.isSubPageNode(children[i])) {
          --index;
        }
      }
      const trueIndex = index + i;
      this.applyToDocModel({ ...op, path: [trueIndex] });
    },
  };
}

export { SidebarModel };
