import { BaseFluidModel } from '@solidoc/fluid-model-base';
import { SharedMap } from '@fluidframework/map';
import { SharedObjectSequence } from '@fluidframework/sequence';
import { DataObjectFactory } from '@fluidframework/aqueduct';
import { FLUIDNODE_KEYS } from './interfaces';
import { addEventListenerHandler } from './event-handler';
import { slateOpHandler } from './slate-op-handler';
import { Operation } from 'slate';
import { operationApplier } from './operation-applier/operation-applier';
import { FluidNodeChildren, FluidNodeHandle } from './types';

class SlateFluidModel extends BaseFluidModel<Operation> {
  private fluidNodeSequence!: FluidNodeChildren;
  private fluidNode!: SharedMap;

  public static get Name() {
    return 'name';
  }

  public static readonly factory = new DataObjectFactory(
    SlateFluidModel.Name,
    SlateFluidModel,
    [SharedMap.getFactory(), SharedObjectSequence.getFactory()],
    {},
  );

  subscribe = () => {
    throw new Error('Method not implemented.');
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
    operationApplier[op.type](op, this.fluidNodeSequence, this.runtime);
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
    this.fluidNode = SharedMap.create(this.runtime);
    this.fluidNode.set(FLUIDNODE_KEYS.ID, 'id=1234');
    this.fluidNode.set(FLUIDNODE_KEYS.TYPE, 'text');
    this.fluidNode.set(FLUIDNODE_KEYS.TEXT, 'text-test1111');

    this.fluidNodeSequence = SharedObjectSequence.create(this.runtime);
    this.fluidNodeSequence.insert(0, [<FluidNodeHandle>this.fluidNode.handle]);

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
    addEventListenerHandler(this.fluidNode, this.fluidNodeSequence);
  };
}

export { SlateFluidModel };
