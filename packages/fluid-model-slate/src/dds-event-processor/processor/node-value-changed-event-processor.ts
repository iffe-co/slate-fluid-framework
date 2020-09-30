import { FLUIDNODE_KEYS } from '../../interfaces';
import { FluidNode, FluidNodeChildren, FluidNodeProperty } from '../../types';
import { Path } from '../../types/path';
import { getChildren } from '../../operation-applier/node-getter';
import { IValueChanged } from '@fluidframework/map';
import { ISequencedDocumentMessage } from '@fluidframework/protocol-definitions';
import { Operation } from 'slate';
import { createSetNodeOperation } from '../slate-operation-factory';

const noChangedKey = [FLUIDNODE_KEYS.TEXT, FLUIDNODE_KEYS.CHILDREN];

async function getPathFromRoot(
  node: FluidNode,
  root: FluidNodeChildren,
  path: Path = [],
): Promise<Path | undefined> {
  for (let i = 0; i < root.getLength(); i++) {
    const [nodeHandle] = root.getRange(i, i + 1);
    const needCheckNode = await nodeHandle.get();
    const isTextNode = !needCheckNode.get(FLUIDNODE_KEYS.CHILDREN);
    if (isTextNode) {
      if (needCheckNode.id === (node.handle as any).path) {
        return [...path, i];
      } else {
        continue;
      }
    } else {
      const children = await getChildren(needCheckNode);

      const res = await getPathFromRoot(node, children, [...path, i]);
      if (!res) {
        continue;
      } else {
        return res;
      }
    }
  }
  return undefined;
}

async function nodeValueChangedEventProcessor(
  event: IValueChanged,
  local: boolean,
  op: ISequencedDocumentMessage,
  target: FluidNode,
  root: FluidNodeChildren,
): Promise<Operation | undefined> {
  if (local) {
    return;
  }
  const type = op.contents.type;
  if (type === 'set' && !noChangedKey.includes(event.key as FLUIDNODE_KEYS)) {
    const path = (await getPathFromRoot(target, root)) || [];
    const properties = { [event.key]: target.get(event.key) };
    const newProperties = { [event.key]: target.get(event.key) };
    const op = createSetNodeOperation(path, properties, newProperties);
    return op;
  }
  return;
}
export { nodeValueChangedEventProcessor };
