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
  this.load.image('forestBackground', 'https://i.imgur.com/c6Z2rEm.png');
  this.load.spritesheet('wanderer', 'https://i.imgur.com/E37vPhX.png', { frameWidth: 32, frameHeight: 32 });
  this.load.spritesheet('wanderer_right', 'https://i.imgur.com/r9i1FAA.png', { frameWidth: 32, frameHeight: 32 });
  this.load.spritesheet('wanderer_left', 'https://i.imgur.com/VpkFOhS.png', { frameWidth: 32, frameHeight: 32 });
  this.load.spritesheet('wanderer_up', 'https://i.imgur.com/SncQMew.png', { frameWidth: 32, frameHeight: 32 });
  this.load.spritesheet('amanita', 'https://i.imgur.com/HAwLwuU.png', { frameWidth: 32, frameHeight: 32 });
  this.load.spritesheet('spore', 'https://i.imgur.com/HEoiyr4.png', { frameWidth: 32, frameHeight: 32 });
  this.load.audio('backgroundMusic', 'https://mushiimushii1.github.io/mushii/basesong.wav');
  this.load.on('filecomplete-audio-backgroundMusic', () => console.log('Audio file loaded successfully'));
  this.load.on('loaderror', (file) => console.error('Audio load error:', file.key, file.src));
}

function create() {
  this.add.image(400, 360, 'forestBackground').setDisplaySize(800, 720);
  this.add.rectangle(400, 360, 780, 700).setStrokeStyle(5, 0x666666);

  this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('wanderer', { start: 0, end: 1 }), frameRate: 10, repeat: -1 });
  this.anims.create({ key: 'walk_right', frames: this.anims.generateFrameNumbers('wanderer_right', { start: 0, end: 1 }), frameRate: 10, repeat: -1 });
  this.anims.create({ key: 'walk_left', frames: this.anims.generateFrameNumbers('wanderer_left', { start: 0, end: 1 }), frameRate: 10, repeat: -1 });
  this.anims.create({ key: 'walk_up', frames: this.anims.generateFrameNumbers('wanderer_up', { start: 0, end: 1 }), frameRate: 10, repeat: -1 });
  this.anims.create({ key: 'amanita_idle', frames: this.anims.generateFrameNumbers('amanita', { start: 0, end: 1 }), frameRate: 0.5, repeat: -1 });
  this.anims.create({ key: 'spore_float', frames: this.anims.generateFrameNumbers('spore', { start: 0, end: 7 }), frameRate: 5, repeat: -1 });

  this.wanderer = this.physics.add.sprite(400, 360, 'wanderer').setScale(2.5);
  this.wanderer.setCollideWorldBounds(true);
  this.cursors = this.input.keyboard.createCursorKeys();

  this.sporeCount = 0;
  this.sporeText = this.add.text(20, 20, 'Spores: 0', { font: '20px monospace', color: '#ffffff' });
  this.spores = this.physics.add.group();
  for (let i = 0; i < 20; i++) {
    let spore = this.spores.create(Math.random() * 700 + 50, Math.random() * (710 - 240) + 240, 'spore').setScale(1.25);
    spore.anims.play('spore_float', true);
  }
  this.physics.add.overlap(this.wanderer, this.spores, collectSpore, (wanderer, spore) => {
    return Phaser.Math.Distance.Between(wanderer.x, wanderer.y, spore.x, spore.y) < 30;
  }, this);

  this.amanita = this.physics.add.sprite(400, 186, 'amanita').setScale(2.5);
  this.amanita.setData('vibe', 5);
  this.amanita.anims.play('amanita_idle', true);
  this.physics.add.overlap(this.wanderer, this.amanita, resonate, (wanderer, amanita) => {
    return Phaser.Math.Distance.Between(wanderer.x, wanderer.y, amanita.x, amanita.y) < 40;
  }, this);

  // Audio setup with fallback
  try {
    this.backgroundMusic = this.sound.add('backgroundMusic', { loop: true, volume: 0.25 });
    console.log('Background music object created');
    this.backgroundMusic.on('play', () => console.log('Music play event triggered'));
    this.backgroundMusic.on('error', (e) => console.error('Music playback error:', e));
  } catch (e) {
    console.error('Failed to initialize background music:', e);
  }

  // Start button
  const button = this.add.rectangle(400, 360, 200, 80, 0x000000, 0.8);
  button.setStrokeStyle(2, 0xffffff);
  const buttonText = this.add.text(400, 360, 'Click to Play', { font: '24px monospace', color: '#ffffff' }).setOrigin(0.5, 0.5);

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
    createDebugMusicButton.call(this);
  });
}

// Reusable function to play music with fallback
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
      } else {
        console.log('Music already playing after resume');
      }
    }).catch(e => {
      console.error('Failed to resume audio context:', e);
      if (!this.backgroundMusic.isPlaying) {
        this.backgroundMusic.play(); // Try anyway
        console.log('Attempted to play music despite resume failure');
      }
    });
  } else {
    if (!this.backgroundMusic.isPlaying) {
      this.backgroundMusic.play();
      console.log('Music started playing directly');
    } else {
      console.log('Music is already playing');
    }
  }
}

function createJoystick() {
  const joystickRadius = 50;
  const knobRadius = 20;
  const baseX = 100;
  const baseY = this.scale.height - 100;

  this.joystickBase = this.add.circle(baseX, baseY, joystickRadius, 0x666666, 0.7);
  this.joystickBase.setStrokeStyle(2, 0xffffff);

  this.joystickKnob = this.add.circle(baseX, baseY, knobRadius, 0x999999, 0.9);
  this.joystickKnob.setStrokeStyle(2, 0xffffff);
  this.joystickKnob.setInteractive();
  this.input.setDraggable(this.joystickKnob);

  this.joystick = {
    active: false,
    dx: 0,
    dy: 0
  };

  this.joystickKnob.on('dragstart', () => {
    this.joystick.active = true;
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

function createDebugMusicButton() {
  const buttonX = 250;
  const buttonY = this.scale.height - 50;
  const debugButton = this.add.rectangle(buttonX, buttonY, 100, 40, 0x666666, 0.7);
  debugButton.setStrokeStyle(2, 0xffffff);
  const debugText = this.add.text(buttonX, buttonY, 'Play Music', { font: '16px monospace', color: '#ffffff' }).setOrigin(0.5, 0.5);

  debugButton.setInteractive();
  debugButton.on('pointerdown', () => {
    console.log('Debug button pressed');
    playMusic.call(this);
  });
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
      } else {
        if (this.joystick.dy < 0) movingUp = true;
        else isMoving = true;
      }
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
}

function collectSpore(wanderer, spore) {
  spore.destroy();
  this.sporeCount += 1;
  this.sporeText.setText('Spores: ' + this.sporeCount);
}

function resonate(wanderer, amanita) {
  if (this.sporeCount >= 1) {
    this.sporeCount -= 1;
    let vibe = prompt('Tune your vibe (1-10):');
    if (vibe == 5) {
      this.sporeCount += 3;
      const graphics = this.add.graphics();
      graphics.fillStyle(0x000000, 0.8);
      graphics.lineStyle(2, 0xffffff);
      graphics.fillRoundedRect(400 - 158, 360 - 30, 316, 60, 10);
      graphics.strokeRoundedRect(400 - 158, 360 - 30, 316, 60, 10);
      this.add.text(400, 360, 'Gaze beyond the veil....', { font: '20px monospace', color: '#ffffff' }).setOrigin(0.5, 0.5);
      amanita.destroy();
    } else {
      this.cameras.main.setTint(0xff00ff);
      setTimeout(() => this.cameras.main.clearTint(), 500);
    }
    this.sporeText.setText('Spores: ' + this.sporeCount);
  }
}
