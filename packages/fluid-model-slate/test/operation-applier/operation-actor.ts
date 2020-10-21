import {
  SharedObjectSequence,
  SharedString,
} from '@fluidframework/sequence';
import { FluidNodeHandle } from '../../src/types';
import { SharedMap } from '@fluidframework/map';
import { FLUIDNODE_KEYS } from '../../src/interfaces';
import { Node, Operation } from 'slate';
import { operationApplier } from '../../src/operation-applier';
import { getNode } from '../../src/operation-applier/node-getter';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { mockDdsCreate, mockRuntime } from './mocker';
import {addChildrenToCache, addNodeToCache, addTextToCache} from "../../src/dds-cache";

const uuid = require('uuid');

class OperationActor {
  public readonly root: SharedObjectSequence<FluidNodeHandle>;
  private actions: Operation[] = [];
  private valuesPromises: (Promise<any> | any)[] = [];
  private readonly mockRuntime: IFluidDataStoreRuntime;
  constructor(private readonly runtime?: IFluidDataStoreRuntime) {
    this.mockRuntime = runtime || mockRuntime;

    if (!runtime) {
      mockDdsCreate();
    }

    this.addAllDDSToCache();
    this.root = this.initEditorRoot();
  }
  private initEditorRoot = () => {
    const root = SharedObjectSequence.create<FluidNodeHandle>(this.mockRuntime);
    const node_0_0 = this.initNode();
    const node_0 = this.initNode([node_0_0]);
    root.insert(0, [<FluidNodeHandle>node_0.handle]);
    return root;
  };

  private initNode = (childrenNode?: SharedMap[]) => {
    const node =  SharedMap.create(this.mockRuntime);

    if (childrenNode) {
      const childSequence = SharedObjectSequence.create<FluidNodeHandle>(this.mockRuntime);
      childSequence.insert(
        0,
        childrenNode.map(v => <FluidNodeHandle>v.handle),
      );
      node.set(FLUIDNODE_KEYS.CHILDREN, childSequence.handle);
    } else {
      const text = SharedString.create(this.mockRuntime);
      text.insertText(0, 'This default text');
      node.set(FLUIDNODE_KEYS.TEXT, text.handle);
    }

    return node;
  };

  private applyOp = async (op: Operation) => {
    operationApplier[op.type](op, this.root, this.mockRuntime)
  };

  private async internalGetNodeProperties(
    path: number[],
    isHandleProperty: boolean,
    key: string,
  ) {
    const resultNode = await getNode(path, this.root);
    if (!isHandleProperty) {
      return resultNode.get(key);
    }
    const valueHandle = resultNode.get<IFluidHandle<SharedString>>(key);
    const expectValueShareString = await valueHandle.get();
    return expectValueShareString.getText();
  }

  private async internalCheckNodeExist(path: number[]) {
    try {
      await getNode(path, this.root);
    } catch (err) {
      if (err.message === 'Target node not exist!') {
        return false;
      }
      throw err;
    }
    return true;
  }

  public insertTextNode = (path: number[], text: string = 'The first node') => {
    const op = {
      type: 'insert_node',
      path,
      node: { text },
    } as Operation;

    this.actions.push(op);
    return this;
  };

  public insertNode = (path: number[], node: any) => {
    const op = {
      type: 'insert_node',
      path,
      node,
    } as Operation;

    this.actions.push(op);
    return this;
  };

  public insertSequenceNode = (path: number[]) => {
    const op = {
      type: 'insert_node',
      path,
      node: { children: [] },
    } as Operation;

    this.actions.push(op);
    return this;
  };

  public insertText = (
    path: number[],
    offset: number,
    text: string = 'The first node',
  ) => {
    const op = { type: 'insert_text', offset, path, text } as Operation;
    this.actions.push(op);
    return this;
  };

  public removeText = (
    path: number[],
    offset: number,
    text: string = 'The first node',
  ) => {
    const op = { type: 'remove_text', offset, path, text } as Operation;
    this.actions.push(op);
    return this;
  };

  public splitNode = (
    path: number[],
    position: number,
    properties: Partial<Node>,
  ) => {
    const op = { type: 'split_node', path, position, properties } as Operation;
    this.actions.push(op);
    return this;
  };

  public setNode = (path: number[], newProperties: Partial<Node>) => {
    const op = { type: 'set_node', path, newProperties } as Operation;
    this.actions.push(op);
    return this;
  };

  public mergeNode = (path: number[]) => {
    const op = { type: 'merge_node', path } as Operation;
    this.actions.push(op);
    return this;
  };

  public moveNode = (from: number[], to: number[]) => {
    const op = { type: 'move_node', path: from, newPath: to } as Operation;
    this.actions.push(op);
    return this;
  };

  public removeNode = (path: number[]) => {
    const op = { type: 'remove_node', path } as Operation;
    this.actions.push(op);
    return this;
  };

  public execute = async () => {
    for (let action of this.actions) {
      await this.applyOp(action);
    }
    this.actions = [];
    return this;
  };

  public getNode = (path: number[]) => {
    this.valuesPromises.push(getNode(path, this.root));
    return this;
  };

  public getNodeText = (path: number[]) => {
    this.getNodeProperties(path, FLUIDNODE_KEYS.TEXT, true);
    return this;
  };

  public getNodeProperties = (
    path: number[],
    key: string,
    isHandleProperty: boolean = false,
  ) => {
    this.valuesPromises.push(
      this.internalGetNodeProperties(path, isHandleProperty, key),
    );
    return this;
  };

  public isNodeExist = (path: number[]) => {
    this.valuesPromises.push(this.internalCheckNodeExist(path));
    return this;
  };

  public values = async () => {
    const values = await Promise.all(this.valuesPromises);
    this.valuesPromises = [];
    return values;
  };

  private addAllDDSToCache() {
    const createMap = SharedMap.create
    SharedMap.create = (rt, id?: string) => {
      const map = createMap(rt, id)
      addNodeToCache(map)
      return map
    }

    const createSeq = SharedObjectSequence.create
    SharedObjectSequence.create = <T>(rt: any, id?: string) => {
      const seq = createSeq<T>(rt, id)
      addChildrenToCache(seq as any)
      return seq
    }

    const createString = SharedString.create
    SharedString.create = (rt, id?: string) => {
      const string = createString(rt, id)
      addTextToCache(string)
      return string
    }
  }
}

/**
 * by default, the doc tree for 'actor', only has a [0, 0] node and [0, 0] node is a text node
 * @param runtime
 */
export const initOperationActor = (runtime?: IFluidDataStoreRuntime) =>
  new OperationActor(runtime);
