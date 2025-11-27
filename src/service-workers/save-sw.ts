const encoder = new TextEncoder();

const readyClients = new Set<string>();
const pendingMessages = new Map<string, ServiceWorkerData>();

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data === "ready") {
    const client = event.source as WindowClient;
    readyClients.add(client.id);
    const pending = pendingMessages.get(client.id);
    if (pending) {
      client.postMessage(pending);
      pendingMessages.delete(client.id);
    }
  }
});

self.addEventListener("fetch", (event: FetchEvent) => {
  const { request, resultingClientId } = event;
  const { pathname } = new URL(request.url);

  if (request.method === "POST" && pathname === "/") {
    event.respondWith(Response.redirect("/?save=true")); // important to tackle cannot post url error
    event.waitUntil(
      (async () => {
        const client = await self.clients.get(resultingClientId);
        if (!client) return;

        const form = await request.formData();
        const title = form.get("title")?.toString() ?? "";
        const text = form.get("text")?.toString() ?? "";
        const url = form.get("url")?.toString() ?? "";
        const files = form.getAll("files");

        const noFiles = files.length === 0;
        if (noFiles) {
          let content = "";
          if (title) content += `Title: ${title}\n`;
          if (text) content += `Text: ${text}\n`;
          if (url) content += `Url: ${url}`;
          if (content) files.push(new File([encoder.encode(content)], "savemate.txt", { type: "text/plain" }));
        }

        const payload: ServiceWorkerData = { title, text, url, files, noFiles };
        if (readyClients.has(client.id)) client.postMessage(payload);
        else pendingMessages.set(client.id, payload);
      })()
    );
  }
});
