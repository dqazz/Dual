export const scores = {};

export function incrementScore(word) {
    if (scores[word]) {
        scores[word]++;
    } else {
        scores[word] = 1;
    }
}

export function getScores() {
    return scores;
}

export function getMostPreferred() {
    return Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b), [null, 0])[0];
}