import * as mocks from "@fluidframework/test-runtime-utils";
import {InsertNodeOperation} from "slate";
import {SharedObjectSequence, SharedObjectSequenceFactory} from "@fluidframework/sequence";
import {SharedMap} from "@fluidframework/map";
import {IFluidHandle} from "@fluidframework/core-interfaces";

import uuid from "uuid"

import {getNode} from "../../src/operation-applier/node-getter";
import {operationApplier} from "../../src/operation-applier";
import {FLUIDNODE_KEYS} from "../../src/interfaces";

SharedMap.create = (runtime) => new SharedMap(uuid.v4(), runtime, SharedMap.getFactory().attributes)
SharedObjectSequence.create = (runtime) => new SharedObjectSequence(runtime, uuid.v4(), SharedObjectSequenceFactory.Attributes);

describe('operation applier', () => {
    const mockRuntime: mocks.MockFluidDataStoreRuntime = new mocks.MockFluidDataStoreRuntime();
    const initNode = (childrenNode: SharedMap[] = []) => {
        const node = new SharedMap(uuid.v4(), mockRuntime, SharedMap.getFactory().attributes)
        const childSequence = new SharedObjectSequence<IFluidHandle<SharedMap>>(mockRuntime, uuid.v4(), SharedObjectSequenceFactory.Attributes);

        childSequence.insert(0, childrenNode.map((v, i) => <IFluidHandle<SharedMap>>v.handle))
        node.set(FLUIDNODE_KEYS.CHILDREN, childSequence.handle)

        return node
    }
    describe('insert node operation', () => {
        it('should insert a element to path when apply a insert node op', async () => {
            const root = new SharedObjectSequence<IFluidHandle<SharedMap>>(mockRuntime, "id", SharedObjectSequenceFactory.Attributes)

            const node_0_0 = initNode()

            const node_0 = initNode([node_0_0])

            root.insert(0, [<IFluidHandle<SharedMap>>node_0.handle])

            const insertOp =
                {
                    type: 'insert_node',
                    path: [0, 0],
                    node: {
                        text: 'The first node'
                    }
                }

            await operationApplier[insertOp.type](insertOp as InsertNodeOperation, root, mockRuntime)

            const resultNode = await getNode([0,0,0], root)
            const expectText = resultNode.get(FLUIDNODE_KEYS.TEXT)
            expect(expectText).toEqual('The first node')
        });
    });
});
