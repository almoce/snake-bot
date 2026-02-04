
export const buildShareImage = (state, maxScores, sourceCanvas) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const c = canvas.getContext("2d");
  c.fillStyle = "#000000";
  c.fillRect(0, 0, canvas.width, canvas.height);

  // Geometric background pattern
  c.strokeStyle = "rgba(255, 255, 255, 0.08)";
  c.lineWidth = 1;
  const step = 48;
  for (let x = -canvas.height; x < canvas.width + canvas.height; x += step) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x + canvas.height, canvas.height);
    c.stroke();
  }
  c.strokeStyle = "rgba(255, 255, 255, 0.05)";
  for (let y = -canvas.width; y < canvas.height + canvas.width; y += step) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(canvas.width, y + canvas.width);
    c.stroke();
  }

  const snapMargin = 24;
  const snapWidth = 520;
  const snapHeight = canvas.height - snapMargin * 2;
  const snapX = canvas.width - snapMargin - snapWidth;
  const snapY = snapMargin;
  
  if (sourceCanvas) {
    c.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, snapX, snapY, snapWidth, snapHeight);
  }

  const fade = c.createLinearGradient(snapX - 120, 0, snapX + 40, 0);
  fade.addColorStop(0, "#000000");
  fade.addColorStop(1, "rgba(0, 0, 0, 0)");
  c.fillStyle = fade;
  c.fillRect(snapX - 120, snapY, 160, snapHeight);

  c.strokeStyle = "#ffffff";
  c.lineWidth = 4;
  c.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

  c.fillStyle = "#ffffff";
  c.font = "600 28px Helvetica, Arial, sans-serif";
  c.fillText("Snake Duel", 64, 90);

  c.font = "500 18px Helvetica, Arial, sans-serif";
  c.fillText("MAX SCORE", 64, 160);

  c.font = "700 120px Helvetica, Arial, sans-serif";
  c.fillStyle = "#1f6feb";
  c.fillText(`H ${maxScores.human}`, 64, 300);

  c.fillStyle = "#f85149";
  c.fillText(`A ${maxScores.agent}`, 64, 430);

  c.fillStyle = "#ffffff";
  c.font = "500 20px Helvetica, Arial, sans-serif";
  const humanRounds = state.roundWins?.human || 0;
  const agentRounds = state.roundWins?.agent || 0;
  c.fillText(`Rounds H ${humanRounds} | A ${agentRounds}`, 64, 520);

  c.font = "400 14px Helvetica, Arial, sans-serif";
  const urlLabel = "Play at " + window.location.href.replace(/https?:\/\//, "");
  c.fillText(urlLabel, 64, 560);

  return canvas.toDataURL("image/png");
};
