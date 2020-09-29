import {
  bindFluidNodeEvent,
  fluidNodePropertyEventBinder,
  registerOperationReceiver,
} from '../../src/dds-event-processor/binder';

import {
  buildNetSharedMap,
  buildNetSharedString,
} from './networked-dds-builder';
import { initOperationActor } from '../operation-applier/operation-actor';
import { FLUIDNODE_KEYS } from '../../src/interfaces';
import { getChildren } from '../../src/operation-applier/node-getter';
import { FluidNodeHandle } from '../../src/types';

describe('dds event processor', () => {
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

  describe('shared map value changed event', () => {
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

  describe('shared string value changed event', () => {
    it('should trigger operation with insert text op when SharedString insert text', async () => {
      const {
        maps: [str1, str2],
        sendMessage,
      } = await buildNetSharedString();

      fluidNodePropertyEventBinder(str1, initOperationActor().root);

      str2.insertText(0, 'text');
      sendMessage();

      await receiverPromise;

      expect(operationReceiverMock).toBeCalledWith({
        offset: 0,
        text: 'text',
        path: [],
        type: 'insert_text',
      });
    });
  });
});
