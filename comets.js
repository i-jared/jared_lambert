function startTheFire() {
  // Load the comets sprite sheet
  const cometSpriteSheet = new Image();
  cometSpriteSheet.src = "./fun/meteor.png";

  // Wait for the image to load before proceeding
  cometSpriteSheet.onload = () => {
    // Your existing code and logic can go here
    // You can use the cometSpriteSheet for drawing comets
    sendTheFire(cometSpriteSheet);
  };
}

function sendTheFire(cometSpriteSheet) {
  const links = [
    "https://open.spotify.com/track/2LD2gT7gwAurzdQDQtILds?si=fdaa4fb69cea4daa",
    "./fun/cat.jpeg",
    "./fun/vampire_blocked.jpeg",
    "./fun/pikachu.jpeg",
    "https://www.youtube.com/watch?v=9TxtTF_dUHQ&list=LL&index=5",
    "https://www.youtube.com/watch?v=dRIueSuykFY&list=LL&index=90",
    "https://www.youtube.com/watch?v=uEWmmHdKPT4&list=LL&index=33",
  ];

  const canvas = document.getElementById("comets");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");
  ctx.webkitImageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false;

  const width = canvas.width;
  const height = canvas.height;

  // Comet properties
  const cometWidth = 64;
  const cometHeight = 64;
  const cometSpeed = 2;
  const updateSpeed = 30;

  // Array to store active comets
  let comets = [];

  // Function to create a new comet
  function createComet() {
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x, y, dx, dy;

    switch (edge) {
      case 0: // Top
        x = Math.random() * width;
        y = -cometHeight;
        dx = Math.random() * 2 - 1;
        dy = Math.random() * cometSpeed;
        break;
      case 1: // Right
        x = width + cometWidth;
        y = Math.random() * height;
        dx = -Math.random() * cometSpeed;
        dy = Math.random() * 2 - 1;
        break;
      case 2: // Bottom
        x = Math.random() * width;
        y = height + cometHeight;
        dx = Math.random() * 2 - 1;
        dy = -Math.random() * cometSpeed;
        break;
      case 3: // Left
        x = -cometWidth;
        y = Math.random() * height;
        dx = Math.random() * cometSpeed;
        dy = Math.random() * 2 - 1;
        break;
    }

    const link = links[Math.floor(Math.random() * links.length)];
    comets.push({ x, y, dx, dy, link, frame: 0 });
  }

  // Function to update and draw comets
  function updateAndDrawComets() {
    ctx.clearRect(0, 0, width, height);

    comets = comets.filter((comet) => {
      comet.x += comet.dx;
      comet.y += comet.dy;
      comet.frame = (comet.frame + 1) % (4 * updateSpeed / cometSpeed);
      const imageOffset = Math.floor(comet.frame / updateSpeed * cometSpeed) * 64;

      // Draw the comet using nearest neighbor scaling
      // Save the current context state
      ctx.save();
      
      // Translate to the center of where the comet will be drawn
      ctx.translate(Math.round(comet.x + cometWidth / 2), Math.round(comet.y + cometHeight / 2));
      
      // Rotate the comet to face its direction of travel
      const angle = Math.atan2(comet.dy, comet.dx) + Math.PI / 4;
      ctx.rotate(angle);
      
      // Draw the rotated image, offset by half its dimensions to center it
      ctx.drawImage(
        cometSpriteSheet,
        imageOffset,
        0,
        64,
        64,
        -cometWidth / 2,
        -cometHeight / 2,
        cometWidth,
        cometHeight
      );
      
      // Restore the context to its original state
      ctx.restore();

      // Remove comet if it's out of bounds
      return !(
        comet.x < -cometWidth ||
        comet.x > width + cometWidth ||
        comet.y < -cometHeight ||
        comet.y > height + cometHeight
      );
    });

    requestAnimationFrame(updateAndDrawComets);
  }

  // Start creating comets
  setInterval(createComet, 3000); // Create a new comet every 3 seconds

  // Start the animation
  updateAndDrawComets();

  // Handle click events
  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    for (const comet of comets) {
      if (
        clickX >= comet.x &&
        clickX <= comet.x + cometWidth &&
        clickY >= comet.y &&
        clickY <= comet.y + cometHeight
      ) {
        window.open(comet.link, "_blank");
        event.preventDefault();
        break;
      }
    }
  });
}

startTheFire();
