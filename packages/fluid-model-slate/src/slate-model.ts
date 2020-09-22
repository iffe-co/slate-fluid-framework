import { BaseFluidModel, IOperation } from '@solidoc/fluid-model-base';

class SlateFluidModel extends BaseFluidModel {
  subscribe(id: string) {
    throw new Error('Method not implemented.');
  }

  unsubscribe(id: string): void {
    throw new Error('Method not implemented.');
  }

  apply<T extends IOperation>(op: T) {
    throw new Error('Method not implemented.');
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
    //TODO createDDS
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
    //TODO 注册event-handler
  }
}

export { SlateFluidModel };
