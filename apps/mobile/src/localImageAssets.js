import { Asset } from "expo-asset";

const bundledCardImages = {
  "birds": {
    "chicken": require("../assets/photos/birds/chicken.png"),
    "duck": require("../assets/photos/birds/duck.png"),
    "eagle": require("../assets/photos/birds/eagle.png"),
    "flamingo": require("../assets/photos/birds/flamingo.png"),
    "owl": require("../assets/photos/birds/owl.png"),
    "parrot": require("../assets/photos/birds/parrot.png"),
    "peacock": require("../assets/photos/birds/peacock.png"),
    "penguin": require("../assets/photos/birds/penguin.png"),
    "sparrow": require("../assets/photos/birds/sparrow.png"),
    "swan": require("../assets/photos/birds/swan.png"),
  },
  "body": {
    "arms": require("../assets/photos/body/arms.png"),
    "ears": require("../assets/photos/body/ears.png"),
    "eyes": require("../assets/photos/body/eyes.png"),
    "feet": require("../assets/photos/body/feet.png"),
    "hands": require("../assets/photos/body/hands.png"),
    "head": require("../assets/photos/body/head.png"),
    "legs": require("../assets/photos/body/legs.png"),
    "mouth": require("../assets/photos/body/mouth.png"),
    "nose": require("../assets/photos/body/nose.png"),
    "teeth": require("../assets/photos/body/teeth.png"),
  },
  "fruits": {
    "apple": require("../assets/photos/fruits/apple.png"),
    "banana": require("../assets/photos/fruits/banana.png"),
    "cherries": require("../assets/photos/fruits/cherries.png"),
    "grapes": require("../assets/photos/fruits/grapes.png"),
    "mango": require("../assets/photos/fruits/mango.png"),
    "orange": require("../assets/photos/fruits/orange.png"),
    "pear": require("../assets/photos/fruits/pear.png"),
    "pineapple": require("../assets/photos/fruits/pineapple.png"),
    "strawberry": require("../assets/photos/fruits/strawberry.png"),
    "watermelon": require("../assets/photos/fruits/watermelon.png"),
  },
  "indian_food": {
    "curd": require("../assets/photos/indian_food/curd.png"),
    "dal": require("../assets/photos/indian_food/dal.png"),
    "dhokala": require("../assets/photos/indian_food/dhokala.png"),
    "dosa": require("../assets/photos/indian_food/dosa.png"),
    "idli": require("../assets/photos/indian_food/idli.png"),
    "kheer": require("../assets/photos/indian_food/kheer.png"),
    "khichdi": require("../assets/photos/indian_food/khichdi.png"),
    "makhana": require("../assets/photos/indian_food/makhana.png"),
    "murmura": require("../assets/photos/indian_food/murmura.png"),
    "paneer": require("../assets/photos/indian_food/paneer.png"),
    "paratha": require("../assets/photos/indian_food/paratha.png"),
    "poha": require("../assets/photos/indian_food/poha.png"),
    "puri": require("../assets/photos/indian_food/puri.png"),
    "rice": require("../assets/photos/indian_food/rice.png"),
    "roti": require("../assets/photos/indian_food/roti.png"),
    "upma": require("../assets/photos/indian_food/upma.png"),
  },
  "shapes": {
    "circle": require("../assets/photos/shapes/circle.png"),
    "diamond": require("../assets/photos/shapes/diamond.png"),
    "heart_shape": require("../assets/photos/shapes/heart_shape.png"),
    "hexagon": require("../assets/photos/shapes/hexagon.png"),
    "oval": require("../assets/photos/shapes/oval.png"),
    "pentagon": require("../assets/photos/shapes/pentagon.png"),
    "rectangle": require("../assets/photos/shapes/rectangle.png"),
    "square": require("../assets/photos/shapes/square.png"),
    "star": require("../assets/photos/shapes/star.png"),
    "triangle": require("../assets/photos/shapes/triangle.png"),
  },
  "sizes": {
    "big": require("../assets/photos/sizes/big.png"),
    "heavy": require("../assets/photos/sizes/heavy.png"),
    "light": require("../assets/photos/sizes/light.png"),
    "long": require("../assets/photos/sizes/long.png"),
    "narrow": require("../assets/photos/sizes/narrow.png"),
    "short": require("../assets/photos/sizes/short.png"),
    "small": require("../assets/photos/sizes/small.png"),
    "tall": require("../assets/photos/sizes/tall.png"),
    "thin": require("../assets/photos/sizes/thin.png"),
    "wide": require("../assets/photos/sizes/wide.png"),
  },
  "vegetables": {
    "broccoli": require("../assets/photos/vegetables/broccoli.png"),
    "carrot": require("../assets/photos/vegetables/carrot.png"),
    "corn": require("../assets/photos/vegetables/corn.png"),
    "cucumber": require("../assets/photos/vegetables/cucumber.png"),
    "eggplant": require("../assets/photos/vegetables/eggplant.png"),
    "onion": require("../assets/photos/vegetables/onion.png"),
    "peas": require("../assets/photos/vegetables/peas.png"),
    "potato": require("../assets/photos/vegetables/potato.png"),
    "pumpkin": require("../assets/photos/vegetables/pumpkin.png"),
    "tomato": require("../assets/photos/vegetables/tomato.png"),
  },
  "vehicles": {
    "airplane": require("../assets/photos/vehicles/airplane.png"),
    "ambulance": require("../assets/photos/vehicles/ambulance.png"),
    "bicycle": require("../assets/photos/vehicles/bicycle.png"),
    "boat": require("../assets/photos/vehicles/boat.png"),
    "bus": require("../assets/photos/vehicles/bus.png"),
    "car": require("../assets/photos/vehicles/car.png"),
    "helicopter": require("../assets/photos/vehicles/helicopter.png"),
    "motorcycle": require("../assets/photos/vehicles/motorcycle.png"),
    "train": require("../assets/photos/vehicles/train.png"),
    "truck": require("../assets/photos/vehicles/truck.png"),
  },
  "wild_animals": {
    "bear": require("../assets/photos/wild_animals/bear.png"),
    "deer": require("../assets/photos/wild_animals/deer.png"),
    "elephant": require("../assets/photos/wild_animals/elephant.png"),
    "fox": require("../assets/photos/wild_animals/fox.png"),
    "hippo": require("../assets/photos/wild_animals/hippo.png"),
    "lion": require("../assets/photos/wild_animals/lion.png"),
    "monkey": require("../assets/photos/wild_animals/monkey.png"),
    "tiger": require("../assets/photos/wild_animals/tiger.png"),
    "wolf": require("../assets/photos/wild_animals/wolf.png"),
    "zebra": require("../assets/photos/wild_animals/zebra.png"),
  },
};

const bundledUriCache = new Map();

export function resolveBundledImageUri(categoryId, cardId) {
  const moduleRef = bundledCardImages[categoryId]?.[cardId];
  if (!moduleRef) return null;

  const cacheKey = `${categoryId}:${cardId}`;
  if (bundledUriCache.has(cacheKey)) return bundledUriCache.get(cacheKey);

  const uri = Asset.fromModule(moduleRef).uri;
  bundledUriCache.set(cacheKey, uri);
  return uri;
}
