(function () {
  var POSITIONS = ["Left", "Center", "Right"];
  var HOLD_MS = 3330;
  var drawn = [];
  var holdTimer = null;
  var holding = false;

  var drawBtn = document.getElementById("draw-btn");
  var status = document.getElementById("status");
  var promptSection = document.getElementById("prompt-section");
  var promptBox = document.getElementById("prompt-box");
  var copyBtn = document.getElementById("copy-btn");

  function getSlot(i) {
    return document.getElementById("slot-" + i);
  }

  function setStatus(text, type) {
    status.textContent = text;
    status.className = "status" + (type ? " " + type : "");
  }

  function renderCard(i, card, reversed) {
    var slot = getSlot(i);
    slot.classList.remove("face-down");
    slot.classList.add("drawn");
    if (reversed) slot.classList.add("reversed-card");
    slot.innerHTML =
      '<span class="position-label">' + POSITIONS[i] + "</span>" +
      '<span class="card-name">' + card +
      (reversed ? '<span class="reversed">reversed</span>' : "") +
      "</span>";
  }

  function resetSlots() {
    for (var i = 0; i < 3; i++) {
      var slot = getSlot(i);
      slot.className = "card-slot face-down";
      slot.innerHTML = '<span class="position-label">' + POSITIONS[i] + "</span>";
    }
  }

  function buildPrompt() {
    var name = document.getElementById("name-input").value.trim() || "Anonymous";
    var question = document.getElementById("question-input").value.trim() || "General reading";
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
      "significantly influenced (or weakened) by the left and right cards. The cards will be laid as Left - Center - Right. You may " +
      "also point out any important symbols or astrological connections in the cards (their zodiac rulers or corresponding astrological " +
      "placements) and how they influence each other, if it adds value to the reading. Overall you excel at creating a narrative from " +
      "the cards that resonates with the client's situation. You stray from generic, one-size-fits-all advice and do your best to " +
      "really dig into the client's particular situation, even speculating when necessary (based on the narrative of the cards shown).";

    return header + cardsLine + "\n\n" + instructions;
  }

  function cancelHold() {
    if (!holding) return;
    holding = false;
    clearTimeout(holdTimer);
    holdTimer = null;
    drawBtn.classList.remove("holding");
    setStatus("", "");
  }

  function startHold(e) {
    if (e.type === "click") return;
    if (drawBtn.disabled) return;
    if (holding) return;

    holding = true;
    drawBtn.classList.add("holding");
    setStatus("Focus on your question while the draw is made\u2026", "");

    holdTimer = setTimeout(function () {
      holding = false;
      holdTimer = null;
      drawBtn.classList.remove("holding");
      drawCard();
    }, HOLD_MS);
  }

  function endHold(e) {
    if (!holding) return;
    e.preventDefault();
    cancelHold();
  }

  drawBtn.addEventListener("mousedown", startHold);
  drawBtn.addEventListener("touchstart", startHold);
  drawBtn.addEventListener("mouseup", endHold);
  drawBtn.addEventListener("touchend", endHold);
  drawBtn.addEventListener("mouseleave", cancelHold);
  drawBtn.addEventListener("touchcancel", cancelHold);
  drawBtn.addEventListener("dragstart", function (e) { e.preventDefault(); });

  drawBtn.addEventListener("click", function () {
    if (drawn.length >= 3) {
      drawn.length = 0;
      resetSlots();
      promptSection.classList.remove("visible");
      setStatus("", "");
      drawBtn.textContent = "Hold to Draw";
    }
  });

  function drawCard() {
    drawBtn.disabled = true;
    setStatus("Drawing " + POSITIONS[drawn.length].toLowerCase() + " card\u2026", "");

    fetch("/api/draw")
      .then(function (res) {
        if (!res.ok) throw new Error("Server returned " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data.error) throw new Error(data.error);

        if (!data.accepted) {
          setStatus(
            "Quantum rejection \u2014 value " + data.raw + " discarded (bias guard). Redrawing\u2026",
            "rejection"
          );
          setTimeout(drawCard, 1200);
          return;
        }

        var i = drawn.length;
        drawn.push({ index: i, card: data.card, reversed: data.reversed });
        renderCard(i, data.card, data.reversed);

        if (drawn.length < 3) {
          setStatus("", "");
          drawBtn.disabled = false;
          drawBtn.textContent = "Hold to Draw";
        } else {
          drawBtn.textContent = "Hold to Draw Again";
          promptBox.textContent = buildPrompt();
          promptSection.classList.add("visible");
          setTimeout(function () {
            setStatus("", "");
            drawBtn.disabled = false;
          }, 3330);
        }
      })
      .catch(function (err) {
        setStatus("Error: " + err.message, "error");
        drawBtn.disabled = false;
      });
  }

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
})();
