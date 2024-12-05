import type { MqttAdapter } from "@nstadigs/homie-adapter";
import type { PropertyElementProps } from "../jsx-runtime.ts";
import type { Instance } from "./Instance.ts";
import type { Node } from "./Node.ts";

export class Property implements Instance {
  readonly instanceType = "property" as const;

  readonly id: string;
  readonly datatype: string;
  readonly name?: string;
  readonly format?: string;
  readonly retained?: boolean;

  path?: string;
  mqtt?: MqttAdapter;

  // deno-lint-ignore no-explicit-any
  onSet?: (value: any) => void;
  value?: unknown;
  target?: unknown;

  constructor(props: PropertyElementProps) {
    this.id = props.id;
    this.name = props.name ?? this.id;
    this.datatype = props.datatype;
    this.format = props.format;
    this.retained = props.retained;
    this.onSet = props.onSet;
    this.value = props.value;
    this.target = props.target;
  }

  addChild() {
    throw new Error("Properties cannot have children");
  }

  commitMount() {
    if (this.value != null) {
      this.mqtt?.publish(
        `homie/5/${this.path}`,
        this.value.toString(),
        2,
        !!this.retained,
      );
    }

    if (this.target != null) {
      this.mqtt?.publish(
        `homie/5/${this.path}/$target`,
        this.target.toString(),
        2,
        !!this.retained,
      );
    }
  }

  prepareUpdate(
    oldProps: Record<string, unknown>,
    newProps: Record<string, unknown>,
  ): null | Array<unknown> {
    const allKeys = new Set([
      ...Object.keys(oldProps),
      ...Object.keys(newProps),
    ]);

    const updates = [];

    for (const key of allKeys) {
      if (oldProps[key] !== newProps[key]) {
        updates.push([key, newProps[key]]);
      }
    }

    return updates[0] == null ? null : updates;
  }

  commitUpdate(updatePayload: [key: string, value: unknown][]): void {
    if (updatePayload == null) {
      return;
    }

    const valuesToUpdate = [
      "name",
      "datatype",
      "format",
      "retained",
      "onSet",
      "value",
      "target",
    ];

    for (const [key, value] of updatePayload) {
      if (key === "value") {
        this.mqtt?.publish(
          `homie/5/${this.path}`,
          String(value),
          2,
          !!this.retained,
        );
      } else if (key === "target") {
        this.mqtt?.publish(
          `homie/5/${this.path}/$target`,
          String(value),
          2,
          !!this.retained,
        );
      }

      if (valuesToUpdate.includes(key)) {
        (this as Record<string, unknown>)[key] = value;
      }
    }
  }

  setMqtt(mqtt: MqttAdapter) {
    this.mqtt = mqtt;
  }

  setParent(node: Node) {
    this.path = `${node.deviceId}/${node.id}/${this.id}`;
  }

  toJSON() {
    return {
      name: this.name,
      datatype: this.datatype,
      format: this.format,
      retained: this.retained,
      settable: this.onSet != null,
    };
  }
}
