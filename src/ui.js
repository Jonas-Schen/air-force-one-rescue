import { i18n } from './i18n.js';

export function updateScoreUI(distance, worldSpeed, lives, fuelLevel) {
    const distanceElement = document.getElementById('distance');
    const speedElement = document.getElementById('speed');
    const livesElement = document.getElementById('lives');

    if (distanceElement) {
        distanceElement.innerText = `${i18n.t('distance')}: ${distance.toFixed(1)} ${i18n.t('miles')}`;
    }

    if (speedElement) {
        speedElement.innerText = `${i18n.t('speed')}: ${(worldSpeed * 4000).toFixed(1)} ${i18n.t('mph')}`;
    }

    if (livesElement) {
        livesElement.replaceChildren();
        for (let i = 0; i < lives; i++) {
            const life = document.createElement('span');
            life.classList.add('material-symbols-outlined');
            life.innerText = 'plane_contrails';

            livesElement.appendChild(life);
        }
    }

    setFuelLevel(fuelLevel);
}

export function updatePauseUI(isPaused) {
    const pausedElement = document.getElementById('paused');

    if (isPaused) {
        pausedElement.innerText = i18n.t('paused');
    } else {
        pausedElement.innerText = '';
    }
}

export function showGameOver(distance, resetCallback) {
    alert(`${i18n.t('gameOver')}! ${i18n.t('yourDistanceWas')}: ${distance.toFixed(1)} ${i18n.t('miles')}. \n\n${i18n.t('pressOk')}.`);
    resetCallback();
}

function setFuelLevel(level) {
    const barsContainer = document.getElementById('barsContainer');
    const bars = Array.from(barsContainer.querySelectorAll('.fuel-bar'));
    const ticker = document.getElementById('fuelTicker');
    const gauge = document.getElementById('fuelGauge');

    level = Math.max(0, Math.min(100, level));
    level = level / 100;
    const rect = gauge.getBoundingClientRect();
    const gaugeHeight = rect.height;  // altura total em pixels
    const tickerHeight = ticker.getBoundingClientRect().height;
    const y = (1 - level) * (gaugeHeight - tickerHeight);
    ticker.style.top = `${y}px`;

    bars.forEach(bar => bar.classList.remove('filled'));
    const fillCount = Math.ceil(level * bars.length);
    for (let i = 0; i < fillCount; i++) {
        bars[i].classList.add('filled');
    }
}
