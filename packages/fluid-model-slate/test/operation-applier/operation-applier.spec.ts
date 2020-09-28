import {
  SharedObjectSequence,
  SharedObjectSequenceFactory,
  SharedString,
  SharedStringFactory,
} from '@fluidframework/sequence';
import { SharedMap } from '@fluidframework/map';
import uuid from 'uuid';

import { FLUIDNODE_KEYS } from '../../src/interfaces';
import { initOperationActor } from './operation-actor';

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
  describe('insert node operation', () => {
    it('should insert a node to path when apply a insert node op', async () => {
      const operationActor = await initOperationActor()
        .insertTextNode([0, 1], 'Insert a node')
        .execute();

      const [expectText] = await operationActor.getNodeText([0, 1]).values();

      expect(expectText).toEqual('Insert a node');
    });

    it('should insert into specific position when target path was in exist path', async () => {
      const operationActor = await initOperationActor()
          .insertTextNode([0, 1], 'Insert a node1')
          .insertTextNode([0, 1], 'Insert a node2')
          .insertTextNode([0, 1], 'Insert a node3')
          .execute();

      const [expectNode3,expectNode2,expectNode1] = await operationActor
          .getNodeText([0, 1])
          .getNodeText([0, 2])
          .getNodeText([0, 3])
          .values();

      expect(expectNode3).toEqual('Insert a node3');
      expect(expectNode2).toEqual('Insert a node2');
      expect(expectNode1).toEqual('Insert a node1');
    });

    it('should insert root path when path length === 1', async () => {
      const operationActor = await initOperationActor()
          .insertTextNode([0], 'This text was insert to root path')
          .execute();

      const [expectRootText] = await operationActor
          .getNodeText([0])
          .values();

      expect(expectRootText).toEqual('This text was insert to root path');
    });
  });

  describe('insert text operation', () => {
    it('should insert text from a exist node', async () => {
      const operationActor = await initOperationActor()
        .insertText([0, 0], 17, ' and this insert text')
        .execute();

      const [expectText] = await operationActor.getNodeText([0, 0]).values();

      expect(expectText).toEqual('This default text and this insert text');
    });
  });

  describe('remove text operation', () => {
    it('should remove text from a exist node', async () => {
      const operationActor = await initOperationActor()
        .removeText([0, 0], 1, 'his')
        .execute();

      const [expectText] = await operationActor.getNodeText([0, 0]).values();

      expect(expectText).toEqual('T default text');
    });
  });

  describe('split node operation', () => {
    it('should split text node and apply properties when split op target was a text ', async () => {
      const operationActor = await initOperationActor()
        .splitNode([0, 0], 2, { type: 'block-quote' })
        .execute();

      const [
        expectText1,
        expectText2,
        expectType,
      ] = await operationActor
        .getNodeText([0, 0])
        .getNodeText([0, 1])
        .getNodeProperties([0, 1], FLUIDNODE_KEYS.TYPE)
        .values();

      expect(expectText1).toEqual('Th');
      expect(expectText2).toEqual('is default text');
      expect(expectType).toEqual('block-quote');
    });

    it('should move node when split node path was not the foot node', async () => {
      const operationActor = await initOperationActor()
        .splitNode([0, 0], 2, {})
        .splitNode([0], 1, {})
        .execute();

      const [expectText1, expectText2] = await operationActor
        .getNodeText([0, 0])
        .getNodeText([1, 0])
        .values();

      expect(expectText1).toEqual('Th');
      expect(expectText2).toEqual('is default text');
    });

    it('should apply node style when move node with style', async () => {
      const operationActor = await initOperationActor()
        .splitNode([0, 0], 2, {})
        .splitNode([0], 1, { type: 'block-quote' })
        .execute();

      const [expectType] = await operationActor
        .getNodeProperties([1], FLUIDNODE_KEYS.TYPE)
        .values();

      expect(expectType).toEqual('block-quote');
    });
  });

  describe('set node operation', () => {
    it('should set node properties when set node', async () => {
      const operationActor = await initOperationActor()
        .setNode([0], { titalic: true })
        .execute();

      const [expectTitalic] = await operationActor
        .getNodeProperties([0], FLUIDNODE_KEYS.TITALIC, false)
        .values();

      expect(expectTitalic).toEqual(true);
    });
  });

  describe('merge node operation', () => {
    it('should merge text node when target was text node', async () => {
      const operationActor = await initOperationActor()
        .splitNode([0, 0], 2, {})
        .mergeNode([0, 1])
        .execute();

      const [expectText] = await operationActor.getNodeText([0, 0]).values();

      expect(expectText).toEqual('This default text');
    });

    it('should merge not text node when target was not text node', async () => {
      const operationActor = await initOperationActor()
        .splitNode([0, 0], 2, {})
        .splitNode([0], 1, {})
        .mergeNode([1])
        .execute();

      const [expectText1, expectText2] = await operationActor
        .getNodeText([0, 0])
        .getNodeText([0, 1])
        .values();

      expect(expectText1).toEqual('Th');
      expect(expectText2).toEqual('is default text');
    });
  });

  describe('move node operation', () => {
    it('should delete origin node when move node', async () => {
      const operationActor = await initOperationActor()
          .splitNode([0, 0], 2, {})
          .splitNode([0], 1, {})
          .moveNode([1, 0], [0, 0])
          .execute();

      const [splitNodeExistAfterMove] = await operationActor
          .isNodeExist([1, 0])
          .values()

      expect(splitNodeExistAfterMove).toEqual(false)
    });

    it('should move origin node to target path when move node', async () => {
      const operationActor = await initOperationActor()
          .splitNode([0, 0], 3, {})
          .splitNode([0], 1, {})
          .insertSequenceNode([0])
          .moveNode([1, 0], [2, 0])
          .execute();

      const [splitNodeExistAfterMove, targetNodeText] = await operationActor
          .isNodeExist([1, 0])
          .getNodeText([2, 0])
          .values()

      expect(splitNodeExistAfterMove).toEqual(false)
      expect(targetNodeText).toEqual('s default text')
    });

    it('should move to true path when original path was end before target path', async () => {
      const operationActor = await initOperationActor()
          .insertSequenceNode([1])
          .insertTextNode([1, 0], 'original text node')
          .insertSequenceNode([1, 1])
          .moveNode([1, 0], [1, 1, 0])
          .execute()

      const [expectText] = await operationActor
          .getNodeText([1, 0, 0])
          .values()

      expect(expectText).toEqual('original text node')
    });
  });
});
