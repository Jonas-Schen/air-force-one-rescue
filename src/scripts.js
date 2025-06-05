import { App } from './main.js';
import { Credits } from './credits.js';
import { i18n } from './i18n.js';

document.addEventListener('DOMContentLoaded', () => {
    translateAllTags();
});

function translateAllTags() {
    document.querySelectorAll('t').forEach(el => {
        const key = el.textContent.trim();
        el.textContent = i18n.t(key);
    });
}

let creditsInstance = null;
const creditsContainer = document.getElementById('credits-container');

const app = new App();

const btnStart = document.getElementById('btn-start');

const btnControls = document.getElementById('btn-controls');
const btnCloseControls = document.getElementById('btn-close-controls');

const btnSettings = document.getElementById('btn-settings');
const btnSettingsSound = document.getElementById('settings-sound');
const btnCloseSettings = document.getElementById('btn-close-settings');

const btnCredits = document.getElementById('btn-credits');

const menuOverlay = document.getElementsByClassName('menu-overlay');

btnStart.addEventListener('click', () => {
    menuOverlay[0].style.display = 'none';
    app.start();
});

btnControls.addEventListener('click', () => {
    menuOverlay[0].style.display = 'none';
    document.getElementById('controls-container').style.display = 'block';
});

btnCloseControls.addEventListener('click', () => {
    menuOverlay[0].style.display = 'flex';
    document.getElementById('controls-container').style.display = 'none';
});

btnSettings.addEventListener('click', () => {
    openSettings();
});

btnSettingsSound.addEventListener('click', () => {
    const currentValue = document.getElementById('settings-sound').innerText.trim();

    if (currentValue === 'ON') {
        document.getElementById('settings-sound').innerText = 'OFF';

        return;
    }

    document.getElementById('settings-sound').innerText = 'ON';
});

btnCloseSettings.addEventListener('click', () => {
    closeSettings();
});

btnCredits.addEventListener('click', () => {
    menuOverlay[0].style.display = 'none';
    if (creditsContainer) {
        openCredits();
    }
});

creditsContainer.addEventListener('click', () => {
    closeCredits();
});

function openCredits() {
    if (creditsInstance) {
        creditsInstance._clearScene();
        creditsInstance = null;
    }

    creditsContainer.style.display = 'block';
    creditsInstance = new Credits(creditsContainer);
}

function closeCredits() {
    if (!creditsInstance) return;

    creditsInstance._clearScene();
    creditsInstance = null;
}

function openSettings() {
    const sound = localStorage.getItem('sound') ?? 'ON';
    const lang = localStorage.getItem('lang') ?? 'en';
    document.getElementById('settings-sound').innerText = sound;
    document.getElementById('settings-lang').value = lang;

    menuOverlay[0].style.display = 'none';
    document.getElementById('settings-container').style.display = 'block';
}

function closeSettings() {
    const sound = document.getElementById('settings-sound').innerText.trim();
    const lang = document.getElementById('settings-lang').value;
    localStorage.setItem('sound', sound);
    localStorage.setItem('lang', lang);

    menuOverlay[0].style.display = 'flex';
    document.getElementById('settings-container').style.display = 'none';
    location.reload();
}
