import { tryCatchAsync } from "utility-kit";
import { cacheName } from "@/constants";
import { getShareCacheKey } from "@/lib/cache";

const encoder = new TextEncoder();

self.addEventListener("fetch", (event: FetchEvent) => {
  const { request } = event;
  const { pathname } = new URL(request.url);

  if (request.method === "POST" && pathname === "/") {
    const id = crypto.randomUUID();
    const cacheKey = getShareCacheKey(id);

    event.respondWith(Response.redirect(`/?save=true&id=${id}`)); // important to tackle cannot post url error

    event.waitUntil(
      (async () => {
        const cache = await caches.open(cacheName);

        const { success, error } = await tryCatchAsync(async () => {
          const form = await request.formData();
          const title = form.get("title")?.toString() ?? "";
          const text = form.get("text")?.toString() ?? "";
          const url = form.get("url")?.toString() ?? "";
          const files = form.getAll("files") as File[];

          const noFiles = files.length === 0;
          if (noFiles) {
            let content = "";
            if (title) content += `Title: ${title}\n`;
            if (text) content += `Text: ${text}\n`;
            if (url) content += `Url: ${url}`;
            if (content) files.push(new File([encoder.encode(content)], "savemate.txt", { type: "text/plain" }));
          }

          const payload = new FormData();
          payload.set("title", title);
          payload.set("text", text);
          payload.set("url", url);
          payload.set("noFiles", `${noFiles}`);
          for (const file of files) payload.append("files", file);

          await cache.put(cacheKey, new Response(payload));
        });

        if (!success) {
          await cache.put(cacheKey, new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } }));
        }
      })(),
    );
  }
});
