import { SharedObjectSequence } from '@fluidframework/sequence';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { SharedMap } from '@fluidframework/map';

const getNode = async (
  path: number[],
  children: SharedObjectSequence<IFluidHandle<SharedMap>>,
): Promise<SharedMap> => {
  const [index, ...rest] = path;

  if (!index) {
    throw 'can not get effective index to get node!';
  }

  if (rest.length === 0) {
    return await children.getRange(index, index + 1)[0].get();
  }

  const map = await children.getRange(index, index + 1)[0].get();
  return await getNode(rest, map.get('children'));
};

export { getNode };
