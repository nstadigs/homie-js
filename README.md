WIP

Warning! I'm rebasing and force pushing to main atm.

I'm only dogfooding this ATM so I'm only implementing the things I need. I hope to reach a state where I feel confident with contributions.

TODO:

- [ ] homie-devices
  - [x] Basic structure
  - [x] Send initial payloads on init
  - [x] Send expected payloads on update
  - [x] Create child device
  - [ ] Validate format
  - [ ] Handle set commands
  - [ ] Validate set command
  - [ ] Validate ids
  - [ ] Pause/resume mqtt updates
        mqtt-connections (z2m plugin for example)
  - [ ] ...finilize
- [ ] homie-client
  - [ ] ?
- [ ] Adapter for u8-mqtt (small, fast, but doesn't allow QOS2, so that's problematic)
- [ ] Adapter for mqtt.js
- [ ] Simple adapter for external mqtt-connections (z2m plugin for example)
