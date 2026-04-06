self.addEventListener("install", () => {
  console.log("Service worker installed");
});

self.addEventListener("fetch", () => {
  // Placeholder for offline caching if you want it later
});
