// @deno-types="@types/react-reconciler"
import ReactReconciler from "npm:react-reconciler";
// @deno-types="@types/react-reconciler/constants"
import { DefaultEventPriority } from "react-reconciler/constants.js";

// @deno-types="npm:@types/react"
import type React from "react";

import { createInstance, type Instance } from "./Instance.ts";
import type { Device } from "./Device.ts";
import type {
  DeviceElementProps,
  NodeElementProps,
  PropertyElementProps,
} from "../jsx-runtime.ts";

import { Container } from "./Container.ts";
import type { CreateConnectionFn } from "./Container.ts";

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
  null,
  unknown,
  Record<string, Device>, // ChildSet
  unknown,
  unknown
>({
  supportsMutation: true,
  supportsPersistence: false,

  supportsHydration: false,

  // MARK: createInstance
  createInstance(type, props) {
    return createInstance(type, props);
  },

  appendInitialChild(parentInstance: Instance, child: Instance) {
    parentInstance.addChild(child);
  },

  appendChild(parentInstance: Instance, child: Instance) {
    parentInstance.addChild(child);
  },

  appendChildToContainer(container, child: Instance) {
    container.addChild(child);
  },

  createTextInstance() {
    throw new Error("Text nodes are not supported");
  },

  // MARK: finilizeInitialChildren
  finalizeInitialChildren() {
    return true;
  },

  // MARK: prepareUpdate
  prepareUpdate(
    instance,
    _type,
    oldProps: Record<
      string,
      unknown
    >,
    newProps: Record<
      string,
      unknown
    >,
  ) {
    return instance.prepareUpdate(oldProps, newProps);
  },

  // MARK: commitMount
  commitMount(
    instance,
  ) {
    instance.commitMount();
  },

  // MARK: commitUpdate
  commitUpdate(
    instance,
    updatePayload: unknown[],
  ) {
    instance.commitUpdate(updatePayload);
  },

  removeChildFromContainer(container, child: Instance) {
    container.removeChild(child);
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
  clearContainer() {},
});

// MARK: register
export function register(
  whatToRender: React.ReactNode,
  createConnection: CreateConnectionFn,
) {
  const containerContext = new Container(createConnection);

  const container = reconciler.createContainer(
    containerContext,
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
