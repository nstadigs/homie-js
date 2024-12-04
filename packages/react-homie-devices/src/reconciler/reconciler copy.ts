// @deno-types="@types/react-reconciler"
import ReactReconciler from "npm:react-reconciler";
// @deno-types="@types/react-reconciler/constants"
import { DefaultEventPriority } from "react-reconciler/constants.js";
import type { MqttAdapter } from "@nstadigs/homie-adapter";

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

import { validateValue } from "@nstadigs/homie-spec";
import { Property } from "./Property.ts";

type Container = {
  rootDevices: Record<string, Device>;
  devicesById: Record<string, Device>;
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

  // MARK: createInstance
  createInstance(type, props) {
    return createInstance(type, props);
  },

  // MARK: cloneInstance
  cloneInstance(
    instance,
    // New props if changed, otherwise null. Passed from prepareUpdate
    updatePayload,
    _type,
    _oldProps,
    newProps,
    __DEV__internalInstanceHandle,
    keepChildren,
  ) {
    if (updatePayload == null && keepChildren) {
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

  // MARK: finilizeInitialChildren
  finalizeInitialChildren(instance, _type, props, rootContainer) {
    if (instance instanceof Property) {
      const { value, target, retained } = props as PropertyElementProps;

      if (value != null) {
        rootContainer.mqtt.publish(
          "homie/5/" + instance.path,
          value?.toString() ?? "",
          2,
          Boolean(retained),
        );

        instance.transferable.value = value;
      }

      if (target != null) {
        rootContainer.mqtt.publish(
          "homie/5/" + instance.path + "/$target",
          target?.toString() ?? "",
          2,
          Boolean(retained),
        );

        instance.transferable.target = target;
      }

      // Since prepareUpdate skips the onSet prop when comparing props, we need
      // to set it here to make sure we bring it over even if it was the only
      // thing that changed.
      instance.transferable.onSet = (props as PropertyElementProps).onSet;
    }

    return false;
  },

  // MARK: prepareUpdate
  prepareUpdate(
    instance,
    type,
    oldProps: Record<
      string,
      unknown
    >,
    newProps: Record<
      string,
      unknown
    >,
    rootContainer,
  ) {
    const nonConfigProps = ["children", "onSet", "value", "target"];
    const oldConfigProps = objWithout(oldProps, nonConfigProps);
    const newConfigProps = objWithout(newProps, nonConfigProps);

    const [isShallowEqual] = shallowEqual(
      oldConfigProps,
      newConfigProps,
    );

    const typeIsEqual = `${instance.instanceType}$` === type;

    // Don't know if this is the best place to handle this. Probably better
    // to do this in replaceContainerChildren.
    if (instance instanceof Property) {
      const { value, target, retained, onSet } =
        newProps as PropertyElementProps;

      if (instance.transferable.value !== value) {
        rootContainer.mqtt.publish(
          "homie/5/" + instance.path,
          value?.toString() ?? "",
          2,
          Boolean(retained),
        );

        instance.transferable.value = value;
      }

      if (instance.transferable.target !== target) {
        rootContainer.mqtt.publish(
          "homie/5/" + instance.path + "/$target",
          target?.toString() ?? "",
          2,
          Boolean(retained),
        );

        instance.transferable.target = target;
      }

      // Since prepareUpdate skips the onSet prop when comparing props, we need
      // to set it here to make sure we bring it over even if it was the only
      // thing that changed.
      instance.transferable.onSet = onSet;
    }

    if (typeIsEqual && isShallowEqual) {
      return null;
    }

    return newProps;
  },

  supportsMicrotasks: true,

  scheduleMicrotask(fn) {
    return queueMicrotask(fn);
  },

  shouldSetTextContent() {
    return false;
  },

  getRootHostContext() {
    return null;
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

  // MARK: replaceContainerChildren
  replaceContainerChildren(container, newChildren: Record<string, Device>) {
    const { changedDevices, devicesById } = collectDeviceChanges(
      container.rootDevices,
      newChildren,
    );

    for (const change of changedDevices) {
      if (change.type === "remove") {
        continue;
      }

      container.mqtt.publish(
        `homie/5/${change.device.id}/$state`,
        "init",
        2,
        true,
      );
    }

    for (const change of changedDevices.toReversed()) {
      if (change.type === "remove") {
        container.mqtt.publish(
          `homie/5/${change.device.id}/$state`,
          "",
          2,
          true,
        );
        container.mqtt.publish(
          `homie/5/${change.device.id}/$description`,
          "",
          2,
          true,
        );

        continue;
      }

      container.mqtt.publish(
        `homie/5/${change.device.id}/$description`,
        JSON.stringify(change.device, null, 2),
        2,
        true,
      );

      container.mqtt.publish(
        `homie/5/${change.device.id}/$state`,
        "ready",
        2,
        true,
      );
    }

    container.devicesById = devicesById;
    container.rootDevices = newChildren;
  },
});

// MARK: register
export function register(
  whatToRender: React.ReactNode,
  mqtt: MqttAdapter,
) {
  const context: Container = { rootDevices: {}, mqtt, devicesById: {} };

  const container = reconciler.createContainer(
    context,
    0,
    null,
    true,
    null,
    "",
    () => {},
    null,
  );

  mqtt.connect();

  mqtt.onMessage((topic, payload) => {
    const [_, homieVersion, deviceId, nodeId, propertyId, maybeSet] = topic
      .split("/");

    if (homieVersion === "5" && maybeSet !== "set") {
      return;
    }

    const property = context.devicesById[deviceId]?.nodes[nodeId]
      ?.properties[propertyId];

    if (property == null || property.onSet == null) {
      return;
    }

    const result = validateValue(
      property,
      payload.toString(),
    );

    if (result.valid) {
      property.onSet(result.value);
    }
  });

  reconciler.updateContainer(whatToRender, container, null, null);

  return () => {
    reconciler.updateContainer(null, container, null, null);
    reconciler.flushPassiveEffects();
    reconciler.flushSync();
  };
}

type DeviceChange = {
  type: "add" | "remove" | "update";
  device: Device;
  path: string;
};

function collectDeviceChanges(
  oldDevices: Record<string, Device>,
  newDevices: Record<string, Device>,
  _changedDevices: DeviceChange[] = [],
  _devicesById: Record<string, Device> = {},
  _path: string = "",
) {
  const allDeviceIds = new Set([
    ...Object.keys(oldDevices),
    ...Object.keys(newDevices),
  ]);

  for (const deviceId of allDeviceIds) {
    if (_devicesById[deviceId] != null) {
      throw new Error(
        `Duplicate device id "${deviceId}" found. Please make sure all device ids are unique`,
      );
    }

    _devicesById[deviceId] = newDevices[deviceId] ?? oldDevices[deviceId];

    const oldDevice = oldDevices[deviceId];
    const newDevice = newDevices[deviceId];

    if (oldDevice == null) {
      _changedDevices.push({
        type: "add",
        device: newDevice,
        path: `${_path}/${newDevice.id}`,
      });

      collectDeviceChanges(
        {},
        newDevice.childDevices,
        _changedDevices,
        _devicesById,
        `${_path}/${newDevice.id}`,
      );

      continue;
    }

    if (newDevice == null) {
      _changedDevices.push({
        type: "remove",
        device: oldDevice,
        path: `${_path}/${oldDevice.id}`,
      });

      collectDeviceChanges(
        oldDevice.childDevices,
        {},
        _changedDevices,
        _devicesById,
        `${_path}/${oldDevice.id}`,
      );

      continue;
    }

    if (oldDevice !== newDevice) {
      _changedDevices.push({
        type: "update",
        device: newDevice,
        path: `${_path}/${newDevice.id}`,
      });

      collectDeviceChanges(
        oldDevice.childDevices,
        newDevice.childDevices,
        _changedDevices,
        _devicesById,
        `${_path}/${newDevice.id}`,
      );
    }
  }

  return { changedDevices: _changedDevices, devicesById: _devicesById };
}

function objWithout<TObj extends Record<string, unknown>>(
  obj: TObj,
  keys: string[],
): Omit<TObj, keyof typeof keys> {
  const newObj = { ...obj };

  for (const key of keys) {
    delete newObj[key];
  }

  return newObj;
}
