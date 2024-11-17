import { createRootDevice } from "../index";
import { TestMqttAdapter } from "./utils";
import { describe, test, it } from "node:test";
import assert from "node:assert";

describe("Initializing device", () => {
  it("Publishes correct topics and payloads", async () => {
    const mqttAdapter = new TestMqttAdapter();

    const rootDevice = createTestRootDevice(mqttAdapter);

    await rootDevice.start();

    assert.equal(mqttAdapter.events.length, 3);
    assert.deepEqual(mqttAdapter.events[0], {
      payload: "init",
      qos: 2,
      retained: true,
      topic: "homie/5/test-device/$state",
    });

    assert.deepEqual(mqttAdapter.events[1], {
      topic: "homie/5/test-device/$description",
      payload: JSON.stringify({
        name: "Test Device",
        nodes: {
          "test-node": {
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
        version: "f785781f",
        children: [],
      }),
      qos: 2,
      retained: true,
    });

    assert.deepEqual(mqttAdapter.events[2], {
      payload: "ready",
      qos: 2,
      retained: true,
      topic: "homie/5/test-device/$state",
    });
  });
});

describe("Reconfiguring device", () => {
  it("publishes $state before and after reconfiguration", async () => {
    const mqttAdapter = new TestMqttAdapter();
    const rootDevice = createTestRootDevice(mqttAdapter);

    await rootDevice.start();

    mqttAdapter.reset();

    await rootDevice.reconfigure((config) => {
      config.name = "New Name";
    });

    assert.equal(mqttAdapter.events.length, 3);

    assert.deepEqual(mqttAdapter.events[0], {
      payload: "init",
      qos: 2,
      retained: true,
      topic: "homie/5/test-device/$state",
    });

    assert.deepEqual(mqttAdapter.events[1], {
      payload: JSON.stringify({
        name: "New Name",
        nodes: {
          "test-node": {
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
        version: "a67a72fc",
        children: [],
      }),
      qos: 2,
      retained: true,
      topic: "homie/5/test-device/$description",
    });

    assert.deepEqual(mqttAdapter.events[2], {
      payload: "ready",
      qos: 2,
      retained: true,
      topic: "homie/5/test-device/$state",
    });
  });
  it("deletes value and $target topics on node removal", async () => {
    const mqttAdapter = new TestMqttAdapter();
    const rootDevice = createTestRootDevice(mqttAdapter);

    await rootDevice.start();

    mqttAdapter.reset();

    await rootDevice.reconfigure((config) => {
      delete config.nodes?.["test-node"];
    });

    assert.equal(mqttAdapter.events.length, 7);
    assert.deepEqual(mqttAdapter.events[1], {
      topic: "homie/5/test-device/test-node/property-1",
      payload: "",
      qos: 2,
      retained: true,
    });
    assert.deepEqual(mqttAdapter.events[2], {
      topic: "homie/5/test-device/test-node/property-1/$target",
      payload: "",
      qos: 2,
      retained: true,
    });
    assert.deepEqual(mqttAdapter.events[3], {
      topic: "homie/5/test-device/test-node/property-2",
      payload: "",
      qos: 2,
      retained: true,
    });
    assert.deepEqual(mqttAdapter.events[4], {
      topic: "homie/5/test-device/test-node/property-2/$target",
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
      delete config.nodes?.["test-node"]?.properties?.["property-1"];
    });

    assert.equal(mqttAdapter.events.length, 5);
    assert.deepEqual(mqttAdapter.events[1], {
      topic: "homie/5/test-device/test-node/property-1",
      payload: "",
      qos: 2,
      retained: true,
    });
    assert.deepEqual(mqttAdapter.events[2], {
      topic: "homie/5/test-device/test-node/property-1/$target",
      payload: "",
      qos: 2,
      retained: true,
    });
  });
});

describe("Publishing to /set", () => {
  describe("Format: float", () => {
    it("rounds to nearest step", async () => {});

    it("sets to max if result is higher", async () => {});

    it("sets to min if result is lower", async () => {});
  });

  describe("Format: integer", () => {
    it("rounds to nearest step", async () => {});

    it("sets to max if result is higher", async () => {});

    it("sets to min if result is lower", async () => {});
  });
});

function createDeviceWithAllTypesOfProps(mqttAdapter: TestMqttAdapter) {
  return createRootDevice(
    "test-device",
    {
      name: "Test Device",
      nodes: {
        float: {
          name: "Test Node",
          properties: {
            "with-max-only": {
              name: "Test Property",
              datatype: "integer",
              format: ":100",
              retained: true,
              settable: true,
            },
            "with-min-only": {
              name: "Test Property",
              datatype: "integer",
              format: "0:",
              retained: true,
              settable: true,
            },
            "with-step-only": {
              name: "Test Property",
              datatype: "integer",
              format: "::100",
              retained: true,
              settable: true,
            },
            "with-min-max": {
              name: "Test Property",
              datatype: "integer",
              format: "0:100",
              retained: true,
              settable: true,
            },
            "with-min-max": {
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
    mqttAdapter
  );
}

function createTestRootDevice(mqttAdapter: TestMqttAdapter) {
  return createRootDevice(
    "test-device",
    {
      name: "Test Device",
      nodes: {
        "test-node": {
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
    mqttAdapter
  );
}
