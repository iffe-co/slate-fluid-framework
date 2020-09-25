import * as mocks from "@fluidframework/test-runtime-utils";
import {
    SharedObjectSequence,
    SharedObjectSequenceFactory,
    SharedString,
    SharedStringFactory
} from "@fluidframework/sequence";
import {SharedMap} from "@fluidframework/map";
import {IFluidHandle} from "@fluidframework/core-interfaces";

import uuid from "uuid"

import {getNode} from "../../src/operation-applier/node-getter";
import {operationApplier} from "../../src/operation-applier";
import {FLUIDNODE_KEYS} from "../../src/interfaces";

SharedString.create = (runtime) => new SharedString(runtime, uuid.v4(), SharedStringFactory.Attributes)
SharedMap.create = (runtime) => new SharedMap(uuid.v4(), runtime, SharedMap.getFactory().attributes)
SharedObjectSequence.create = (runtime) => new SharedObjectSequence(runtime, uuid.v4(), SharedObjectSequenceFactory.Attributes);

describe('operation applier', () => {
    const mockRuntime: mocks.MockFluidDataStoreRuntime = new mocks.MockFluidDataStoreRuntime()
    const initNode = (childrenNode: SharedMap[] = []) => {
        const node = new SharedMap(uuid.v4(), mockRuntime, SharedMap.getFactory().attributes)

        const childSequence = new SharedObjectSequence<IFluidHandle<SharedMap>>(mockRuntime, uuid.v4(), SharedObjectSequenceFactory.Attributes)
        childSequence.insert(0, childrenNode.map((v, i) => <IFluidHandle<SharedMap>>v.handle))

        const text = new SharedString(mockRuntime, uuid.v4(), SharedStringFactory.Attributes)
        text.insertText(0, "This default text")

        node.set(FLUIDNODE_KEYS.CHILDREN, childSequence.handle)
        node.set(FLUIDNODE_KEYS.TEXT, text.handle)

        return node
    }

    const initEditorRoot = () => {
        const root = new SharedObjectSequence<IFluidHandle<SharedMap>>(mockRuntime, uuid.v4(), SharedObjectSequenceFactory.Attributes)
        const node_0_0 = initNode()
        const node_0 = initNode([node_0_0])
        root.insert(0, [<IFluidHandle<SharedMap>>node_0.handle])
        return root
    }

    const getNodeText = async (root:SharedObjectSequence<IFluidHandle<SharedMap>>, path: number[]): Promise<string> => {
        const resultNode = await getNode(path, root)
        const textHandle = resultNode.get<IFluidHandle<SharedString>>(FLUIDNODE_KEYS.TEXT)
        const expectShareString = await textHandle.get();
        return expectShareString.getText()
    }
    describe('insert node operation', () => {
        it('should insert a element to path when apply a insert node op', async () => {
            const root = initEditorRoot()

            const insertOp =
                {
                    type: 'insert_node',
                    path: [0, 0],
                    node: {
                        text: 'The first node'
                    }
                }

            await operationApplier[insertOp.type](insertOp, root, mockRuntime)

            const expectText = await getNodeText(root, [0,0,0])

            expect(expectText).toEqual('The first node')
        });
    });

    describe('insert text operation', function () {
        it('should insert text to a exist node', async () => {
            const root = initEditorRoot()

            const insertTextOp = {
                type: 'insert_text',
                offset: 17,
                path: [0, 0],
                text: ' and this insert text'
            }

            await operationApplier[insertTextOp.type](insertTextOp, root, mockRuntime)

            const expectText = await getNodeText(root, [0,0])

            expect(expectText).toEqual('This default text and this insert text')
        });
    });
});
