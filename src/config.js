const basePath = process.cwd();
const { MODE } = require(`${basePath}/constants/blend_mode.js`);

const Cryptr = require('cryptr');
const cryptr = new Cryptr('breezykeezy');

const encryptedString = cryptr.encrypt('Get to the chopper');
const decrptyedString = cryptr.decrypt(encryptedString);

const hbarMetadata = {
  name: "test f Pass",
  creator: "inc",
  creatorDID: "DID URI", // Optional
  description: "Bussin fr fr",
  image: "ipfs://preview-image-for-wallet-address - Consider making any images at a width between 320 and 1080 pixels and aspect ratio between 1.91:1 and 4:5 inclusive",
  type: "image/png",
  format: "HIP412@1.0.0",
  localization: "Language / location settings" // Optional
}

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
  hbarMetadata,
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
