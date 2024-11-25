declare namespace JSX {
  type DeviceNode = {
    children?: Array<DeviceNode | NodeNode>;
    id: string;
  };

  type NodeNode = {
    children?: Array<PropertyNode> | PropertyNode;
    id: string;
  };

  type PropertyNode = {
    id: string;
  };

  interface IntrinsicElements {
    device$: DeviceNode;
    node$: NodeNode;
    property$: PropertyNode;
  }
}
