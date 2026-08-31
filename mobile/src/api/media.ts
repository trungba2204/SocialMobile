export type PickedAsset = { uri: string; name: string; type: string };

// React Native FormData accepts a { uri, name, type } object as a file part.
export function buildFilePart(asset: PickedAsset): {
  uri: string;
  name: string;
  type: string;
} {
  return { uri: asset.uri, name: asset.name, type: asset.type };
}
