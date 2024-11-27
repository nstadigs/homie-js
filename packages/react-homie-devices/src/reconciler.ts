// @deno-types="@types/react-reconciler"
import ReactReconciler from "npm:react-reconciler";
// @deno-types="@types/react-reconciler/constants"
import { DefaultEventPriority } from "react-reconciler/constants.js";
import type { MqttAdapter } from "@nstadigs/homie-devices";

// @deno-types="npm:@types/react"
import type React from "react";

import { createInstance, type Instance } from "./instance/Instance.ts";
import { shallowEqual } from "./utils.ts";
import { Device } from "./instance/Device.ts";
import type {
  DeviceElementProps,
  NodeElementProps,
  PropertyElementProps,
} from "./jsx-runtime.ts";

type Container = {
  rootDevices: Device[];
  mqtt: MqttAdapter;
};

type Element =
  | { type: "device$"; props: DeviceElementProps }
  | { type: "node$"; props: NodeElementProps }
  | { type: "property$"; props: PropertyElementProps };

const reconciler = ReactReconciler<
  Element["type"],
  Element["props"],
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

  // Persistent mode is found to work better than mutation mode for our use
  // case since we need granular control over the order of events from the
  // root level.
  supportsPersistence: true,

  supportsHydration: false,

  // -------------------
  //    Core Methods
  // -------------------

  createInstance(type, props) {
    return createInstance(type, props);
  },

  cloneInstance(
    instance,
    _updatePayload,
    type,
    oldProps,
    newProps,
    __DEV__internalInstanceHandle,
    keepChildren,
  ) {
    const [isShallowEqual] = shallowEqual(oldProps, newProps);
    const typeIsEqual = `${instance.instanceType}$` === type;

    if (typeIsEqual && isShallowEqual) {
      return instance;
    }

    return instance.cloneWithProps(newProps, keepChildren);
  },

  appendInitialChild(parentInstance: Instance, child: Instance) {
    parentInstance.addChild(child);
  },

  createTextInstance() {
    throw new Error("Text nodes are not supported");
  },

  finalizeInitialChildren() {
    return false;
  },

  prepareUpdate() {
    return {};
  },

  shouldSetTextContent() {
    return false;
  },

  getRootHostContext(rootContext) {
    return rootContext;
  },

  getChildHostContext(parentHostContext) {
    return parentHostContext;
  },

  getPublicInstance(instance) {
    return instance;
  },

  prepareForCommit() {
    console.log("prepareForCommit called");
    return null;
  },

  resetAfterCommit() {
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
    return DefaultEventPriority;
  },

  getInstanceFromNode() {
    return null;
  },

  beforeActiveInstanceBlur() {},
  afterActiveInstanceBlur() {},
  prepareScopeUpdate() {},

  getInstanceFromScope() {
    return null;
  },

  detachDeletedInstance() {},

  createContainerChildSet() {
    return [];
  },

  appendChildToContainerChildSet(childSet, child: Instance) {
    if (!(child instanceof Device)) {
      throw new Error(
        `Only devices can be at the root of the tree. Got: ${child.constructor.name}`,
      );
    }

    childSet.push(child);
  },

  finalizeContainerChildren() {
  },

  replaceContainerChildren(container, newChildren: Device[]) {
    console.log(newChildren.map(generateDeviceDescription));
    container.rootDevices = newChildren;
  },
});

export function register(
  whatToRender: React.ReactNode,
  mqtt: MqttAdapter,
) {
  const container = reconciler.createContainer(
    { rootDevices: [], mqtt },
    0,
    null,
    true,
    null,
    "",
    () => {},
    null,
  );

  reconciler.updateContainer(whatToRender, container, null, null);

  return () => {
    reconciler.updateContainer(null, container, null, null);
    reconciler.flushPassiveEffects();
    reconciler.flushSync();
  };
}

function generateDeviceDescription(device: Device) {
  return JSON.stringify(device);
}
