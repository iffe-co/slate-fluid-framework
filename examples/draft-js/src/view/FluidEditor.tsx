import { EditorProps, EditorState } from "draft-js";
import React from "react";

// eslint-disable-next-line import/no-internal-modules, import/no-unassigned-import
import "./css/RichEditor.css";
import RichText from "../slate-editor/rich-text";
import { IFluidDraftJsObject } from "../fluid-object";

interface IProps extends Partial<EditorProps> {
    model: IFluidDraftJsObject
    currentSlateValue: any
}

interface IState {
    editorState: EditorState;
}

export { IProps as IFluidEditorProps };
export { IState as IFluidEditorState };

export class FluidEditor extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
    }

    render() {
        // TODO Pass through props to Editor
        return (
            <div className="RichEditor-root">
                <RichText model={this.props.model} currentSlateValue={this.props.currentSlateValue}/>
            </div>
        );
    }
}
