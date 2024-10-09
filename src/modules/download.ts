import { wait } from "utility-kit";

export async function download(file: File, name: string) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = name; // giving default name to download prompt
  a.click();
  URL.revokeObjectURL(url);
  await wait(100);
}
