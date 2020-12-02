import { FluidNode, FluidNodeChildren, FluidNodeProperty } from '../types';
import { IValueChanged } from '@fluidframework/map';
import { ISequencedDocumentMessage } from '@fluidframework/protocol-definitions';
import { SequenceDeltaEvent } from '@fluidframework/sequence';
import { Operation } from '@solidoc/slate';
import {
  textSequenceDeltaEventProcessor,
  nodeValueChangedEventProcessor,
} from './processor';
import { childrenSequenceDeltaEventProcessor } from './processor/children-value-changed-event-processor';
import { ddsChangesQueue } from '../dds-changes-queue';
import { operationCollector } from './operations-collector';

type OperationReceiver = (op: Operation) => void;
const operationTransmitter: OperationReceiver[] = [];
const registerOperationReceiver = (receiver: OperationReceiver) =>
  operationTransmitter.push(receiver);

function bindFluidNodeEvent(fluidNode: FluidNode, root: FluidNodeChildren) {
  if (fluidNode.listenerCount('valueChanged') !== 0) {
    // console.log('duplicated bind');
    return;
  }
  fluidNode.on(
    'valueChanged',
    (
      event: IValueChanged,
      local: boolean,
      op: ISequencedDocumentMessage,
      target: FluidNode,
    ) => {
      const slateOp = nodeValueChangedEventProcessor(event, op, target, root);
      if (slateOp) {
        if (local) {
          operationCollector.add(root.id, [slateOp]);
        } else {
          console.log('valueChanged op');
          ddsChangesQueue.addOperationResolver({
            key: root.id,
            resolver: Promise.resolve([slateOp]),
          });
        }
      }
    },
  );
}

function fluidNodePropertyEventBinder(
  fluidNodeProperty: FluidNodeProperty,
  root: FluidNodeChildren,
) {
  if (fluidNodeProperty.listenerCount('sequenceDelta') !== 0) {
    // console.warn('duplicated bind');
    return;
  }
  fluidNodeProperty.on(
    'sequenceDelta',
    (event: SequenceDeltaEvent, target: FluidNodeProperty) => {
      const slateOps = textSequenceDeltaEventProcessor(event, target, root);
      if (event.isLocal) {
        operationCollector.add(root.id, slateOps);
      } else {
        console.log('sequenceDelta op');
        ddsChangesQueue.addOperationResolver({
          key: root.id,
          resolver: Promise.resolve(slateOps),
        });
      }
    },
  );
}

function fluidNodeChildrenEventBinder(
  fluidNodeChildren: FluidNodeChildren,
  root: FluidNodeChildren,
) {
  if (fluidNodeChildren.listenerCount('sequenceDelta') !== 0) {
    // console.log('duplicated bind');
    return;
  }
  fluidNodeChildren.on(
    'sequenceDelta',
    (event: SequenceDeltaEvent, target: FluidNodeChildren) => {
      const result = childrenSequenceDeltaEventProcessor(event, target, root);
      if (result instanceof Array) {
        operationCollector.add(root.id, result);
      } else {
        console.log('sequenceDelta op');

        ddsChangesQueue.addOperationResolver({
          key: root.id,
          resolver: result,
        });
      }
    },
  );
}

export {
  bindFluidNodeEvent,
  fluidNodeChildrenEventBinder,
  fluidNodePropertyEventBinder,
  registerOperationReceiver,
};
