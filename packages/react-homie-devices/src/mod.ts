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
  unknown[], // ChildSet
  unknown,
  unknown
>({
  supportsMutation: false,
  supportsPersistence: true,
  supportsHydration: false,

  // -------------------
  //    Core Methods
  // -------------------

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

  createTextInstance() {
    throw new Error("Text nodes are not supported");
  },

  appendInitialChild() {
    console.log("appendInitialChild called");
  },

  finalizeInitialChildren(instance) {
    console.log("finalizeInitialChildren called with", instance);
    return true;
  },

  prepareUpdate() {
    console.log("prepareUpdate called");
    return {};
  },

  shouldSetTextContent() {
    console.log("shouldSetTextContent called");
    return false;
  },

  getRootHostContext(rootContet) {
    console.log("getRootHostContext called", rootContet);
    return rootContet;
  },

  getChildHostContext(parentHostContext, type) {
    console.log("getChildHostContext called with", parentHostContext, type);
    return parentHostContext;
  },

  getPublicInstance(instance) {
    return instance;
  },

  prepareForCommit() {
    console.log("prepareForCommit called");
    return {};
  },

  resetAfterCommit(container) {
    console.log("resetAfterCommit called");
    container.changes = [];
  },

  preparePortalMount() {
    console.log("preparePortalMount called");
  },

  scheduleTimeout(cb, ms) {
    return setTimeout(cb, ms);
  },

  cancelTimeout(id: number) {
    clearTimeout(id);
  },

  noTimeout: -1,

  isPrimaryRenderer: true,

  getCurrentEventPriority() {
    console.log("getCurrentEventPriority called");
    return 0;
  },

  getInstanceFromNode(node: any) {
    console.log("getInstanceFromNode called with", node);
    return null;
  },

  beforeActiveInstanceBlur() {
    console.log("beforeActiveInstanceBlur called");
  },

  afterActiveInstanceBlur() {
    console.log("afterActiveInstanceBlur called");
  },

  prepareScopeUpdate() {
    console.log("prepareScopeUpdate called");
  },

  getInstanceFromScope() {
    console.log("getInstanceFromScope called");
    return null;
  },

  detachDeletedInstance() {
    console.log("detachDeletedInstance called");
  },

  // -------------------
  // Persistence Methods
  // -------------------

  cloneInstance(
    instance,
    updatePayload,
    type,
    oldProps,
    newProps,
    internalInstanceHandle,
    keepChildren,
    recyclableInstance,
  ) {
    console.log("cloneInstance called");
    return { ...instance, props: newProps };
  },

  createContainerChildSet(container) {
    console.log("createContainerChildSet called");
    return [];
  },

  appendChildToContainerChildSet(childSet, child) {
    console.log("appendChildToContainerChildSet called");
    childSet.push(child);
  },

  finalizeContainerChildren(container, newChildren) {
    console.log("finalizeContainerChildren called");
    container.devices = newChildren;
  },

  replaceContainerChildren(container, newChildren) {
    console.log("replaceContainerChildren called");
    container.devices = newChildren;
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
