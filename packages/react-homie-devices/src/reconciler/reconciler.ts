// @deno-types="@types/react-reconciler"
import ReactReconciler from "npm:react-reconciler";
// @deno-types="@types/react-reconciler/constants"
import { DefaultEventPriority } from "react-reconciler/constants.js";
import type { MqttAdapter } from "@nstadigs/homie-devices";

// @deno-types="npm:@types/react"
import type React from "react";

import { createInstance, type Instance } from "./Instance.ts";
import { shallowEqual } from "../utils.ts";
import { Device } from "./Device.ts";
import type {
  DeviceElementProps,
  NodeElementProps,
  PropertyElementProps,
} from "../jsx-runtime.ts";

type Container = {
  rootDevices: Record<string, Device>;
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
  Record<string, Device>, // ChildSet
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

  prepareUpdate(instance, type, oldProps, newProps) {
    // Better to do diffing in here maybe?
    return newProps;
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
    return null;
  },

  resetAfterCommit() {
  },

  preparePortalMount() {
    throw new Error("Portals are not supported");
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
    return {};
  },

  appendChildToContainerChildSet(childSet, child: Instance) {
    if (!(child instanceof Device)) {
      throw new Error(
        `Only devices can be at the root of the tree. Got: ${child.constructor.name}`,
      );
    }

    childSet[child.id] = child;
  },

  finalizeContainerChildren() {
  },

  replaceContainerChildren(container, newChildren: Record<string, Device>) {
    const seenDeviceIds: string[] = [];

    type Change = {
      type: "add" | "remove" | "update";
      device: Device;
      path: string;
    };

    const changedDevices: Change[] = [];

    function collectDeviceChanges(
      oldDevices: Record<string, Device>,
      newDevices: Record<string, Device>,
      _path: string = "",
    ) {
      const allDeviceIds = new Set([
        ...Object.keys(oldDevices),
        ...Object.keys(newDevices),
      ]);

      for (const deviceId of allDeviceIds) {
        if (seenDeviceIds.includes(deviceId)) {
          throw new Error(
            "Duplicate device id found. Please make sure all device ids are unique",
          );
        }

        seenDeviceIds.push(deviceId);

        const oldDevice = oldDevices[deviceId];
        const newDevice = newDevices[deviceId];

        if (oldDevice == null) {
          changedDevices.push({
            type: "add",
            device: newDevice,
            path: `${_path}/${newDevice.id}`,
          });

          collectDeviceChanges(
            {},
            newDevice.childDevices,
            `${_path}/${newDevice.id}`,
          );

          continue;
        }

        if (newDevice == null) {
          changedDevices.push({
            type: "remove",
            device: oldDevice,
            path: `${_path}/${oldDevice.id}`,
          });

          collectDeviceChanges(
            oldDevice.childDevices,
            {},
            `${_path}/${oldDevice.id}`,
          );

          continue;
        }

        if (oldDevice !== newDevice) {
          changedDevices.push({
            type: "update",
            device: newDevice,
            path: `${_path}/${newDevice.id}`,
          });

          collectDeviceChanges(
            oldDevice.childDevices,
            newDevice.childDevices,
            `${_path}/${newDevice.id}`,
          );
        }
      }

      return changedDevices;
    }

    collectDeviceChanges(
      container.rootDevices,
      newChildren,
    );

    for (const change of changedDevices) {
      if (change.type === "remove") {
        continue;
      }

      container.mqtt.publish(`${change.device.id}/$state`, "init", 2, true);
    }

    for (const change of changedDevices.toReversed()) {
      if (change.type === "remove") {
        // TODO: Clear value topics
        container.mqtt.publish(`${change.device.id}/$state`, "", 2, true);
        container.mqtt.publish(`${change.device.id}/$description`, "", 2, true);

        continue;
      }

      container.mqtt.publish(
        `${change.device.id}/$description`,
        JSON.stringify(change.device, null, 2),
        2,
        true,
      );

      container.mqtt.publish(`${change.device.id}/$state`, "ready", 2, true);
    }

    container.rootDevices = newChildren;
  },
});

export function register(
  whatToRender: React.ReactNode,
  mqtt: MqttAdapter,
) {
  const container = reconciler.createContainer(
    { rootDevices: {}, mqtt },
    0,
    null,
    true,
    null,
    "",
    () => {},
    null,
  );

  mqtt.connect("ws://localhost:8080");

  reconciler.updateContainer(whatToRender, container, null, null);

  return () => {
    reconciler.updateContainer(null, container, null, null);
    reconciler.flushPassiveEffects();
    reconciler.flushSync();
  };
}
