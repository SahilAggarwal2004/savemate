self.addEventListener("fetch", (event) => {
  const { request, resultingClientId } = event;
  const { pathname } = new URL(request.url);
  if (request.method === "POST" && pathname === "/") {
    event.respondWith(Response.redirect("/?save=true")); // important to tackle cannot post url error
    event.waitUntil(
      (async function () {
        const client = await self.clients.get(resultingClientId);
        const data = await request.formData();
        const files = data.getAll("files");
        if (files.length) setTimeout(() => client.postMessage({ files }), 1000);
      })()
    );
  }
});
