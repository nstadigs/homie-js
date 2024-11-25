// @deno-types="npm:@types/react-reconciler"
import ReactReconciler from "react-reconciler";
import type { MqttAdapter } from "@nstadigs/homie-devices";
import type React from "react";

type Container = {
  changes: Change[];
  devices: Record<string, {}>;
};

type Type = "device$" | "node$" | "property$";

type DeviceInstance = {
  type: "device";
  props: Record<string, string>;
  nodes: Record<string, NodeInstance>;
};

type NodeInstance = {
  type: "node";
  props: Record<string, string>;
  properties: Record<string, PropertyInstance>;
};

type PropertyInstance = {
  type: "property";
  props: Record<string, string>;
};

type Instance = DeviceInstance | NodeInstance | PropertyInstance;

const reconciler = ReactReconciler<
  Type,
  Instance["props"],
  Container,
  Instance,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown
>({
  supportsMutation: true,
  isPrimaryRenderer: true,
  supportsPersistence: false,
  supportsHydration: false,
  noTimeout: -1,

  afterActiveInstanceBlur() {
    console.log("afterActiveInstanceBlur called");
  },
  beforeActiveInstanceBlur() {
    console.log("beforeActiveInstanceBlur called");
  },
  preparePortalMount() {
    console.log("preparePortalMount called");
  },

  prepareScopeUpdate() {
    console.log("prepareScopeUpdate called");
  },

  resetAfterCommit(container) {
    console.log("resetAfterCommit called");
    container.changes = [];
  },

  commitHydratedContainer() {
    console.log("commitHydratedContainer called");
  },

  cancelTimeout(id: number) {
    clearTimeout(id);
  },

  detachDeletedInstance() {
    console.log("detachDeletedInstance called");
  },

  scheduleTimeout(cb, ms) {
    return setTimeout(cb, ms);
  },

  finalizeInitialChildren(instance) {
    console.log("finalizeInitialChildren called with", instance);
    return true;
  },

  getChildHostContext(parentHostContext, type) {
    console.log("getChildHostContext called with", parentHostContext, type);
    // I think we should pass along the nearest parent device here
    return parentHostContext;
  },

  getPublicInstance(instance) {
    return instance;
  },

  getRootHostContext(rootContet) {
    console.log("getRootHostContext called", rootContet);
    // I think we should pass along the nearest parent device here
    return rootContet;
  },
  prepareForCommit() {
    console.log("prepareForCommit called");
    return {};
  },

  getCurrentEventPriority() {
    console.log("getCurrentEventPriority called");
    return 0;
  },

  getInstanceFromNode(node: any) {
    console.log("getInstanceFromNode called with", node);
    return null;
  },

  getInstanceFromScope() {
    console.log("getInstanceFromScope called");
    return null;
  },

  prepareUpdate() {
    console.log("prepareUpdate called");
    return {};
  },

  shouldSetTextContent() {
    console.log("shouldSetTextContent called");
    return false;
  },

  createInstance(type, props) {
    if (type === "device$") {
      return { type: "device", props, nodes: {} };
    }

    if (type === "node$") {
      return {
        type: "node",
        props,
        properties: {},
      };
    }

    if (type === "property$") {
      return { type: "property", props };
    }

    throw new Error(
      `Component type: ${type} is not supported. Use export Node, Device, or Property`,
    );
  },

  commitUpdate() {
    console.log("commitUpdate called");
  },

  removeChildFromContainer() {
    console.log("removeChildFromContainer called");
  },

  removeChild(parentInstance, child) {
    console.log("removeChild called");
  },

  clearContainer() {
  },

  createTextInstance() {
    console.log("createTextInstance called");
  },

  appendChildToContainer(
    container,
    child: Instance,
  ) {
    if (child.type !== "device") {
      throw new Error("Only Device components can be added to the root");
    }

    container.devices[child.props.id] = child;
  },

  appendChild(parentInstance, child: Instance) {
    if (parentInstance.type === "device") {
      if (child.type !== "node") {
        throw new Error("Only Node components can be added to a Device");
      }

      parentInstance.nodes[child.props.id] = child;
    } else if (parentInstance.type === "node") {
      if (child.type !== "property") {
        throw new Error("Only Property components can be added to a Node");
      }

      parentInstance.properties[child.props.id] = child;
    }
  },
  appendInitialChild() {
    console.log("appendInitialChild called");
  },

  commitMount(instance) {
    // Apply all changes to mqtt here, I guess
    console.log("commitMount called with");
  },
});

type Change = {
  type: "update";
  id: string;
  property: string;
  value: string;
} | {
  type: "delete";
  id: string;
} | { type: "add"; id: string };

export function register(
  whatToRender: React.ReactNode,
  mqttAdapter: MqttAdapter,
) {
  const changes: Change[] = [];
  const devices = {};

  const container = reconciler.createContainer(
    { changes, devices },
    0,
    null,
    true,
    null,
    "",
    () => {},
    null,
  );

  reconciler.updateContainer(whatToRender, container, null, null);
}
