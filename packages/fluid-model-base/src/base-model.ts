import { DataObject } from '@fluidframework/aqueduct';
import { IBaseFluidModel, IOperation } from './interfaces';

abstract class BaseFluidModel extends DataObject implements IBaseFluidModel {
  abstract subscribe(id: string): any;

  abstract unsubscribe(id: string): void;

  abstract async apply<T extends IOperation>(op: T): Promise<void>;
}

export { BaseFluidModel };
