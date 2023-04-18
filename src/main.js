const basePath = process.cwd();
const fs = require("fs");
const sha1 = require(`${basePath}/node_modules/sha1`);
const { createCanvas, loadImage } = require(`${basePath}/node_modules/canvas`);
const buildDir = `${basePath}/buildNew`;
const layersDir = `${basePath}/layersNew`;
const {
  format,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  shuffleLayerConfigurations,
  debugLogs,
  text,
} = require(`${basePath}/src/config.js`);
const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = format.smoothing;
var metadataList = [];
var attributesList = [];
var dnaList = new Set();
const DNA_DELIMITER = "|";

const buildSetup = () => {
  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true });
  }
  fs.mkdirSync(buildDir);
  fs.mkdirSync(`${buildDir}/json`);
  fs.mkdirSync(`${buildDir}/images`);
  fs.mkdirSync(`${buildDir}/dna`);
};

const getRarityWeight = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = Number(
    nameWithoutExtension.split(rarityDelimiter).pop()
  );
  if (isNaN(nameWithoutWeight)) {
    nameWithoutWeight = 1;
  }
  return nameWithoutWeight;
};

const cleanDna = (_str) => {
  const withoutOptions = removeQueryStrings(_str);
  var dna = Number(withoutOptions.split(":").shift());
  return dna;
};

const cleanName = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
  return nameWithoutWeight;
};

const getElements = (path) => {
  return fs
    .readdirSync(path)
    .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
    .map((i, index) => {
      if (i.includes("-")) {
        throw new Error(`layer name can not contain dashes, please fix: ${i}`);
      }
      return {
        id: index,
        name: cleanName(i),
        filename: i,
        path: `${path}${i}`,
        weight: getRarityWeight(i),
      };
    });
};

const layersSetup = (layersOrder) => {
  const layers = layersOrder.map((layerObj, index) => ({
    id: index,
    elements: getElements(`${layersDir}/${layerObj.name}/`),
    name:
      layerObj.options?.["displayName"] != undefined
        ? layerObj.options?.["displayName"]
        : layerObj.name,
    blend:
      layerObj.options?.["blend"] != undefined
        ? layerObj.options?.["blend"]
        : "source-over",
    opacity:
      layerObj.options?.["opacity"] != undefined
        ? layerObj.options?.["opacity"]
        : 1,
    bypassDNA:
      layerObj.options?.["bypassDNA"] !== undefined
        ? layerObj.options?.["bypassDNA"]
        : false,
  }));
  return layers;
};

const saveImage = (_editionCount) => {
  fs.writeFileSync(
    `${buildDir}/images/${_editionCount}.png`,
    canvas.toBuffer("image/png")
  );
};

const genColor = () => {
  let hue = Math.floor(Math.random() * 360);
  let pastel = `hsl(${hue}, 100%, ${background.brightness})`;
  return pastel;
};

const drawBackground = () => {
  ctx.fillStyle = background.static ? background.default : genColor();
  ctx.fillRect(0, 0, format.width, format.height);
};

// const addMetadata = (_dna, _edition) => {
//   let tempMetadata = {
//     name: `The Alixon Collection`,
//     description: `An extraordinary art collection brought to you by Barbarian Inc's incredibly talented artist, Alixon. This 1000 piece exclusive collection consists of 10 distinct masterpieces, each one meticulously crafted. From the intricate details to the bold strokes of color, each piece captures the essence of Alixon's artistic vision and the raw power of Barbarian Inc's creative force.`,
//     file_url: `ipfs${_edition}.png`,
//     edition: _edition,
//     custom_fields: {
//       creator: `BarbarianInc`,
//       type: `image/png`,
//       format: `HIP412@1.0.0`
//     },
//     attributes: attributesList,
//   };
//   metadataList.push(tempMetadata);
//   attributesList = [];
// };

const addMetadata = (_dna, _edition) => {
  let tempMetadata = {
    name: `Hbarbarian Community Founder's Pass`,
    description: `The Hbarbarian Community Founder's Pass & Playable ARG piece. This will give holders exclusive access to future Barbarian Inc Collections/Airdrops and a plethora of perks & utility along the way`,
    file_url: `ipfs${_edition}.png`,
    edition: _edition,
    custom_fields: {
      creator: `BarbarianInc`,
      type: `image/png`,
      format: `HIP412@1.0.0`
    },
    attributes: attributesList,
  };
  metadataList.push(tempMetadata);
  attributesList = [];
};

const addAttributes = (_element) => {
  let selectedElement = _element.layer.selectedElement;
  {
    attributesList.push({
      trait_type: _element.layer.name,
      value: selectedElement.name,
    });
  }
};

const loadLayerImg = async (_layer) => {
  try {
    return new Promise(async (resolve) => {
      const image = await loadImage(`${_layer.selectedElement.path}`);
      resolve({ layer: _layer, loadedImage: image });
    });
  } catch (error) {
    console.error("Error loading image:", error);
  }
};

const addText = (_sig, x, y, size) => {
  ctx.fillStyle = text.color;
  ctx.font = `${text.weight} ${size}pt ${text.family}`;
  ctx.textBaseline = text.baseline;
  ctx.textAlign = text.align;
  ctx.fillText(_sig, x, y);
};

const drawElement = (_renderObject, _index, _layersLen) => {
  ctx.globalAlpha = _renderObject.layer.opacity;
  ctx.globalCompositeOperation = _renderObject.layer.blend;
  text.only
    ? addText(
        `${_renderObject.layer.name}${text.spacer}${_renderObject.layer.selectedElement.name}`,
        text.xGap,
        text.yGap * (_index + 1),
        text.size
      )
    : ctx.drawImage(
        _renderObject.loadedImage,
        0,
        0,
        format.width,
        format.height
      );

  addAttributes(_renderObject);
};

const constructLayerToDna = (_dna = "", _layers = []) => {
  let mappedDnaToLayers = _layers.map((layer, index) => {
    let selectedElement = layer.elements.find(
      (e) => e.id == cleanDna(_dna.split(DNA_DELIMITER)[index])
    );
    return {
      name: layer.name,
      blend: layer.blend,
      opacity: layer.opacity,
      selectedElement: selectedElement,
    };
  });
  return mappedDnaToLayers;
};

/**
 * This cleanses the DNA String in case weights and item location change
 *
 * @param {String} _dna New DNA string
 * @returns new DNA string with any items that should be filtered, removed.
 */
const filterDNAOptions = (_dna) => {
  const dnaItems = _dna.split(DNA_DELIMITER);
  let filterDNA = [];
  const filteredDNA = dnaItems.filter((element) => {
    let traitClean = element.split(':')[1];
    let traitClean2 = traitClean.split('#')[0];
    let traitCleansed = traitClean2.split('.')[0];

    filterDNA.push(traitCleansed)
  });
  return filterDNA.join(DNA_DELIMITER);
};

/**
 * Cleaning function for DNA strings. When DNA strings include an option, it
 * is added to the filename with a ?setting=value query string. It needs to be
 * removed to properly access the file name before Drawing.
 *
 * @param {String} _dna The entire newDNA string
 * @returns Cleaned DNA string without querystring parameters.
 */
const removeQueryStrings = (_dna) => {
  const query = /(\?.*$)/;
  return _dna.replace(query, "");
};

const isDnaUnique = (_DnaList = new Set(), _dna = "") => {
  const _filteredDNA = filterDNAOptions(_dna);
  return !_DnaList.has(_filteredDNA);
};

const createDna = (_layers) => {
  let randNum = [];
  _layers.forEach((layer) => {
    var totalWeight = 0;
    layer.elements.forEach((element) => {
      totalWeight += element.weight;
    });
    // number between 0 - totalWeight
    let random = Math.floor(Math.random() * totalWeight);
    for (var i = 0; i < layer.elements.length; i++) {
      // subtract the current weight from the random weight until we reach a sub zero value.
      random -= layer.elements[i].weight;
      if (random < 0) {
        return randNum.push(
          `${layer.elements[i].id}:${layer.elements[i].filename}${
            layer.bypassDNA ? "?bypassDNA=true" : ""
          }`
        );
      }
    }
  });
  return randNum.join(DNA_DELIMITER);
};

const writeMetaData = (_data) => {
  fs.writeFileSync(`${buildDir}/json/_metadata.json`, _data);
};

const saveMetaDataSingleFile = (_editionCount) => {
  let metadata = metadataList.find((meta) => meta.edition == _editionCount);
  debugLogs
    ? console.log(
        `Writing metadata for ${_editionCount}: ${JSON.stringify(metadata)}`
      )
    : null;
  fs.writeFileSync(
    `${buildDir}/json/${_editionCount}.json`,
    JSON.stringify(metadata, null, 2)
  );
};

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

// Ensure we don't make the same NFT's that existed in previous collections
const prevCollectionCheck = (newDna) => {
  let collection1Dna = fs.readFileSync(`build-final/dna/collection1.json`).toString('utf-8');
  let prevCollectionPass = 1;

  if (collection1Dna.includes(newDna)){
      console.log('DNA Exists in previous Collection!')
      prevCollectionPass = 0
    }
  return prevCollectionPass;
}

// Hardcoded checks when you know the layers to determine what specific traits can not mix
// Ensure to match the trait check with the position of the layer in the array
const traitMixCheck = (newDna) => {
  let traitCheckPass = 1;
  let dnaArray = newDna.split(DNA_DELIMITER);

  let background = dnaArray[0];
  let body = dnaArray[1];
  let clothes = dnaArray[2];
  let hair = dnaArray[3];
  let eyesNose = dnaArray[4];
  let mouth = dnaArray[5];
  let accessory = dnaArray[6];

  const bigHats = ["Moose Hood", "Trapper Hat", "Bob With Bangs", "Wolf Hood"]
  const protrudingEyes = ["3D Glasses", "Cyclops Sunglasses", "Experimental VR Lens", "Flaming Sunglasses", "Heart Sunglasses", "Hedera Sunglasses",
                          "Sunglasses", "Steampunk Monocle", "Shutter Lens"]

  if (traitCheckPass == 1 && bigHats.includes(hair) && accessory != "Empty") {
    console.log(`Hair ${hair} and Accessory ${accessory} Can't Mix!`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && bigHats.includes(hair) && protrudingEyes.includes(eyesNose)) {
    console.log(`Hair ${hair} and Eyes Nose ${eyesNose} Can't Mix!`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && hair == "Cowboy Hat" && eyesNose == "Steampunk Monocle") {
    console.log(`Hair ${hair} and Eyes Nose ${eyesNose} Can't Mix!`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && protrudingEyes.includes(eyesNose) && mouth == "Leather Respiratory Mask"){
    console.log(`Eyes Nose ${eyesNose} and Mouth ${mouth} Can't Mix!`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && mouth.includes("Beard") && hair == "Bob With Bangs"){
    console.log(`Mouth ${mouth} and Hair ${hair} Can't Mix!`)
    traitCheckPass = 0;
  }

  if(traitCheckPass == 1 && mouth.includes("Beard") && (hair.includes("Braids") || hair.includes("Frizzy") || hair.includes("Hair") || hair.includes("Mullet") || 
                                 hair.includes("Toupee") || hair.includes("Hedera Sport Bandana") || hair.includes("Military Helmet") || hair.includes("Hedera Hat") || 
                                 hair.includes("Backyard Cap") || hair.includes("Cowboy Hat") || hair.includes("Winter Hat"))){
    // Set trait check to not pass initially and only if hair color matches up we pass the trait check
    traitCheckPass = 0;
    if(mouth.includes("Blonde") && (hair.includes("Blonde") || hair.includes("Hedera Sport Bandana") || hair.includes("Backyard Cap"))) {traitCheckPass = 1;}
    if(mouth.includes("Brown") && hair.includes("Brown")) {traitCheckPass = 1;}
    if(mouth.includes("Ginger") && hair.includes("Ginger")) {traitCheckPass = 1;}
    if(mouth.includes("Bronde") && (hair.includes("Bronde") || hair.includes("Military Helmet") || hair.includes("Hedera Hat"))) {traitCheckPass = 1;}
    if(mouth.includes("Gray") && (hair.includes("Gray") || hair.includes("Cowboy Hat"))) {traitCheckPass = 1;}
    if(mouth.includes("Black") && (hair.includes("Black") || hair.includes("Winter Hat"))) {traitCheckPass = 1;}

    if(traitCheckPass == 0){console.log(`Mouth ${mouth} and Hair ${hair} Can't Mix!`)}
  }

  return traitCheckPass;
}

const startCreating = async () => {
  let layerConfigIndex = 0;
  let editionCount = 1;
  let failedCount = 0;
  let abstractedIndexes = [];

  for (
    let i = 1;
    i <= layerConfigurations[layerConfigurations.length - 1].growEditionSizeTo;
    i++
  ) {
    abstractedIndexes.push(i);
  }
  if (shuffleLayerConfigurations) {
    abstractedIndexes = shuffle(abstractedIndexes);
  }
  debugLogs
    ? console.log("Editions left to create: ", abstractedIndexes)
    : null;
  while (layerConfigIndex < layerConfigurations.length) {
    const layers = layersSetup(
      layerConfigurations[layerConfigIndex].layersOrder
    );
    while (
      editionCount <= layerConfigurations[layerConfigIndex].growEditionSizeTo
    ) {
      let newDna = createDna(layers);
      debugLogs
          ? console.log("newDna String: ", newDna)
          : null;
    
      // Existing Collection Check
      let prevCollectionPass = 1 //prevCollectionCheck(filterDNAOptions(newDna));
      // Custom Trait Mixer Check
      let traitCheckPass = traitMixCheck(filterDNAOptions(newDna));

      if (isDnaUnique(dnaList, newDna) && traitCheckPass == 1 && prevCollectionPass == 1) {
        let results = constructLayerToDna(newDna, layers);
        let loadedElements = [];

        results.forEach((layer) => {
          loadedElements.push(loadLayerImg(layer));
        });

        await Promise.all(loadedElements).then((renderObjectArray) => {
          debugLogs ? console.log("Clearing canvas") : null;
          ctx.clearRect(0, 0, format.width, format.height);
          if (background.generate) {
            drawBackground();
          }
          renderObjectArray.forEach((renderObject, index) => {
            drawElement(
              renderObject,
              index,
              layerConfigurations[layerConfigIndex].layersOrder.length
            );
          });
          debugLogs
            ? console.log("Editions left to create: ", abstractedIndexes)
            : null;
          saveImage(abstractedIndexes[0]);
          addMetadata(newDna, abstractedIndexes[0]);
          saveMetaDataSingleFile(abstractedIndexes[0]);
          console.log(
            `Created edition: ${abstractedIndexes[0]}, with DNA: ${sha1(
              newDna
            )}`
          );
        });
        dnaList.add(filterDNAOptions(newDna));
        editionCount++;
        abstractedIndexes.shift();
      } else {
        if (traitCheckPass == 1){
          console.log("DNA exists!")};
        failedCount++;
        if (failedCount >= uniqueDnaTorrance) {
          console.log(
            `You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`
          );
          process.exit();
        }
      }
    }
    layerConfigIndex++;
  }
  writeMetaData(JSON.stringify(metadataList, null, 2));

  let dnaJson = JSON.stringify(Array.from(dnaList), null, 2);
  fs.writeFileSync(`${buildDir}/dna/dna.json`, dnaJson);
};

module.exports = { startCreating, buildSetup, getElements };
