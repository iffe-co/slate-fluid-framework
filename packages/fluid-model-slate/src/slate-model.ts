import { BaseFluidModel } from '@solidoc/fluid-model-base';
import { SharedMap } from '@fluidframework/map';
import { SharedObjectSequence, SharedString } from '@fluidframework/sequence';
import { DataObjectFactory, IDataObjectProps } from '@fluidframework/aqueduct';
import { FLUIDNODE_KEYS } from './interfaces';
import { slateOpHandler } from './slate-op-handler';
import { Operation } from 'slate';
import { operationApplier } from './operation-applier/operation-applier';
import { FluidNodeChildren, FluidNodeHandle } from './types';
import { registerOperationReceiver } from './dds-event-processor/binder';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';

class SlateFluidModel extends BaseFluidModel<Operation> {
  public fluidNodeSequence!: FluidNodeChildren;

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

  apply = (op: Operation) => {
    this.applyOperation(op);
    return slateOpHandler(op);
  };

  fetch = (): any => {
    throw new Error('Method not implemented.');
  };

  applyOperation = (op: Operation) => {
    const applier = operationApplier[op.type];
    if (applier) {
      console.log(op);
      applier(op, this.fluidNodeSequence, this.runtime).then();
    }
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

    const initNode = SharedMap.create(this.runtime);
    initNode.set(FLUIDNODE_KEYS.TEXT, text.handle);

    const initChildren = SharedObjectSequence.create(this.runtime);
    initChildren.insert(0, [initNode.handle]);

    const childrenNode = SharedMap.create(this.runtime);
    childrenNode.set(FLUIDNODE_KEYS.CHILDREN, initChildren.handle);

    this.fluidNodeSequence = SharedObjectSequence.create(this.runtime);
    this.fluidNodeSequence.insert(0, [<FluidNodeHandle>childrenNode.handle]);

    this.root.set(FLUIDNODE_KEYS.ID, '');

    this.root.set(FLUIDNODE_KEYS.CHILDREN, this.fluidNodeSequence.handle);
  };

  /**
   * Called every time but the first time the data store is initialized (creations
   * with an existing data store runtime)
   */
  protected initializingFromExistingasync = async (): Promise<void> => {};

  /**
   * Called every time the data store is initialized after create or existing.
   */
  protected hasInitialized = async (): Promise<void> => {
    [this.fluidNodeSequence] = await Promise.all([
      this.root.get(FLUIDNODE_KEYS.CHILDREN).get(),
    ]);

    //注册event-handler
    // addEventListenerHandler(this.fluidNode, this.fluidNodeSequence);
  };
}

export { SlateFluidModel };
