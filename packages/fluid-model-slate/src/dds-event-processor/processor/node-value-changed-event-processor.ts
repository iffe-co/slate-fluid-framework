import { FLUIDNODE_KEYS } from '../../interfaces';
import { FluidNode, FluidNodeChildren } from '../../types';
import { Path } from '../../types/path';
import { IValueChanged } from '@fluidframework/map';
import { ISequencedDocumentMessage } from '@fluidframework/protocol-definitions';
import { Operation } from '@solidoc/slate';
import { createSetNodeOperation } from '../slate-operation-factory';
import {
  getChildrenFromCacheByHandle,
  getNodeFromCacheByHandle,
} from '../../dds-cache';

const noChangedKey = [FLUIDNODE_KEYS.TEXT, FLUIDNODE_KEYS.CHILDREN];

function getPathFromRoot(
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

      const res = getPathFromRoot(node, children, [...path, i]);
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
  local: boolean,
  op: ISequencedDocumentMessage,
  target: FluidNode,
  root: FluidNodeChildren,
): Operation | undefined {
  if (local) {
    return;
  }
  const type = op.contents.type;
  if (type === 'set' && !noChangedKey.includes(event.key as FLUIDNODE_KEYS)) {
    const path = getPathFromRoot(target, root) || [];
    const properties = { [event.key]: event.previousValue };
    const newProperties = { [event.key]: target.get(event.key) };
    return createSetNodeOperation(path, properties, newProperties);
  }
  return;
}
export { nodeValueChangedEventProcessor };
