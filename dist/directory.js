const panels = [...document.querySelectorAll(".work-panel")];
const links = [...document.querySelectorAll(".rail a")];
function selectDirection() {
  const selected = panels.find(panel => "#" + panel.id === location.hash) || panels[0];
  for (const panel of panels) panel.hidden = panel !== selected;
  for (const link of links) {
    if (link.hash === "#" + selected.id) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  }
}
selectDirection();
window.addEventListener("hashchange", selectDirection);
for (const link of links) {
  link.addEventListener("click", event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(null, "", link.hash);
    selectDirection();
  });
}
window.addEventListener("popstate", selectDirection);
