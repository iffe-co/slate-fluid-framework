import { FLUIDNODE_KEYS } from '../../interfaces';
import { FluidNode, FluidNodeChildren } from '../../types';
import { Path } from '../../interfaces/path';
import { IValueChanged, SharedMap } from '@fluidframework/map';
import { ISequencedDocumentMessage } from '@fluidframework/protocol-definitions';
import { Operation } from '@solidoc/slate';
import { createSetNodeOperation } from '../slate-operation-factory';
import {
  getChildrenFromCacheByHandle,
  getNodeFromCacheByHandle,
} from '../../dds-cache';
import { SharedObjectSequence } from '@fluidframework/sequence';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { ProcessorContext } from '@solidoc/fluid-model-base';

const noChangedKey = [FLUIDNODE_KEYS.TEXT, FLUIDNODE_KEYS.CHILDREN];

function getTargetSharedMapPathFromRoot(
  node: FluidNode,
  root: FluidNodeChildren,
  path: Path = [],
): Path | undefined {
  for (let i = 0; i < root.getLength(); i++) {
    const [nodeHandle] = root.getRange(i, i + 1);
    const needCheckNode = getNodeFromCacheByHandle(nodeHandle);
    const isTextNode = !needCheckNode.get(FLUIDNODE_KEYS.CHILDREN);
    if (isTextNode) {
      if (needCheckNode.id === (node.handle as any).path) {
        return [...path, i];
      } else {
        continue;
      }
    } else {
      if (needCheckNode.id === (node.handle as any).path) {
        return [...path, i];
      }

      const children = getChildrenFromCacheByHandle(
        needCheckNode.get(FLUIDNODE_KEYS.CHILDREN),
      );

      const res = getTargetSharedMapPathFromRoot(node, children, [...path, i]);
      if (!res) {
        continue;
      } else {
        return res;
      }
    }
  }
  return undefined;
}

function nodeValueChangedEventProcessor(
  event: IValueChanged,
  op: ISequencedDocumentMessage,
  target: SharedMap,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
  { targetPath }: ProcessorContext<Operation, IFluidHandle<SharedMap>>,
): Operation[] {
  const type = (op && op.contents.type) || 'set';
  if (type === 'set' && !noChangedKey.includes(event.key as FLUIDNODE_KEYS)) {
    const properties = { [event.key]: event.previousValue };
    const newProperties = { [event.key]: target.get(event.key) };
    return [createSetNodeOperation(targetPath, properties, newProperties)];
  }
  return [];
}
export { nodeValueChangedEventProcessor, getTargetSharedMapPathFromRoot };
