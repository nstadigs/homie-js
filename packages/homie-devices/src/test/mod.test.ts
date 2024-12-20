import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import { createRootDevice, type SetCommandCallback } from "../mod.ts";
import { TestMqttAdapter } from "./utils.ts";

describe("Initializing root device", () => {
  it("Publishes correct topics and payloads", async () => {
    const mqttAdapter = new TestMqttAdapter();

    const rootDevice = createTestRootDevice(mqttAdapter);

    await rootDevice.start();

    assertEquals(mqttAdapter.events.length, 3);
    assertEquals(mqttAdapter.events[0], {
      payload: "init",
      qos: 2,
      retained: true,
      topic: "homie/5/root-device/$state",
    });

    assertEquals(mqttAdapter.events[1], {
      topic: "homie/5/root-device/$description",
      payload: JSON.stringify({
        name: "Test Device",
        nodes: {
          "node-1": {
            name: "Test Node",
            properties: {
              "property-1": {
                name: "Test Property",
                datatype: "integer",
                format: "0:100",
                retained: true,
                settable: true,
              },
              "property-2": {
                name: "Test Property",
                datatype: "integer",
                format: "0:100",
                retained: true,
                settable: true,
              },
            },
          },
        },
        homie: "5.0",
        version: 3337458480,
        children: [],
      }),
      qos: 2,
      retained: true,
    });

    assertEquals(mqttAdapter.events[2], {
      payload: "ready",
      qos: 2,
      retained: true,
      topic: "homie/5/root-device/$state",
    });
  });

  it("Subscribes to set topic", async () => {
    const mqttAdapter = new TestMqttAdapter();

    const rootDevice = createTestRootDevice(mqttAdapter);

    await rootDevice.start();

    assertEquals(
      true,
      mqttAdapter.subscribedTopics.has("homie/5/root-device/+/+/set"),
    );
  });
});

describe("Reconfiguring device", () => {
  it("publishes correct $state before and after reconfiguration", async () => {
    const mqttAdapter = new TestMqttAdapter();
    const rootDevice = createTestRootDevice(mqttAdapter);
    await rootDevice.start();

    mqttAdapter.reset();

    await rootDevice.reconfigure((config) => {
      config.name = "New Name";
    });

    assertEquals(mqttAdapter.events.length, 3);

    assertEquals(mqttAdapter.events[0], {
      payload: "init",
      qos: 2,
      retained: true,
      topic: "homie/5/root-device/$state",
    });

    assertEquals(
      mqttAdapter.events[1].topic,
      "homie/5/root-device/$description",
    );

    assertEquals(mqttAdapter.events[2], {
      payload: "ready",
      qos: 2,
      retained: true,
      topic: "homie/5/root-device/$state",
    });
  });

  it("publishes correct $configuration", async () => {
    const mqttAdapter = new TestMqttAdapter();
    const rootDevice = createTestRootDevice(mqttAdapter);
    await rootDevice.start();

    mqttAdapter.reset();

    await rootDevice.reconfigure((config) => {
      config.name = "New Name";
    });

    assertEquals(mqttAdapter.events.length, 3);

    assertEquals(mqttAdapter.events[1], {
      payload: JSON.stringify({
        name: "New Name",
        nodes: {
          "node-1": {
            name: "Test Node",
            properties: {
              "property-1": {
                name: "Test Property",
                datatype: "integer",
                format: "0:100",
                retained: true,
                settable: true,
              },
              "property-2": {
                name: "Test Property",
                datatype: "integer",
                format: "0:100",
                retained: true,
                settable: true,
              },
            },
          },
        },
        homie: "5.0",
        version: 3448011083,
        children: [],
      }),
      qos: 2,
      retained: true,
      topic: "homie/5/root-device/$description",
    });
  });

  it("deletes value and $target topics on node removal", async () => {
    const mqttAdapter = new TestMqttAdapter();
    const rootDevice = createTestRootDevice(mqttAdapter);

    await rootDevice.start();

    mqttAdapter.reset();

    await rootDevice.reconfigure((config) => {
      delete config.nodes?.["node-1"];
    });

    assertEquals(mqttAdapter.events.length, 7);
    assertEquals(mqttAdapter.events[1], {
      topic: "homie/5/root-device/node-1/property-1",
      payload: "",
      qos: 2,
      retained: true,
    });
    assertEquals(mqttAdapter.events[2], {
      topic: "homie/5/root-device/node-1/property-1/$target",
      payload: "",
      qos: 2,
      retained: true,
    });
    assertEquals(mqttAdapter.events[3], {
      topic: "homie/5/root-device/node-1/property-2",
      payload: "",
      qos: 2,
      retained: true,
    });
    assertEquals(mqttAdapter.events[4], {
      topic: "homie/5/root-device/node-1/property-2/$target",
      payload: "",
      qos: 2,
      retained: true,
    });
  });

  it("deletes value and $target topics on property removal", async () => {
    const mqttAdapter = new TestMqttAdapter();
    const rootDevice = createTestRootDevice(mqttAdapter);

    await rootDevice.start();

    mqttAdapter.reset();

    await rootDevice.reconfigure((config) => {
      delete config.nodes?.["node-1"]?.properties?.["property-1"];
    });

    assertEquals(mqttAdapter.events.length, 5);
    assertEquals(mqttAdapter.events[1], {
      topic: "homie/5/root-device/node-1/property-1",
      payload: "",
      qos: 2,
      retained: true,
    });
    assertEquals(mqttAdapter.events[2], {
      topic: "homie/5/root-device/node-1/property-1/$target",
      payload: "",
      qos: 2,
      retained: true,
    });
  });
});

describe("Set command handling", () => {
  it("gets called with converted value when a valid set command is received", async () => {
    const mqttAdapter = new TestMqttAdapter();
    const rootDevice = createTestRootDevice(mqttAdapter);

    await rootDevice.start();

    let calledWith: Parameters<SetCommandCallback> | null = null;

    rootDevice.onCommand((...args) => {
      calledWith = args;
    });

    await mqttAdapter.publish(
      "homie/5/root-device/node-1/property-1/set",
      "50",
      0,
      false,
    );

    assertEquals(calledWith, [{
      propertyId: "property-1",
      nodeId: "node-1",
      value: 50,
      raw: "50",
    }]);
  });

  it("ignores invalid payloads", async () => {
    const mqttAdapter = new TestMqttAdapter();
    const rootDevice = createTestRootDevice(mqttAdapter);

    await rootDevice.start();

    let called = false;

    rootDevice.onCommand(() => {
      called = true;
    });

    await mqttAdapter.publish(
      "homie/5/root-device/node-1/property-1/set",
      "invalid",
      0,
      false,
    );

    assertEquals(called, false);
  });
});

describe("Setting values", () => {
  it("publishes correct value and $target topics", async () => {
    const mqttAdapter = new TestMqttAdapter();
    const rootDevice = createTestRootDevice(mqttAdapter);

    await rootDevice.start();
    mqttAdapter.events = [];

    await rootDevice.setValue("node-1", "property-1", "50");

    assertEquals(mqttAdapter.events.length, 1);
    assertEquals(mqttAdapter.events[0], {
      topic: "homie/5/root-device/node-1/property-1",
      payload: "50",
      qos: 2,
      retained: true,
    });
  });

  it("ignores invalid values", async () => {
    const mqttAdapter = new TestMqttAdapter();
    const rootDevice = createTestRootDevice(mqttAdapter);

    await rootDevice.start();
    mqttAdapter.events = [];

    await rootDevice.setValue("node-1", "property-1", "200");

    assertEquals(mqttAdapter.events.length, 0);
  });
});

describe("Creating child device", () => {
  it("Publishes correct topics and payloads", async () => {
    const mqttAdapter = new TestMqttAdapter();

    const rootDevice = createTestRootDevice(mqttAdapter);

    await rootDevice.start();

    mqttAdapter.reset();

    await rootDevice.createDevice("child-device", {
      name: "Child Device",
      nodes: {
        "node-1": {
          name: "Node 1",
          properties: {
            "property-1": {
              name: "Property 1",
              datatype: "integer",
              format: "0:100",
              retained: true,
              settable: true,
            },
          },
        },
      },
    });

    assertEquals(mqttAdapter.events.length, 6);

    // root init
    assertEquals(mqttAdapter.events[0], {
      topic: "homie/5/root-device/$state",
      payload: "init",
      qos: 2,
      retained: true,
    });

    // child init
    assertEquals(mqttAdapter.events[1], {
      topic: "homie/5/child-device/$state",
      payload: "init",
      qos: 2,
      retained: true,
    });

    // child description
    assertEquals(mqttAdapter.events[2], {
      topic: "homie/5/child-device/$description",
      payload: JSON.stringify({
        "name": "Child Device",
        "nodes": {
          "node-1": {
            "name": "Node 1",
            "properties": {
              "property-1": {
                "name": "Property 1",
                "datatype": "integer",
                "format": "0:100",
                "retained": true,
                "settable": true,
              },
            },
          },
        },
        "homie": "5.0",
        "version": 31206040,
        "root": "root-device",
        "parent": "root-device",
        "children": [],
      }),
      qos: 2,
      retained: true,
    });

    // child ready
    assertEquals(mqttAdapter.events[3], {
      topic: "homie/5/child-device/$state",
      payload: "ready",
      qos: 2,
      retained: true,
    });

    // // root description
    assertEquals(
      mqttAdapter.events[4].topic,
      "homie/5/root-device/$description",
    );
    assertEquals(mqttAdapter.events[4].qos, 2);
    assertEquals(mqttAdapter.events[4].retained, true);
    const description = JSON.parse(mqttAdapter.events[4].payload);
    assertEquals(description.children, ["child-device"]);

    // // root ready
    assertEquals(mqttAdapter.events[5], {
      topic: "homie/5/root-device/$state",
      payload: "ready",
      qos: 2,
      retained: true,
    });
  });

  it("Subscribes to set topic", async () => {
    const mqttAdapter = new TestMqttAdapter();

    const rootDevice = createTestRootDevice(mqttAdapter);

    await rootDevice.start();

    await rootDevice.createDevice("child-device", {
      name: "Child Device",
      nodes: {
        "node-1": {
          name: "Node 1",
          properties: {
            "property-1": {
              name: "Property 1",
              datatype: "integer",
              format: "0:100",
              retained: true,
              settable: true,
            },
          },
        },
      },
    });

    assertEquals(
      true,
      mqttAdapter.subscribedTopics.has("homie/5/child-device/+/+/set"),
    );
  });
});

function createTestRootDevice(mqttAdapter: TestMqttAdapter) {
  return createRootDevice(
    "root-device",
    {
      name: "Test Device",
      nodes: {
        "node-1": {
          name: "Test Node",
          properties: {
            "property-1": {
              name: "Test Property",
              datatype: "integer",
              format: "0:100",
              retained: true,
              settable: true,
            },
            "property-2": {
              name: "Test Property",
              datatype: "integer",
              format: "0:100",
              retained: true,
              settable: true,
            },
          },
        },
      },
    },
    mqttAdapter,
  );
}
