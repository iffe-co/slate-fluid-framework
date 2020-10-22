/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    DataObjectFactory,
} from "@fluidframework/aqueduct";
import { ISequencedClient } from "@fluidframework/protocol-definitions";
import { SharedMap } from "@fluidframework/map";
import {SharedObjectSequence, SharedString} from "@fluidframework/sequence";
import { insertBlockStart, PresenceManager } from "../utils";
import {SlateFluidModel} from "@solidoc/fluid-model-slate";

export interface IFluidDraftJsObject {
    text: SharedString | undefined;
    authors: SharedMap | undefined;
    readonly presenceManager: PresenceManager;
    readonly members: IterableIterator<[string, ISequencedClient]>
    on(event: "addMember" | "removeMember", listener: () => void): this;
    off(event: "addMember" | "removeMember", listener: () => void): this;
    currentSlateValue(): any
}

const addMemberValue = "addMember";
const removeMemberValue = "removeMember";

export class FluidDraftJsObject extends SlateFluidModel implements IFluidDraftJsObject {
    public static get Name() { return "@fluid-example/draft-js"; }

    public text: SharedString | undefined;
    public authors: SharedMap | undefined;

    public presenceManager: PresenceManager;

    public static readonly factory = new DataObjectFactory(
        FluidDraftJsObject.Name,
        FluidDraftJsObject,
        [SharedMap.getFactory(), SharedString.getFactory(), SharedObjectSequence.getFactory()],
        {},
    );

    protected async initializingFirstTime() {
        const text = SharedString.create(this.runtime);
        insertBlockStart(text, 0);
        text.insertText(text.getLength(), "starting text");
        this.root.set("text", text.handle);

        const authors = SharedMap.create(this.runtime);
        this.root.set("authors", authors.handle);

        await super.initializingFirstTime()
    }

    protected async hasInitialized() {
        [this.text, this.authors] = await Promise.all([this.root.get("text").get(), this.root.get("authors").get()]);

        await super.hasInitialized()

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
