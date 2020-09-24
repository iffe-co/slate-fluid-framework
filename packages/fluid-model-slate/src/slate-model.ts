import { BaseFluidModel, IOperation } from '@solidoc/fluid-model-base';
import { SharedMap } from '@fluidframework/map';
import { SharedObjectSequence } from '@fluidframework/sequence';
import { DataObjectFactory } from '@fluidframework/aqueduct';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { FLUIDNODE_KEYS } from './interfaces';
import { addEventListenerHandler } from './event-handler';
import { slateOpHandler } from './slate-op-handler';

class SlateFluidModel extends BaseFluidModel {
  private fluidNodeSequence!: SharedObjectSequence<IFluidHandle<SharedMap>>;
  private fluidNode!: SharedMap;

  // public static readonly factory = new DataObjectFactory(
  //   SlateFluidModel.Name,
  //   SlateFluidModel,
  //   [SharedMap.getFactory()],
  //   {},
  // );

  public static get Name() {
    return 'name';
  }

  public static readonly factory = new DataObjectFactory(
    SlateFluidModel.Name,
    SlateFluidModel,
    [SharedMap.getFactory(), SharedObjectSequence.getFactory()],
    {},
  );

  subscribe(id: string) {
    throw new Error('Method not implemented.');
  }

  unsubscribe(id: string): void {
    throw new Error('Method not implemented.');
  }

  async apply<T extends IOperation>(op: T) {
    return slateOpHandler(op);
  }

  /**
   * Called the first time the data store is initialized (new creations with a new
   * data store runtime)
   *
   * @param props - Optional props to be passed in on create
   */
  protected async initializingFirstTime<S = undefined>(
    props?: S,
  ): Promise<void> {
    this.fluidNode = SharedMap.create(this.runtime);
    this.fluidNode.set(FLUIDNODE_KEYS.ID, 'id=1234');
    this.fluidNode.set(FLUIDNODE_KEYS.TYPE, 'text');
    this.fluidNode.set(FLUIDNODE_KEYS.TEXT, 'text-test1111');

    this.fluidNodeSequence = SharedObjectSequence.create(this.runtime);
    this.fluidNodeSequence.insert(0, [
      <IFluidHandle<SharedMap>>this.fluidNode.handle,
    ]);

    this.root.set(FLUIDNODE_KEYS.ID, '');
    this.root.set(FLUIDNODE_KEYS.CHILDREN, this.fluidNodeSequence.handle);
  }

  /**
   * Called every time but the first time the data store is initialized (creations
   * with an existing data store runtime)
   */
  protected async initializingFromExisting(): Promise<void> {}

  /**
   * Called every time the data store is initialized after create or existing.
   */
  protected async hasInitialized(): Promise<void> {
    [this.fluidNodeSequence] = await Promise.all([
      this.root.get(FLUIDNODE_KEYS.CHILDREN).get(),
    ]);

    //注册event-handler
    addEventListenerHandler(this.fluidNode, this.fluidNodeSequence);
  }
}

export { SlateFluidModel };
