# WIP

**Warning! I'm rebasing and force pushing to main atm.**

Early development and dogfooding right now so I'm only implementing the things I
need. I hope to reach a state where I feel confident with contributions.

## TODO:

- [ ] @nstadigs/homie-devices (create homie v5 devices in js/ts)
  - [x] Basic structure
  - [x] Send initial payloads on init
  - [x] Send expected payloads on update
  - [x] Create child device
  - [ ] Property values
  - [ ] Validate format
  - [x] Handle set commands
  - [ ] Validate set command
    - [x] Ignore invalid payloads
    - [ ] Log errors
  - [ ] Validate ids
  - [ ] Pause/resume mqtt updates
  - [ ] ...finalize
- [ ] @nstadigs/homie-client (homie v5 client for automations etc)
  - [ ] ?
- [ ] @nstadigs/homie-spec (js/ts utilities for working with homie v5)
  - [x] Specification as ts-types
  - [ ] Value validator
  - [ ] Format validator
  - [ ] ID validator
  - [ ] Contribute to and test with https://github.com/homieiot/homie-testsuite
- [ ] MQTT adapters to be used with both homie-devices and homie-client
  - [ ] Adapter for u8-mqtt (small, fast, but doesn't allow QOS2, so that's
        problematic)
  - [ ] Adapter for mqtt.js
  - [ ] Simple adapter for external mqtt-connections (z2m plugin for example)
