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

// const layerConfigurations = [
//   {
//     growEditionSizeTo: 220,
//     layersOrder: [
//       { name: "Background" },
//       { name: "Body" },
//       { name: "Armor" },
//       { name: "Eyes" },
//       { name: "Mouth" },
//       { name: "Nose" },
//       { name: "Hair" },
//       { name: "Outside" },
//       { name: "Race" }
//     ],
//   },
// ];

//  const layerConfigurations = [
//   {
//     growEditionSizeTo: 220,
//     layersOrder: [
//       { name: "Background" },
//       { name: "Body" },
//       { name: "Clothes" },
//       { name: "Eyes" },
//       { name: "Hair Hat" },
//       { name: "Earring" },
//       { name: "Mouth" },
//       { name: "Race" }
//     ],
//   },
// ];


//  const layerConfigurations = [
//   {
//     growEditionSizeTo: 220,
//     layersOrder: [
//       { name: "Background" },
//       { name: "Soul Flame" },
//       { name: "Body" },
//       { name: "Clothes" },
//       { name: "Eyes Nose" },
//       { name: "Hair" },
//       { name: "Mouth" },
//       { name: "Eyes Mask" },
//       { name: "Smoke" },
//       { name: "Earring" },
//       { name: "Race" }
//     ],
//   },
// ];

// const layerConfigurations = [
//   {
//     growEditionSizeTo: 220,
//     layersOrder: [
//       { name: "Background" },
//       { name: "Body" },
//       { name: "Clothes" },
//       { name: "Eyes" },
//       { name: "Mouth" },
//       { name: "Eye Wear" },
//       { name: "Hat Head" },
//       { name: "Cigar" },
//       { name: "Race" }
//     ],
//   },
// ];

// // hippo male
// const layerConfigurations = [
//   {
//     growEditionSizeTo: 50,
//     layersOrder: [
//       { name: "BACKGROUND" },
//       { name: "SKIN" },
//       { name: "CLOTHES" },
//       { name: "JEWELRY" },
//       { name: "EYES" },
//       { name: "HAIR HAT" },
//       { name: "MOUTH" }
//     ],
//   },
// ];

// // hippo female
// const layerConfigurations = [
//   {
//     growEditionSizeTo: 50,
//     layersOrder: [
//       { name: "BACKGROUND" },
//       { name: "SKIN" },
//       { name: "CLOTHES" },
//       { name: "HAIR HAT" },
//       { name: "MOUTH" },
//       { name: "ACCESSORY" },
//       { name: "EYES" }
//     ],
//   },
// ];

// archangels
const layerConfigurations = [
  {
    growEditionSizeTo: 60,
    layersOrder: [
      { name: "Background" },
      { name: "Behind" },
      { name: "Behind Eye" },
      { name: "Eye" },
      { name: "Above Eye" },
      { name: "Front" },
      { name: "Race" }
    ],
  },
];

const shuffleLayerConfigurations = false;

const debugLogs = false;

const format = {
  width: 2500,
  height: 2500,
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

const uniqueDnaTorrance = 100000000;

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
