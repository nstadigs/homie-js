import type { MqttAdapter } from "@nstadigs/homie-adapter";
import type { Instance } from "./Instance.ts";
import { Device } from "./Device.ts";
import { assert } from "@std/assert";

export type WillConfig = {
  topic: string;
  payload: string;
  qos: number;
  retain: boolean;
};

export type CreateConnectionFn = (opts: { will: WillConfig }) => MqttAdapter;

export class Container {
  rootDevices: Record<string, Device> = {};
  devicesById: Record<string, React.Component> = {};
  createConnection: CreateConnectionFn;

  constructor(createConnection: CreateConnectionFn) {
    this.createConnection = createConnection;
  }

  addChild(child: Instance) {
    assert(child instanceof Device, "Only devices can be added to the root");

    // Root devices handles the mqtt connection. See the specification for
    // last will and testament: https://homieiot.github.io/specification/#last-will-and-testament
    child.recursivelySetMqtt(this.createConnection({
      will: {
        topic: `$homie/${child.id}/$state`,
        payload: "lost",
        qos: 2,
        retain: true,
      },
    }));

    this.rootDevices[child.id] = child;
  }

  removeChild(child: Instance) {
    delete this.rootDevices[child.id];
  }
}
