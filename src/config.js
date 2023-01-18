const basePath = process.cwd();
const { MODE } = require(`${basePath}/constants/blend_mode.js`);

const Cryptr = require('cryptr');
const cryptr = new Cryptr('breezykeezy');

const encryptedString = cryptr.encrypt('Get to the chopper');
const decrptyedString = cryptr.decrypt(encryptedString);

const layerConfigurations = [
  {
    growEditionSizeTo: 3,
    layersOrder: [
      // { name: "Background" },
      // { name: "Body" },
      // { name: "Eyes" },
      // { name: "Mouth Nose" },
      // { name: "Clothes" },
      // { name: "Hair Hat" },
      // { name: "Accessory" }

      { name: "Background" },
      { name: "Bottom Lid" },
      { name: "Eye color" },
      { name: "Eyeball" },
      { name: "Goo" },
      { name: "Iris" },
      { name: "Shine" },
      { name: "Top lid" }
    ],
  },
];

const shuffleLayerConfigurations = false;

const debugLogs = false;

const format = {
  // width: 2500,
  // height: 2500,
  // smoothing: false,
  width: 512,
  height: 512,
  smoothing: false,
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
  encryptedString,
  decrptyedString,
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
