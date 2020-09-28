import { Path } from '../types/path';
import { Node, Operation } from 'slate';

export function createSetNodeOperation(
  path: Path,
  properties: Partial<Node>,
  newProperties: Partial<Node>,
): Operation {
  return { type: 'set_node', path, properties, newProperties };
}
