import { IValueChanged } from '@fluidframework/map';
import { ISequencedDocumentMessage } from '@fluidframework/protocol-definitions';
import { FluidNode } from '../types';
import { FLUIDNODE_KEYS } from '../interfaces';
import { createSetNodeOperation } from './slate-operation-factory';
import { Operation } from 'slate';

const noChangedKey = [FLUIDNODE_KEYS.TEXT, FLUIDNODE_KEYS.CHILDREN];

function processFluidNodeValueChangedEvent(
  event: IValueChanged,
  local: boolean,
  op: ISequencedDocumentMessage,
  target: FluidNode,
): Operation | undefined {
  if (local) {
    return;
  }
  const type = op.contents.type;
  if (type === 'set' && !noChangedKey.includes(event.key as FLUIDNODE_KEYS)) {
    const path: number[] = [];
    const properties = { key: target.get(event.key) };
    const newProperties = { key: target.get(event.key) };
    const op = createSetNodeOperation(path, properties, newProperties);
    return op;
  }
  return;
}

export { processFluidNodeValueChangedEvent };
