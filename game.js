const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- 1. SAVED SCORE SYSTEM ---
let score = parseInt(localStorage.getItem('soldier_current_score')) || 0;
let highScore = parseInt(localStorage.getItem('soldier_high_score')) || 0;
let currentSkin = parseInt(localStorage.getItem('selected_skin')) || 0;

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
scoreEl.innerText = score;
highScoreEl.innerText = highScore;

function saveScore() {
    localStorage.setItem('soldier_current_score', score);
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('soldier_high_score', highScore);
        highScoreEl.innerText = highScore;
    }
    scoreEl.innerText = score;
    checkSkinUnlocks();
}

setInterval(() => {
    if (!isGameOver) {
        score += 2;
        saveScore();
    }
}, 1000);

// --- 2. SKINS MENU SYSTEM ---
const skinsBtn = document.getElementById('skins-btn');
const skinsMenu = document.getElementById('skins-menu');
const skinBtns = document.querySelectorAll('.skin-btn');
const skinBtn1 = document.getElementById('skin-btn-1');
const skinBtn2 = document.getElementById('skin-btn-2');

skinsBtn.addEventListener('click', () => {
    skinsMenu.classList.toggle('hidden');
    musicMenu.classList.add('hidden'); // Close music menu if open
});

function checkSkinUnlocks() {
    // Skin 1 unlocks at 500 score (highScore or current score)
    if (highScore >= 500 || score >= 500) {
        skinBtn1.classList.remove('locked');
        skinBtn1.classList.add('unlocked');
        skinBtn1.innerText = "🟡 2. Cyber Gold (UNLOCKED)";
    }
    // Skin 2 unlocks at 1000 score
    if (highScore >= 1000 || score >= 1000) {
        skinBtn2.classList.remove('locked');
        skinBtn2.classList.add('unlocked');
        skinBtn2.innerText = "⚫ 3. Shadow Assassin (UNLOCKED)";
    }
}
checkSkinUnlocks();

skinBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const skinIdx = parseInt(btn.getAttribute('data-skin'));
        if (skinIdx === 1 && highScore < 500 && score < 500) {
            alert("🔒 محتاج تجيب سكور 500 نقطة على الأقل عشان تفتح الـ Skin ده!");
            return;
        }
        if (skinIdx === 2 && highScore < 1000 && score < 1000) {
            alert("🔒 محتاج تجيب سكور 1000 نقطة على الأقل عشان تفتح الـ Skin ده!");
            return;
        }

        currentSkin = skinIdx;
        localStorage.setItem('selected_skin', currentSkin);
        skinBtns.forEach((b, i) => {
            b.classList.toggle('active', i === currentSkin);
        });
        skinsMenu.classList.add('hidden');
    });
});

// Set active skin on load
skinBtns[currentSkin].classList.add('active');

// --- 3. MUSIC PLAYLIST & MENU SYSTEM ---
const playlist = [
    'mafya_elshyaten.mp3', //[cite: 2]
    'waklen_el_mestahbela.mp3', //[cite: 3]
    'hadi_fi_albak_tal2a.mp3', //[cite: 5]
    'ana_ma5no2_mn_koldnya.mp3' //[cite: 4]
];
let currentTrackIndex = 0;
const audioPlayer = new Audio();
audioPlayer.src = playlist[currentTrackIndex];
audioPlayer.preload = 'auto';

const menuBtn = document.getElementById('menu-btn');
const musicMenu = document.getElementById('music-menu');
const songBtns = document.querySelectorAll('.song-btn');
const toggleAudioBtn = document.getElementById('toggle-audio-btn');

menuBtn.addEventListener('click', () => {
    musicMenu.classList.toggle('hidden');
    skinsMenu.classList.add('hidden'); // Close skins menu if open
});

function playTrack(index) {
    currentTrackIndex = index;
    audioPlayer.src = playlist[currentTrackIndex];
    audioPlayer.load();
    audioPlayer.play().catch(err => console.log("Audio play blocked:", err));
    songBtns.forEach((btn, i) => {
        btn.classList.toggle('active', i === currentTrackIndex);
    });
}

audioPlayer.addEventListener('ended', () => {
    let nextTrack = (currentTrackIndex + 1) % playlist.length;
    playTrack(nextTrack);
});

songBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'));
        playTrack(idx);
    });
});

toggleAudioBtn.addEventListener('click', () => {
    if (audioPlayer.paused) {
        audioPlayer.play().catch(err => console.log("Audio play blocked:", err));
    } else {
        audioPlayer.pause();
    }
});

// --- 4. GAME STATE & ENTITIES ---
let isGameOver = false;
const groundY = () => canvas.height * 0.78;

const player = {
    worldX: 200,
    width: 48,
    height: 82,
    facing: 1
};

let cameraX = 0;
let bullets = [];
let enemies = [];
let particles = [];
let muzzleFlashTimer = 0;

function shoot() {
    if (isGameOver) return;
    if (audioPlayer.paused && audioPlayer.currentTime === 0) {
        audioPlayer.play().catch(() => {});
    }

    muzzleFlashTimer = 5;
    const gunTipX = player.worldX + player.width + 14;
    const gunTipY = groundY() - player.height + 41;

    bullets.push({
        worldX: gunTipX,
        y: gunTipY,
        speed: 15,
        radius: 4
    });

    for (let i = 0; i < 4; i++) {
        particles.push({
            x: gunTipX,
            y: gunTipY,
            vx: (Math.random() - 0.5) * 4 + 3,
            vy: (Math.random() - 0.5) * 4,
            alpha: 1,
            color: currentSkin === 1 ? '#ffcc00' : (currentSkin === 2 ? '#ff00ff' : '#ffaa00')
        });
    }
}

setInterval(() => {
    if (isGameOver) return;
    enemies.push({
        worldX: cameraX + canvas.width + 100 + Math.random() * 200,
        width: 48,
        height: 82,
        hp: 2
    });
}, 1500);

const btnShoot = document.getElementById('btn-shoot');
btnShoot.addEventListener('touchstart', (e) => { e.preventDefault(); shoot(); });
btnShoot.addEventListener('mousedown', () => shoot());

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') shoot();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    enemies = [];
    bullets = [];
    particles = [];
    player.worldX = 200;
    cameraX = 0;
    score = 0;
    saveScore();
    isGameOver = false;
    document.getElementById('game-over').classList.add('hidden');
});

// Helper function to draw Soldiers (Hero uses selected skin colors)
function drawTacticalSoldier(x, y, w, h, isHero, skinId) {
    ctx.save();
    
    let uniformColor = '#0077b6';
    let armorColor = '#1e293b';
    let helmetColor = '#0f172a';
    let visorColor = '#00ffcc';

    if (isHero) {
        if (skinId === 1) { // Cyber Gold Skin
            uniformColor = '#b45309';
            armorColor = '#78350f';
            helmetColor = '#451a03';
            visorColor = '#fbbf24';
        } else if (skinId === 2) { // Shadow Assassin Skin
            uniformColor = '#18181b';
            armorColor = '#09090b';
            helmetColor = '#000000';
            visorColor = '#a855f7';
        }
    } else {
        uniformColor = '#b3243c';
        armorColor = '#4a5568';
        helmetColor = '#2d3748';
        visorColor = '#ff3333';
    }

    // Uniform Body
    ctx.fillStyle = uniformColor;
    ctx.fillRect(x + 8, y + 25, w - 16, h - 25);

    // Armor Vest
    ctx.fillStyle = armorColor;
    ctx.fillRect(x + 10, y + 32, w - 20, 26);

    // Helmet
    ctx.fillStyle = helmetColor;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 15, 14, 0, Math.PI * 2);
    ctx.fill();

    // Visor Glow
    ctx.fillStyle = visorColor;
    ctx.shadowBlur = 10;
    ctx.shadowColor = visorColor;
    if (isHero) {
        ctx.fillRect(x + w / 2 + 1, y + 10, 11, 5);
    } else {
        ctx.fillRect(x + w / 2 - 12, y + 10, 11, 5);
    }
    ctx.shadowBlur = 0;

    // Rifle
    ctx.fillStyle = '#090d16';
    if (isHero) {
        ctx.fillRect(x + w / 2, y + 38, 30, 6);
        ctx.fillRect(x + w / 2 + 8, y + 44, 5, 8);
    } else {
        ctx.fillRect(x - 14, y + 38, 30, 6);
        ctx.fillRect(x - 2, y + 44, 5, 8);
    }

    ctx.restore();
}

// Main Loop
function updateAndDraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const floor = groundY();

    if (!isGameOver) {
        player.worldX += 2.6;
        cameraX = player.worldX - 180;
    }

    ctx.save();
    ctx.translate(-cameraX, 0);

    // Background Grid
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.08)';
    ctx.lineWidth = 1;
    let startGrid = Math.floor(cameraX / 60) * 60;
    let endGrid = startGrid + canvas.width + 120;
    for (let x = startGrid; x < endGrid; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, floor); ctx.stroke();
    }

    // Ground Line
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cameraX - 100, floor);
    ctx.lineTo(cameraX + canvas.width + 200, floor);
    ctx.stroke();

    // Draw Hero with Selected Skin
    const py = floor - player.height;
    drawTacticalSoldier(player.worldX, py, player.width, player.height, true, currentSkin);

    // Muzzle Flash
    if (muzzleFlashTimer > 0) {
        muzzleFlashTimer--;
        ctx.fillStyle = currentSkin === 1 ? '#f59e0b' : (currentSkin === 2 ? '#c084fc' : '#ffff00');
        ctx.beginPath();
        ctx.arc(player.worldX + player.width + 16, py + 41, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Update & Draw Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.worldX += b.speed;

        ctx.fillStyle = currentSkin === 1 ? '#fbbf24' : (currentSkin === 2 ? '#e879f9' : '#ffff33');
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(b.worldX, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (b.worldX < cameraX || b.worldX > cameraX + canvas.width) {
            bullets.splice(i, 1);
        }
    }

    // Update & Draw Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (!isGameOver) {
            e.worldX -= 0.5;
        }

        const ey = floor - e.height;
        drawTacticalSoldier(e.worldX, ey, e.width, e.height, false, 0);

        // Check Bullet Hit
        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (b.worldX > e.worldX && b.worldX < e.worldX + e.width && b.y > ey && b.y < floor) {
                bullets.splice(j, 1);
                e.hp--;

                for (let p = 0; p < 5; p++) {
                    particles.push({
                        x: b.worldX, y: b.y,
                        vx: (Math.random() - 0.5) * 5,
                        vy: (Math.random() - 0.5) * 5,
                        alpha: 1,
                        color: '#00ffcc'
                    });
                }

                if (e.hp <= 0) {
                    enemies.splice(i, 1);
                    score += 20;
                    saveScore();
                }
                break;
            }
        }

        // Check Collision with Hero
        if (e.worldX < player.worldX + player.width - 10 && e.worldX + e.width > player.worldX + 10) {
            isGameOver = true;
            document.getElementById('final-score').innerText = score;
            document.getElementById('game-over').classList.remove('hidden');
        }
    }

    // Update & Draw Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.04;
        ctx.fillStyle = pt.color || '#ffaa00';
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillRect(pt.x, pt.y, 3, 3);
        ctx.globalAlpha = 1;
        if (pt.alpha <= 0) particles.splice(i, 1);
    }

    ctx.restore();
    requestAnimationFrame(updateAndDraw);
}

updateAndDatain = updateAndDraw();