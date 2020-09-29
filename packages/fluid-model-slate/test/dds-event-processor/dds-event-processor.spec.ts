import {
  bindFluidNodeEvent,
  registerOperationReceiver,
} from '../../src/dds-event-processor/binder';

import { buildNetSharedMap } from './networked-dds-builder';
import { initOperationActor } from '../operation-applier/operation-actor';
import { FLUIDNODE_KEYS } from '../../src/interfaces';
import { getChildren } from '../../src/operation-applier/node-getter';
import { FluidNodeHandle } from '../../src/types';

describe('dds event processor', () => {
  describe('shared map value changed event', () => {
    let operationReceiverMock: jest.Mock;
    let receiverPromise: Promise<void>;

    beforeEach(() => {
      operationReceiverMock = jest.fn();
      receiverPromise = new Promise((resolve, reject) => {
        registerOperationReceiver(op => {
          operationReceiverMock(op);
          resolve();
        });
      });
    });

    afterEach(() => {
      operationReceiverMock.mockRestore();
    });

    it('should trigger operation receiver with set node op when obtain a set SharedMap op', async () => {
      const {
        maps: [map, map2],
        sendMessage,
      } = await buildNetSharedMap();

      bindFluidNodeEvent(map, initOperationActor().root);

      map2.set('newKey', 'new value');

      sendMessage();

      await receiverPromise;

      expect(operationReceiverMock).toBeCalledWith({
        newProperties: { newKey: 'new value' },
        path: [],
        properties: { newKey: 'new value' },
        type: 'set_node',
      });
    });

    it('should trigger operation receiver with correct path when obtain a set SharedMap op', async () => {
      const {
        maps: [map, map2],
        sendMessage,
      } = await buildNetSharedMap();

      const operationActor = await initOperationActor()
        .splitNode([0, 0], 2, {})
        .insertSequenceNode([0, 2])
        .execute();

      bindFluidNodeEvent(map, operationActor.root);

      const [node_02] = await operationActor.getNode([0, 2]).values();

      const node_02_children = await getChildren(node_02);

      node_02_children.insert(0, [<FluidNodeHandle>map.handle]);

      map2.set(FLUIDNODE_KEYS.TITALIC, false);

      sendMessage();

      await receiverPromise;

      expect(operationReceiverMock).toBeCalledWith({
        newProperties: { [FLUIDNODE_KEYS.TITALIC]: false },
        path: [0, 2, 0],
        properties: { [FLUIDNODE_KEYS.TITALIC]: false },
        type: 'set_node',
      });
    });
  });
});
