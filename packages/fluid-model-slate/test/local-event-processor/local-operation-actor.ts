import { SlateFluidModel } from "../../src"
import { createLocalModel } from "./local-model-creator"
import { Node, Operation } from '@solidoc/slate';
import {v4} from "uuid"

export class LocalOperationActor {
  model!: SlateFluidModel;
  actions: Operation[] = [];
  disconnect!: () => {};
  private constructor() {
  }

  public static async create(): Promise<LocalOperationActor> {
    const actor = new LocalOperationActor();
    await actor.init()
    return actor
  }

  private async init(): Promise<any> {
    const {model, disconnect} = await createLocalModel<SlateFluidModel>(v4(), SlateFluidModel.factory);
    this.model = model
    this.disconnect = disconnect
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
    const changePromise = new Promise<Operation[]>(resolve => {
      this.model.changedObserver.subscribe(ops => {
        resolve(ops)
      })
    })
    this.model.apply(this.actions)
    this.actions = []

    return await changePromise
  };
}