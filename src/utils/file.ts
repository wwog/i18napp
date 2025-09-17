import { save, type SaveDialogOptions, open, type OpenDialogOptions } from "@tauri-apps/plugin-dialog";
export * as fs from "@tauri-apps/plugin-fs";

export function openSaveDialog(options: SaveDialogOptions) {
  return save(options);
}

export function openFileDialog(options?: OpenDialogOptions) {
  return open(options);
}

export function openDirectoryDialog(options?: OpenDialogOptions) {
  return open({
    directory: true,
    ...options
  });
}
