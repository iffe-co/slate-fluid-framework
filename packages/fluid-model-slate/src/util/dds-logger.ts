import { FluidNodeChildren, FluidNodeHandle } from '../types';
import { FLUIDNODE_KEYS } from '../interfaces';

export async function getDDSesTreeInfo(root: FluidNodeChildren) {
  return await recordChildrenInfo(root);
}

async function recordNodeInfo(nodeHandle: FluidNodeHandle) {
  const res = { nodeAbsPath: nodeHandle.absolutePath };
  const node = await nodeHandle.get();
  if (node.has(FLUIDNODE_KEYS.TEXT)) {
    let textHandle = node.get(FLUIDNODE_KEYS.TEXT);
    res['text'] = await textHandle.get();
    res['textAbsPath'] = textHandle.absolutePath;
  } else {
    let childrenHandle = node.get(FLUIDNODE_KEYS.CHILDREN);
    const children = await childrenHandle.get();
    res['childrenAbsPath'] = childrenHandle.absolutePath;
    res['children'] = await recordChildrenInfo(children);
  }
  return res;
}
async function recordChildrenInfo(children: FluidNodeChildren) {
  return Promise.all(
    children.getRange(0).map(nh => {
      return recordNodeInfo(nh);
    }),
  );
}
