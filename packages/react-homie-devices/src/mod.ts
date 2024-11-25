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
  children: React.ReactElement[];
};

type Type = "device$" | "node$" | "property$";

type Device = {
  id: string;
  description: DeviceDescription;
};

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
  React.ReactElement,
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
    console.log("createInstance called with", type, props.id);
    if (!props.id) {
      throw new Error("All elements must have an id");
    }

    return {
      key: props.id,
      type,
      props,
      children: [],
    };
  },

  createTextInstance() {
    throw new Error("Text nodes are not supported");
  },

  appendInitialChild(parentInstance, child) {
    console.log(
      "appendInitialChild called with",
      parentInstance.type,
      (child as any).type as string,
    );
  },

  finalizeInitialChildren(instance) {
    return false;
  },

  prepareUpdate() {
    return null;
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
    _keepChildren,
    _recyclableInstance,
  ) {
    const isEqual = instance.type === type && shallowEqual(oldProps, newProps);

    console.log("cloneInstance called with", instance.type, newProps.id);

    if (isEqual) {
      return instance;
    }

    return React.cloneElement(instance, newProps);
  },

  createContainerChildSet() {
    return [];
  },

  appendChildToContainerChildSet(childSet, child) {
    childSet.push(child);
  },

  removeChild(container, child) {
    console.log("removeChild called with", (child as any).props.id);
  },

  finalizeContainerChildren() {},

  replaceContainerChildren(container, newChildren: React.ReactElement[]) {
    const changes = [];

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

    container.children = newChildren;

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
    { changes, children: [] },
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

function shallowEqual(objA: unknown, objB: unknown): boolean {
  if (Object.is(objA, objB)) {
    return true;
  }

  if (
    typeof objA !== "object" || objA === null ||
    typeof objB !== "object" || objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
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
      return false;
    }
  }

  return true;
}

const hasOwnProperty = Object.prototype.hasOwnProperty;
