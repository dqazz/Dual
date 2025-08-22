// This file contains the main JavaScript logic for the interactive classification system.
// It handles the random selection of words, user input for preferences, and score tracking.

let words = [];
let scores = {};
let duels = [];
let currentDuelIndex = 0;

const wordList = document.getElementById('wordList');
const scoreList = document.getElementById('scoreList');
const addWordBtn = document.getElementById('addWordBtn');
const newWordInput = document.getElementById('newWord');
const startBtn = document.getElementById('startBtn');
const duelSection = document.getElementById('duelSection');
const duelBtn1 = document.getElementById('duelBtn1');
const duelBtn2 = document.getElementById('duelBtn2');
const scoreSection = document.getElementById('scoreSection');
const restartBtn = document.getElementById('restartBtn');
const duelCounter = document.getElementById('duelCounter');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const saveNameInput = document.getElementById('saveName');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importInput = document.getElementById('importInput');
const confirmLoadBtn = document.getElementById('confirmLoadBtn');
const wordMsg = document.getElementById('wordMsg');
const resetAllBtn = document.getElementById('resetAllBtn');
const backDuelBtn = document.getElementById('backDuelBtn');
const wordCount = document.getElementById('wordCount');

let selectedSaveName = null;
let confirmRapidLoad = false;
let confirmReset = false;

// Historique des choix pour retour
let duelHistory = []; // [{duelIndex, winnerIndex}]

// Ajout de mot
addWordBtn.onclick = () => {
    const word = newWordInput.value.trim();
    if (!word) {
        wordMsg.textContent = '';
        wordMsg.classList.remove('visible');
        return;
    }
    if (words.includes(word)) {
        wordMsg.textContent = `Le mot "${word}" est déjà dans la liste.`;
        wordMsg.classList.add('visible');
        return;
    }
    words.push(word);
    scores[word] = 0;
    updateWordList();
    newWordInput.value = '';
    wordMsg.textContent = '';
    wordMsg.classList.remove('visible');
    autoSave();
};

// Sauvegarde nommée pour export/import/liste
function saveNamed(name) {
    if (!name) {
        wordMsg.textContent = "Veuillez entrer un nom pour exporter ou gérer la sauvegarde.";
        wordMsg.classList.add('visible');
        setTimeout(() => wordMsg.classList.remove('visible'), 1800);
        return false;
    }
    const state = {
        name,
        words,
        scores,
        duels,
        currentDuelIndex,
        duelHistory, // <-- AJOUTE CETTE LIGNE
        phase: {
            addVisible: document.getElementById('add-word-section').style.display !== 'none',
            duelVisible: duelSection.style.display !== 'none',
            scoreVisible: scoreSection.style.display !== 'none'
        }
    };
    localStorage.setItem('classificationSave_' + name, JSON.stringify(state));
    return state;
}

// Exporter la sauvegarde nommée en fichier JSON
exportBtn.onclick = () => {
    const name = saveNameInput.value.trim();
    const state = saveNamed(name);
    if (!state) return;
    const blob = new Blob([JSON.stringify(state, null, 2)], {type: "application/json"});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    wordMsg.textContent = `Export "${name}.json" effectué !`;
    wordMsg.classList.add('visible');
    setTimeout(() => wordMsg.classList.remove('visible'), 1500);
};

// Importer une sauvegarde JSON
importBtn.onclick = () => {
    importInput.click();
};
importInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const state = JSON.parse(evt.target.result);
            words = state.words || [];
            scores = state.scores || {};
            duels = state.duels || [];
            currentDuelIndex = state.currentDuelIndex || 0;
            duelHistory = state.duelHistory || [];
            document.getElementById('add-word-section').style.display = state.phase.addVisible ? '' : 'none';
            startBtn.style.display = state.phase.addVisible ? '' : 'none';
            duelSection.style.display = state.phase.duelVisible ? '' : 'none';
            scoreSection.style.display = state.phase.scoreVisible ? '' : 'none';
            updateWordList();
            if (state.phase.duelVisible) nextDuel();
            if (state.phase.scoreVisible) showScores();
            saveNameInput.value = state.name || "";
            wordMsg.textContent = `Import "${state.name || file.name}" réussi !`;
            wordMsg.classList.add('visible');
            setTimeout(() => wordMsg.classList.remove('visible'), 1500);
            autoSave();
        } catch {
            wordMsg.textContent = "Erreur lors de l'import.";
            wordMsg.classList.add('visible');
            setTimeout(() => wordMsg.classList.remove('visible'), 1500);
        }
    };
    reader.readAsText(file);
};

// Confirmation du chargement d'une sauvegarde nommée
confirmLoadBtn.onclick = () => {
    if (!selectedSaveName) return;
    const state = localStorage.getItem('classificationSave_' + selectedSaveName);
    if (!state) {
        wordMsg.textContent = `Aucune sauvegarde "${selectedSaveName}" trouvée.`;
        wordMsg.classList.add('visible');
        setTimeout(() => wordMsg.classList.remove('visible'), 1500);
        confirmLoadBtn.style.display = 'none';
        return;
    }
    const stateObj = JSON.parse(state);
    words = stateObj.words || [];
    scores = stateObj.scores || {};
    duels = stateObj.duels || [];
    currentDuelIndex = stateObj.currentDuelIndex || 0;
    duelHistory = stateObj.duelHistory || []; // <-- AJOUTE CETTE LIGNE
    document.getElementById('add-word-section').style.display = stateObj.phase.addVisible ? '' : 'none';
    startBtn.style.display = stateObj.phase.addVisible ? '' : 'none';
    duelSection.style.display = stateObj.phase.duelVisible ? '' : 'none';
    scoreSection.style.display = stateObj.phase.scoreVisible ? '' : 'none';
    updateWordList();
    if (stateObj.phase.duelVisible) nextDuel();
    if (stateObj.phase.scoreVisible) showScores();
    wordMsg.textContent = `Sauvegarde "${selectedSaveName}" chargée !`;
    wordMsg.classList.add('visible');
    setTimeout(() => wordMsg.classList.remove('visible'), 1500);
    confirmLoadBtn.style.display = 'none';
    selectedSaveName = null;
};

// Fonction pour mettre à jour l'affichage de la liste des mots
function updateWordList() {
    wordList.innerHTML = '';
    wordCount.textContent = words.length;
    const canDelete = document.getElementById('add-word-section').style.display !== 'none';
    words.forEach(w => {
        const li = document.createElement('li');
        li.textContent = w;
        if (canDelete) {
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.innerHTML = `
                <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="11" />
                    <line x1="8" y1="8" x2="16" y2="16" stroke="#ff4d4d" stroke-width="2"/>
                    <line x1="16" y1="8" x2="8" y2="16" stroke="#ff4d4d" stroke-width="2"/>
                </svg>
            `;
            delBtn.onclick = () => {
                words = words.filter(word => word !== w);
                delete scores[w];
                updateWordList();
                autoSave();
            };
            li.appendChild(delBtn);
        }
        wordList.appendChild(li);
    });
}

function prepareDuels() {
    duels = [];
    for (let i = 0; i < words.length; i++) {
        for (let j = i + 1; j < words.length; j++) {
            duels.push([words[i], words[j]]);
        }
    }
    // Mélange les duels
    duels = duels.sort(() => Math.random() - 0.5);
}

function nextDuel() {
    if (currentDuelIndex >= duels.length) {
        showScores();
        return;
    }
    const [w1, w2] = duels[currentDuelIndex];
    duelBtn1.textContent = w1;
    duelBtn2.textContent = w2;
    duelCounter.textContent = `Duel ${currentDuelIndex + 1} / ${duels.length}`;
}

duelBtn1.onclick = () => {
    duelHistory.push({ duelIndex: currentDuelIndex, winnerIndex: 0 });
    scores[duels[currentDuelIndex][0]]++;
    currentDuelIndex++;
    nextDuel();
    autoSave();
};
duelBtn2.onclick = () => {
    duelHistory.push({ duelIndex: currentDuelIndex, winnerIndex: 1 });
    scores[duels[currentDuelIndex][1]]++;
    currentDuelIndex++;
    nextDuel();
    autoSave();
};

// Bouton retour
backDuelBtn.onclick = () => {
    // On ne peut revenir que sur les 3 derniers duels joués, un par un
    if (duelHistory.length === 0 || currentDuelIndex === 0) {
        wordMsg.textContent = "Impossible de revenir en arrière.";
        wordMsg.classList.add('visible');
        setTimeout(() => wordMsg.classList.remove('visible'), 1200);
        return;
    }
    // On ne peut revenir que sur les 3 derniers duels joués, un par un
    // On autorise le retour si on n'a pas déjà fait 3 retours successifs
    if (duelHistory.length <= 3) {
        const last = duelHistory.pop();
        currentDuelIndex = last.duelIndex;
        scores[duels[currentDuelIndex][last.winnerIndex]]--;
        nextDuel();
        autoSave();
        wordMsg.textContent = `Retour effectué (${duelHistory.length} retour restant${duelHistory.length !== 1 ? 's' : ''}).`;
        wordMsg.classList.add('visible');
        setTimeout(() => wordMsg.classList.remove('visible'), 1200);
    } else {
        // Si on a déjà fait 3 retours successifs, on bloque
        wordMsg.textContent = "Tu ne peux revenir qu'aux 3 derniers duels.";
        wordMsg.classList.add('visible');
        setTimeout(() => wordMsg.classList.remove('visible'), 1200);
    }
};

function showScores() {
    duelSection.style.display = 'none';
    scoreSection.style.display = '';
    scoreList.innerHTML = '';
    const sorted = Object.entries(scores)
        .filter(([w]) => words.includes(w))
        .sort((a, b) => b[1] - a[1]);
    sorted.forEach(([w, s], idx) => {
        const li = document.createElement('li');
        li.textContent = `${idx + 1}. ${w} : ${s} vote${s > 1 ? 's' : ''}`;
        scoreList.appendChild(li);
    });
}

startBtn.onclick = () => {
    if (words.length < 2) {
        wordMsg.textContent = "Ajoute au moins deux mots.";
        wordMsg.classList.add('visible');
        return;
    }
    wordMsg.textContent = '';
    wordMsg.classList.remove('visible');
    document.getElementById('add-word-section').style.display = 'none';
    startBtn.style.display = 'none';
    updateWordList();
    duelSection.style.display = '';
    scoreSection.style.display = 'none';
    prepareDuels(); // Mélange les duels UNE SEULE FOIS
    currentDuelIndex = 0;
    duelHistory = [];
    nextDuel();
    autoSave();
};

restartBtn.onclick = () => {
    words.forEach(word => scores[word] = 0);
    currentDuelIndex = 0;
    duelHistory = [];
    document.getElementById('add-word-section').style.display = '';
    startBtn.style.display = '';
    duelSection.style.display = 'none';
    scoreSection.style.display = 'none';
    updateWordList();
    autoSave();
};

// Réinitialiser tout le classement
resetAllBtn.onclick = () => {
    if (!confirmReset) {
        wordMsg.textContent = "Cliquez à nouveau sur 'Réinitialiser' pour confirmer la suppression de tout le classement.";
        wordMsg.classList.add('visible');
        confirmReset = true;
        setTimeout(() => {
            wordMsg.classList.remove('visible');
            confirmReset = false;
        }, 4000);
        return;
    }
    confirmReset = false;
    // Reset uniquement les données en mémoire et la sauvegarde rapide
    words = [];
    scores = {};
    duels = [];
    currentDuelIndex = 0;
    localStorage.removeItem('classificationSave_last'); // Ne touche pas aux sauvegardes manuelles !
    document.getElementById('add-word-section').style.display = '';
    startBtn.style.display = '';
    duelSection.style.display = 'none';
    scoreSection.style.display = 'none';
    updateWordList();
    wordMsg.textContent = "Classement réinitialisé !";
    wordMsg.classList.add('visible');
    setTimeout(() => wordMsg.classList.remove('visible'), 1500);
};

function autoSave() {
    const state = {
        words,
        scores,
        duels,
        currentDuelIndex,
        duelHistory, // <-- IMPORTANT
        phase: {
            addVisible: document.getElementById('add-word-section').style.display !== 'none',
            duelVisible: duelSection.style.display !== 'none',
            scoreVisible: scoreSection.style.display !== 'none'
        }
    };
    localStorage.setItem('classificationSave_last', JSON.stringify(state));
}

window.onload = () => {
    const state = localStorage.getItem('classificationSave_last');
    if (state) {
        const stateObj = JSON.parse(state);
        words = stateObj.words || [];
        scores = stateObj.scores || {};
        duels = stateObj.duels || [];
        currentDuelIndex = stateObj.currentDuelIndex || 0;
        duelHistory = stateObj.duelHistory || [];
        document.getElementById('add-word-section').style.display = stateObj.phase.addVisible ? '' : 'none';
        startBtn.style.display = stateObj.phase.addVisible ? '' : 'none';
        duelSection.style.display = stateObj.phase.duelVisible ? '' : 'none';
        scoreSection.style.display = stateObj.phase.scoreVisible ? '' : 'none';
        updateWordList();
        if (stateObj.phase.duelVisible) nextDuel();
        if (stateObj.phase.scoreVisible) showScores();
    }
};