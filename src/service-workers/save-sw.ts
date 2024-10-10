self.addEventListener("fetch", (event: FetchEvent) => {
  const { request, resultingClientId } = event;
  const { pathname } = new URL(request.url);
  if (request.method === "POST" && pathname === "/") {
    event.respondWith(Response.redirect("/?save=true")); // important to tackle cannot post url error
    event.waitUntil(
      (async function () {
        const client = await self.clients.get(resultingClientId);
        if (!client) return;
        const data = await request.formData();
        const title = data.get("title");
        const text = data.get("text");
        const url = data.get("url");
        const files = data.getAll("files");
        setTimeout(() => client.postMessage({ title, text, url, files }), 1000); // wait for client to be ready
      })()
    );
  }
});
