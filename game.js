const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 720,
  pixelArt: true,
  backgroundColor: '#000000',
  scene: { preload, create, update },
  physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  parent: 'game-container'
};

const game = new Phaser.Game(config);

function preload() {
  this.load.image('forestBackground', 'https://i.imgur.com/M99tDtL.png');
  this.load.image('frontBushes', 'https://i.imgur.com/d9Tn7k2.png');
  this.load.image('bushes', 'https://i.imgur.com/sgEaJ4w.png');
  this.load.spritesheet('wanderer', 'https://i.imgur.com/E37vPhX.png', { frameWidth: 32, frameHeight: 32 });
  this.load.spritesheet('wanderer_right', 'https://i.imgur.com/r9i1FAA.png', { frameWidth: 32, frameHeight: 32 });
  this.load.spritesheet('wanderer_left', 'https://i.imgur.com/VpkFOhS.png', { frameWidth: 32, frameHeight: 32 });
  this.load.spritesheet('wanderer_up', 'https://i.imgur.com/SncQMew.png', { frameWidth: 32, frameHeight: 32 });
  this.load.spritesheet('amanita', 'https://i.imgur.com/HAwLwuU.png', { frameWidth: 32, frameHeight: 32 });
  this.load.spritesheet('spore', 'https://i.imgur.com/HEoiyr4.png', { frameWidth: 32, frameHeight: 32 });
  this.load.spritesheet('twinkle', 'https://i.imgur.com/fXGvwUv.png', { frameWidth: 32, frameHeight: 32 });
  this.load.audio('backgroundMusic', 'https://mushiimushii1.github.io/mushii/basesong.wav');
  this.load.on('filecomplete-audio-backgroundMusic', () => console.log('Audio file loaded successfully'));
  this.load.on('loaderror', (file) => console.error('Audio load error:', file.key, file.src));
}

function create() {
  this.add.image(400, 360, 'forestBackground').setDisplaySize(800, 720).setDepth(0);
  this.add.image(400, 360, 'bushes').setDisplaySize(800, 720).setDepth(1); // Bushes at depth 1
  this.add.image(400, 360, 'frontBushes').setDisplaySize(800, 720).setDepth(3); // FrontBushes at depth 3
  this.add.rectangle(400, 360, 780, 700).setStrokeStyle(5, 0x666666).setDepth(6); // UI at 6

  this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('wanderer', { start: 0, end: 1 }), frameRate: 10, repeat: -1 });
  this.anims.create({ key: 'walk_right', frames: this.anims.generateFrameNumbers('wanderer_right', { start: 0, end: 1 }), frameRate: 10, repeat: -1 });
  this.anims.create({ key: 'walk_left', frames: this.anims.generateFrameNumbers('wanderer_left', { start: 0, end: 1 }), frameRate: 10, repeat: -1 });
  this.anims.create({ key: 'walk_up', frames: this.anims.generateFrameNumbers('wanderer_up', { start: 0, end: 1 }), frameRate: 10, repeat: -1 });
  this.anims.create({ key: 'amanita_idle', frames: this.anims.generateFrameNumbers('amanita', { start: 0, end: 1 }), frameRate: 0.5, repeat: -1 });
  this.anims.create({ key: 'spore_float', frames: this.anims.generateFrameNumbers('spore', { start: 0, end: 7 }), frameRate: 5, repeat: -1 });
  this.anims.create({ key: 'twinkle_glow', frames: this.anims.generateFrameNumbers('twinkle', { start: 0, end: 1 }), frameRate: 2, repeat: -1 });

  this.wanderer = this.physics.add.sprite(400, 360, 'wanderer').setScale(2.5).setDepth(4); // Start between layers
  this.wanderer.setCollideWorldBounds(true);
  this.cursors = this.input.keyboard.createCursorKeys();

  this.sporeCount = 0;
  this.sporeText = this.add.text(20, 20, 'Spores: 0', { font: '20px monospace', color: '#ffffff' }).setDepth(7); // UI at 7
  this.spores = this.physics.add.group();
  for (let i = 0; i < 20; i++) {
    let spore = this.spores.create(Math.random() * 700 + 50, Math.random() * (710 - 240) + 240, 'spore').setScale(1.25).setDepth(4);
    spore.anims.play({ key: 'spore_float', delay: Math.random() * 1600 }, true);
  }
  this.physics.add.overlap(this.wanderer, this.spores, collectSpore, (wanderer, spore) => {
    return Phaser.Math.Distance.Between(wanderer.x, wanderer.y, spore.x, spore.y) < 30;
  }, this);

  this.amanita = this.physics.add.sprite(400, 186, 'amanita').setScale(2.5).setDepth(2); // Start behind bushes
  this.amanita.setData('vibe', 5);
  this.amanita.anims.play('amanita_idle', true);
  this.physics.add.overlap(this.wanderer, this.amanita, resonate, (wanderer, amanita) => {
    return Phaser.Math.Distance.Between(wanderer.x, wanderer.y, amanita.x, amanita.y) < 40;
  }, this);

  this.twinkles = this.add.group();
  for (let i = 0; i < 50; i++) {
    let twinkle = this.twinkles.create(Math.random() * 800, Math.random() * 720, 'twinkle').setScale(1.5).setDepth(4);
    twinkle.anims.play({ key: 'twinkle_glow', delay: Math.random() * 2000 }, true);
  }

  try {
    this.backgroundMusic = this.sound.add('backgroundMusic', { loop: true, volume: 0.25 });
    console.log('Background music object created');
    this.backgroundMusic.on('play', () => console.log('Music play event triggered'));
    this.backgroundMusic.on('error', (e) => console.error('Music playback error:', e));
  } catch (e) {
    console.error('Failed to initialize background music:', e);
  }

  const button = this.add.rectangle(400, 360, 200, 80, 0x000000, 0.8).setDepth(6);
  button.setStrokeStyle(2, 0xffffff);
  const buttonText = this.add.text(400, 360, 'Click to Play', { font: '24px monospace', color: '#ffffff' }).setOrigin(0.5, 0.5).setDepth(7);

  this.gameStarted = false;
  this.input.keyboard.enabled = false;

  button.setInteractive();
  button.on('pointerdown', () => {
    playMusic.call(this);
    this.gameStarted = true;
    this.input.keyboard.enabled = true;
    button.destroy();
    buttonText.destroy();
    createJoystick.call(this);
  });

  // Dialogue trigger setup (recurring)
  this.dialogueTriggers = [
    { x: 195, y: 346, text: "Do you feel it?" },
    { x: 752, y: 478, text: "We've been looking for you." },
    { x: 79, y: 245, text: "Welcome home." }
  ];
  this.dialogueCooldowns = this.dialogueTriggers.map(() => ({ lastTriggered: 0 })); // Cooldown tracking
}

function update() {
  if (!this.gameStarted) return;

  this.wanderer.setVelocity(0);
  let isMoving = false;
  let movingRight = false;
  let movingLeft = false;
  let movingUp = false;

  if (this.cursors.left.isDown) {
    this.wanderer.setVelocityX(-250);
    isMoving = true;
    movingLeft = true;
  }
  if (this.cursors.right.isDown) {
    this.wanderer.setVelocityX(250);
    isMoving = true;
    movingRight = true;
  }
  if (this.cursors.up.isDown) {
    this.wanderer.setVelocityY(-250);
    isMoving = true;
    movingUp = true;
  }
  if (this.cursors.down.isDown) {
    this.wanderer.setVelocityY(250);
    isMoving = true;
  }

  if (this.joystick && this.joystick.active) {
    const speed = 250;
    this.wanderer.setVelocityX(this.joystick.dx * speed);
    this.wanderer.setVelocityY(this.joystick.dy * speed);

    isMoving = Math.abs(this.joystick.dx) > 0.1 || Math.abs(this.joystick.dy) > 0.1;
    if (isMoving) {
      if (Math.abs(this.joystick.dx) > Math.abs(this.joystick.dy)) {
        if (this.joystick.dx > 0) movingRight = true;
        else movingLeft = true;
      } else if (this.joystick.dy < 0) movingUp = true;
    }
  }

  if (isMoving) {
    if (movingRight) this.wanderer.anims.play('walk_right', true);
    else if (movingLeft) this.wanderer.anims.play('walk_left', true);
    else if (movingUp) this.wanderer.anims.play('walk_up', true);
    else this.wanderer.anims.play('walk', true);
  } else {
    this.wanderer.anims.stop();
    this.wanderer.setFrame(0);
  }

  // Dynamic depth based on adjusted thresholds
  const bushesThresholds = [228, 324, 453, 675];
  const frontBushesThresholds = [261, 357, 485, 698];

  const setDepthBasedOnThresholds = (obj) => {
    const y = obj.y;

    for (let i = 0; i < bushesThresholds.length; i++) {
      const bushThreshold = bushesThresholds[i];
      const frontThreshold = frontBushesThresholds[i];

      if (y < bushThreshold) {
        obj.setDepth(2); // Behind bushes
        return;
      }
      if (y >= bushThreshold && y < frontThreshold) {
        obj.setDepth(2); // Behind bushes, not yet at frontBushes
        return;
      }
      if (y >= frontThreshold && (i === bushesThresholds.length - 1 || y < bushesThresholds[i + 1])) {
        obj.setDepth(4); // Between bushes and frontBushes
        return;
      }
    }

    if (y >= frontBushesThresholds[frontBushesThresholds.length - 1]) {
      obj.setDepth(5); // In front of both
    }
  };

  setDepthBasedOnThresholds(this.wanderer);
  this.spores.children.iterate(spore => setDepthBasedOnThresholds(spore));
  setDepthBasedOnThresholds(this.amanita);
  this.twinkles.children.iterate(twinkle => setDepthBasedOnThresholds(twinkle));

  // Dialogue trigger logic (recurring with cooldown)
  const currentTime = this.time.now;
  const cooldownDuration = 5000; // 5 seconds cooldown

  this.dialogueTriggers.forEach((trigger, index) => {
    const distance = Phaser.Math.Distance.Between(this.wanderer.x, this.wanderer.y, trigger.x, trigger.y);
    if (distance < 10 && currentTime - this.dialogueCooldowns[index].lastTriggered >= cooldownDuration) {
      this.dialogueCooldowns[index].lastTriggered = currentTime;
      showDialogue.call(this, trigger.x, trigger.y, trigger.text);
    }
  });
}

function showDialogue(triggerX, triggerY, text) {
  // Position bubble toward the middle (interpolate x toward 400)
  const bubbleX = Phaser.Math.Linear(triggerX, 400, 0.5); // Halfway to center
  const bubbleY = triggerY - 30; // Adjusted for smaller size

  // Create word bubble with pointy extensions
  const graphics = this.add.graphics();
  graphics.fillStyle(0x000000, 0.8);
  graphics.lineStyle(2, 0xffffff);

  // Main bubble body (smaller)
  graphics.fillRoundedRect(bubbleX - 97.5, bubbleY - 15, 195, 30, 8); // 75% of 260x40
  graphics.strokeRoundedRect(bubbleX - 97.5, bubbleY - 15, 195, 30, 8);

  // Determine flag positioning based on text
  if (text === "Welcome home." || text === "We've been looking for you.") {
    // Flags point toward triggerX
    const isLeft = triggerX < bubbleX; // Trigger is left of bubble
    const flagBaseOffset = isLeft ? -80 : 80; // Shift base to left (-80) or right (+80) side of bubble

    // First triangular extension
    const flag1BaseLeft = bubbleX + flagBaseOffset - 7.5; // 15px wide base
    const flag1BaseRight = bubbleX + flagBaseOffset + 7.5;
    const flag1TipX = Phaser.Math.Linear(bubbleX, triggerX, 0.15); // Tip 15% toward trigger
    const flag1TipY = bubbleY + 15; // 15px below bubble
    graphics.fillTriangle(
      flag1BaseLeft, bubbleY + 15,
      flag1BaseRight, bubbleY + 15,
      flag1TipX, flag1TipY
    );
    graphics.strokeTriangle(
      flag1BaseLeft, bubbleY + 15,
      flag1BaseRight, bubbleY + 15,
      flag1TipX, flag1TipY
    );

    // Second triangular extension
    const flag2BaseLeft = flag1TipX - 6; // 12px wide base centered on first tip
    const flag2BaseRight = flag1TipX + 6;
    const flag2TipX = Phaser.Math.Linear(bubbleX, triggerX, 0.25); // Tip 25% toward trigger
    const flag2TipY = flag1TipY + 11; // 11px below first tip
    graphics.fillTriangle(
      flag2BaseLeft, flag1TipY,
      flag2BaseRight, flag1TipY,
      flag2TipX, flag2TipY
    );
    graphics.strokeTriangle(
      flag2BaseLeft, flag1TipY,
      flag2BaseRight, flag1TipY,
      flag2TipX, flag2TipY
    );
  } else {
    // Centered flags for "Do you feel it?"
    const flag1BaseLeft = bubbleX - 7.5; // 15px wide
    const flag1BaseRight = bubbleX + 7.5;
    const flag1TipX = bubbleX; // Centered
    const flag1TipY = bubbleY + 15; // 15px below bubble
    graphics.fillTriangle(
      flag1BaseLeft, bubbleY + 15,
      flag1BaseRight, bubbleY + 15,
      flag1TipX, flag1TipY
    );
    graphics.strokeTriangle(
      flag1BaseLeft, bubbleY + 15,
      flag1BaseRight, bubbleY + 15,
      flag1TipX, flag1TipY
    );

    const flag2BaseLeft = bubbleX - 6; // 12px wide
    const flag2BaseRight = bubbleX + 6;
    const flag2TipX = bubbleX; // Centered
    const flag2TipY = flag1TipY + 11; // 11px below first tip
    graphics.fillTriangle(
      flag2BaseLeft, flag1TipY,
      flag2BaseRight, flag1TipY,
      flag2TipX, flag2TipY
    );
    graphics.strokeTriangle(
      flag2BaseLeft, flag1TipY,
      flag2BaseRight, flag1TipY,
      flag2TipX, flag2TipY
    );
  }

  graphics.setDepth(7);

  const dialogueText = this.add.text(bubbleX, bubbleY, text, { font: '12px monospace', color: '#ffffff' }).setOrigin(0.5, 0.5).setDepth(8);

  // Remove after 3 seconds
  this.time.delayedCall(3000, () => {
    graphics.destroy();
    dialogueText.destroy();
  });
}

function playMusic() {
  if (!this.backgroundMusic) {
    console.warn('Background music not initialized, attempting to reinitialize');
    try {
      this.backgroundMusic = this.sound.add('backgroundMusic', { loop: true, volume: 0.25 });
      console.log('Background music reinitialized');
    } catch (e) {
      console.error('Failed to reinitialize background music:', e);
      return;
    }
  }

  if (this.sound.context.state === 'suspended') {
    this.sound.context.resume().then(() => {
      console.log('Audio context resumed');
      if (!this.backgroundMusic.isPlaying) {
        this.backgroundMusic.play();
        console.log('Music started playing from resume');
      }
    }).catch(e => console.error('Failed to resume audio context:', e));
  } else if (!this.backgroundMusic.isPlaying) {
    this.backgroundMusic.play();
    console.log('Music started playing directly');
  }
}

function createJoystick() {
  const joystickRadius = 50;
  const knobRadius = 20;
  const baseX = 100;
  const baseY = this.scale.height - 100;

  this.joystickBase = this.add.circle(baseX, baseY, joystickRadius, 0x666666, 0.7).setDepth(6);
  this.joystickBase.setStrokeStyle(2, 0xffffff);

  this.joystickKnob = this.add.circle(baseX, baseY, knobRadius, 0x999999, 0.9).setDepth(6);
  this.joystickKnob.setStrokeStyle(2, 0xffffff);
  this.joystickKnob.setInteractive();
  this.input.setDraggable(this.joystickKnob);

  this.joystick = { active: false, dx: 0, dy: 0 };

  this.joystickKnob.on('dragstart', () => {
    console.log('Joystick drag started');
    this.joystick.active = true;
    playMusic.call(this);
  });

  this.joystickKnob.on('drag', (pointer, dragX, dragY) => {
    const dx = dragX - baseX;
    const dy = dragY - baseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= joystickRadius) {
      this.joystickKnob.x = dragX;
      this.joystickKnob.y = dragY;
    } else {
      const angle = Math.atan2(dy, dx);
      this.joystickKnob.x = baseX + Math.cos(angle) * joystickRadius;
      this.joystickKnob.y = baseY + Math.sin(angle) * joystickRadius;
    }

    this.joystick.dx = (this.joystickKnob.x - baseX) / joystickRadius;
    this.joystick.dy = (this.joystickKnob.y - baseY) / joystickRadius;
  });

  this.joystickKnob.on('dragend', () => {
    this.joystick.active = false;
    this.joystick.dx = 0;
    this.joystick.dy = 0;
    this.joystickKnob.setPosition(baseX, baseY);
  });
}

function collectSpore(wanderer, spore) {
  spore.destroy();
  this.sporeCount += 1;
  this.sporeText.setText('Spores: ' + this.sporeCount);
}

function resonate(wanderer, amanita) {
  if (this.sporeCount >= 1) {
    this.sporeCount -= 1;
    let vibe = prompt('Tune your vibe (1-5):');
    if (vibe == 3) {
      this.sporeCount += 3;
      const graphics = this.add.graphics();
      graphics.fillStyle(0x000000, 0.8);
      graphics.lineStyle(2, 0xffffff);
      graphics.fillRoundedRect(400 - 158, 360 - 30, 316, 60, 10).setDepth(7);
      graphics.strokeRect(400 - 158, 360 - 30, 316, 60, 10).setDepth(7);
      this.add.text(400, 360, 'Gaze beyond the veil....', { font: '20px monospace', color: '#ffffff' }).setOrigin(0.5, 0.5).setDepth(8);
      amanita.destroy();
    } else {
      this.cameras.main.setTint(0xff00ff);
      setTimeout(() => this.cameras.main.clearTint(), 500);
    }
    this.sporeText.setText('Spores: ' + this.sporeCount);
  }
}
