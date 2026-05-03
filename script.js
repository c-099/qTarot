(function () {
var POSITIONS = ["Past", "Present", "Future"];
var HOLD_MS = 3330;
var drawn = [];
var holdTimer = null;
var holding = false;
var holdingSlotIndex = -1;
var drawingSlotIndex = -1;
var spreadsData = null;
var selectedSpread = null;

var status = document.getElementById("status");
var promptSection = document.getElementById("prompt-section");
var promptBox = document.getElementById("prompt-box");
var copyBtn = document.getElementById("copy-btn");
var resetBtn = document.getElementById("reset-btn");
var spreadBtn = document.getElementById("spread-btn");
var spreadPanel = document.getElementById("spread-panel");
var spreadCategory = document.getElementById("spread-category");
var spreadChoices = document.getElementById("spread-choices");
var nameInput = document.getElementById("name-input");
var questionInput = document.getElementById("question-input");
var cardsLabels = document.getElementById("cards-labels");

function getSlot(i) {
return document.getElementById("slot-" + i);
}

function getDrawBtn(i) {
var slot = getSlot(i);
return slot ? slot.querySelector(".draw-btn") : null;
}

function getLabel(i) {
return cardsLabels.querySelectorAll(".position-label")[i] || null;
}

function isSlotDrawn(i) {
for (var d = 0; d < drawn.length; d++) {
if (drawn[d].index === i) return true;
}
return false;
}

function setStatus(text, type) {
status.textContent = text;
status.className = "status" + (type ? " " + type : "");
}

function updateLabels() {
for (var i = 0; i < 3; i++) {
var lbl = getLabel(i);
if (lbl) lbl.textContent = POSITIONS[i];
}
}

function lockInputs() {
nameInput.disabled = true;
questionInput.disabled = true;
spreadBtn.disabled = true;
spreadCategory.disabled = true;
var btns = spreadChoices.querySelectorAll(".spread-choice-btn");
for (var b = 0; b < btns.length; b++) btns[b].disabled = true;
for (var i = 0; i < 3; i++) {
var db = getDrawBtn(i);
if (db) db.disabled = true;
}
}

function unlockInputs() {
nameInput.disabled = false;
questionInput.disabled = false;
spreadBtn.disabled = false;
spreadCategory.disabled = false;
var btns = spreadChoices.querySelectorAll(".spread-choice-btn");
for (var b = 0; b < btns.length; b++) btns[b].disabled = false;
for (var i = 0; i < 3; i++) {
var db = getDrawBtn(i);
if (db) db.disabled = false;
}
}

function renderCard(i, card, reversed) {
var slot = getSlot(i);
slot.classList.remove("face-down");
slot.classList.add("drawn");
if (reversed) slot.classList.add("reversed-card");
var lbl = getLabel(i);
if (lbl) lbl.classList.remove("drawing");
slot.innerHTML =
'<span class="card-name">' + card +
(reversed ? '<span class="reversed">reversed</span>' : "") +
"</span>";
}

function resetSlots() {
for (var i = 0; i < 3; i++) {
var slot = getSlot(i);
slot.className = "card-slot face-down";
slot.innerHTML =
'<button class="draw-btn" type="button">Hold to Draw</button>';
attachSlotListeners(i);
}
}

function buildPrompt() {
var name = nameInput.value.trim() || "Anonymous";
var question = questionInput.value.trim() || "General reading";
var now = new Date();
var dateStr = now.toLocaleString("en-US", {
weekday: "short", year: "numeric", month: "short",
day: "numeric", hour: "numeric", minute: "2-digit"
});

var header = "Client: " + name + "\nQuestion: " + question + "\nDate: " + dateStr + "\n";
var cardsLine = drawn.map(function (c) {
return POSITIONS[c.index] + ": " + c.card + (c.reversed ? " (reversed)" : "");
}).join(" | ");

var instructions =
"You are a professional Tarot reader who interprets the client's cards with depth, nuance, and practical clarity. " +
"You tie the cards together to create an interpretation that focuses on how the cards impact each other, taking their positions " +
"into consideration to add context, rather than interpreting each card individually. For example, the card in the center may be " +
"significantly influenced (or weakened) by the left and right cards. The cards will be laid as " + POSITIONS[0] + " - " + POSITIONS[1] + " - " + POSITIONS[2] + ". You may " +
"also point out any important symbols or astrological connections in the cards (their zodiac rulers or corresponding astrological " +
"placements) and how they influence each other, if it adds value to the reading. Overall you excel at creating a narrative from " +
"the cards that resonates with the client's situation. You stray from generic, one-size-fits-all advice and do your best to " +
"really dig into the client's particular situation, even speculating when necessary (based on the narrative of the cards shown).";

return header + cardsLine + "\n\n" + instructions;
}

function attachSlotListeners(i) {
var btn = getDrawBtn(i);
if (!btn) return;

btn.addEventListener("mousedown", function (e) { startHold(e, i); });
btn.addEventListener("touchstart", function (e) { startHold(e, i); });
btn.addEventListener("mouseup", function (e) { endHold(e, i); });
btn.addEventListener("touchend", function (e) { endHold(e, i); });
btn.addEventListener("mouseleave", function (e) { cancelHold(e, i); });
btn.addEventListener("touchcancel", function (e) { cancelHold(e, i); });
btn.addEventListener("dragstart", function (e) { e.preventDefault(); });
}

function cancelHold(e, slotIndex) {
if (!holding) return;
if (slotIndex !== undefined && slotIndex !== holdingSlotIndex) return;
holding = false;
clearTimeout(holdTimer);
holdTimer = null;
var btn = getDrawBtn(holdingSlotIndex);
if (btn) btn.classList.remove("holding");
var lbl = getLabel(holdingSlotIndex);
if (lbl) lbl.classList.remove("drawing");
holdingSlotIndex = -1;
setStatus("", "");
}

function startHold(e, slotIndex) {
if (e.type === "click") return;
if (holding) return;
if (isSlotDrawn(slotIndex)) return;
var btn = getDrawBtn(slotIndex);
if (!btn || btn.disabled) return;

holding = true;
holdingSlotIndex = slotIndex;
btn.classList.add("holding");
var lbl = getLabel(slotIndex);
if (lbl) lbl.classList.add("drawing");
setStatus("Focus on your question while the draw is made\u2026", "");

holdTimer = setTimeout(function () {
holding = false;
holdTimer = null;
var b = getDrawBtn(holdingSlotIndex);
if (b) b.classList.remove("holding");
drawingSlotIndex = holdingSlotIndex;
holdingSlotIndex = -1;
drawCard();
}, HOLD_MS);
}

function endHold(e, slotIndex) {
if (!holding) return;
if (slotIndex !== holdingSlotIndex) return;
e.preventDefault();
cancelHold();
}

function drawCard() {
lockInputs();
setStatus("Drawing " + POSITIONS[drawingSlotIndex].toLowerCase() + " card\u2026", "");

var excludeParam = drawn.map(function (c) { return c.cardNum; }).join(",");
var url = "/api/draw" + (excludeParam ? "?exclude=" + excludeParam : "");

fetch(url)
.then(function (res) {
if (!res.ok) throw new Error("Server returned " + res.status);
return res.json();
})
.then(function (data) {
if (data.error) throw new Error(data.error);

if (!data.accepted) {
if (data.reason === "duplicate") {
setStatus(data.card + " already drawn. Redrawing\u2026", "rejection");
} else {
setStatus("Quantum rejection \u2014 value " + data.raw + " discarded (bias guard). Redrawing\u2026", "rejection");
}
setTimeout(drawCard, 1200);
return;
}

var i = drawingSlotIndex;
var mapped = data.raw % 156;
drawn.push({ index: i, card: data.card, reversed: data.reversed, cardNum: mapped % 78 });
drawingSlotIndex = -1;
renderCard(i, data.card, data.reversed);

if (drawn.length < 3) {
setStatus("", "");
unlockInputs();
} else {
resetBtn.classList.add("visible");
promptBox.textContent = buildPrompt();
promptSection.classList.add("visible");
setTimeout(function () {
setStatus("", "");
}, 3330);
}
})
.catch(function (err) {
setStatus("Error: " + err.message, "error");
if (drawingSlotIndex >= 0) {
var lbl = getLabel(drawingSlotIndex);
if (lbl) lbl.classList.remove("drawing");
}
drawingSlotIndex = -1;
unlockInputs();
});
}

resetBtn.addEventListener("click", function () {
drawn.length = 0;
resetSlots();
promptSection.classList.remove("visible");
resetBtn.classList.remove("visible");
setStatus("", "");
unlockInputs();
});

function loadSpreads() {
fetch("/3cardspreads.json")
.then(function (res) { return res.json(); })
.then(function (data) {
spreadsData = data;
populateCategories();
selectSpread(findSpreadById("1"));
})
.catch(function () {
});
}

function populateCategories() {
spreadCategory.innerHTML = "";
var keys = Object.keys(spreadsData);
for (var k = 0; k < keys.length; k++) {
var opt = document.createElement("option");
opt.value = keys[k];
opt.textContent = keys[k];
spreadCategory.appendChild(opt);
}
renderSpreadChoices(keys[0]);
}

function renderSpreadChoices(category) {
spreadChoices.innerHTML = "";
var spreads = spreadsData[category];
for (var s = 0; s < spreads.length; s++) {
var sp = spreads[s];
var btn = document.createElement("button");
btn.type = "button";
btn.className = "spread-choice-btn";
if (selectedSpread && selectedSpread.id === sp.id) btn.classList.add("selected");
btn.setAttribute("data-id", sp.id);
var left = document.createElement("span");
left.className = "pos-left";
left.textContent = sp.left;
var center = document.createElement("span");
center.className = "pos-center";
center.textContent = sp.center;
var right = document.createElement("span");
right.className = "pos-right";
right.textContent = sp.right;
btn.appendChild(left);
btn.appendChild(center);
btn.appendChild(right);
btn.addEventListener("click", onSpreadChoiceClick);
spreadChoices.appendChild(btn);
}
}

function onSpreadChoiceClick(e) {
var id = e.currentTarget.getAttribute("data-id");
selectSpread(findSpreadById(id));
closeSpreadPanel();
}

function findSpreadById(id) {
var keys = Object.keys(spreadsData);
for (var k = 0; k < keys.length; k++) {
var spreads = spreadsData[keys[k]];
for (var s = 0; s < spreads.length; s++) {
if (spreads[s].id === id) return spreads[s];
}
}
return null;
}

function selectSpread(spread) {
if (!spread) return;
selectedSpread = spread;
POSITIONS = [spread.left, spread.center, spread.right];
updateLabels();

var curCat = findCategoryForSpread(spread.id);
if (curCat && spreadCategory.value !== curCat) {
spreadCategory.value = curCat;
renderSpreadChoices(curCat);
}

updateSelectedBtn();
resetSlots();
for (var d = 0; d < drawn.length; d++) {
renderCard(drawn[d].index, drawn[d].card, drawn[d].reversed);
}
}

function findCategoryForSpread(id) {
var keys = Object.keys(spreadsData);
for (var k = 0; k < keys.length; k++) {
var spreads = spreadsData[keys[k]];
for (var s = 0; s < spreads.length; s++) {
if (spreads[s].id === id) return keys[k];
}
}
return null;
}

function updateSelectedBtn() {
var btns = spreadChoices.querySelectorAll(".spread-choice-btn");
for (var b = 0; b < btns.length; b++) {
if (btns[b].getAttribute("data-id") === selectedSpread.id) {
btns[b].classList.add("selected");
} else {
btns[b].classList.remove("selected");
}
}
}

function openSpreadPanel() {
spreadPanel.classList.add("open");
spreadBtn.classList.add("open");
}

function closeSpreadPanel() {
spreadPanel.classList.remove("open");
spreadBtn.classList.remove("open");
}

function toggleSpreadPanel() {
if (spreadBtn.disabled) return;
if (spreadPanel.classList.contains("open")) {
closeSpreadPanel();
} else {
openSpreadPanel();
}
}

spreadBtn.addEventListener("click", toggleSpreadPanel);

spreadCategory.addEventListener("change", function () {
renderSpreadChoices(spreadCategory.value);
});

copyBtn.addEventListener("click", function () {
var text = promptBox.textContent;
if (navigator.clipboard) {
navigator.clipboard.writeText(text).then(function () {
copyBtn.textContent = "Copied!";
setTimeout(function () { copyBtn.textContent = "Copy to clipboard"; }, 1500);
});
} else {
var ta = document.createElement("textarea");
ta.value = text;
document.body.appendChild(ta);
ta.select();
document.execCommand("copy");
document.body.removeChild(ta);
copyBtn.textContent = "Copied!";
setTimeout(function () { copyBtn.textContent = "Copy to clipboard"; }, 1500);
}
});

for (var i = 0; i < 3; i++) attachSlotListeners(i);
loadSpreads();
})();
