import {
  SharedObjectSequence,
  SharedObjectSequenceFactory,
  SharedString,
  SharedStringFactory,
} from '@fluidframework/sequence';
import { FluidNodeChildren, FluidNodeHandle } from '../../src/types';
import uuid from 'uuid';
import * as mocks from '@fluidframework/test-runtime-utils';
import { SharedMap } from '@fluidframework/map';
import { FLUIDNODE_KEYS } from '../../src/interfaces';
import { Node, Operation } from 'slate';
import { operationApplier } from '../../src/operation-applier';
import { getNode } from '../../src/operation-applier/node-getter';
import { IFluidHandle } from '@fluidframework/core-interfaces';

SharedString.create = runtime =>
  new SharedString(runtime, uuid.v4(), SharedStringFactory.Attributes);
SharedMap.create = runtime =>
  new SharedMap(uuid.v4(), runtime, SharedMap.getFactory().attributes);
SharedObjectSequence.create = runtime =>
  new SharedObjectSequence(
    runtime,
    uuid.v4(),
    SharedObjectSequenceFactory.Attributes,
  );

const mockRuntime: mocks.MockFluidDataStoreRuntime = new mocks.MockFluidDataStoreRuntime();

class OperationActor {
  private readonly root: SharedObjectSequence<FluidNodeHandle>;
  private actions: Operation[] = [];
  private valuesPromises: Promise<any>[] = [];
  constructor() {
    this.root = this.initEditorRoot();
  }
  private initEditorRoot = () => {
    const root = new SharedObjectSequence<FluidNodeHandle>(
      mockRuntime,
      uuid.v4(),
      SharedObjectSequenceFactory.Attributes,
    );
    const node_0_0 = this.initNode();
    const node_0 = this.initNode([node_0_0]);
    root.insert(0, [<FluidNodeHandle>node_0.handle]);
    return root;
  };

  private initNode = (childrenNode?: SharedMap[]) => {
    const node = new SharedMap(
      uuid.v4(),
      mockRuntime,
      SharedMap.getFactory().attributes,
    );

    if (childrenNode) {
      const childSequence = new SharedObjectSequence<FluidNodeHandle>(
        mockRuntime,
        uuid.v4(),
        SharedObjectSequenceFactory.Attributes,
      );
      childSequence.insert(
        0,
        childrenNode.map(v => <FluidNodeHandle>v.handle),
      );
      node.set(FLUIDNODE_KEYS.CHILDREN, childSequence.handle);
    } else {
      const text = new SharedString(
        mockRuntime,
        uuid.v4(),
        SharedStringFactory.Attributes,
      );
      text.insertText(0, 'This default text');
      node.set(FLUIDNODE_KEYS.TEXT, text.handle);
    }

    return node;
  };

  private applyOp = async (op: Operation) => {
    await operationApplier[op.type](op, this.root, mockRuntime);
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

  public getNodeText = (path: number[]) => {
    this.getNodeProperties(path, FLUIDNODE_KEYS.TEXT);
    return this;
  };

  public getNodeProperties = (
    path: number[],
    key: string,
    isHandleProperty: boolean = true,
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
}

export const initOperationActor = () => new OperationActor();
