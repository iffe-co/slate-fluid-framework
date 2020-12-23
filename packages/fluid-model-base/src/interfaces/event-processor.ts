import { SharedMap } from '@fluidframework/map';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { SharedObjectSequence, SharedString } from '@fluidframework/sequence';
import { IValueChanged } from '@fluidframework/map';
import { ISequencedDocumentMessage } from '@fluidframework/protocol-definitions';
import { SequenceDeltaEvent } from '@fluidframework/sequence';
import { BaseFluidModel } from '../base-model';

interface EventProcessor<T> {
  local: {
    SharedString: (
      event: SequenceDeltaEvent,
      target: SharedString,
      root: SharedObjectSequence<IFluidHandle<SharedMap>>,
    ) => T[];
    SharedMap: (
      event: IValueChanged,
      op: ISequencedDocumentMessage,
      target: SharedMap,
      root: SharedObjectSequence<IFluidHandle<SharedMap>>,
    ) => T[];
    SharedObjectSequence: (
      event: SequenceDeltaEvent,
      target: SharedObjectSequence<IFluidHandle<SharedMap>>,
      root: SharedObjectSequence<IFluidHandle<SharedMap>>,
    ) => T[];
  };
  remote: {
    SharedString: (
      event: SequenceDeltaEvent,
      target: SharedString,
      root: SharedObjectSequence<IFluidHandle<SharedMap>>,
    ) => T[] | Promise<T[]>;
    SharedMap: (
      event: IValueChanged,
      op: ISequencedDocumentMessage,
      target: SharedMap,
      root: SharedObjectSequence<IFluidHandle<SharedMap>>,
    ) => T[] | Promise<T[]>;
    SharedObjectSequence: (
      event: SequenceDeltaEvent,
      target: SharedObjectSequence<IFluidHandle<SharedMap>>,
      root: SharedObjectSequence<IFluidHandle<SharedMap>>,
      model?: BaseFluidModel<T>,
    ) => T[] | Promise<T[]>;
  };
}

export { EventProcessor };
