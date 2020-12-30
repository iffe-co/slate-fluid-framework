import { SharedMap } from '@fluidframework/map';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { SharedObjectSequence, SharedString } from '@fluidframework/sequence';
import { IValueChanged } from '@fluidframework/map';
import { ISequencedDocumentMessage } from '@fluidframework/protocol-definitions';
import { SequenceDeltaEvent } from '@fluidframework/sequence';
import { BaseFluidModel } from '../base-model';

type ProcessorContext<T, D = object> = {
  model: BaseFluidModel<T, D>;
  targetPath: number[];
};

interface EventProcessor<T, D = object> {
  local: {
    SharedString: (
      event: SequenceDeltaEvent,
      target: SharedString,
      root: SharedObjectSequence<IFluidHandle<SharedMap>>,
      context: ProcessorContext<T, D>,
    ) => T[];
    SharedMap: (
      event: IValueChanged,
      op: ISequencedDocumentMessage,
      target: SharedMap,
      root: SharedObjectSequence<IFluidHandle<SharedMap>>,
      context: ProcessorContext<T, D>,
    ) => T[];
    SharedObjectSequence: (
      event: SequenceDeltaEvent,
      target: SharedObjectSequence<D>,
      root: SharedObjectSequence<D>,
      context: ProcessorContext<T, D>,
    ) => T[];
  };
  remote: {
    SharedString: (
      event: SequenceDeltaEvent,
      target: SharedString,
      root: SharedObjectSequence<IFluidHandle<SharedMap>>,
      context: ProcessorContext<T, D>,
    ) => T[] | Promise<T[]>;
    SharedMap: (
      event: IValueChanged,
      op: ISequencedDocumentMessage,
      target: SharedMap,
      root: SharedObjectSequence<IFluidHandle<SharedMap>>,
      context: ProcessorContext<T, D>,
    ) => T[] | Promise<T[]>;
    SharedObjectSequence: (
      event: SequenceDeltaEvent,
      target: SharedObjectSequence<D>,
      root: SharedObjectSequence<D>,
      context: ProcessorContext<T, D>,
    ) => T[] | Promise<T[]>;
  };
}

export { EventProcessor, ProcessorContext };
