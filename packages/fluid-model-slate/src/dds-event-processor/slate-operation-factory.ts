import { Path } from '../types/path';
import { Node, Operation } from 'slate';

export function createSetNodeOperation(
  path: Path,
  properties: Partial<Node>,
  newProperties: Partial<Node>,
): Operation {
  return { type: 'set_node', path, properties, newProperties };
}

export function createInsertTextOperation(
  path: Path,
  text: string,
  offset: number,
): Operation {
  return { type: 'insert_text', path, offset, text };
}

export function createRemoveTextOperation(
  path: Path,
  text: string,
  offset: number,
): Operation {
  return { type: 'remove_text', path, offset, text };
}

export function createInsertNodeOperation(path: Path, opData: any): Operation {
  return { type: 'insert_node', path, node: opData };
}
