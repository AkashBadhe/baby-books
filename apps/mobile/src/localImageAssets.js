import { Asset } from "expo-asset";

const bundledCardImages = {
  shapes: {
    circle: require("../assets/photos/shapes/circle.png"),
    square: require("../assets/photos/shapes/square.png"),
    triangle: require("../assets/photos/shapes/triangle.png"),
    rectangle: require("../assets/photos/shapes/rectangle.png"),
    star: require("../assets/photos/shapes/star.png"),
    oval: require("../assets/photos/shapes/oval.png"),
    heart_shape: require("../assets/photos/shapes/heart_shape.png"),
    diamond: require("../assets/photos/shapes/diamond.png"),
    pentagon: require("../assets/photos/shapes/pentagon.png"),
    hexagon: require("../assets/photos/shapes/hexagon.png"),
  },
  sizes: {
    big: require("../assets/photos/sizes/big.png"),
    small: require("../assets/photos/sizes/small.png"),
    tall: require("../assets/photos/sizes/tall.png"),
    short: require("../assets/photos/sizes/short.png"),
    long: require("../assets/photos/sizes/long.png"),
    heavy: require("../assets/photos/sizes/heavy.png"),
    light: require("../assets/photos/sizes/light.png"),
    wide: require("../assets/photos/sizes/wide.png"),
    narrow: require("../assets/photos/sizes/narrow.png"),
    thin: require("../assets/photos/sizes/thin.png"),
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
