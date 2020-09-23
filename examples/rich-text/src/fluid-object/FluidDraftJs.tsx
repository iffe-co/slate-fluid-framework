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
import { PresenceManager } from "../utils";
export interface IFluidDraftJsObject {
    doc: SharedMap | undefined;
    authors: SharedMap | undefined;
    readonly presenceManager: PresenceManager;
    readonly members: IterableIterator<[string, ISequencedClient]>
    on(event: "addMember" | "removeMember", listener: () => void): this;
    off(event: "addMember" | "removeMember", listener: () => void): this;
}

const addMemberValue = "addMember";
const removeMemberValue = "removeMember";

export class FluidDraftJsObject extends DataObject implements IFluidDraftJsObject {
    public static get Name() { return "@fluid-example/draft-js"; }

    public doc: SharedMap | undefined;
    public authors: SharedMap | undefined;
    public presenceManager: PresenceManager;

    public static readonly factory = new DataObjectFactory(
        FluidDraftJsObject.Name,
        FluidDraftJsObject,
        [SharedMap.getFactory()],
        {},
    );

    /**
     * Do setup work here
     */
    protected async initializingFirstTime() {
        const doc = SharedMap.create(this.runtime);
        this.root.set("doc", doc.handle);

        const authors = SharedMap.create(this.runtime);
        this.root.set("authors", authors.handle);
    }

    protected async hasInitialized() {
        [this.doc, this.authors] = await Promise.all([this.root.get("doc").get(), this.root.get("authors").get()]);

        // this.presenceManager = new PresenceManager(this.authors, this.runtime);
        this.runtime.getQuorum().on(addMemberValue, () => {
            this.emit(addMemberValue);
        });
        this.runtime.getQuorum().on(removeMemberValue, () => {
            this.emit(removeMemberValue);
        });

        this.presenceManager = new PresenceManager(this.authors, this.runtime);
    }

    public get members() {
        return this.runtime.getQuorum().getMembers().entries();
    }
}
