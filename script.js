// --- DOM Elements ---
const heart = document.getElementById('heart');
const lineText = document.getElementById('lineText');
const text = document.querySelector('.text');
const ball = document.getElementById('ball');
const finalLine = document.getElementById('finalLine');
const branch = document.getElementById('branch');

// --- Animation Globals ---
let animationFrameId = null;
const TREE_X_OFFSET = 140;
const HEART_FALL_RATE = 0.7;
const HEART_FALL_TOTAL = 35;

// --- Math Utils ---
function cubicBezier(t, p0, p1, p2, p3) {
  return (
    Math.pow(1 - t, 3) * p0 +
    3 * Math.pow(1 - t, 2) * t * p1 +
    3 * (1 - t) * t * t * p2 +
    Math.pow(t, 3) * p3
  );
}
function getBezierPointAndTangent(t, p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y) {
  const x = cubicBezier(t, p0x, p1x, p2x, p3x);
  const y = cubicBezier(t, p0y, p1y, p2y, p3y);
  const dx = 3 * Math.pow(1 - t, 2) * (p1x - p0x) +
             6 * (1 - t) * t * (p2x - p1x) +
             3 * Math.pow(t, 2) * (p3x - p2x);
  const dy = 3 * Math.pow(1 - t, 2) * (p1y - p0y) +
             6 * (1 - t) * t * (p2y - p1y) +
             3 * Math.pow(t, 2) * (p3y - p2y);
  const angle = Math.atan2(dy, dx);
  return { x, y, angle };
}

// --- Heart Shape Points ---
function getHeartPixelPoints(centerX, centerY, scaleX, scaleY) {
  const points = [];
  for (let t = 0; t <= Math.PI * 2; t += 0.01) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const finalX = centerX + x * scaleX;
    const finalY = centerY - y * scaleY;
    points.push({ x: finalX, y: finalY });
  }
  return points;
}
function getRandomPointsInHeart(centerX, centerY, scaleX, scaleY, count) {
  const points = [];
  let attempts = 0;
  const maxAttempts = count * 5;
  while (points.length < count && attempts < maxAttempts) {
    attempts++;
    const t = Math.random() * (2 * Math.PI);
    const r = Math.pow(Math.random(), 0.5);
    let x_parametric = 16 * Math.pow(Math.sin(t), 3);
    let y_parametric = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    if (y_parametric < -10 && Math.random() < 0.5) continue;
    const finalX = centerX + r * x_parametric * scaleX;
    const finalY = centerY - r * y_parametric * scaleY;
    points.push({ x: finalX, y: finalY });
  }
  return points;
}

// --- Heart Boundary ---
function drawHeartBoundary(svg, centerX, centerY, scaleX, scaleY) {
  const existingBoundary = svg.querySelector('.heart-boundary');
  if (existingBoundary) existingBoundary.remove();
  const boundaryGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  boundaryGroup.setAttribute("class", "heart-boundary-group");
  svg.appendChild(boundaryGroup);
  const heartOutlinePoints = getHeartPixelPoints(centerX, centerY, scaleX, scaleY);
  let pathData = `M ${heartOutlinePoints[0].x} ${heartOutlinePoints[0].y}`;
  for (let i = 1; i < heartOutlinePoints.length; i++) {
    pathData += ` L ${heartOutlinePoints[i].x} ${heartOutlinePoints[i].y}`;
  }
  pathData += ` Z`;
  const heartPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  heartPath.setAttribute("d", pathData);
  heartPath.setAttribute("fill", "none");
  heartPath.setAttribute("stroke", "none");
  heartPath.setAttribute("stroke-width", "0");
  heartPath.setAttribute("class", "heart-boundary");
  boundaryGroup.appendChild(heartPath);
}

// --- Heart Placement ---
function placeHeartsOnBoundary(container, heartOutlinePoints, count = 50) {
  container.querySelectorAll('.heart-img-on-boundary').forEach(el => el.remove());
  const step = Math.floor(heartOutlinePoints.length / count);
  const images = ['1.jpg', '2.jpg', '3.jpg', '4.jpg'];
  const size = 40;
  if (!document.getElementById('heart-animations-style')) {
    const style = document.createElement('style');
    style.id = 'heart-animations-style';
    style.innerHTML = `
      .heart-img-on-boundary, .heart-img-inside {
        transition: none;
        will-change: transform, opacity;
        transform-origin: center;
        opacity: 0;
      }
      @keyframes fadeInHeart {
        from { opacity: 0; }
        to { opacity: var(--final-opacity); }
      }
      @keyframes popInHeart {
        from { transform: scale(0) rotate(var(--rot, 0deg)); opacity: 0; }
        to { transform: scale(1) rotate(var(--rot, 0deg)); opacity: var(--final-opacity); }
      }
    `;
    document.head.appendChild(style);
  }
  for (let i = 0; i < count; i++) {
    let idx = i * step + Math.floor(Math.random() * Math.max(1, step / 2));
    if (idx >= heartOutlinePoints.length) idx = heartOutlinePoints.length - 1;
    const pt = heartOutlinePoints[idx];
    const imgNum = 1 + Math.floor(Math.random() * 4);
    const img = document.createElement('img');
    img.src = `${imgNum}.jpg`;
    img.className = 'heart-img-on-boundary';
    img.style.position = 'fixed';
    img.style.left = `${pt.x - size / 2}px`;
    img.style.top = `${pt.y - size / 2}px`;
    img.style.width = `${size}px`;
    img.style.height = `${size}px`;
    img.style.pointerEvents = 'none';
    img.style.zIndex = 1100;
    const rotations = [0, 90, 180, 270];
    const randomRot = rotations[Math.floor(Math.random() * rotations.length)];
    img.style.setProperty('--rot', `${randomRot}deg`);
    const finalOpacity = (0.7 + Math.random() * 0.2).toFixed(2);
    img.style.setProperty('--final-opacity', finalOpacity);
    const animationType = Math.random();
    let animationDuration = 0.6;
    const animationDelay = i * 0.005 + Math.random() * 0.2;
    if (animationType < 0.5) {
      img.style.animation = `fadeInHeart ${animationDuration}s ease-out ${animationDelay.toFixed(2)}s forwards`;
    } else {
      animationDuration = 0.8;
      img.style.animation = `popInHeart ${animationDuration}s cubic-bezier(0.68, -0.55, 0.27, 1.55) ${animationDelay.toFixed(2)}s forwards`;
    }
    img.onerror = function() {
      this.src = 'https://placehold.co/40x40/FF0000/FFFFFF?text=X';
    };
    container.appendChild(img);
  }
}
function placeHeartsInsideHeart(container, heartPositionPoints) {
  container.querySelectorAll('.heart-img-inside').forEach(el => el.remove());
  const heartSize = 35;
  const images = ['1.jpg', '2.jpg', '3.jpg', '4.jpg'];
  if (!document.getElementById('heart-animations-style')) {
    const style = document.createElement('style');
    style.id = 'heart-animations-style';
    style.innerHTML = `
      .heart-img-inside {
        transition: none;
        will-change: transform, opacity;
        transform-origin: center;
        opacity: 0;
      }
      @keyframes fadeInHeart {
        from { opacity: 0; }
        to { opacity: var(--final-opacity); }
      }
      @keyframes popInHeart {
        from { transform: scale(0) rotate(var(--rot, 0deg)); opacity: 0; }
        to { transform: scale(1) rotate(var(--rot, 0deg)); opacity: var(--final-opacity); }
      }
    `;
    document.head.appendChild(style);
  }
  heartPositionPoints.forEach((pt, index) => {
    const imgNum = 1 + Math.floor(Math.random() * 4);
    const img = document.createElement('img');
    img.src = `${imgNum}.jpg`;
    img.className = 'heart-img-inside';
    img.style.position = 'fixed';
    img.style.left = `${pt.x - heartSize / 2}px`;
    img.style.top = `${pt.y - heartSize / 2}px`;
    img.style.width = `${heartSize}px`;
    img.style.height = `${heartSize}px`;
    img.style.pointerEvents = 'none';
    img.style.zIndex = 1100;
    const rotations = [0, 90, 180, 270];
    const randomRot = rotations[Math.floor(Math.random() * rotations.length)];
    img.style.setProperty('--rot', `${randomRot}deg`);
    const finalOpacity = (0.7 + Math.random() * 0.2).toFixed(2);
    img.style.setProperty('--final-opacity', finalOpacity);
    const animationType = Math.random();
    let animationDuration = 0.6;
    const animationDelay = index * 0.005 + Math.random() * 0.2;
    if (animationType < 0.5) {
      img.style.animation = `fadeInHeart ${animationDuration}s ease-out ${animationDelay.toFixed(2)}s forwards`;
    } else {
      animationDuration = 0.8;
      img.style.animation = `popInHeart ${animationDuration}s cubic-bezier(0.68, -0.55, 0.27, 1.55) ${animationDelay.toFixed(2)}s forwards`;
    }
    img.onerror = function() {
      this.src = 'https://placehold.co/40x40/FF0000/FFFFFF?text=X';
    };
    container.appendChild(img);
  });
}

// --- Branch Config ---
const branches = [
  // Left side branches
  {
    id: 'b1',
    heightPercent: 25, // Lower on the trunk
    lengthPx: 250,
    bendAmount: -40,
    startWidth: 15,
    angle: -55,
    color: '#000',
    drawn: false, // Flag to track if this branch has started animating
    subBranches: [ // Sub-branches for b1
      {
        id: 'b1small1',
        heightPercent: 50, // Attach at 50% along parent branch
        lengthPx: 70,      // Shorter
        bendAmount: -10,   // Slight bend
        startWidth: 4,     // Thinner
        angle: -25,        // Angle relative to parent branch tangent
        color: '#000',
        drawn: false
      },
      {
        id: 'b1small2',
        heightPercent: 85, // Attach at 85% along parent branch
        lengthPx: 50,      // Shorter
        bendAmount: 10,    // Slight bend
        startWidth: 2,     // Thinner
        angle: 30,         // Angle relative to parent branch tangent
        color: '#000',
        drawn: false
      }
    ]
  },
  {
    id: 'b2',
    heightPercent: 50, // Middle
    lengthPx: 180,
    bendAmount: -50,
    startWidth: 12,
    angle: -55,
    color: '#000',
    drawn: false,
    subBranches: [ // Sub-branches for b2
      {
        id: 'b2small1',
        heightPercent: 50,
        lengthPx: 70,
        bendAmount: -15,
        startWidth: 5,
        angle: -30,
        color: '#000',
        drawn: false
      },
      {
        id: 'b2small2',
        heightPercent: 80,
        lengthPx: 55,
        bendAmount: 10,
        startWidth: 2,
        angle: 20,
        color: '#000',
        drawn: false
      }
    ]
  },

  // Right side branches
  {
    id: 'b3',
    heightPercent: 35, // Lower
    lengthPx: 210,
    bendAmount: 45,
    startWidth: 14,
    angle: 45,
    color: '#000',
    drawn: false,
    subBranches: [ // Sub-branch for b3
      {
        id: 'b3small1',
        heightPercent: 50,
        lengthPx: 75,
        bendAmount: 10,
        startWidth: 5,
        angle: 25,
        color: '#000',
        drawn: false
      }
    ]
  },
  {
    id: 'b4',
    heightPercent: 70, // Middle
    lengthPx: 145,
    bendAmount: 55,
    startWidth: 12,
    angle: 35,
    color: '#000',
    drawn: false,
    subBranches: [ // Sub-branch for b4
      {
        id: 'b4small1',
        heightPercent: 60,
        lengthPx: 60,
        bendAmount: -10,
        startWidth: 4,
        angle: -15,
        color: '#000',
        drawn: false
      }
    ]
  },
  {
    id: 'b5', // Top branch, no sub-branches for simplicity in this example
    heightPercent: 85,
    lengthPx: 65,
    bendAmount: 15,
    startWidth: 2,
    angle: 20,
    color: '#000',
    drawn: false,
    subBranches: [] // Explicitly empty or omit if no sub-branches
  },
];

// --- Branch Animation ---
function animateBranchGrowth(svg, startX, startY, branchConfig, parentTangentAngle, animationDuration) {
  const branchGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  branchGroup.setAttribute("class", `branch-group-${branchConfig.id}`);
  svg.appendChild(branchGroup);
  const branchPoly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  branchPoly.setAttribute("class", `branch-polygon branch-${branchConfig.id}`);
  branchPoly.setAttribute("fill", branchConfig.color);
  branchGroup.appendChild(branchPoly);
  const branchSegments = 20;
  const branchLength = branchConfig.lengthPx;
  const baseAngle = parentTangentAngle + (branchConfig.angle * Math.PI / 180);
  const p0x = startX;
  const p0y = startY;
  const ctrl1X = startX + Math.cos(baseAngle) * branchLength * 0.3;
  const ctrl1Y = startY + Math.sin(baseAngle) * branchLength * 0.3;
  const ctrl2X = startX + Math.cos(baseAngle) * branchLength * 0.7 + branchConfig.bendAmount * 0.3;
  const ctrl2Y = startY + Math.sin(baseAngle) * branchLength * 0.7;
  const endX = startX + Math.cos(baseAngle) * branchLength + branchConfig.bendAmount;
  const endY = startY + Math.sin(baseAngle) * branchLength;
  let startTime = null;
  function frame(currentTime) {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / animationDuration, 1);
    const branchPoints = [];
    const branchRight = [];
    for (let i = 0; i <= branchSegments * progress; i++) {
      const t = i / branchSegments;
      const { x, y, angle: currentSegmentTangentAngle } = getBezierPointAndTangent(t, p0x, p0y, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY);
      const taperFactor = Math.pow(1 - t, 1.5);
      const width = branchConfig.startWidth * taperFactor + 4;
      const half = width / 2;
      const perpAngle = currentSegmentTangentAngle + Math.PI / 2;
      const topX = x + Math.cos(perpAngle) * half;
      const topY = y + Math.sin(perpAngle) * half;
      const bottomX = x - Math.cos(perpAngle) * half;
      const bottomY = y - Math.sin(perpAngle) * half;
      branchPoints.push([topX, topY]);
      branchRight.unshift([bottomX, bottomY]);
      if (branchConfig.subBranches && branchConfig.subBranches.length > 0) {
        branchConfig.subBranches.forEach(subBranch => {
          const subBranchProgressThreshold = subBranch.heightPercent / 100;
          if (progress >= subBranchProgressThreshold && !subBranch.drawn) {
            const { x: subBranchX, y: subBranchY, angle: subBranchTangentAngle } =
              getBezierPointAndTangent(subBranchProgressThreshold, p0x, p0y, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY);
            setTimeout(() => {
                animateBranchGrowth(svg, subBranchX, subBranchY, subBranch, subBranchTangentAngle, animationDuration * 0.7);
            }, elapsed - (subBranchProgressThreshold * animationDuration) + 50);
            subBranch.drawn = true;
          }
        });
      }
    }
    const points = branchPoints.concat(branchRight);
    const pointsStr = points.map(pt => pt.join(',')).join(' ');
    branchPoly.setAttribute("points", pointsStr);
    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      if (typeof onAllBranchesDone === 'function') {
        remainingBranches--;
        if (remainingBranches === 0) {
          onAllBranchesDone();
        }
      }
    }
  }
  requestAnimationFrame(frame);
}

// --- Trunk Animation ---
function animateTrunkGrowth() {
  const treeContainer = document.getElementById('tree-container');
  treeContainer.innerHTML = '';
  treeContainer.style.setProperty('--tree-x-offset', TREE_X_OFFSET + 'px');
  treeContainer.classList.remove('move-right');
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", window.innerWidth);
  svg.setAttribute("height", window.innerHeight);
  svg.style.position = "absolute";
  svg.style.left = "0";
  svg.style.top = "0";
  svg.style.pointerEvents = "none";
  svg.style.zIndex = "1000";
  treeContainer.appendChild(svg);
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("class", "trunk-group");
  svg.appendChild(group);
  const baseX = window.innerWidth / 2;
  const baseY = window.innerHeight - 70;
  const height = window.innerHeight / 1.5;
  const widthStart = 50;
  const widthEnd = 4;
  const segments = 60;
  const straightHeightFraction = 0.7;
  const bendAmount = -60;
  const ctrl1X = baseX;
  const ctrl1Y = baseY - height * straightHeightFraction;
  const ctrl2X = baseX + (bendAmount * 0.3);
  const ctrl2Y = baseY - height * 0.85;
  const endX = baseX + bendAmount;
  const endY = baseY - height;
  const trunkPoly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  trunkPoly.setAttribute("class", "trunk-polygon");
  trunkPoly.setAttribute("fill", "#000");
  group.appendChild(trunkPoly);
  let startTime = null;
  const animationDuration = 1500;
  remainingBranches = countAllBranches(branches) + 1;
  onAllBranchesDone = () => {
    const blueHeartCenterX = endX + 40;
    const blueHeartCenterY = endY + 100;
    const blueHeartScaleX = 19;
    const blueHeartScaleY = 19;
    drawHeartBoundary(svg, blueHeartCenterX, blueHeartCenterY, blueHeartScaleX, blueHeartScaleY);
    const heartOutlinePoints = getHeartPixelPoints(blueHeartCenterX, blueHeartCenterY, blueHeartScaleX, blueHeartScaleY);
    placeHeartsOnBoundary(treeContainer, heartOutlinePoints, 40);
    const insideHeartPoints = getRandomPointsInHeart(blueHeartCenterX, blueHeartCenterY, blueHeartScaleX, blueHeartScaleY, 550);
    placeHeartsInsideHeart(treeContainer, insideHeartPoints);
    setTimeout(() => {
      treeContainer.classList.add('move-right');
      setTimeout(() => {
        const timerDiv = document.getElementById('groundTimer');
        timerDiv.style.visibility = 'visible';
        startGroundTimer();
        showKuchuPuchuText();
        showTypewriterBox(`I really appreciate the time we spend together. Whether we're talking for hours or just seeing each other, it always feels comforting. You have this calm and sweet vibe that makes everything feel better. I admire how caring and understanding you are—it makes being around you so easy and peaceful. I’m genuinely thankful for all the moments we share and for having you in my life..`, 'boxImage.png');
        spawnFallingHearts({ count: HEART_FALL_TOTAL, from: 'tree' });
      }, 1200);
    }, 1200);
  };
  function frame(currentTime) {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / animationDuration, 1);
    let trunkPointsLeft = [];
    let trunkPointsRight = [];
    for (let i = 0; i <= segments * progress; i++) {
      const t = i / segments;
      const { x, y, angle: trunkTangentAngle } = getBezierPointAndTangent(t, baseX, baseY, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY);
      const width = widthStart * Math.pow(1 - t, 1.2) + widthEnd;
      const half = width / 2;
      trunkPointsLeft.push([x - half, y]);
      trunkPointsRight.unshift([x + half, y]);
      branches.forEach(branch => {
        const branchProgressThreshold = branch.heightPercent / 100;
        if (progress >= branchProgressThreshold && !branch.drawn) {
          const { x: branchX, y: branchY, angle: calculatedTrunkTangentAngle } =
            getBezierPointAndTangent(branchProgressThreshold, baseX, baseY, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY);
          setTimeout(() => {
              animateBranchGrowth(svg, branchX, branchY, branch, calculatedTrunkTangentAngle, animationDuration * 0.8);
          }, elapsed - (branchProgressThreshold * animationDuration) + 100);
          branch.drawn = true;
        }
      });
    }
    const allTrunkPoints = trunkPointsLeft.concat(trunkPointsRight);
    const pointsStr = allTrunkPoints.map(pt => pt.join(',')).join(' ');
    trunkPoly.setAttribute("points", pointsStr);
    if (progress < 1) {
      animationFrameId = requestAnimationFrame(frame);
    } else {
      if (typeof onAllBranchesDone === 'function') {
        remainingBranches--;
        if (remainingBranches === 0) {
          onAllBranchesDone();
        }
      }
    }
  }
  animationFrameId = requestAnimationFrame(frame);
}
function countAllBranches(branches) {
  let count = 0;
  branches.forEach(branch => {
    count++;
    if (branch.subBranches) count += branch.subBranches.length;
  });
  return count;
}
let remainingBranches = 0;
let onAllBranchesDone = null;

// --- UI Events ---
heart.addEventListener('mouseenter', () => {
  lineText.style.opacity = '1';
  text.style.opacity = '1';
});
heart.addEventListener('mouseleave', () => {
  lineText.style.opacity = '0';
  text.style.opacity = '0';
});
heart.addEventListener('click', async () => {
  heart.style.opacity = '0';
  await new Promise(resolve => setTimeout(resolve, 500));
  const heartRect = heart.getBoundingClientRect();
  ball.style.opacity = '1';
  ball.style.top = `${heartRect.top + heartRect.height/2}px`;
  const finalPosition = window.innerHeight - 90;
  const duration = 2000;
  const startTime = performance.now();
  const startPosition = parseFloat(ball.style.top);
  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = progress * progress * (3 - 2 * progress);
    const currentPosition = startPosition + (finalPosition - startPosition) * easeProgress;
    ball.style.top = `${currentPosition}px`;
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      ball.style.opacity = '0';
      finalLine.style.width = '100vw';
      setTimeout(() => {
        branches.forEach(branch => {
          branch.drawn = false;
          if (branch.subBranches) {
            branch.subBranches.forEach(subBranch => subBranch.drawn = false);
          }
        });
        remainingBranches = countAllBranches(branches) + 1;
        onAllBranchesDone = null;
        animateTrunkGrowth();
      }, 600);
    }
  }
  requestAnimationFrame(animate);
});
window.onload = function() {
  const timerDiv = document.getElementById('groundTimer');
  timerDiv.style.visibility = 'hidden';
};

// --- Timer ---
function startGroundTimer() {
  const timerDiv = document.getElementById('groundTimer');
  const startDate = new Date(Date.UTC(2025, 0, 00, 4, 51, 0));
  function updateTimer() {
    const now = new Date();
    let diff = Math.floor((now.getTime() - startDate.getTime()) / 1000);
    if (diff < 0) diff = 0;
    const days = Math.floor(diff / (24 * 3600));
    diff %= 24 * 3600;
    const hours = Math.floor(diff / 3600);
    diff %= 3600;
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    timerDiv.innerHTML =
      `<span class="timer-num">${days}</span><span class="timer-unit">DAYS</span> ` +
      `<span class="timer-num">${hours}</span><span class="timer-unit">HOURS</span> ` +
      `<span class="timer-num">${minutes}</span><span class="timer-unit">MIN</span> ` +
      `<span class="timer-num">${seconds}</span><span class="timer-unit">SEC</span>`;
  }
  updateTimer();
  setInterval(updateTimer, 1000);
}

// --- Typewriter ---
function showTypewriterBox(text, imageUrl = 'boxImage.png') {
  let boxWrapper = document.getElementById('typewriterBoxWrapper');
  if (!boxWrapper) {
    boxWrapper = document.createElement('div');
    boxWrapper.id = 'typewriterBoxWrapper';
    boxWrapper.className = 'typewriter-box-wrapper';
    document.body.appendChild(boxWrapper);
  } else {
    boxWrapper.innerHTML = '';
  }
  const img = document.createElement('img');
  img.src = imageUrl;
  img.className = 'typewriter-box-image';
  boxWrapper.appendChild(img);
  const textDiv = document.createElement('div');
  textDiv.className = 'typewriter-text';
  boxWrapper.appendChild(textDiv);
  const lines = text.split(/\r?\n/);
  let lineIdx = 0;
  function typeLine() {
    if (lineIdx >= lines.length) return;
    let i = 0;
    const line = lines[lineIdx];
    function typeChar() {
      if (i < line.length) {
        textDiv.textContent += line.charAt(i);
        i++;
        setTimeout(typeChar, 32);
      } else {
        textDiv.textContent += '\n';
        lineIdx++;
        setTimeout(typeLine, 350);
      }
    }
    typeChar();
  }
  typeLine();
}
function showKuchuPuchuText() {
  let kp = document.getElementById('kuchuPuchu');
  if (!kp) {
    kp = document.createElement('div');
    kp.id = 'kuchuPuchu';
    kp.className = 'kuchu-puchu-text';
    kp.innerHTML = '<span style="color: #1db954;">Your Kuchu Puchu, </span><span style="color: #111;">since.....</span>';
    document.body.appendChild(kp);
  }
  kp.classList.add('fade-in-scale');
}

// --- Timer Position ---
function getTimerPosition() {
  const timer = document.getElementById('groundTimer');
  if (!timer) return { x: 60, y: window.innerHeight - 80 };
  const rect = timer.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

// --- Falling Heart Animation ---
function spawnFallingHearts({ count = 18, from = 'tree' } = {}) {
  const timerPos = getTimerPosition();
  const finalLine = document.getElementById('finalLine');
  const finalLineRect = finalLine ? finalLine.getBoundingClientRect() : { top: window.innerHeight - 70 };
  const finalLineY = finalLineRect.top;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const heart = document.createElement('img');
      heart.src = `${1 + Math.floor(Math.random() * 4)}.jpg`;
      heart.className = 'falling-heart';
      heart.style.position = 'fixed';
      heart.style.width = '32px';
      heart.style.height = '32px';
      heart.style.pointerEvents = 'none';
      heart.style.zIndex = 3500;
      heart.style.opacity = 0.92 + Math.random() * 0.08;
      const startX = window.innerWidth / 2 + TREE_X_OFFSET + (Math.random() - 0.5) * 120;
      const startY = window.innerHeight / 2 - 120 + Math.random() * 60;
      heart.style.left = `${startX}px`;
      heart.style.top = `${startY}px`;
      document.body.appendChild(heart);
      const timerWidth = 400;
      const timerHeight = 180;
      const endX = timerPos.x - timerWidth / 2 + Math.random() * timerWidth;
      const endY = timerPos.y - timerHeight / 2 + Math.random() * timerHeight;
      const duration = (2600 + Math.random() * 1200) / HEART_FALL_RATE;
      const wobble = 18 + Math.random() * 22;
      const scale = 0.9 + Math.random() * 0.3;
      const rot = (Math.random() - 0.5) * 60;
      const swayFreq = 1.2 + Math.random() * 1.2;
      const swayAmp = 0.7 + Math.random() * 0.7;
      let startTime = null;
      function animateHeart(ts) {
        if (!startTime) startTime = ts;
        const t = Math.min((ts - startTime) / duration, 1);
        const bx = startX + (endX - startX) * t;
        const by = startY + (endY - startY) * t;
        const wob = Math.sin(t * Math.PI * 2 * swayFreq + i) * wobble * (1 - t) * swayAmp;
        const sc = scale * (0.98 + 0.08 * Math.sin(t * Math.PI));
        const angle = rot + Math.sin(t * 2.5 + i) * 18 + Math.sin(t * 6 + i) * 6;
        heart.style.transform = `translate(0,0) translate(${bx - startX + wob}px, ${by - startY}px) scale(${sc}) rotate(${angle}deg)`;
        if (by > finalLineY) {
          heart.style.opacity = Math.max(0, 1 - (by - finalLineY) / 160);
        }
        if (t < 1) {
          requestAnimationFrame(animateHeart);
        } else {
          heart.remove();
        }
      }
      requestAnimationFrame(animateHeart);
    }, i * 600 + Math.random() * 250);
  }
}
if (!document.getElementById('falling-heart-style')) {
  const style = document.createElement('style');
  style.id = 'falling-heart-style';
  style.innerHTML = `
    .falling-heart {
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.13));
      transition: opacity 0.4s;
      will-change: transform, opacity;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}
