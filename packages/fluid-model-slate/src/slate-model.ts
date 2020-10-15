import { BaseFluidModel } from '@solidoc/fluid-model-base';
import { SharedMap } from '@fluidframework/map';
import { SharedObjectSequence, SharedString } from '@fluidframework/sequence';
import { DataObjectFactory, IDataObjectProps } from '@fluidframework/aqueduct';
import { FLUIDNODE_KEYS } from './interfaces';
import { Operation } from 'slate';
import { operationApplier } from './operation-applier/operation-applier';
import { FluidNodeHandle } from './types';
import { registerOperationReceiver } from './dds-event-processor/binder';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import {
  addChildrenToCache,
  addNodeToCache,
  addTextToCache,
} from './dds-cache';

class SlateFluidModel extends BaseFluidModel<Operation> {
  public fluidNodeSequence!: SharedObjectSequence<IFluidHandle<SharedMap>>;

  public constructor(props: IDataObjectProps) {
    super(props);
    this.runtime = props.runtime;
  }

  public runtime: IFluidDataStoreRuntime;

  public static get Name() {
    return 'slate-fluid-model';
  }

  public static readonly factory = new DataObjectFactory(
    SlateFluidModel.Name,
    SlateFluidModel,
    [
      SharedMap.getFactory(),
      SharedObjectSequence.getFactory(),
      SharedString.getFactory(),
    ],
    {},
  );

  onModelChanged = (callback: (op: Operation) => void) => {
    registerOperationReceiver(callback);
  };

  unsubscribe = (): void => {
    throw new Error('Method not implemented.');
  };

  apply = async (op: Operation[]) => {
    await this.applyOperation(op);
  };

  fetch = (): any => {
    throw new Error('Method not implemented.');
  };

  applyOperation = async (ops: Operation[]) => {
    const executable = await Promise.all(
      ops.map(op =>
        operationApplier[op.type](op, this.fluidNodeSequence, this.runtime),
      ),
    );
    executable.forEach(e => e());
  };

  /**
   * Called the first time the data store is initialized (new creations with a new
   * data store runtime)
   *
   * @param props - Optional props to be passed in on create
   */
  protected initializingFirstTime = async <S = undefined>(
    props?: S,
  ): Promise<void> => {
    const text = SharedString.create(this.runtime);
    addTextToCache(text);

    const initNode = SharedMap.create(this.runtime);
    initNode.set(FLUIDNODE_KEYS.TEXT, text.handle);
    addNodeToCache(initNode);

    const initChildren = SharedObjectSequence.create<FluidNodeHandle>(
      this.runtime,
    );
    initChildren.insert(0, [<FluidNodeHandle>initNode.handle]);
    addChildrenToCache(initChildren);

    const childrenNode = SharedMap.create(this.runtime);
    childrenNode.set(FLUIDNODE_KEYS.CHILDREN, initChildren.handle);
    childrenNode.set(FLUIDNODE_KEYS.TEXT, 'initChildren.handle');
    addNodeToCache(childrenNode);

    this.fluidNodeSequence = SharedObjectSequence.create(this.runtime);
    this.fluidNodeSequence.insert(0, [<FluidNodeHandle>childrenNode.handle]);

    this.root.set(FLUIDNODE_KEYS.ID, '');

    this.root.set(FLUIDNODE_KEYS.CHILDREN, this.fluidNodeSequence.handle);

    console.log(123);
    // await addEventListenerHandler(this.fluidNodeSequence);
  };

  /**
   * Called every time but the first time the data store is initialized (creations
   * with an existing data store runtime)
   */
  protected async initializingFromExisting(): Promise<void> {
    [this.fluidNodeSequence] = await Promise.all([
      this.root.get(FLUIDNODE_KEYS.CHILDREN).get(),
    ]);

    const nodeHandle = await this.fluidNodeSequence.getRange(0, 1)[0];
    const a = await nodeHandle.get();
    console.log(a.get('text'));
    return super.initializingFromExisting();
  }

  /**
   * Called every time the data store is initialized after create or existing.
   */
  protected hasInitialized = async (): Promise<void> => {
    //注册event-handler
    // await addEventListenerHandler(this.fluidNodeSequence);
  };
}

export { SlateFluidModel };
