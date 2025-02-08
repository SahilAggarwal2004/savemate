/* eslint-disable react-hooks/exhaustive-deps */
import { download } from "@/modules/download";
import { NextRouter } from "next/router";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";

type DataEntry = string | null;

type Files = File[];

type Message = { data: { title: DataEntry; text: DataEntry; url: DataEntry; files: Files } };

const encoder = new TextEncoder();

export default function Home({ router }: { router: NextRouter }) {
  const { save } = router.query;
  const [files, setFiles] = useState<Files>([]);
  const [names, setNames] = useState<{ name: string; extension: string }[]>([]);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (save) {
      const handleMessage = ({ data: { title, text, url, files } }: Message) => {
        if (!files.length) {
          let content = "";
          if (title) content += `Title: ${title}\n`;
          if (text) content += `Text: ${text}\n`;
          if (url) content += `Url: ${url}`;
          if (content) files.push(new File([encoder.encode(content)], "savemate.txt", { type: "text/plain" }));
        }
        setFiles(files);
        setNames(
          files.map((file) => {
            const [name, extension] = file.name.split(".");
            return { name, extension: extension ? `.${extension}` : "" };
          })
        );
      };
      navigator.serviceWorker.addEventListener("message", handleMessage);
      return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
    } else {
      const setEvent = (event: Event) => setInstallEvent(event as BeforeInstallPromptEvent);
      window.addEventListener("beforeinstallprompt", setEvent);
      return () => window.removeEventListener("beforeinstallprompt", setEvent);
    }
  }, []);

  return (
    <div className="flex flex-col items-center mx-3 my-8 space-y-12">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold">SaveMate</h1>
        <h6>Share It, Save It, Done!</h6>
      </div>
      {names.length ? (
        <form
          className="flex flex-col items-center space-y-5 max-w-64"
          onSubmit={async (event: FormEvent) => {
            event.preventDefault();
            for (let i = 0; i < files.length; i++) await download(files[i], names[i].name + names[i].extension);
            toast.success("File(s) downloaded successfully!");
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
                        const newNames = prev.slice();
                        newNames[index].name = event.target.value;
                        return newNames;
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
                        const newNames = prev.slice();
                        newNames[index].extension = event.target.value;
                        return newNames;
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </form>
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
