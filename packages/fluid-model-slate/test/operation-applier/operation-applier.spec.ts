import * as mocks from '@fluidframework/test-runtime-utils';
import {
  SharedObjectSequence,
  SharedObjectSequenceFactory,
  SharedString,
  SharedStringFactory,
} from '@fluidframework/sequence';
import { SharedMap } from '@fluidframework/map';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { Operation } from 'slate';
import uuid from 'uuid';

import { getNode } from '../../src/operation-applier/node-getter';
import { operationApplier } from '../../src/operation-applier';
import { FLUIDNODE_KEYS } from '../../src/interfaces';
import { FluidNodeChildren, FluidNodeHandle } from '../../src/types';

SharedString.create = runtime =>
  new SharedString(runtime, uuid.v4(), SharedStringFactory.Attributes);
SharedMap.create = runtime =>
  new SharedMap(uuid.v4(), runtime, SharedMap.getFactory().attributes);
SharedObjectSequence.create = runtime =>
  new SharedObjectSequence(
    runtime,
    uuid.v4(),
    SharedObjectSequenceFactory.Attributes,
  );

describe('operation applier', () => {
  const mockRuntime: mocks.MockFluidDataStoreRuntime = new mocks.MockFluidDataStoreRuntime();

  const applyOp = async (splitTextOp: Operation, root: FluidNodeChildren) => {
    await operationApplier[splitTextOp.type](splitTextOp, root, mockRuntime);
  };

  const initNode = (childrenNode?: SharedMap[]) => {
    const node = new SharedMap(
      uuid.v4(),
      mockRuntime,
      SharedMap.getFactory().attributes,
    );

    if (childrenNode) {
      const childSequence = new SharedObjectSequence<FluidNodeHandle>(
        mockRuntime,
        uuid.v4(),
        SharedObjectSequenceFactory.Attributes,
      );
      childSequence.insert(
        0,
        childrenNode.map(v => <FluidNodeHandle>v.handle),
      );
      node.set(FLUIDNODE_KEYS.CHILDREN, childSequence.handle);
    } else {
      const text = new SharedString(
        mockRuntime,
        uuid.v4(),
        SharedStringFactory.Attributes,
      );
      text.insertText(0, 'This default text');
      node.set(FLUIDNODE_KEYS.TEXT, text.handle);
    }

    return node;
  };

  const initEditorRoot = () => {
    const root = new SharedObjectSequence<FluidNodeHandle>(
      mockRuntime,
      uuid.v4(),
      SharedObjectSequenceFactory.Attributes,
    );
    const node_0_0 = initNode();
    const node_0 = initNode([node_0_0]);
    root.insert(0, [<FluidNodeHandle>node_0.handle]);
    return root;
  };

  const getNodeText = async (
    root: FluidNodeChildren,
    path: number[],
  ): Promise<string> => {
    return await getNodeProperties(root, path, FLUIDNODE_KEYS.TEXT);
  };

  const getNodeProperties = async (
    root: FluidNodeChildren,
    path: number[],
    key: string,
    isHandleProperty: boolean = true,
  ) => {
    const resultNode = await getNode(path, root);
    if (!isHandleProperty) {
      return resultNode.get(key);
    }
    const valueHandle = resultNode.get<IFluidHandle<SharedString>>(key);
    const expectValueShareString = await valueHandle.get();
    return expectValueShareString.getText();
  };

  describe('insert node operation', () => {
    it('should insert a element to path when apply a insert node op', async () => {
      const root = initEditorRoot();

      const insertOp = {
        type: 'insert_node',
        path: [0, 1],
        node: {
          text: 'The first node',
        },
      };

      await operationApplier[insertOp.type](insertOp, root, mockRuntime);

      const expectText = await getNodeText(root, [0, 1]);

      expect(expectText).toEqual('The first node');
    });
  });

  describe('insert text operation', () => {
    it('should insert text from a exist node', async () => {
      const root = initEditorRoot();

      const insertTextOp = {
        type: 'insert_text',
        offset: 17,
        path: [0, 0],
        text: ' and this insert text',
      };

      await operationApplier[insertTextOp.type](
        insertTextOp,
        root,
        mockRuntime,
      );

      const expectText = await getNodeText(root, [0, 0]);

      expect(expectText).toEqual('This default text and this insert text');
    });
  });

  describe('remove text operation', () => {
    it('should remove text from a exist node', async () => {
      const root = initEditorRoot();

      const removeTextOp = {
        type: 'remove_text',
        offset: 1,
        path: [0, 0],
        text: 'his',
      };

      await operationApplier[removeTextOp.type](
        removeTextOp,
        root,
        mockRuntime,
      );

      const expectText = await getNodeText(root, [0, 0]);

      expect(expectText).toEqual('T default text');
    });
  });

  describe('split node operation', () => {
    it('should split text node and apply properties when split op target was a text ', async () => {
      const root = initEditorRoot();

      const splitTextOp = {
        path: [0, 0],
        type: 'split_node',
        position: 2,
        properties: {
          type: 'block-quote',
        },
      } as Operation;

      await applyOp(splitTextOp, root);

      const expectText1 = await getNodeText(root, [0, 0]);
      const expectText2 = await getNodeText(root, [0, 1]);
      const expectType = await getNodeProperties(
        root,
        [0, 1],
        FLUIDNODE_KEYS.TYPE,
      );

      expect(expectText1).toEqual('Th');
      expect(expectText2).toEqual('is default text');
      expect(expectType).toEqual('block-quote');
    });

    it('should move node when split node path was not the foot node', async () => {
      const root = initEditorRoot();

      const splitTextOp1 = {
        path: [0, 0],
        type: 'split_node',
        position: 2,
        properties: {},
      } as Operation;

      const splitTextOp2 = {
        path: [0],
        type: 'split_node',
        position: 1,
        properties: {},
      } as Operation;

      await applyOp(splitTextOp1, root);
      await applyOp(splitTextOp2, root);

      const expectText1 = await getNodeText(root, [0, 0]);
      const expectText2 = await getNodeText(root, [1, 0]);

      expect(expectText1).toEqual('Th');
      expect(expectText2).toEqual('is default text');
    });

    it('should apply node style when move node with style', async () => {
      const root = initEditorRoot();

      const splitTextOp1 = {
        path: [0, 0],
        type: 'split_node',
        position: 2,
        properties: {},
      } as Operation;

      const splitTextOp2 = {
        path: [0],
        type: 'split_node',
        position: 1,
        properties: {
          type: 'block-quote',
        },
      } as Operation;

      await applyOp(splitTextOp1, root);
      await applyOp(splitTextOp2, root);

      const expectType = await getNodeProperties(
        root,
        [1],
        FLUIDNODE_KEYS.TYPE,
      );

      expect(expectType).toEqual('block-quote');
    });
  });

  describe('set node operation', () => {
    it('should set node properties when set node', async () => {
      const root = initEditorRoot();

      const setNode = {
        path: [0],
        type: 'set_node',
        properties: {
          titalic: undefined,
        },
        newProperties: {
          titalic: true,
        },
      } as Operation;

      await applyOp(setNode, root);

      const expectTitalic = await getNodeProperties(
        root,
        [0],
        FLUIDNODE_KEYS.TITALIC,
        false,
      );

      expect(expectTitalic).toEqual(true);
    });
  });

  describe('merge node operation', () => {
    it('should merge text node when target was text node', async () => {
      const root = initEditorRoot();

      const splitTextOp = {
        path: [0, 0],
        type: 'split_node',
        position: 2,
        properties: {
          type: 'block-quote',
        },
      } as Operation;

      await applyOp(splitTextOp, root);

      const mergeNodeOp = {
        path: [0, 1],
        type: 'merge_node'
      } as Operation;

      await applyOp(mergeNodeOp, root);

      const expectText1 = await getNodeText(root, [0, 0]);
      expect(expectText1).toEqual('This default text');
    });

    it('should merge not text node when target was not text node', async () => {
      const root = initEditorRoot();

      const splitTextOp1 = {
        path: [0, 0],
        type: 'split_node',
        position: 2,
        properties: {},
      } as Operation;

      const splitTextOp2 = {
        path: [0],
        type: 'split_node',
        position: 1,
        properties: {},
      } as Operation;

      await applyOp(splitTextOp1, root);
      await applyOp(splitTextOp2, root);

      const mergeNodeOp = {
        path: [1],
        type: 'merge_node'
      } as Operation;

      await applyOp(mergeNodeOp, root);

      const expectText1 = await getNodeText(root, [0, 0]);
      const expectText2 = await getNodeText(root, [0, 1]);
      expect(expectText1).toEqual('Th');
      expect(expectText2).toEqual('is default text');
    });
  });
});
