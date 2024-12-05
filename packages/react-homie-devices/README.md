Is this crazy? I mean, maaaybe... but it kinda works!

**It's very much a work in progress!**

## React renderer for Homie5 devices

Handles all the messages according to the
[Homie MQTT Convention](https://homieiot.github.io/specification/) for you
automatically as you render Devices, Nodes and Properties.

### Example

A Device to control LG Tvs on your network could be implemented something like
this (very simplified):

```tsx
import * as React from "react";
import {
  Device,
  Enum,
  Integer,
  Node,
  start,
} from "@nstadigs/react-homie-devices";

// This doesn't exist yet...
import { MqttAdapter } from "@nstadigs/homie-mqttjs-adapter";

function Controller() {
  const [tvs, setTvs] = useState([]);

  const searchForLgtvDevices = async () => {
    const devices = await useSomeApiToGetDevicesOnTheNetwork();
    setTvs(devices);
  };

  return (
    <Device id="lgtv-controller">
      <Node id="actions">
        <Property
          id="search-for-devices"
          settable
          onSet={searchForLgtvDevices}
        />
      </Node>
      {tvs.map(({ id, name }) => <TV id={id} name={name} />)}
    </Device>
  );
}

function TV({ id, name, isPaired, setPaired }) {
  const handlePairCommand = async () => {
    await callSomeApiToPairTheTv();
    setPaired();
  };

  return (
    <Device id={id} name={name}>
      <Node id="pairing">
        <Enum
          id="commands"
          settable
          options={["pair"]}
          onSet={(value) => {
            if (value === "pair") {
              handlePairCommand();
            }
          }}
        />
        <Enum
          id="status"
          retained
          options={["not-paired", "pairing", "paired"]}
          value="not-paired"
        />
      </Node>
      {isPaired && (
        <>
          <Node id="audio" name="Audio controls">
            <Integer
              id="volume"
              retained
              settable
              value={0}
              min={0}
              max={100}
              step={1}
              onSet={(newVolume) => {
                // Call lgtv api to set volume
              }}
            />
          </Node>
        </>
      )}
    </Device>
  );
}

start(<Controller />, new MqttAdapter({ url: "mqtt://localhost:1883" }));
```

### TODO:

- [x] Send states on first render
- [x] Send descriptions on first render
- [x] Send states and descriptions on updates
- [x] Send states and descriptions on removals
- [x] Child devices (root, parent, children)
- [x] Set and send property values
- [x] Set and send property $target values
- [ ] Validation (see @nstadigs/homie-spec)
- [x] Handle set commands
- [x] Last will
  - We will have to refactor the connection logic to connect after first render.
    We will also have to have a connection per root device.
- [ ] and probably a lot more...
