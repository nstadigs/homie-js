import createLgtvClient from "npm:lgtv2";
import { wake } from "jsr:@bukhalo/wol";
import { createRootDevice, MqttAdapter } from "jsr:@nstadigs/homie-devices";
import { Device, Enum, Node } from "react-homie-devices";
import { webosUris } from "./constants.ts";

// @deno-types="@types/react"
import * as React from "react";


class TestAdapter implements MqttAdapter {
  connect(url: string): Promise<void> {
    console.log("Connecting to MQTT broker");
    return Promise.resolve();
  }

  disconnect(url: string): Promise<void> {
    console.log("Disconnecting from MQTT broker");
    return Promise.resolve();
  }

  subscribe(topic: string): Promise<void> {
    console.log("Subscribing to", topic);
    return Promise.resolve();
  }

  unsubscribe(topic: string): Promise<void> {
    console.log("Unsubscribing from", topic);
    return Promise.resolve();
  }

  publish(
    topic: string,
    payload: string,
    qos: 0 | 1 | 2,
    retained: boolean,
  ): Promise<void> {
    console.log("Pub:", topic, payload);
    return Promise.resolve();
  }

  onMessage(callback: (topic: string, payload: string) => void): () => void {
    console.log("Setting up message callback");
    return () => {
      console.log("Removing message callback");
    };
  }

  onBeforeDisconnect(callback: () => void): void {
    console.log("Setting up before disconnect callback");
  }
}




function Controller() {
  const 

  return (
    <Device id="webos-controller" name="WebOS Devices Controller">
      <DiscoveryNode />
    </Device>
  );
}

const device = createRootDevice("lgtv", {
  name: "LG TV",
  nodes: {
    system: {
      name: "System",
      properties: {
        power: {
          name: "Power",
          datatype: "boolean",
          settable: true,
          retained: true,
        },
      },
    },

    audio: {
      name: "Audio",
      properties: {
        volume: {
          name: "Volume",
          datatype: "integer",
          settable: true,
          retained: true,
          unit: "%",
        },

        muted: {
          name: "Muted",
          datatype: "boolean",
          settable: true,
          retained: true,
          format: "yes,no",
        },

        command: {
          name: "Command",
          datatype: "enum",
          format: "volume_up,volume_down",
          settable: true,
          retained: false,
        },
      },
    },
  },
}, new TestAdapter());

device.onCommand(({ nodeId, propertyId, value }) => {
  // const valueAsString = typeof value === "string" ? value : JSON.stringify(value);
  // device.setValue(nodeId, propertyId, valueAsString);
  console.log("Command received", { nodeId, propertyId, value });

  switch (nodeId) {
    case "system":
      switch (propertyId) {
        case "power":
          switch (value) {
            case true:
              wake("64:E4:A5:C5:99:33");
              break;

            case false:
              lgtv.send("ssap://system/turnOff");
              break;
          }
          break;
      }
      break;

    case "audio":
      switch (propertyId) {
        case "volume":
          console.log("Volume command", value);
          lgtv.send(webosUris.SET_VOLUME, { volume: value });
          break;

        case "command":
          switch (value) {
            case "volume_up":
              console.log("Volume up command");
              lgtv.send(webosUris.VOLUME_UP);

              break;

            case "volume_down":
              console.log("Volume down command");
              lgtv.send(webosUris.VOLUME_DOWN);
              break;

            case "muted":
              lgtv.send(webosUris.SET_MUTE, { mute: value });
          }
          break;
      }
      break;
  }
});

device.start();

const lgtv = createLgtvClient({
  url: "wss://192.168.0.33:3001",
  wsconfig: {
    keepalive: true,
    keepaliveInterval: 10000,
    dropConnectionOnKeepaliveTimeout: false,
    keepaliveGracePeriod: 5000,
    tlsOptions: {
      rejectUnauthorized: false,
    },
  },
});

lgtv.on("error", function (err) {
  console.log(err);
});

lgtv.on("connect", function () {
  console.log("connected");

  lgtv.subscribe(webosUris.AUDIO_STATUS, function (err, res) {
    if (err) {
      console.log(err);
      return;
    }

    device.setValue("audio", "volume", res.volume);
    device.setValue("audio", "muted", JSON.stringify(res.mute));
  });

  lgtv.subscribe(
    "ssap://api/getServiceList",
    function (err, res) {
      if (err) {
        console.log(err);
        return;
      }

      console.log("services", res);
    },
  );
});

// import { Client } from "jsr:@bukhalo/webos-client";

// const client = new Client("wss://192.168.0.33:3001");
// await client.register();
// await client.sendLunaMessage("", {});
