import { FluidNode, FluidNodeChildren, FluidNodeProperty } from '../types';
import { IValueChanged } from '@fluidframework/map';
import { ISequencedDocumentMessage } from '@fluidframework/protocol-definitions';
import { SequenceDeltaEvent } from '@fluidframework/sequence';
import { Operation } from 'slate';
import {
  textSequenceDeltaEventProcessor,
  nodeValueChangedEventProcessor,
} from './processor';
import { childrenSequenceDeltaEventProcessor } from './processor/children-value-changed-event-processor';

type OperationReceiver = (op: Operation) => void;
const operationTransmitter: OperationReceiver[] = [];
const registerOperationReceiver = (receiver: OperationReceiver) =>
  operationTransmitter.push(receiver);
const broadcastOp = (op: Operation) => operationTransmitter.forEach(t => t(op));

function bindFluidNodeEvent(fluidNode: FluidNode, root: FluidNodeChildren) {
  fluidNode.on(
    'valueChanged',
    async (
      event: IValueChanged,
      local: boolean,
      op: ISequencedDocumentMessage,
      target: FluidNode,
    ) => {
      const slateOp = await nodeValueChangedEventProcessor(
        event,
        local,
        op,
        target,
        root,
      );
      if (slateOp) {
        broadcastOp(slateOp);
      }
    },
  );
}

function fluidNodePropertyEventBinder(
  fluidNodeProperty: FluidNodeProperty,
  root: FluidNodeChildren,
) {
  fluidNodeProperty.on(
    'sequenceDelta',
    async (event: SequenceDeltaEvent, target: FluidNodeProperty) => {
      const slateOps = await textSequenceDeltaEventProcessor(
        event,
        target,
        root,
      );
      if (slateOps) {
        slateOps.forEach(broadcastOp);
      }
    },
  );
}

function fluidNodeChildrenEventBinder(
  fluidNodeChildren: FluidNodeChildren,
  root: FluidNodeChildren,
) {
  fluidNodeChildren.on(
    'sequenceDelta',
    async (event: SequenceDeltaEvent, target: FluidNodeChildren) => {
      const slateOps = await childrenSequenceDeltaEventProcessor(
        event,
        target,
        root,
      );
      if (slateOps) {
        slateOps.forEach(broadcastOp);
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
