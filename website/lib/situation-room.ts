// Lets any component anywhere on the site open the full Situation Room board
// (mounted once in the header). Fire-and-forget custom event.
export function openSituationRoom() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("rally:open"));
  }
}
