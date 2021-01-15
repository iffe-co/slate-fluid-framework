import { LocalOperationActor } from './local-operation-actor';

describe('local dds event', () => {
  describe('insert node', () => {
    it('should get locally op when insert text node', async () => {
      const actor = await LocalOperationActor.create();
      const ops = await actor.insertTextNode([0, 1], 'Insert a node').execute();

      expect(ops).toEqual([
        {
          type: 'insert_node',
          path: [0, 1],
          node: {
            text: 'Insert a node',
          },
        },
      ]);
      actor.disconnect();
    });

    it('should get locally op when insert multiple text node', async () => {
      const actor = await LocalOperationActor.create();
      const ops = await actor
        .insertTextNode([0, 1], 'Insert a node1')
        .insertTextNode([0, 1], 'Insert a node2')
        .insertTextNode([0, 1], 'Insert a node3')
        .execute();

      expect(ops).toEqual([
        {
          type: 'insert_node',
          path: [0, 1],
          node: {
            text: 'Insert a node1',
          },
        },
        {
          type: 'insert_node',
          path: [0, 1],
          node: {
            text: 'Insert a node2',
          },
        },
        {
          type: 'insert_node',
          path: [0, 1],
          node: {
            text: 'Insert a node3',
          },
        },
      ]);
      actor.disconnect();
    });

    it('should get locally op when insert root path', async () => {
      const actor = await LocalOperationActor.create();
      const ops = await actor
        .insertTextNode([0], 'This text was insert to root path')
        .execute();

      expect(ops).toEqual([
        {
          type: 'insert_node',
          path: [0],
          node: {
            text: 'This text was insert to root path',
          },
        },
      ]);
      actor.disconnect();
    });

    it('should get locally op when insetr multiple children node', async () => {
      const actor = await LocalOperationActor.create();
      const ops = await actor
        .insertNode([0, 1], {
          children: [
            {
              text: 'first node text',
            },
            {
              text: 'second node text',
              code: true,
            },
            {
              children: [
                {
                  text: 'third node text',
                },
              ],
            },
          ],
          type: 'paragraph',
        })
        .execute();

      expect(ops).toEqual([
        {
          type: 'insert_node',
          path: [0, 1],
          node: {
            children: [
              {
                text: 'first node text',
              },
              {
                text: 'second node text',
                code: true,
              },
              {
                children: [
                  {
                    text: 'third node text',
                  },
                ],
              },
            ],
            type: 'paragraph',
          },
        },
      ]);
      actor.disconnect();
    });
  });

  describe('remove node', () => {
    it('should get locally op when remove text node', async () => {
      const actor = await LocalOperationActor.create();
      await actor.insertTextNode([0, 1], 'Insert a node').execute();

      const ops = await actor.removeNode([0, 1]).execute();

      expect(ops).toEqual([
        {
          type: 'remove_node',
          path: [0, 1],
          node: {
            text: 'Insert a node',
          },
        },
      ]);
      actor.disconnect();
    });
  });

  describe('insert text', () => {
    it('should get locally op when insert text', async () => {
      const actor = await LocalOperationActor.create();
      const ops = await actor.insertText([0, 0], 0, 'Insert a node').execute();

      expect(ops).toEqual([
        {
          type: 'insert_text',
          path: [0, 0],
          offset: 0,
          text: 'Insert a node',
        },
      ]);
      actor.disconnect();
    });

    it('should get locally op when insert text with offset', async () => {
      const actor = await LocalOperationActor.create();
      await actor.insertText([0, 0], 0, 'Insert a node').execute();
      const ops = await actor.insertText([0, 0], 3, 'Insert a node').execute();

      expect(ops).toEqual([
        {
          type: 'insert_text',
          path: [0, 0],
          offset: 3,
          text: 'Insert a node',
        },
      ]);
      actor.disconnect();
    });
  });

  describe('remove text', () => {
    it('should get locally op when remove text', async () => {
      const actor = await LocalOperationActor.create();
      await actor.insertText([0, 0], 0, 'Insert a node').execute();
      const ops = await actor.removeText([0, 0], 1, 'nse').execute();

      expect(ops).toEqual([
        {
          type: 'remove_text',
          path: [0, 0],
          offset: 1,
          text: 'nse',
        },
      ]);
      actor.disconnect();
    });
  });

  describe('split node', () => {
    it('should get locally op when split text node', async () => {
      const actor = await LocalOperationActor.create();
      await actor.insertText([0, 0], 0, 'Insert a node').execute();
      const ops = await actor
        .splitNode([0, 0], 2, { type: 'block-quote' })
        .execute();

      expect(ops).toEqual([
        {
          offset: 2,
          path: [0, 0],
          text: 'sert a node',
          type: 'remove_text',
        },
        {
          type: 'insert_node',
          path: [0, 1],
          node: {
            text: 'sert a node',
            type: 'block-quote',
          },
        },
      ]);
      actor.disconnect();
    });

    it('should get locally op when split children node', async () => {
      const actor = await LocalOperationActor.create();
      await actor
        .insertText([0, 0], 0, 'Insert a node')
        .splitNode([0, 0], 2, { type: 'block-quote' })
        .execute();

      const ops = await actor.splitNode([0], 1, {}).execute();

      expect(ops).toEqual([
        {
          path: [1],
          type: 'insert_node',
          node: {
            children: [
              {
                text: 'sert a node',
                type: 'block-quote',
              },
            ],
          },
        },
        {
          type: 'remove_node',
          path: [0, 1],
          node: {
            text: 'sert a node',
            type: 'block-quote',
          },
        },
      ]);
      actor.disconnect();
    });

    it('should get locally op when split children node with flow up', async () => {
      const actor = await LocalOperationActor.create();
      await actor
        .insertText([0, 0], 0, 'Insert a node')
        .insertNode([0, 1], {
          children: [
            {
              text: 'first node text',
            },
            {
              text: 'second node text',
              code: true,
            },
            {
              children: [
                {
                  text: 'third node text',
                },
              ],
            },
          ],
          type: 'paragraph',
        })
        .splitNode([0, 0], 2, { type: 'block-quote' })
        .execute();

      const ops = await actor.splitNode([0], 1, {}).execute();

      expect(ops).toEqual([
        {
          type: 'insert_node',
          path: [1],
          node: {
            children: [
              {
                text: 'sert a node',
                type: 'block-quote',
              },
              {
                children: [
                  {
                    text: 'first node text',
                  },
                  {
                    text: 'second node text',
                    code: true,
                  },
                  {
                    children: [
                      {
                        text: 'third node text',
                      },
                    ],
                  },
                ],
                type: 'paragraph',
              },
            ],
          },
        },
        {
          type: 'remove_node',
          path: [0, 1],
          node: {
            text: 'sert a node',
            type: 'block-quote',
          },
        },
        {
          type: 'remove_node',
          path: [0, 2],
          node: {
            children: [
              {
                text: 'first node text',
              },
              {
                text: 'second node text',
                code: true,
              },
              {
                children: [
                  {
                    text: 'third node text',
                  },
                ],
              },
            ],
            type: 'paragraph',
          },
        },
      ]);
      actor.disconnect();
    });
  });

  describe('set node', () => {
    it('should get locally op when set node properties', async () => {
      const actor = await LocalOperationActor.create();
      await actor.insertText([0, 0], 0, 'Insert a node').execute();
      const ops = await actor.setNode([0], { titalic: true }).execute();

      expect(ops).toEqual([
        {
          type: 'set_node',
          path: [0],
          properties: {
            titalic: undefined,
          },
          newProperties: {
            titalic: true,
          },
        },
      ]);
      actor.disconnect();
    });

    it('should get locally op when set root node properties', async () => {
      const actor = await LocalOperationActor.create();
      await actor.execute();
      const ops = await actor
        .setNode([], { title: 'title', icon: 'icon' })
        .execute();

      expect(ops).toEqual([
        {
          type: 'set_node',
          path: [],
          properties: {
            title: 'default title',
          },
          newProperties: {
            title: 'title',
          },
        },
        {
          type: 'set_node',
          path: [],
          properties: {
            icon: '',
          },
          newProperties: {
            icon: 'icon',
          },
        },
      ]);
      actor.disconnect();
    });
  });

  describe('morge node', () => {
    it('should get locally op when apply merge node to text node', async () => {
      const actor = await LocalOperationActor.create();
      await actor
        .insertText([0, 0], 0, 'Insert a node')
        .splitNode([0, 0], 2, {})
        .execute();

      const ops = await actor.mergeNode([0, 1]).execute();

      expect(ops).toEqual([
        {
          type: 'insert_text',
          path: [0, 0],
          offset: 2,
          text: 'sert a node',
        },
        {
          type: 'remove_node',
          path: [0, 1],
          node: {
            text: 'sert a node',
          },
        },
      ]);
      actor.disconnect();
    });

    it('should get locally op when apply merge node to children node', async () => {
      const actor = await LocalOperationActor.create();
      await actor
        .insertText([0, 0], 0, 'Insert a node')
        .splitNode([0, 0], 2, {})
        .splitNode([0], 1, {})
        .execute();

      const ops = await actor.mergeNode([1]).execute();

      expect(ops).toEqual([
        {
          type: 'insert_node',
          path: [0, 1],
          node: {
            text: 'sert a node',
          },
        },
        {
          type: 'remove_node',
          path: [1],
          node: {
            children: [
              {
                text: 'sert a node',
              },
            ],
          },
        },
      ]);
      actor.disconnect();
    });
  });

  describe('move op', () => {
    it('should get locally op when move node', async () => {
      const actor = await LocalOperationActor.create();
      await actor
        .insertText([0, 0], 0, 'Insert a node')
        .splitNode([0, 0], 2, {})
        .splitNode([0], 1, {})
        .execute();

      const ops = await actor.moveNode([1, 0], [0, 0]).execute();

      expect(ops).toEqual([
        {
          type: 'remove_node',
          path: [1, 0],
          node: {
            text: 'sert a node',
          },
        },
        {
          type: 'insert_node',
          path: [0, 0],
          node: {
            text: 'sert a node',
          },
        },
      ]);
      actor.disconnect();
    });

    it('should get locally op when original path was end before target path', async () => {
      const actor = await LocalOperationActor.create();
      await actor
        .insertText([0, 0], 0, 'Insert a node')
        .insertSequenceNode([1])
        .insertTextNode([1, 0], 'original text node')
        .insertSequenceNode([1, 1])
        .execute();

      const ops = await actor.moveNode([1, 0], [1, 1, 0]).execute();

      expect(ops).toEqual([
        {
          type: 'remove_node',
          path: [1, 0],
          node: {
            text: 'original text node',
          },
        },
        {
          type: 'insert_node',
          path: [1, 0, 0],
          node: {
            text: 'original text node',
          },
        },
      ]);
      actor.disconnect();
    });
  });
});
