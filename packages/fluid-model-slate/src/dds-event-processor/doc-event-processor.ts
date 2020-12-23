import { EventProcessor } from '@solidoc/fluid-model-base';
import { Operation } from '@solidoc/slate';
import { textSequenceDeltaEventProcessor } from './processor';
import { nodeValueChangedEventProcessor } from './processor';
import {
  localChildrenSequenceDeltaEventProcessor,
  remoteChildrenSequenceDeltaEventProcessor,
} from './processor';

const docEventprocessor: EventProcessor<Operation> = {
  local: {
    SharedString: textSequenceDeltaEventProcessor,
    SharedMap: nodeValueChangedEventProcessor,
    SharedObjectSequence: localChildrenSequenceDeltaEventProcessor,
  },
  remote: {
    SharedString: textSequenceDeltaEventProcessor,
    SharedMap: nodeValueChangedEventProcessor,
    SharedObjectSequence: remoteChildrenSequenceDeltaEventProcessor,
  },
};

export { docEventprocessor };
