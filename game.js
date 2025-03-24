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

  // Audio with error handling
  try {
    this.backgroundMusic = this.sound.add('backgroundMusic', { loop: true, volume: 0.25 });
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
    if (this.backgroundMusic && !this.backgroundMusic.isPlaying) {
      this.backgroundMusic.play();
    }
    this.gameStarted = true;
    this.input.keyboard.enabled = true;
    button.destroy();
    buttonText.destroy();
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