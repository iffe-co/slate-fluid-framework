import { SharedMap } from '@fluidframework/map';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { SharedObjectSequence, SharedString } from '@fluidframework/sequence';

export type FluidNode = SharedMap;
export type FluidNodeHandle = IFluidHandle<FluidNode>;
export type FluidNodeProperty = SharedString;
export type FluidNodePropertyHandle = IFluidHandle<SharedString>;
export type FluidNodeChildren = SharedObjectSequence<FluidNodeHandle>;
export type FluidNodeChildrenHandle = IFluidHandle<FluidNodeChildren>;
