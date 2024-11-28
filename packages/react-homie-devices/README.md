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
import * as React from 'react';
import { start, Device, Property, Node } from '@nstadigs/react-homie-devices';
import { MqttAdapter } from '@nstadigs/homie-mqttjs-adapter';

function Controller() {
  const [tvs, setTvs] = useState([]);

  const searchForLgtvDevices = async () => {
    const devices = await useSomeApiToGetDevicesOnTheNetwork();
    setTvs(devices);
  };

  return (
    <Device id="lgtv-controller">
      <Node id="actions">
        <Property id="search-for-devices" settable onSet={searchForLgtvDevices} />
      </Node>
      {tvs.map(({id, name}) => (
        <TV id={id} name={name} />
      ))}
    </Device>
  );
}

function TV({id, name, isPaired, setPaired}) {
  const handlePairCommand = async () => {
    await callSomeApiToPairTheTv();
    setPaired()
  }

  return (
    <Device id={id} name={name}>
      {!isPaired && (
        <Node id="pairing">
          <Property id="pair" settable onSet={} />
        </Node>
      )}
      <Node id="audio" name="Audio controls">
        <Property id="volume" retained settable value={0} onSet={(newVolume) => {
          // Call lgtv api to set volume
        }} />
      </Node>
    </Device>
  )
}

start(<Controller />, new MqttAdapter({url: 'mqtt://localhost:1883'}));
```

TODO:

- [x] Send states on first render
- [x] Send descriptions on first render
- [x] Send states and descriptions on updates
- [x] Send states and descriptions on removals
- [x] Child devices (root, parent, children)
- [ ] Set and send property values
- [ ] Set and send property $target values
- [ ] Handle set commands
- [ ] Last will
- [ ] and probably a lot more...
