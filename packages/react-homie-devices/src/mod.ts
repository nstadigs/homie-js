// @deno-types="@types/react-reconciler"
import ReactReconciler from "npm:react-reconciler";
// @deno-types="@types/react-reconciler/constants"
import { DefaultEventPriority } from "react-reconciler/constants.js";
import type { MqttAdapter } from "@nstadigs/homie-devices";
import type { DeviceDescription } from "@nstadigs/homie-spec";
// @deno-types="npm:@types/react"
import React from "react";

type Container = {
  changes: Change[];
  rootDevices: Device[];
};

type ElementType = "device$" | "node$" | "property$";

type Device = {
  id: string;
  description: DeviceDescription;
};

type DeviceInstance = {
  type: "device";
  props: Record<string, string>;
  nodes: Record<string, NodeInstance>;
  devices: Record<string, DeviceInstance>;
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
  ElementType,
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
    if (type !== "device$" && type !== "node$" && type !== "property$") {
      throw new Error(
        `Invalid type: ${type}. Use component Device, Node, or Property`,
      );
    }

    if (!props.id) {
      throw new Error("All elements must have an id");
    }

    switch (type) {
      case "device$":
        return {
          type: "device",
          props,
          nodes: {},
          devices: {},
        };
      case "node$":
        return {
          type: "node",
          props,
          properties: {},
        };
      case "property$":
        return {
          type: "property",
          props,
        };
    }
  },

  createTextInstance() {
    throw new Error("Text nodes are not supported");
  },

  appendInitialChild(parentInstance: Instance, child: Instance) {
    switch (parentInstance.type) {
      case "device":
        switch (child.type) {
          case "device":
            if (parentInstance.devices[child.props.id] != null) {
              throw new Error(
                `Child device with id ${child.props.id} already exists in device with id ${parentInstance.props.id}`,
              );
            }
            (parentInstance as DeviceInstance).devices[child.props.id] = child;
            break;

          case "node":
            (parentInstance as DeviceInstance).nodes[child.props.id] = child;
            break;

          default:
            throw new Error(
              "Only devices and nodes can be children of devices",
            );
        }

        break;

      case "node":
        if (child.type !== "property") {
          throw new Error(
            `Only properties can be children of nodes. Got: ${child.type}`,
          );
        }

        parentInstance.properties[child.props.id] = child;
        break;

      case "property":
        throw new Error(`Properties cannot have children. Got: ${child.type}`);
    }
  },

  finalizeInitialChildren(instance) {
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

  getChildHostContext(parentHostContext, type) {
    return parentHostContext;
  },

  getPublicInstance(instance) {
    return instance;
  },

  prepareForCommit() {
    console.log("prepareForCommit called");
    return null;
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
    return DefaultEventPriority;
  },

  getInstanceFromNode(node: any) {
    return null;
  },

  beforeActiveInstanceBlur() {},
  afterActiveInstanceBlur() {},
  prepareScopeUpdate() {},

  getInstanceFromScope() {
    return null;
  },

  detachDeletedInstance() {},

  // -------------------
  // Persistence Methods
  // -------------------

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
    const typeIsEqual = `${instance.type}$` === type;

    if (typeIsEqual && isShallowEqual) {
      return instance;
    }

    switch (instance.type) {
      case "device": {
        // Recreating both nodes and devices even if only one of them changed
        // is the set of children. This is because we don't have a way to
        // determine which children were added or removed. And in practice,
        // it should not matter because the description has to be resent
        // anyway.
        const devices = keepChildren ? instance.devices : {};
        const nodes = keepChildren ? instance.nodes : {};

        return {
          type: "device",
          props: newProps,
          nodes: nodes,
          devices,
        };
      }
      case "node": {
        const properties = keepChildren ? instance.properties : {};
        return {
          type: "node",
          props: newProps,
          properties,
        };
      }
      case "property":
        return {
          type: "property",
          props: newProps,
        };
    }
  },

  createContainerChildSet() {
    return [];
  },

  appendChildToContainerChildSet(childSet, child: Instance) {
    if (child.type !== "device") {
      throw new Error(
        `Only devices can be at the root of the tree. Got: ${child.type}`,
      );
    }

    childSet.push(child);
  },

  finalizeContainerChildren() {
  },

  replaceContainerChildren(container, newChildren: Device[]) {
    const changes = [];

    console.log(newChildren);

    // Calculate diff between newChildren and container.devices
    // for (const child of newChildren) {
    //   const oldChild = container.devices.find((c) =>
    //     c.props.id === child.props.id
    //   );

    //   if (oldChild == null) {
    //     changes.push({ type: "add", id: child.props.id });
    //     continue;
    //   }

    //   if (oldChild !== child) {
    //     changes.push({ type: "update", id: child.props.id });
    //   }
    // }

    container.rootDevices = newChildren;

    // Calculate changes
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

  const container = reconciler.createContainer(
    { changes, rootDevices: [] },
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

function traverseAndCollectChanges(
  instance: Instance,
  changes: Change[],
  mqttAdapter: MqttAdapter,
) {
  if (instance.type === "device") {
  }
}

function buildDeviceDescription(
  device: DeviceInstance,
  parentDevice: DeviceInstance,
): DeviceDescription {
  const nodes = {}; // TODO

  return {
    homie: "5.0",

    // TODO: Hash
    version: Date.now(),
    children: Object.keys(device.devices),
    root: parentDevice?.props.rootId ?? parentDevice?.props.id,
    parent: parentDevice?.props.id,
    nodes,
  };
}

function shallowEqual(objA: unknown, objB: unknown): [boolean, string | null] {
  if (Object.is(objA, objB)) {
    return [true, null];
  }

  if (
    typeof objA !== "object" || objA === null ||
    typeof objB !== "object" || objB === null
  ) {
    return [false, "type differs"];
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return [false, "length differs"];
  }

  // Test for A's keys different from B.
  for (let i = 0; i < keysA.length; i++) {
    if (
      !hasOwnProperty.call(objB, keysA[i]) ||
      !Object.is(
        (objA as Record<string, unknown>)[keysA[i]],
        (objB as Record<string, unknown>)[keysA[i]],
      )
    ) {
      return [false, keysA[i]];
    }
  }

  return [true, null];
}

const hasOwnProperty = Object.prototype.hasOwnProperty;
