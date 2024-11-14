import { produceWithPatches, enablePatches } from "npm:immer";
// import { Device, DeviceConfig } from "./index.ts";
enablePatches();

const description = {
  name: "WebOS TV Controller",
  nodes: {
    system: {
      properties: {
        volume: {
          name: "Volume",
          datatype: "integer",
          format: "0:100",
          settable: true,
          retained: true,
          unit: "%",
        },
        volume_up: {
          name: "Volume Up",
          datatype: "boolean",
          settable: true,
          retained: false,
        },
        volume_down: {
          name: "Volume Down",
          datatype: "boolean",
          settable: true,
          retained: false,
        },
      },
    },
    tv: {
      properties: {
        muted: {
          name: "Muted",
          datatype: "boolean",
          format: "yes,no",
          retained: true,
          settable: true,
        },
        button: {
          name: "Button",
          datatype: "enum",
          format: "up,down,left,right,ok,back,home",
          retained: false,
          settable: true,
        },
      },
    },
  },
};

const [nextDescription, patches] = produceWithPatches(description, (next) => {
  next.nodes.system.properties.volume.settable = false;
  next.nodes.tv.properties.newProperty = {
    name: "New property",
    datatype: "boolean",
    format: "yes,no",
    retained: true,
    settable: true,
  };

  next.nodes.newNode = {
    properties: {
      newNodeProperty: {
        name: "New property",
        datatype: "boolean",
        format: "yes,no",
        retained: true,
        settable: true,
      },
    },
  };

  delete next.nodes.system.properties.volume_up;
});

patches.map(({ op, path, value }) => {});

// function handlePatch({op, [, nodeId,, propertyId, attribute], value}) {
//   switch (op) {
//     case "add":
//       console.log(`Added ${attribute} to ${propertyId} of ${nodeId}`);
//       break;
//     case "remove":
//       console.log(`Removed ${attribute} from ${propertyId} of ${nodeId}`);
//       break;
//     case "replace":
//       console.log(`Changed ${attribute} of ${propertyId} of ${nodeId} to ${value}`);
//       break;
//   }
// }

console.log(patches);
