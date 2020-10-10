import {
  bindFluidNodeEvent,
  fluidNodeChildrenEventBinder,
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
import { SharedMap } from '@fluidframework/map';
import { buildE2eSharedObjectSequence } from './e2e-dds-builder';
import { mockRuntime, restoreDdsCreate } from '../operation-applier/mocker';
import { SharedObjectSequence, SharedString } from '@fluidframework/sequence';

describe('dds event processor', () => {
  const getMockerAndAwaiter = (): [jest.Mock, Promise<any>] => {
    const operationReceiverMock = jest.fn();
    const receiverPromise = new Promise((resolve, reject) => {
      registerOperationReceiver(op => {
        operationReceiverMock(op);
        resolve();
      });
    });
    return [operationReceiverMock, receiverPromise];
  };

  describe('shared map value changed event', () => {
    it('should trigger operation receiver with set node op when obtain a set SharedMap op', async () => {
      const [operationReceiverMock, receiverPromise] = getMockerAndAwaiter();
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
      const [operationReceiverMock, receiverPromise] = getMockerAndAwaiter();

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
    it('should trigger operation receiver with insert text op when SharedString insert text', async () => {
      const [operationReceiverMock, receiverPromise] = getMockerAndAwaiter();

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

    it('should trigger operation receiver with remove text op when SharedString remove text', async () => {
      const [operationReceiverMock, receiverPromise] = getMockerAndAwaiter();

      const {
        maps: [str1, str2],
        sendMessage,
      } = await buildNetSharedString();

      str2.insertText(0, 'text');
      sendMessage();

      fluidNodePropertyEventBinder(str1, initOperationActor().root);

      str2.removeText(1, 3);
      sendMessage();

      await receiverPromise;

      expect(operationReceiverMock).toBeCalledWith({
        offset: 1,
        text: 'ex',
        path: [],
        type: 'remove_text',
      });
    });

    it('should trigger operation receiver with correct path when SharedString insert text', async () => {
      const [operationReceiverMock, receiverPromise] = getMockerAndAwaiter();

      const {
        maps: [str1, str2],
        sendMessage,
      } = await buildNetSharedString();
      const map = SharedMap.create(mockRuntime);
      map.set(FLUIDNODE_KEYS.TEXT, str1.handle);

      const operationActor = await initOperationActor()
        .insertSequenceNode([0, 1])
        .execute();
      const [node_0_1] = await operationActor.getNode([0, 1]).values();
      const children = await getChildren(node_0_1);
      children.insert(0, [<FluidNodeHandle>map.handle]);

      fluidNodePropertyEventBinder(str1, operationActor.root);

      str2.insertText(0, 'test path text');
      sendMessage();

      await receiverPromise;

      const [textAfterInsert] = await operationActor
        .getNodeText([0, 1, 0])
        .values();

      expect(operationReceiverMock).toBeCalledWith({
        offset: 0,
        text: 'test path text',
        path: [0, 1, 0],
        type: 'insert_text',
      });

      expect(textAfterInsert).toEqual('test path text');
    });

    it('should trigger operation receiver with op twice when SharedString replace text', async () => {
      const [operationReceiverMock, receiverPromise] = getMockerAndAwaiter();
      const {
        maps: [str1, str2],
        sendMessage,
      } = await buildNetSharedString();

      str2.insertText(0, 'text');
      sendMessage();

      fluidNodePropertyEventBinder(str1, initOperationActor().root);

      str2.replaceText(1, 3, 'gg');
      sendMessage();

      await receiverPromise;
      expect(operationReceiverMock).toBeCalledTimes(2);
      expect(operationReceiverMock.mock.calls).toEqual([
        [
          {
            offset: 3,
            path: [],
            text: 'gg',
            type: 'insert_text',
          },
        ],
        [
          {
            offset: 1,
            path: [],
            text: 'ex',
            type: 'remove_text',
          },
        ],
      ]);
    });
  });

  describe('shared object sequence value changed event', () => {
    const setUpTest = async () => {
      restoreDdsCreate();
      const [operationReceiverMock, receiverPromise] = getMockerAndAwaiter();

      const {
        dds: [seq1, seq2],
        runtime: [rt1, rt2],
        syncDds,
        close,
      } = await buildE2eSharedObjectSequence();

      const operationActor = initOperationActor(rt2);
      const root = operationActor.root;

      const seqNode01 = SharedMap.create(rt2);
      seqNode01.set(FLUIDNODE_KEYS.CHILDREN, seq2.handle);

      root.insert(1, [<FluidNodeHandle>seqNode01.handle]);

      fluidNodeChildrenEventBinder(seq1, operationActor.root);

      return {
        seq1,
        seq2,
        rt1,
        rt2,
        syncDds,
        close,
        operationReceiverMock,
        receiverPromise,
      };
    };

    it('should trigger operation receiver with insert node when insert a new children', async () => {
      const {
        rt2,
        seq1,
        syncDds,
        seq2,
        close,
        receiverPromise,
        operationReceiverMock,
      } = await setUpTest();

      const node = SharedMap.create(rt2);
      node.set(FLUIDNODE_KEYS.TITALIC, true);

      seq2.insert(0, [<FluidNodeHandle>node.handle]);
      await syncDds(2);

      await receiverPromise;

      const node01 = await seq1.getRange(0, 1)[0].get();

      expect(node01.get(FLUIDNODE_KEYS.TITALIC)).toBeTruthy();

      expect(operationReceiverMock).toBeCalledWith({
        path: [1, 0],
        node: { [FLUIDNODE_KEYS.TITALIC]: true },
        type: 'insert_node',
      });

      await close();
    });

    it('should trigger operation receiver with correct op when insert text node', async () => {
      const {
        rt2,
        seq1,
        syncDds,
        seq2,
        close,
        receiverPromise,
        operationReceiverMock,
      } = await setUpTest();

      const node = SharedMap.create(rt2);
      const text = SharedString.create(rt2);
      text.insertText(0, 'hello world');
      node.set(FLUIDNODE_KEYS.TEXT, text.handle);

      seq2.insert(0, [<FluidNodeHandle>node.handle]);

      await syncDds(2);

      await receiverPromise;

      expect(operationReceiverMock).toBeCalledWith({
        path: [1, 0],
        node: { [FLUIDNODE_KEYS.TEXT]: 'hello world' },
        type: 'insert_node',
      });

      await close();
    });

    it('should trigger operation receiver with correct op when insert tree node', async () => {
      const {
        rt2,
        seq1,
        syncDds,
        seq2,
        close,
        receiverPromise,
        operationReceiverMock,
      } = await setUpTest();

      const node = SharedMap.create(rt2);
      const text = SharedString.create(rt2);
      text.insertText(0, 'hello world');
      node.set(FLUIDNODE_KEYS.TEXT, text.handle);

      const children = SharedObjectSequence.create(rt2);
      const childrenNode = SharedMap.create(rt2);
      const childrenText = SharedString.create(rt2);
      childrenText.insertText(0, 'children hello world');
      childrenNode.set(FLUIDNODE_KEYS.TEXT, childrenText.handle);
      children.insert(0, [childrenNode.handle]);
      node.set(FLUIDNODE_KEYS.CHILDREN, children.handle);

      node.set(FLUIDNODE_KEYS.TYPE, 'paragraph');

      seq2.insert(0, [<FluidNodeHandle>node.handle]);

      await syncDds(2);

      await receiverPromise;

      expect(operationReceiverMock).toBeCalledWith({
        path: [1, 0],
        node: {
          [FLUIDNODE_KEYS.TEXT]: 'hello world',
          [FLUIDNODE_KEYS.TYPE]: 'paragraph',
          [FLUIDNODE_KEYS.CHILDREN]: [
            {
              [FLUIDNODE_KEYS.TEXT]: 'children hello world',
            },
          ],
        },
        type: 'insert_node',
      });

      await close();
    });

    it('should trigger operation receiver with correct op when remove a node', async () => {
      const {
        rt2,
        seq1,
        syncDds,
        seq2,
        close,
        receiverPromise,
        operationReceiverMock,
      } = await setUpTest();

      const node = SharedMap.create(rt2);
      node.set(FLUIDNODE_KEYS.TITALIC, true);

      seq2.insert(0, [<FluidNodeHandle>node.handle]);
      await syncDds(2);

      await receiverPromise;

      seq2.remove(0, 1);

      await syncDds(2);

      await receiverPromise;

      expect(operationReceiverMock).toHaveBeenNthCalledWith(2, {
        path: [1, 0],
        type: 'remove_node',
      });

      await close();
    });

    it('should trigger operation receiver with multiple op when remove range node', async () => {
      const {
        rt2,
        seq1,
        syncDds,
        seq2,
        close,
        receiverPromise,
        operationReceiverMock,
      } = await setUpTest();

      const node = SharedMap.create(rt2);
      node.set(FLUIDNODE_KEYS.TITALIC, true);
      const node2 = SharedMap.create(rt2);
      node2.set(FLUIDNODE_KEYS.TITALIC, true);

      seq2.insert(0, [<FluidNodeHandle>node.handle, <FluidNodeHandle>node2.handle]);
      await syncDds(2);

      await receiverPromise;

      seq2.remove(0, 2);

      await syncDds(2);

      await receiverPromise;

      expect(operationReceiverMock).toHaveBeenNthCalledWith(3, {
        path: [1, 0],
        type: 'remove_node',
      });

      expect(operationReceiverMock).toHaveBeenNthCalledWith(4, {
        path: [1, 1],
        type: 'remove_node',
      });

      await close();
    });
  });
});
