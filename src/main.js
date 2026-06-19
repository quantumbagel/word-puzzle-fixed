import {loadWordList, assertValidWord, resetGame } from "./game-logic.js";
import { checkForLetterChange, checkForAnagram } from "./game-logic.js";
import { HISTORY, STARTING_WORD, TARGET_WORD } from "./game-logic.js";

import { loadAudioFile, playSound } from "./audio.js";

import PUZZLES from "./puzzles.json" with { type: "json" }

const WORD_INPUT = document.getElementById("wordInput");
const INPUT_CONTAINER = document.getElementById("inputContainer");
const UNDO_BUTTON = document.getElementById("undo-button");
const RESET_BUTTON = document.getElementById("resetButton");
const HELP_BUTTON = document.getElementById("help-button");
const CLOSE_HELP_BUTTON = document.getElementById("closeHelp");
const FAKE_CARET = document.getElementById("caret");

let MOBILE_MODE = null;
const WORD_DISPLAY_OFFSET = 2.25; // in cap

/* Animation Functions */

function beginGameAnimation() {
    let buttonContainer = document.getElementById("buttonContainer");
    buttonContainer.hidden = true;
    buttonContainer.style.animation = "none";

    let targetContainer = document.getElementById("targetContainer");
    targetContainer.style.opacity = "0";
    targetContainer.style.animation = "none";

    let gameContainer = document.getElementById("gameContainer");
    gameContainer.style.animation = "none";
    gameContainer.hidden = false;

    INPUT_CONTAINER.hidden = true;

    let historyContainer = document.getElementById("historyContainer");
    historyContainer.hidden = false;
    historyContainer.style.animation = "reveal 3s ease-in-out";

    let keyboardContainer = document.getElementById("keyboardContainer");
    keyboardContainer.hidden = true;
    keyboardContainer.style.animation = "none";

    setTimeout(() => {
        targetContainer.hidden = false;
        targetContainer.style.animation = "reveal 3s ease-in-out forwards";

        setTimeout( () => {
            revealInputAnimation();
            buttonContainer.hidden = false;
            buttonContainer.style.animation = "reveal 2s ease-in-out";

            let keyboardContainer = document.getElementById("keyboardContainer");
            keyboardContainer.hidden = false;
            keyboardContainer.style.animation = "reveal 2s ease-in-out";

            WORD_INPUT.focus();
        }, 3000);

    }, 3000);
}

function resumeGameAnimation() {
    let buttonContainer = document.getElementById("buttonContainer");
    buttonContainer.hidden = false;
    buttonContainer.style.animation = "none";

    let targetContainer = document.getElementById("targetContainer");
    targetContainer.style.opacity = "1";
    targetContainer.style.animation = "none";

    let gameContainer = document.getElementById("gameContainer");
    gameContainer.hidden = false;
    gameContainer.style.animation = "reveal 3s ease-in-out";

    let historyContainer = document.getElementById("historyContainer");
    historyContainer.hidden = false;
    historyContainer.style.animation = "reveal 3s ease-in-out";

    let keyboardContainer = document.getElementById("keyboardContainer");
    keyboardContainer.hidden = false;
    keyboardContainer.style.animation = "reveal 3s ease-in-out";

    setTimeout(() => {
        WORD_INPUT.focus();
    }, 3000);
}

let CANCEL_VICTORY_ANIMATION = false
function victoryAnimation() {
    CANCEL_VICTORY_ANIMATION = false;

    let gameContainer = document.getElementById("gameContainer");
    gameContainer.style.animation = "hide 2s ease-in-out forwards";

    let keyboardContainer = document.getElementById("keyboardContainer");
    keyboardContainer.style.animation = "hide 2s ease-in-out forwards";

    let victoryContainer = document.getElementById("victoryContainer");
    victoryContainer.hidden = false;

    // Fill out history display
    let historyContainer = document.getElementById("historyContainer");
    historyContainer.hidden = true;

    // update positions
    let victoryFlex = document.getElementById("victoryFlex");
    victoryFlex.replaceChildren();

    let firstBlock = constructWordDisplay(STARTING_WORD);
    firstBlock.classList.add("static", "startingWord");
    firstBlock.style.bottom = "";
    victoryFlex.append(firstBlock);

    for (const word of HISTORY) {
        let newBlock = constructWordDisplay(word);
        newBlock.classList.add("wordHistory");
        newBlock.classList.add("static");
        newBlock.style.bottom = "";

        victoryFlex.append(newBlock);
    }

    victoryFlex.scrollTop = victoryFlex.scrollHeight; // force the scroll to start at the bottom

    let finalWord = victoryFlex.children[victoryFlex.children.length - 1];
    finalWord.classList.remove("wordHistory");
    finalWord.style.animation = "victory 3s ease-in-out 2s forwards";

    let victoryText = document.getElementById("victoryText");
    victoryText.hidden = true;

    let moveCounter = document.getElementById("moveCounter");
    moveCounter.innerHTML = (HISTORY.length).toString();

    let victoryVideo = document.getElementById("victoryVideo");
    victoryVideo.hidden = true;

    //sfx
    playSound("victoryPiano");

    setTimeout( () => {
        if (CANCEL_VICTORY_ANIMATION) {
            CANCEL_VICTORY_ANIMATION = false;
            return;
        }

        victoryText.hidden = false;
        victoryText.style.animation = "reveal 3s ease-in-out forwards";
    }, 5000)

    setTimeout(() => {
        if (CANCEL_VICTORY_ANIMATION) {
            CANCEL_VICTORY_ANIMATION = false;
            return;
        }

        victoryVideo.hidden = false;
        victoryVideo.play();

        setTimeout( () => {
            if (CANCEL_VICTORY_ANIMATION) {
                CANCEL_VICTORY_ANIMATION = false;
                return;
            }

            playSound("victoryPathetic");
        }, 200);
    }, 12500);
}

function badSubmit() {
    playSound("submit-fail");

    INPUT_CONTAINER.style.animation = "none";
    setTimeout(() => {
        INPUT_CONTAINER.style.animationComposition = "accumulate";
        INPUT_CONTAINER.style.animation = "NoSubmit 0.5s";
    });
}

function formatHistory() {
    let historyContainer = document.getElementById("historyContainer");

    // update positions
    let historyList = historyContainer.children;
    let counter = historyList.length;
    for (let child of historyList) {
        child.style.bottom = (WORD_DISPLAY_OFFSET * counter + 1) + "cap";
        counter--;
    }
}

function revealInputAnimation() {
    INPUT_CONTAINER.hidden = false;
    INPUT_CONTAINER.style.animation = "none";
    INPUT_CONTAINER.style.animationComposition = "";
    WORD_INPUT.value = "";

    setTimeout(() => {
        formatHistory();
        INPUT_CONTAINER.style.animation = "reveal 1s";
    });
}

function revealHelpText() {
    let cover = document.getElementById("cover");
    let helpText = document.getElementById("helpText");
    cover.hidden = false;
    helpText.hidden = false;

    cover.style.animation = "reveal 1s forwards";
    helpText.style.animation = "reveal 1s forwards";
}

function hideHelpText() {
    let cover = document.getElementById("cover");
    let helpText = document.getElementById("helpText");

    cover.style.animation = "hide 1s forwards";
    helpText.style.animation = "hide 1s forwards";
}

function constructWordDisplay(word) {
    let newBlock = document.createElement("div");
    newBlock.className = "wordDisplay text-lg gameplayText smoothMovement";
    newBlock.innerHTML = word;
    newBlock.style.bottom = "1cap";

    return newBlock;
}

function constructWordHistory(word, lastWord) {
    let newDisplay = constructWordDisplay(word);

    // We're ignoring all this for now
    // Hopefully we find a better way of indicating moves later
    /*
    const letterIdx = checkForLetterChange(lastWord, word);

    if (letterIdx >= 0) {
        let firstSegment = word.slice(0, letterIdx);
        let secondSegment = "<span class='letterMove'>" + word[letterIdx] + "</span>";
        let thirdSegment = word.slice(letterIdx + 1, word.length);

        newDisplay.innerHTML = firstSegment + secondSegment + thirdSegment;
    } else {
        newDisplay.classList.add("anagramMove");
    }
    /* */

    return newDisplay;
}


/*
*  Control functions
*/

const SUBMIT_SOUNDS = ["submit-1", "submit-2", "submit-3", "submit-4"];
let remainingSounds = [...SUBMIT_SOUNDS];

function submitWord() {
    let word = WORD_INPUT.value.toUpperCase();

    if (!assertValidWord(word)) {
        badSubmit();
        return;
    }

    let lastWord = STARTING_WORD;
    if (HISTORY.length > 0)
        lastWord = HISTORY[HISTORY.length - 1];

    if (lastWord === word) {
        badSubmit();
        return;
    }

    // Check for a valid move
    let letterIdx = checkForLetterChange(lastWord, word);
    if (letterIdx < 0 && !checkForAnagram(lastWord, word)) {
        badSubmit();
        return;
    }

    // Move was valid.

    // Add the move to the history
    HISTORY.push(word);
    sessionStorage.setItem("history", HISTORY.toString());

    // Did we win?
    if (word === TARGET_WORD) {
        // We did win!
        endGame();

    } else {
        // Play submit noise
        const num = Math.floor(Math.random() * remainingSounds.length);
        const sound = remainingSounds[num];
        if (remainingSounds.length === 1)
            remainingSounds = [...SUBMIT_SOUNDS];
        else remainingSounds.splice(num, 1);
        playSound("submit-1");

        // Update visuals
        let newDisplay = constructWordHistory(word, lastWord);

        let historyContainer = document.getElementById("historyContainer");
        historyContainer.append(newDisplay);

        setTimeout(() => {
            newDisplay.classList.add("wordHistory")
        });
        revealInputAnimation();
    }
}

function undo() {
    if (HISTORY.length <= 0) {
        if (WORD_INPUT.value === "") {
            playSound("submit-fail");
            return;
        }
        // Just clear the input
        playSound("undo");
        WORD_INPUT.value = "";
        return;
    }

    playSound("undo");
    let lastWord = HISTORY.pop();
    sessionStorage.setItem("history", HISTORY.toString());

    // Create illusion of old input fading away
    let oldInput = document.getElementById("oldInput");
    oldInput.innerHTML = WORD_INPUT.value.toUpperCase();
    oldInput.style.animation = "none";
    oldInput.hidden = false;

    INPUT_CONTAINER.style.transition = "none";
    INPUT_CONTAINER.style.bottom = WORD_DISPLAY_OFFSET + "cap"; // add the class so it moves immediately
    WORD_INPUT.value = lastWord;

    let historyContainer = document.getElementById("historyContainer");
    let historyList = historyContainer.children;
    historyContainer.removeChild(historyList[historyList.length - 1]);

    setTimeout(() => {
        // remove the class and begin the down animation
        INPUT_CONTAINER.style.transition = "bottom 0.3s ease-out";
        INPUT_CONTAINER.style.bottom = "0";

        // fade out old text
        oldInput.style.animation = "hide 0.3s forwards";

        formatHistory();

        setTimeout(() => {
            INPUT_CONTAINER.style.transition = "";
        }, 300);
    });

    WORD_INPUT.focus();
}

WORD_INPUT.addEventListener("keydown", function (event) {
    if (event.repeat) return;

    if (event.key === "Enter") {
        event.preventDefault();
        submitWord();
    } else if (event.key === "Escape" || event.key === "Tab") {
        event.preventDefault();
        undo();
    }
});

WORD_INPUT.addEventListener("input", function (event) {
    // sanitize the input to prevent special characters
    this.value = this.value.replace(/[^a-zA-Z]/, "");
});

UNDO_BUTTON.addEventListener("click", function (event) {
    undo();
});

RESET_BUTTON.addEventListener("click", function (event) {
    CANCEL_VICTORY_ANIMATION = true;
    startGame(STARTING_WORD, TARGET_WORD);
});

HELP_BUTTON.addEventListener("click", function (event) {
    revealHelpText();
});

CLOSE_HELP_BUTTON.addEventListener("click", function (event) {
    hideHelpText();
});

function updateCaret() {
    FAKE_CARET.style.left = (1.25 * WORD_INPUT.value.length) + "ch";
}

function onKeyboardPress(key) {
    if (key === "ENTER") {
        submitWord();
    }

    else if (key === "BACK") {

        if (WORD_INPUT.value.length > 0) {
            WORD_INPUT.value = WORD_INPUT.value.slice(0, WORD_INPUT.value.length - 1);
            playSound("keytap2");
        } else {
            playSound("keytap2-fail");
        }
    }

    // Letter key
    else if (WORD_INPUT.value.length < STARTING_WORD.length) {
        WORD_INPUT.value = WORD_INPUT.value + key;

        playSound("keytap1");
    } else {
        playSound("keytap1-fail");
    }

    // update fake caret
    updateCaret();
}

function setMobileMode(on) {
    if (on) {
        MOBILE_MODE = true;
        WORD_INPUT.disabled = true;
        updateCaret();
    } else {
        MOBILE_MODE = false;
        WORD_INPUT.disabled = false;
    }

    formatHistory();
}

let keyboardButtons = document.querySelectorAll("#keyboardContainer button");
keyboardButtons.forEach(function (button) {

    button.addEventListener("click", function (event) {
        onKeyboardPress(this.value);
    });
});



function correctScreenSize() {
    if (window.innerWidth <= 512 && !MOBILE_MODE) {
        setMobileMode(true);
    } else if (window.innerWidth > 512 && (MOBILE_MODE || MOBILE_MODE === null)) {
        setMobileMode(false);
    }
}

addEventListener("resize", function (event) {
    correctScreenSize();
});



//

function startGame(startWord, targetWord, history=[]) {
    resetGame(startWord, targetWord, history);

    // Storage for persistent levels
    sessionStorage.setItem("startWord", startWord);
    sessionStorage.setItem("targetWord", targetWord);
    sessionStorage.setItem("history", history.toString());

    WORD_INPUT.value = "";
    updateCaret();

    let victoryContainer = document.getElementById("victoryContainer");
    victoryContainer.hidden = true;

    // clear history display
    let historyContainer = document.getElementById("historyContainer");
    historyContainer.replaceChildren();

    let startingWordContainer = constructWordDisplay(STARTING_WORD);
    startingWordContainer.id = "startingWord";
    startingWordContainer.classList.add("startingWord");
    historyContainer.append(startingWordContainer);

    let victoryVideo = document.getElementById("victoryVideo");
    victoryVideo.currentTime = 0;

    let targetWordContainer = document.getElementById("targetWord");
    targetWordContainer.innerHTML = TARGET_WORD;

    if (history.length > 0) {
        // Resume game

        let lastWord = STARTING_WORD;
        for (const word of HISTORY) {
            let newDisplay = constructWordHistory(word, lastWord);
            newDisplay.classList.add("wordHistory");

            historyContainer.append(newDisplay);
            lastWord = word;
        }

        formatHistory();
        resumeGameAnimation();
    } else {
        beginGameAnimation();
    }

}

function endGame() {
    // clear session storage
    sessionStorage.removeItem("startWord");
    sessionStorage.removeItem("targetWord");
    sessionStorage.removeItem("history");

    victoryAnimation();
}

async function onload() {
    await loadWordList();

    await loadAudioFile("./src/audio/keytap1.mp3", "keytap1");
    await loadAudioFile("./src/audio/keytap1-fail.mp3", "keytap1-fail");
    await loadAudioFile("./src/audio/keytap2.mp3", "keytap2");
    await loadAudioFile("./src/audio/keytap2-fail.mp3", "keytap2-fail");
    await loadAudioFile("./src/audio/newWord.mp3", "submit");
    await loadAudioFile("./src/audio/submit-1.mp3", "submit-1");
    await loadAudioFile("./src/audio/submit-2.mp3", "submit-2");
    await loadAudioFile("./src/audio/submit-3.mp3", "submit-3");
    await loadAudioFile("./src/audio/submit-4.mp3", "submit-4");
    await loadAudioFile("./src/audio/badSubmit.mp3", "submit-fail");
    await loadAudioFile("./src/audio/victory.mp3", "victoryPiano");
    await loadAudioFile("./src/audio/party-favor.mp3", "victoryPathetic");
    await loadAudioFile("./src/audio/slide.mp3", "undo");

    correctScreenSize();

    // Check for session storage
    let startWord = sessionStorage.getItem("startWord");
    let targetWord = sessionStorage.getItem("targetWord");
    if (startWord !== null && targetWord !== null) {
        // There is session storage!
        // Load previous game history and resume
        let oldHistory = sessionStorage.getItem("history").split(",");
        if (oldHistory[0] === "")
            oldHistory = [];

        startGame(startWord, targetWord, oldHistory);
    } else {
        // Start a new game

        let puzzle = PUZZLES[Math.floor(Math.random() * PUZZLES.length)];

        startWord = puzzle["start"];
        targetWord = puzzle["target"];

        // read words from query string if it exists
        const urlParams = new URLSearchParams(window.location.search);
        const queryStartWord = urlParams.get("startWord");
        const queryTargetWord = urlParams.get("targetWord");

        if (queryStartWord !== null && assertValidWord(queryStartWord))
            startWord = queryStartWord;
        if (queryTargetWord !== null && assertValidWord(queryTargetWord))
            targetWord = queryTargetWord;

        startGame(startWord, targetWord);
    }
}

await onload();
