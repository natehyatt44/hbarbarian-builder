const basePath = process.cwd();
const fs = require("fs");
const sha1 = require(`${basePath}/node_modules/sha1`);
const { createCanvas, loadImage } = require(`${basePath}/node_modules/canvas`);
const buildDir = `${basePath}/buildArchAngels`;
const layersDir = `${basePath}/layersArchAngels`;
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

const addMetadata = (_dna, _edition) => {
  let tempMetadata = {
    name: `ArchAngel`,
    description: `Step into the realm of 'Hbarbarians - The Lost Ones', a Collection by BarbarianInk! Venture into a universe where each decision you make crafts your very own tale of adventure. Featuring 5 distinct races, each steeped in its own legends, lore, and interconnectivity with other BarbarianInk Collections. However, a word to the wise: not all collectibles grant access to this grand adventure. Can you discover the elusive playable characters, or will they stay hidden as part of the untold legends? Set forth on an expedition of revelation, and become the author of your own destiny. Are you prepared to delve into the mysteries of 'The Lost Ones'?`,
    file_url: `ipfs${_edition}.png`,
    edition: _edition,
    custom_fields: {
      creator: `BarbarianInk`,
      type: `image/png`,
      format: `HIP412@1.0.0`
    },
    attributes: attributesList,
  };
  metadataList.push(tempMetadata);
  attributesList = [];
};

// const addMetadata = (_dna, _edition) => {
//   let tempMetadata = {
//     name: `Hazy Hippo Male`,
//     description: `Drop two of the Hazy Hippos, With new art, games, lore and more how could you say no? Welcome to the Hazyverse! The Indicrons await you!`,
//     file_url: `ipfs${_edition}.png`,
//     edition: _edition,
//     custom_fields: {
//       creator: `Hazy Hippos`,
//       type: `image/png`,
//       format: `HIP412@1.0.0`
//     },
//     attributes: attributesList,
//   };
//   metadataList.push(tempMetadata);
//   attributesList = [];
// };

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
  let collection1Dna = fs.readFileSync(`cfp-dna/dna.json`).toString('utf-8');
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

  const bigHats = ["Moose Hood", "Trapper Hat", "Bob With Bangs", "Wolf Hood", "Mouflon Barbarian Head", "Barbarian Helmet", "Hedron Helmet", "Steampunk Hat", "Viking Eye Collector"]
  const protrudingEyes = ["3d Glasses", "Cyclops Sunglasses", "Experimental VR Lens", "Flaming Sunglasses", "Heart Sunglasses", "Hedera Sunglasses",
                          "Sunglasses", "Steampunk Telescope", "Shutter Lens"]

  if (traitCheckPass == 1 && bigHats.includes(hair) && accessory != "Blank") {
    console.log(`Hair ${hair} and Accessory ${accessory} Can't Mix!`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && bigHats.includes(hair) && protrudingEyes.includes(eyesNose)) {
    console.log(`Hair ${hair} and Eyes Nose ${eyesNose} Can't Mix!`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && hair == "Cowboy Hat" && eyesNose == "Steampunk Telescope") {
    console.log(`Hair ${hair} and Eyes Nose ${eyesNose} Can't Mix!`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && protrudingEyes.includes(eyesNose) && mouth == "Leather Mask"){
    console.log(`Eyes Nose ${eyesNose} and Mouth ${mouth} Can't Mix!`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && mouth.includes("Beard") && hair == "Bob With Bangs"){
    console.log(`Mouth ${mouth} and Hair ${hair} Can't Mix!`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && clothes == "Handmade Shirt" && hair != "Crocodile Skull"){
    console.log(`Clothes ${clothes} Needs Hair to be Crocodile Skull to Mix!`)
    traitCheckPass = 0;
  }

  if(traitCheckPass == 1 && mouth.includes("Beard") && (hair.includes("Braids") || hair.includes("Hair") || hair.includes("Mullet") || hair.includes("Viking Eye Collector") ||
                                  hair.includes("Moose Hood") || hair.includes("Wolf Hood") || hair.includes("Mouflon Barbarian Head") || hair.includes("Barbarian Helmet") ||
                                  hair.includes("Hedron Helmet") ||
                                 hair.includes("Hedera Sport Bandana") || hair.includes("Military Helmet") || hair.includes("Hedera Hat") || hair.includes("Camp Cap") || 
                                 hair.includes("Backyard Cap") || hair.includes("Cowboy Hat") || hair.includes("Winter Hat"))){
    // Set trait check to not pass initially and only if hair color matches up we pass the trait check
    traitCheckPass = 0;
    if(mouth.includes("Blonde") && (hair.includes("Blonde") || hair.includes("Hedera Sport Bandana") || hair.includes("Backyard Cap"))) {traitCheckPass = 1;}
    if(mouth.includes("Bronde") && hair.includes("Bronde")) {traitCheckPass = 1;}
    if(mouth.includes("Ginger") && hair.includes("Ginger")) {traitCheckPass = 1;}
    if(mouth.includes("Brown") && (hair.includes("Brown") || hair.includes("Military Helmet") || hair.includes("Hedera Hat"))) {traitCheckPass = 1;}
    if(mouth.includes("Gray") && (hair.includes("Gray") || hair.includes("Cowboy Hat"))) {traitCheckPass = 1;}
    if(mouth.includes("Black") && (hair.includes("Black") || hair.includes("Winter Hat"))) {traitCheckPass = 1;}

    if(traitCheckPass == 0){console.log(`Mouth ${mouth} and Hair ${hair} Can't Mix!`)}
  }

  return traitCheckPass;
}

const traitMixCheckGaians = (newDna) => {
  let traitCheckPass = 1;
  let dnaArray = newDna.split(DNA_DELIMITER);

  let background = dnaArray[0];
  let body = dnaArray[1];
  let armor = dnaArray[2];
  let eyes = dnaArray[3];
  let mouth = dnaArray[4];
  let nose = dnaArray[5];
  let hair = dnaArray[6];
  let outside = dnaArray[7];

  if (traitCheckPass == 1 && (hair == "Seaweed With Horns White" || nose == "Tree Nose White") && body != "White") {
    console.log(`Hair ${hair} or nose ${nose} Can only be with white body`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && (hair == "Seaweed With Horns" || nose == "Tree Nose") && body == "White") {
    console.log(`Hair ${hair} or nose ${nose} Can't be with white body`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && (outside == "Cocktail Eyes" || outside == "Guardian") && armor != "Hollowed") {
    console.log(`outside ${outside} can only be with hollowed tree`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && outside != "Blank" && armor == 'Battle Tested') {
    console.log(`Outside ${outside} Can't mix with Battle Tested Armor`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && (outside != "Blank" && outside != "Guardian") && armor == 'Nature Camouflage') {
    console.log(`Outside ${outside} Can't mix with Nature Camouflage Armor`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && outside == "Guardian" && nose != 'Skeleton Nose') {
    console.log(`Outside ${outside} Can't mix with nose ${nose}`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && hair.includes("Seaweed") && (armor == 'Battle Tested' || armor == "Nature Camouflage")) {
    console.log(`hair ${hair} Can't mix with armor ${armor}`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && hair.includes("Seaweed") && (outside == 'Cocktail Eyes')) {
    console.log(`hair ${hair} Can't mix with armor ${armor}`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && nose == 'Skeleton Nose' && mouth == 'Smile') {
    console.log(`nose ${nose} Can't mix with mouth ${mouth}`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && body == 'Normal' && hair == 'Seaweed Rust') {
    console.log(`body ${body} Can't mix with hair ${hair}`)
    traitCheckPass = 0;
  }

  return traitCheckPass;
}

const traitMixCheckRunekin = (newDna) => {
  let traitCheckPass = 1;
  let dnaArray = newDna.split(DNA_DELIMITER);

  let background = dnaArray[0];
  let body = dnaArray[1];
  let clothes = dnaArray[2];
  let eyes = dnaArray[3];
  let hairhat = dnaArray[4];
  let earring = dnaArray[5];
  let mouth = dnaArray[6];

  const bigHats = ["Alchemist Hat", "Elk Fungus", "Natural Fungus", "Long Wavy Bowman", "Long Wavy Runekin", "Long Wavy Villager Tunic", "Long Wavy"]

  if (traitCheckPass == 1 && (bigHats.includes(hairhat) && earring == "Gold Hoop")) {
    console.log(`Hair ${hairhat} can not be paired with ${earring}`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && (mouth == "Ponytail Beard" && hairhat != "Ponytail")) {
    console.log(`mouth ${mouth} can not be paired with ${hairhat}`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && (mouth == "Rebel Beard" && hairhat != "Rebel")) {
    console.log(`mouth ${mouth} can not be paired with ${hairhat}`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && ((clothes == "Straps" || clothes == "Bowman") && hairhat == "Elk Fungus")) {
    console.log(`clothes ${clothes} can not be paired with ${hairhat}`)
    traitCheckPass = 0;
  }

  return traitCheckPass;
}

const traitMixCheckSoulweaver = (newDna) => {
  let traitCheckPass = 0;
  let dnaArray = newDna.split(DNA_DELIMITER);

  let background = dnaArray[0];
  let soulFlame = dnaArray[1];
  let body = dnaArray[2];
  let clothes = dnaArray[3];
  let eyesnose = dnaArray[4];
  let hair = dnaArray[5];
  let mouth = dnaArray[6];
  let eyesmask = dnaArray[7];
  let smoke = dnaArray[8];
  let earring = dnaArray[9];

  // Color Sync Checks
  if (traitCheckPass == 0 && (background.includes("Fire") && body.includes("Fire") && mouth.includes("Fire") && eyesnose.includes("Fire"))) {
    console.log(`Fire Traits Synced`)
    traitCheckPass = 1;
  }
  if (traitCheckPass == 0 && (background.includes("Purple") && body.includes("Purple") && mouth.includes("Purple") && eyesnose.includes("Purple"))) {
    console.log(`Purple Traits Synced`)
    traitCheckPass = 1;
  }
  if (traitCheckPass == 0 && (background.includes("Green") && body.includes("Green") && mouth.includes("Green") && eyesnose.includes("Green"))) {
    console.log(`Green Traits Synced`)
    traitCheckPass = 1;
  }
  if (traitCheckPass == 0 && (background.includes("Silver") && body.includes("Silver") && mouth.includes("Silver") && eyesnose.includes("Silver"))) {
    console.log(`Silver Traits Synced`)
    traitCheckPass = 1;
  }

  // Line up soulflames
  if (traitCheckPass == 1 && (background.includes("Fire") && (!soulFlame.includes("Fire") && !soulFlame.includes("Blank")))) {
    console.log(`Fire soulflame not lined up`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && (background.includes("Purple") && (!soulFlame.includes("Purple") && !soulFlame.includes("Blank")))) {
    console.log(`Purple soulflame not lined up`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && (background.includes("Green") && (!soulFlame.includes("Green") && !soulFlame.includes("Blank")))) {
    console.log(`Green soulflame not lined up`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && (background.includes("Silver") && (!soulFlame.includes("Silver") && !soulFlame.includes("Blank")))) {
    console.log(`Silver soulflame not lined up`)
    traitCheckPass = 0;
  }
  // 1/1 combo
  if (traitCheckPass == 1 && (background == "Silver 2" && soulFlame == "Silver Flame 2")) {
    console.log(`Combo is for 1/1`)
    traitCheckPass = 0;
  }

  // Vape Check
  if (traitCheckPass == 1 && smoke != "Blank" && !mouth.includes("Vape") ) {
    console.log(`Smoke needs to include Vape mouths`)
    traitCheckPass = 0;
  }

  if (traitCheckPass == 1 && eyesmask == "Smoke" && mouth.includes("Vape") ) {
    console.log(`Vape and Smoke eyesmask can't mix`)
    traitCheckPass = 0;
  }

   if (traitCheckPass == 1 && (eyesmask == "Smoke" || eyesmask == "Flames" || eyesmask == "Amaterasu" || smoke != "Blank") && hair == "Long Curly Pink" ) {
    console.log(`${eyesmask} and ${hair} dont mix`)
    traitCheckPass = 0;
  }

  if (traitCheckPass == 1 && (eyesmask == "Smoke" || eyesmask == "Flames" || eyesmask == "Amaterasu") && smoke != "Blank" ) {
    console.log(`${eyesmask} and ${smoke} dont mix`)
    traitCheckPass = 0;
  }

  if (traitCheckPass == 1 && (eyesmask == "Smoke" || eyesmask == "Flames" || eyesmask == "Amaterasu") && eyesnose.includes("Suspicious") ) {
    console.log(`${eyesmask} and ${eyesnose} dont mix`)
    traitCheckPass = 0;
  }

  // Trait checks
  if (traitCheckPass == 1 && (eyesmask == "Raven Mask" || eyesmask.includes("Kitsune Mask")) && mouth.includes("Vape") ) {
    console.log(`${eyesmask} can't mix with ${mouth}`)
    traitCheckPass = 0;
  }

  if (traitCheckPass == 1 && (eyesmask == "Raven Mask" || eyesmask.includes("Kitsune Mask")) && smoke != "Blank" ) {
    console.log(`${eyesmask} can't mix with ${smoke}`)
    traitCheckPass = 0;
  }

  if (traitCheckPass == 1 && (hair == "Long" || hair.includes("Smooth")) && earring != "Blank" ) {
    console.log(`${hair} can't mix with ${earring}`)
    traitCheckPass = 0;
  }

  if (traitCheckPass == 1 && (hair.includes("Long") || hair == "Wild Bob" || hair == "Two Buns") && (eyesmask == "Raven Mask" || eyesmask.includes("Kitsune Mask") || eyesmask.includes("Hollow Walker")) ) {
    console.log(`${hair} can't mix with ${eyesmask}`)
    traitCheckPass = 0;
  }

  if (traitCheckPass == 1 && hair == "Wild Bob" && clothes.includes("Void Armor") ) {
    console.log(`${hair} can't mix with ${clothes}`)
    traitCheckPass = 0;
  }

  if (traitCheckPass == 1 && (eyesnose.includes("Suspicious") || eyesnose.includes("Bored")) && (eyesmask.includes("Hollow Walker")) ) {
    console.log(`${hair} can't mix with ${eyesmask}`)
    traitCheckPass = 0;
  }


  return traitCheckPass;
}

const traitMixCheckZephyr = (newDna) => {
  let traitCheckPass = 1;
  let dnaArray = newDna.split(DNA_DELIMITER);

  let background = dnaArray[0];
  let body = dnaArray[1];
  let clothes = dnaArray[2];
  let eyes = dnaArray[3];
  let mouth = dnaArray[4];
  let eyewear = dnaArray[5];
  let hathead = dnaArray[6];
  let cigar = dnaArray[7];
  

  if (traitCheckPass == 1 && (mouth == "Blind" && eyewear != "Blank")) {
    console.log(`mouth ${mouth} can not be paired with ${eyewear}`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && (eyewear != "Blank" && (hathead.includes("Hat") || hathead.includes("Cap")))) {
    console.log(`mouth ${mouth} can not be paired with ${hathead}`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && (mouth == "Mushroom" && cigar == "Weed")) {
    console.log(`mouth ${mouth} can not be paired with ${cigar}`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && (eyewear == "Hedera Glasses Black" && body == "Black")) {
    console.log(`mouth ${eyewear} can not be paired with ${body}`)
    traitCheckPass = 0;
  }

  return traitCheckPass;
}

const traitMixCheckHippoMale = (newDna) => {
  let traitCheckPass = 1;
  let dnaArray = newDna.split(DNA_DELIMITER);

  let background = dnaArray[0];
  let skin = dnaArray[1];
  let clothes = dnaArray[2];
  let jewelry = dnaArray[3];
  let eyes = dnaArray[4];
  let hairhat = dnaArray[5];
  let mouth = dnaArray[6];

  nonLaserHats = ['AFRO', 'DRAGON BALL', 'FIRE', 'HOMELESS', 'RASTA', 'WATERMELON', 'LION', 'SNAP HH', 'HAZY SNAP', 'STRAW', 'MARIO', 'HORNS', 'HIPPIE', 'MULLET']
  nonLaserClothes = ['HAWAII', 'HIPPIE', 'HOODIE', 'ROCK', 'ARMOR', 'FARMER', 'PIMP']
  nonLaserMouth = ['BLUNT', 'CIG', 'JOINT']
  

  if (traitCheckPass == 1 && (eyes == "LASER" && nonLaserHats.includes(hairhat))) {
    console.log(`${eyes} can not be paired with ${hairhat}`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && (eyes == "LASER" && nonLaserClothes.includes(clothes))) {
    console.log(`${eyes} can not be paired with ${clothes}`)
    traitCheckPass = 0;
  }
  if (traitCheckPass == 1 && (eyes == "LASER" && nonLaserMouth.includes(mouth))) {
    console.log(`${eyes} can not be paired with ${mouth}`)
    traitCheckPass = 0;
  }

  return traitCheckPass;
}

const traitMixCheckArchAngel = (newDna) => {
  let traitCheckPass = 1;
  let dnaArray = newDna.split(DNA_DELIMITER);

  let background = dnaArray[0];
  let behind = dnaArray[1];
  let behindeye = dnaArray[2];
  let eye = dnaArray[3];
  let aboveeye = dnaArray[4];
  let front = dnaArray[5];
  

  // if (traitCheckPass == 1 && (behind != "Blank" || behindeye != "Blank") && aboveeye != "Blank" ) {
  //   console.log("behind the eye and behind can go together or show up separately but with nothing else")
  //   traitCheckPass = 0;
  // }
  // if (traitCheckPass == 1 && (behind == "Blank" && behindeye == "Blank" && aboveeye == "Blank")) {
  //   console.log(`eye can't show up alone`)
  //   traitCheckPass = 0;
  // }
  // if (traitCheckPass == 1 && aboveeye == "Geometric Rings" && front != "Chains") {
  //   console.log("Rings cant have anything else but Chains")
  //   traitCheckPass = 0;
  // }
  // if (traitCheckPass == 1 && behindeye == "Eye Wings" && front != "Chains") {
  //   console.log("Eye wings need Chains to show up")
  //   traitCheckPass = 0;
  // }
  if (traitCheckPass == 1 && (aboveeye != "Geometric Rings") && front == "Chains") {
    console.log("Chains need geometric or eye wings to show up")
    traitCheckPass = 0;
  }
  // if (traitCheckPass == 1 && (behind == "Dueling Swords" && behindeye == "Blank")) {
  //   console.log("Swords need a behind eye trait to show up")
  //   traitCheckPass = 0;
  // }

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
      //let traitCheckPass = traitMixCheckGaians(filterDNAOptions(newDna));
      //let traitCheckPass = traitMixCheckRunekin(filterDNAOptions(newDna));
      //let traitCheckPass = traitMixCheckSoulweaver(filterDNAOptions(newDna));
      //let traitCheckPass = traitMixCheckZephyr(filterDNAOptions(newDna));
      let traitCheckPass = traitMixCheckArchAngel(filterDNAOptions(newDna));
      //let traitCheckPass = traitMixCheckHippoMale(filterDNAOptions(newDna));
      
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
          
          
          //abstractedIndexes[0] = abstractedIndexes[0] + 500
          if (abstractedIndexes[0] >= 1 && abstractedIndexes[0] <= 500){
            saveImage(abstractedIndexes[0]);
            addMetadata(newDna, abstractedIndexes[0]);
            saveMetaDataSingleFile(abstractedIndexes[0]);
          }
          else {
            saveImage(abstractedIndexes[0]);
            addMetadata(newDna, abstractedIndexes[0]);
            saveMetaDataSingleFile(abstractedIndexes[0]);
          }
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
