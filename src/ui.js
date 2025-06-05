import { i18n } from './i18n.js';

export function updateScoreUI(score, worldSpeed, lives) {
    const scoreElement = document.getElementById('score');
    const speedElement = document.getElementById('speed');
    const livesElement = document.getElementById('lives');

    if (scoreElement) {
        scoreElement.innerText = `${i18n.t('distance')}: ${score.toFixed(1)} ${i18n.t('miles')}`;
    }

    if (speedElement) {
        speedElement.innerText = `${i18n.t('speed')}: ${(worldSpeed * 4000).toFixed(1)} ${i18n.t('mph')}`;
    }

    if (livesElement) {
        livesElement.textContent = `Lives: ${lives}`;
    }
}

export function updatePauseUI(isPaused) {
    const pausedElement = document.getElementById('paused');

    if (isPaused) {
        pausedElement.innerText = i18n.t('paused');
    } else {
        pausedElement.innerText = '';
    }
}

export function showGameOver(score, resetCallback) {
    alert(`${i18n.t('gameOver')}! ${i18n.t('yourDistanceWas')}: ${score.toFixed(1)} ${i18n.t('miles')}. \n\n${i18n.t('pressOk')}.`);
    resetCallback();
}
