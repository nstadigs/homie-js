import { assertSnapshot } from "@std/testing/snapshot";

// @deno-types="npm:@types/react"
import React, { act, useState } from "react";
import { Device, Node, Property, register } from "../mod.ts";
import { TestMqttAdapter } from "./testutils.ts";

Deno.test("Initial render", async (t) => {
  // deno-lint-ignore require-await
  const { cleanUp, mqtt } = await act(async () => {
    return testRender(<Controller />);
  });

  await assertSnapshot(t, mqtt.events);
  await act(cleanUp);
});

Deno.test("Set new value and target", async (t) => {
  const { cleanUp, mqtt } = await act(() => {
    return testRender(<Controller />);
  });

  mqtt.events = [];

  await act(() => {
    mqtt.publish(
      "homie/5/root-device/root-device-node/property-2/set",
      "41",
      0,
      false,
    );
  });

  await assertSnapshot(t, mqtt.events);
  await act(cleanUp);
});

Deno.test("Set updates root device", async (t) => {
  function Controller() {
    const [rootDeviceName, setRootDeviceName] = useState("");

    return (
      <Device id="root-device" name={`${rootDeviceName}`}>
        <Node id="root-device-node">
          <Property
            id="device-name-property"
            datatype="string"
            onSet={(name) => {
              setRootDeviceName(name);
            }}
          />
        </Node>
        <Device id="child-device" />
      </Device>
    );
  }

  const { cleanUp, mqtt } = await act(() => {
    return testRender(<Controller />);
  });

  mqtt.events = [];

  await act(() => {
    mqtt.publish(
      "homie/5/root-device/root-device-node/device-name-property/set",
      "New name",
      0,
      false,
    );
  });

  await assertSnapshot(t, mqtt.events);
  await act(cleanUp);
});

Deno.test("Set updates property", async (t) => {
  function Controller() {
    const [propertyName, setPropertyName] = useState("old name");

    return (
      <Device id="root-device" name={`${propertyName}`}>
        <Node id="root-device-node">
          <Property
            id="property-name"
            name={propertyName}
            datatype="string"
            onSet={(name) => {
              setPropertyName(name);
            }}
          />
        </Node>
        <Device id="child-device" />
      </Device>
    );
  }

  const { cleanUp, mqtt } = await act(() => {
    return testRender(<Controller />);
  });

  mqtt.events = [];

  await act(() => {
    mqtt.publish(
      "homie/5/root-device/root-device-node/property-name/set",
      "New name",
      0,
      false,
    );
  });

  await assertSnapshot(t, mqtt.events);
  await act(cleanUp);
});

function Controller() {
  const [someValue, setSomeValue] = useState(0);

  return (
    // TODO: Name
    <Device id="root-device" name="0">
      <Node id="root-device-node">
        <Property
          id="property-2"
          name="Property 3"
          datatype="integer"
          onSet={(addValue) => {
            setSomeValue((value) => value + addValue);
          }}
          value={someValue}
          target={someValue}
        />
      </Node>
      <Device id="child-device" />
    </Device>
  );
}

function testRender(whatToRender: React.ReactNode) {
  // TODO: This only returns a single mqtt adapter. We should make
  // one per root devices somehow.
  const mqtt = new TestMqttAdapter();
  const cleanUp = register(whatToRender, () => mqtt);
  return { mqtt, cleanUp };
}
