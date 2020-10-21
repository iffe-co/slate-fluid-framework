/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    DataObject,
    DataObjectFactory,
} from "@fluidframework/aqueduct";
import { ISequencedClient } from "@fluidframework/protocol-definitions";
import { SharedMap } from "@fluidframework/map";
import {SharedObjectSequence, SharedString} from "@fluidframework/sequence";
import { insertBlockStart, PresenceManager } from "../utils";
import {IFluidHandle} from "@fluidframework/core-interfaces";
import { FLUIDNODE_KEYS } from "../slate-fluid-model/interfaces";
import { addEventListenerHandler } from "../slate-fluid-model/event-handler";
import { Operation } from "slate";
import { operationApplier } from "../slate-fluid-model/operation-applier";
import { registerOperationReceiver } from "../slate-fluid-model/dds-event-processor";
import {
    FluidNodeChildren,
    FluidNodeChildrenHandle,
    FluidNodePropertyHandle,
} from "../slate-fluid-model/types";
import { addChildrenToCache, addNodeToCache, addTextToCache } from "../slate-fluid-model/dds-cache";

export interface IFluidDraftJsObject {
    text: SharedString | undefined;
    authors: SharedMap | undefined;
    readonly presenceManager: PresenceManager;
    readonly members: IterableIterator<[string, ISequencedClient]>
    applyOperations: (op: Operation[]) => void
    on(event: "addMember" | "removeMember", listener: () => void): this;
    off(event: "addMember" | "removeMember", listener: () => void): this;
    subscribe(callback: (op: Operation) => void): string;
    unsubscribe(id: string): void;
    currentSlateValue(): any
}

const addMemberValue = "addMember";
const removeMemberValue = "removeMember";

export class FluidDraftJsObject extends DataObject implements IFluidDraftJsObject {
    private initValue: any[];
    public static get Name() { return "@fluid-example/draft-js"; }

    public text: SharedString | undefined;
    public authors: SharedMap | undefined;
    public fluidNodeSequence!: SharedObjectSequence<IFluidHandle<SharedMap>>;

    public presenceManager: PresenceManager;

    public static readonly factory = new DataObjectFactory(
        FluidDraftJsObject.Name,
        FluidDraftJsObject,
        [SharedMap.getFactory(), SharedString.getFactory(), SharedObjectSequence.getFactory()],
        {},
    );

    public applyOperations = (ops: Operation[]) => {
        ops.forEach(op => console.log(op))
        ops.forEach(op => operationApplier[op.type](op, this.fluidNodeSequence, this.runtime))
    };

    public onModelChanged = (callback: (op: Operation) => void) => {
        registerOperationReceiver(callback);
    };

    subscribe(callback: (op: Operation) => void): string {
        this.onModelChanged(callback)
        return ''
    }
    unsubscribe(id: string): void {
        throw new Error("Method not implemented.");
    }

    /**
     * Do setup work here
     */
    protected async initializingFirstTime() {
        const text = SharedString.create(this.runtime);
        insertBlockStart(text, 0);
        text.insertText(text.getLength(), "starting text");
        this.root.set("text", text.handle);

        const authors = SharedMap.create(this.runtime);
        this.root.set("authors", authors.handle);

        const fluidNodeSequence = SharedObjectSequence.create(this.runtime);
        const node_0 = SharedMap.create(this.runtime);
        const node_0_children = SharedObjectSequence.create(this.runtime);
        const node_0_0 = SharedMap.create(this.runtime);
        const node_0_0_text = SharedString.create(this.runtime);

        node_0.set(FLUIDNODE_KEYS.CHILDREN, node_0_children.handle);
        node_0_children.insert(0, [node_0_0.handle]);
        node_0_0.set(FLUIDNODE_KEYS.TEXT, node_0_0_text.handle);

        fluidNodeSequence.insert(0, [node_0.handle]);
        this.fluidNodeSequence = fluidNodeSequence as SharedObjectSequence<IFluidHandle<SharedMap>>
        this.root.set(FLUIDNODE_KEYS.CHILDREN, fluidNodeSequence.handle);
    }

    protected async hasInitialized() {
        [this.text, this.authors, this.fluidNodeSequence] = await Promise.all([this.root.get("text").get(), this.root.get("authors").get(), this.root.get(FLUIDNODE_KEYS.CHILDREN).get()]);

        await this.addDDSToCacheAndInitCurrentValue()
        addEventListenerHandler(this.fluidNodeSequence)

        // this.presenceManager = new PresenceManager(this.authors, this.runtime);
        this.runtime.getQuorum().on(addMemberValue, () => {
            this.emit(addMemberValue);
        });
        this.runtime.getQuorum().on(removeMemberValue, () => {
            this.emit(removeMemberValue);
        });

        this.presenceManager = new PresenceManager(this.authors, this.runtime);
    }

    private async addDDSToCacheAndInitCurrentValue () {
        this.initValue = await this.toInitSlateValue(this.fluidNodeSequence)
    }

    public currentSlateValue () {
        return this.initValue
    }

    private async toInitSlateValue(root: FluidNodeChildren) {
        const slateNodes: any[] = []
        const nodeHandles = root.getRange(0);
        for (let nodeHandle of nodeHandles) {
            const node = await nodeHandle.get()
            addNodeToCache(node)
            const slateNode = {}
            if (node.has(FLUIDNODE_KEYS.CHILDREN)) {
                const children = await node.get<FluidNodeChildrenHandle>(FLUIDNODE_KEYS.CHILDREN).get()
                addChildrenToCache(children)
                slateNode[FLUIDNODE_KEYS.CHILDREN] = await this.toInitSlateValue(children)
            }
            if (node.has(FLUIDNODE_KEYS.TEXT)) {
                const text = await node.get<FluidNodePropertyHandle>(FLUIDNODE_KEYS.TEXT).get()
                addTextToCache(text)
                slateNode[FLUIDNODE_KEYS.TEXT] = text.getText()
            }
            [...node.keys()].filter(k => k !== 'children' && k!== 'text').forEach(k => {
                slateNode[k] = node.get(k)
            })
            slateNodes.push(slateNode)
        }
        return slateNodes;
    }

    public get members() {
        return this.runtime.getQuorum().getMembers().entries();
    }
}
