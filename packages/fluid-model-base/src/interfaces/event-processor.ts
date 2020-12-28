import { SharedMap } from '@fluidframework/map';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { SharedObjectSequence, SharedString } from '@fluidframework/sequence';
import { IValueChanged } from '@fluidframework/map';
import { ISequencedDocumentMessage } from '@fluidframework/protocol-definitions';
import { SequenceDeltaEvent } from '@fluidframework/sequence';
import { BaseFluidModel } from '../base-model';

type ProcessorContext<T> = {
  model: BaseFluidModel<T>;
  targetPath: number[];
};

interface EventProcessor<T> {
  local: {
    SharedString: (
      event: SequenceDeltaEvent,
      target: SharedString,
      root: SharedObjectSequence<IFluidHandle<SharedMap>>,
      context: ProcessorContext<T>,
    ) => T[];
    SharedMap: (
      event: IValueChanged,
      op: ISequencedDocumentMessage,
      target: SharedMap,
      root: SharedObjectSequence<IFluidHandle<SharedMap>>,
      context: ProcessorContext<T>,
    ) => T[];
    SharedObjectSequence: (
      event: SequenceDeltaEvent,
      target: SharedObjectSequence<IFluidHandle<SharedMap>>,
      root: SharedObjectSequence<IFluidHandle<SharedMap>>,
      context: ProcessorContext<T>,
    ) => T[];
  };
  remote: {
    SharedString: (
      event: SequenceDeltaEvent,
      target: SharedString,
      root: SharedObjectSequence<IFluidHandle<SharedMap>>,
      context: ProcessorContext<T>,
    ) => T[] | Promise<T[]>;
    SharedMap: (
      event: IValueChanged,
      op: ISequencedDocumentMessage,
      target: SharedMap,
      root: SharedObjectSequence<IFluidHandle<SharedMap>>,
      context: ProcessorContext<T>,
    ) => T[] | Promise<T[]>;
    SharedObjectSequence: (
      event: SequenceDeltaEvent,
      target: SharedObjectSequence<IFluidHandle<SharedMap>>,
      root: SharedObjectSequence<IFluidHandle<SharedMap>>,
      context: ProcessorContext<T>,
    ) => T[] | Promise<T[]>;
  };
}

export { EventProcessor, ProcessorContext };
