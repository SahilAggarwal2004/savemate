/* eslint-disable react-hooks/exhaustive-deps */
import type { NextRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import type { SubmitEvent } from "react";
import QRCode from "react-qr-code";
import { toast } from "react-toastify";
import { tryCatchAsync } from "utility-kit";

import { cacheName, maxWaitMs, pollIntervalMs } from "@/constants";
import { getConsumedMarkerKey, getShareCacheKey } from "@/lib/cache";
import { download } from "@/lib/download";
import { getStorage, setStorage } from "@/lib/storage";

export default function Home({ router }: { router: NextRouter }) {
  const { save, id } = router.query;
  const [data, setData] = useState<ClientData>({ title: "", text: "", url: "http://localhost:3000/qr?title=hi", files: [], noFiles: true });
  const { files } = data;
  const [names, setNames] = useState<{ name: string; extension: string }[]>([]);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  const qrValue = useMemo(() => {
    const { title, text, url, noFiles } = data;
    if (typeof window === "undefined" || !noFiles) return "";
    const params = new URLSearchParams();
    if (title) params.set("title", title);
    if (text) params.set("text", text);
    if (url) params.set("url", url);
    return `${window.location.origin}/qr?${params.toString()}`;
  }, [data]);

  useEffect(() => {
    if (!save) {
      const setEvent = (event: Event) => setInstallEvent(event as BeforeInstallPromptEvent);
      window.addEventListener("beforeinstallprompt", setEvent);
      return () => window.removeEventListener("beforeinstallprompt", setEvent);
    }

    if (typeof id !== "string") {
      toast.error("Missing or invalid share link.");
      router.replace("/");
      return;
    }

    if (getStorage(getConsumedMarkerKey(id), false, false)) {
      toast.error("This shared content has already been processed. Please share again.");
      router.replace("/");
      return;
    }

    let cancelled = false;
    const cacheKey = getShareCacheKey(id);
    const deadline = Date.now() + maxWaitMs;

    const poll = async () => {
      while (!cancelled) {
        const cache = await caches.open(cacheName);
        const response = await cache.match(cacheKey);

        if (response) {
          await cache.delete(cacheKey);
          if (cancelled) return;

          setStorage(getConsumedMarkerKey(id), true, false);

          if (!response.ok) {
            const { error } = await response.json().catch(() => ({ error: "Something went wrong while preparing your file(s)." }));
            toast.error(error ?? "Something went wrong while preparing your file(s).");
            router.replace("/");
            return;
          }

          const form = await response.formData();
          const title = form.get("title")?.toString() ?? "";
          const text = form.get("text")?.toString() ?? "";
          const url = form.get("url")?.toString() ?? "";
          const noFiles = form.get("noFiles") === "true";
          const files = form.getAll("files") as File[];

          setData({ title, text, url, files, noFiles });
          setNames(
            files.map(({ name }) => {
              const lastDotIndex = name.lastIndexOf(".");
              if (lastDotIndex === -1) return { name, extension: "" };
              return { name: name.slice(0, lastDotIndex), extension: name.slice(lastDotIndex) };
            }),
          );
          return;
        }

        if (Date.now() > deadline) {
          toast.error("Taking too long to prepare the shared file(s). Please try sharing again.");
          router.replace("/");
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [save]);

  return (
    <div className="flex flex-col items-center mx-3 my-8 space-y-12">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold">SaveMate</h1>
        <h6>Share It, Save It, Done!</h6>
      </div>
      {names.length ? (
        <form
          className="flex flex-col items-center space-y-5 max-w-64"
          onSubmit={async (event: SubmitEvent) => {
            event.preventDefault();
            const { success } = await tryCatchAsync(async () => {
              for (let i = 0; i < files.length; i++) await download(files[i]!, names[i]!.name + names[i]!.extension);
            });
            if (success) toast.success("File(s) downloaded successfully!");
            else toast.error("Failed to download one or more files. Please try again.");
          }}
        >
          <button className="bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-3 rounded-sm">Save Files</button>
          <div className="space-y-4 max-h-96 overflow-y-scroll pr-1">
            {names.map(({ name, extension }, index) => (
              <div key={index} className="flex justify-between items-center space-x-2">
                <label>File {index + 1}:</label>
                <div className="flex w-48 space-x-[5%]">
                  <input
                    type="text"
                    className="border border-gray-400 rounded-md w-[70%] px-1 py-0.5"
                    placeholder="Name"
                    value={name}
                    required
                    maxLength={235}
                    onFocus={(event) => event.target.select()}
                    onChange={(event) =>
                      setNames((prev) => {
                        const result = prev.slice();
                        result[index]!.name = event.target.value;
                        return result;
                      })
                    }
                  />
                  <input
                    type="text"
                    className="border border-gray-400 rounded-md w-[25%] px-1 py-0.5"
                    placeholder="Extension"
                    value={extension}
                    maxLength={20}
                    onChange={(event) =>
                      setNames((prev) => {
                        const result = prev.slice();
                        result[index]!.extension = event.target.value;
                        return result;
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          {qrValue && (
            <div className="flex flex-col items-center w-full mt-4 space-y-6">
              <div className="flex items-center w-full">
                <div className="grow border-t border-gray-300" />
                <span className="mx-3 text-sm text-gray-500">OR</span>
                <div className="grow border-t border-gray-300" />
              </div>
              <div className="text-center text-sm text-gray-700 font-semibold">Share with QR</div>
              <div className="p-4 rounded-md border border-gray-200 shadow-sm bg-white">
                <QRCode value={qrValue} size={180} bgColor="#FFFFFF" fgColor="#000000" />
              </div>
            </div>
          )}
        </form>
      ) : save ? (
        <div className="max-w-md rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 text-center">
          <strong>Preparing shared files...</strong>
          <br />
          Please keep SaveMate open until processing is complete. Closing the app may interrupt file preparation or downloads.
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl text-center font-semibold">How to Use SaveMate?</h2>
            <ol className="list-decimal pl-5 space-y-2 text-sm sm:text-base">
              <li>
                <strong>Install SaveMate:</strong> Add the SaveMate app to your device as a web app.
              </li>
              <li>
                <strong>Share Your File:</strong> Open any app and choose a file or text to share.
              </li>
              <li>
                <strong>Select SaveMate:</strong> Tap on the SaveMate icon in the share dialog.
              </li>
              <li>
                <strong>Save It:</strong> Hit the “Save” button to store your file.
              </li>
              <li>
                <strong>All Set!</strong> Your file is now saved in your Downloads folder!
              </li>
            </ol>
          </div>
          {installEvent && (
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 mx-auto rounded-sm"
              onClick={async () => {
                await installEvent.prompt();
                const choice = await installEvent.userChoice;
                if (choice.outcome === "dismissed") return toast.error("App installation cancelled!");
                setInstallEvent(null);
                toast.success("App installed successfully!");
              }}
            >
              Install SaveMate
            </button>
          )}
        </>
      )}
    </div>
  );
}
