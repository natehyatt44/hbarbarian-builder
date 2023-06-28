const basePath = process.cwd();
const { MODE } = require(`${basePath}/constants/blend_mode.js`);

// const layerConfigurations = [
//   {
//     growEditionSizeTo: 2,
//     layersOrder: [
//       { name: "Collection Piece" }
//     ],
//   },
// ];

// const layerConfigurations = [
//   {
//     growEditionSizeTo: 1000,
//     layersOrder: [
//       { name: "Background" },
//       { name: "Body" },
//       { name: "Clothes" },
//       { name: "Hair Hat" },
//       { name: "Eyes Nose" },
//       { name: "Mouth" },
//       { name: "Accessory" },
//       { name: "Race" }
//     ],
//   },
// ];

const layerConfigurations = [
  {
    growEditionSizeTo: 1000,
    layersOrder: [
      { name: "Background" },
      { name: "Body" },
      { name: "Armor" },
      { name: "Eyes" },
      { name: "Mouth" },
      { name: "Nose" },
      { name: "Hair" },
      { name: "Outside" }
    ],
  },
];

const shuffleLayerConfigurations = false;

const debugLogs = false;

const format = {
  width: 512,
  height: 512,
  smoothing: false
};

const text = {
  only: false,
  color: "#ffffff",
  size: 20,
  xGap: 40,
  yGap: 40,
  align: "left",
  baseline: "top",
  weight: "regular",
  family: "Courier",
  spacer: " => ",
};

const pixelFormat = {
  ratio: 50 / 128,
};

const background = {
  generate: true,
  brightness: "80%",
  static: false,
  default: "#000000",
};

const rarityDelimiter = "#";

const uniqueDnaTorrance = 10000;

const preview = {
  thumbPerRow: 10,
  thumbWidth: 100,
  imageRatio: 1,
  imageName: "preview.png",
};

module.exports = {
  format,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  preview,
  shuffleLayerConfigurations,
  debugLogs,
  pixelFormat,
  text,
};
