type FluidElement = {
  id: string;
  type: string;
  children: FluidElement[];
  [key: string]: any;
};

export { FluidElement };
