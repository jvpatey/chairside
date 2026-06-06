import * as FileSystem from 'expo-file-system/legacy';

/** Read a picked file URI as base64 on native. */
export async function readFileAsBase64(uri: string, _file?: File | null): Promise<string> {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}
