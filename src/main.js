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
let LG_FONT_SIZE_PX = 0;
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
    historyContainer.style.animation = "reveal 1s ease-in-out";

    let keyboardContainer = document.getElementById("keyboardContainer");
    keyboardContainer.hidden = true;
    keyboardContainer.style.animation = "none";
    correctScreenSize();

    setTimeout(() => {
        targetContainer.hidden = false;
        targetContainer.style.animation = "reveal 1s ease-in-out forwards";

        setTimeout( () => {
            revealInputAnimation();
            buttonContainer.hidden = false;
            buttonContainer.style.animation = "reveal 0.8s ease-in-out";

            let keyboardContainer = document.getElementById("keyboardContainer");
            keyboardContainer.hidden = false;
            keyboardContainer.style.animation = "reveal 0.8s ease-in-out";
            correctScreenSize();

            WORD_INPUT.focus();
        }, 1000);

    }, 1000);
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
    gameContainer.style.animation = "reveal 1s ease-in-out";

    let historyContainer = document.getElementById("historyContainer");
    historyContainer.hidden = false;
    historyContainer.style.animation = "reveal 1s ease-in-out";

    let keyboardContainer = document.getElementById("keyboardContainer");
    keyboardContainer.hidden = false;
    keyboardContainer.style.animation = "reveal 1s ease-in-out";
    correctScreenSize();

    setTimeout(() => {
        WORD_INPUT.focus();
    }, 1000);
}

let CANCEL_VICTORY_ANIMATION = false
function victoryAnimation() {
    CANCEL_VICTORY_ANIMATION = false;

    let gameContainer = document.getElementById("gameContainer");
    gameContainer.style.animation = "hide 0.8s ease-in-out forwards";

    let keyboardContainer = document.getElementById("keyboardContainer");
    keyboardContainer.style.animation = "hide 0.8s ease-in-out forwards";

    // victory-active class to body to trigger CSS transitions and scroll styling
    document.body.classList.add("victory-active");

    let victoryContainer = document.getElementById("victoryContainer");
    victoryContainer.hidden = false;
    correctScreenSize();

    // final word green in history list with a delay, and combine it with the pop animation
    let historyListElement = document.getElementById("historyList");
    let finalWord = historyListElement.children[historyListElement.children.length - 1];
    if (finalWord) {
        finalWord.classList.remove("wordHistory");
        // Combine pop animation and delayed transition to green
        finalWord.style.animation = "anagram-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both, victory 1.5s ease-in-out 0.4s forwards";
    }

    // Scroll to bottom of history list
    setTimeout(() => {
        historyListElement.scrollTop = historyListElement.scrollHeight;
    }, 100);

    let victoryText = document.getElementById("victoryText");
    victoryText.hidden = true;

    let moveCounter = document.getElementById("moveCounter");
    moveCounter.innerHTML = (HISTORY.length).toString();

    let victoryVideo = document.getElementById("victoryVideo");
    victoryVideo.hidden = true;
    victoryVideo.style.animation = "none";

    // Play victory music
    playSound("victoryPiano");

    // Show stats and Try Again button after 0.8 seconds
    setTimeout( () => {
        if (CANCEL_VICTORY_ANIMATION) {
            CANCEL_VICTORY_ANIMATION = false;
            return;
        }

        victoryText.hidden = false;
        victoryText.style.animation = "reveal 0.8s ease-in-out forwards";
    }, 800);

    // Play video (GIF popup) after 0.8 seconds
    setTimeout(() => {
        if (CANCEL_VICTORY_ANIMATION) {
            CANCEL_VICTORY_ANIMATION = false;
            return;
        }

        victoryVideo.hidden = false;
        victoryVideo.style.animation = "popup 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards";
        victoryVideo.play();

        setTimeout( () => {
            if (CANCEL_VICTORY_ANIMATION) {
                CANCEL_VICTORY_ANIMATION = false;
                return;
            }

            playSound("victoryPathetic");
        }, 200);
    }, 800);

    // Hide video when it finishes playing
    const handleVideoEnded = () => {
        victoryVideo.style.animation = "popout 0.4s cubic-bezier(0.36, 0, 0.66, -0.56) forwards";
        setTimeout(() => {
            victoryVideo.hidden = true;
        }, 400);
    };

    victoryVideo.removeEventListener("ended", victoryVideo._endedListener);
    victoryVideo._endedListener = handleVideoEnded;
    victoryVideo.addEventListener("ended", handleVideoEnded);
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
    let historyListElement = document.getElementById("historyList");

    // update positions
    let historyList = historyListElement.children;
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
        INPUT_CONTAINER.style.animation = "reveal 0.5s";
    });
}

function revealHelpText() {
    let cover = document.getElementById("cover");
    let helpText = document.getElementById("helpText");
    cover.hidden = false;
    helpText.hidden = false;

    // Sped up reveal animation from 1s to 0.4s for snappier UI feel
    cover.style.animation = "reveal 0.4s forwards";
    helpText.style.animation = "reveal 0.4s forwards";
}

function hideHelpText() {
    let cover = document.getElementById("cover");
    let helpText = document.getElementById("helpText");

    // Sped up hide animation from 1s to 0.4s for snappier UI feel
    cover.style.animation = "hide 0.4s forwards";
    helpText.style.animation = "hide 0.4s forwards";
}

// timeouts to track fading transitions of gameplay alert messages
let alertTimeout;
let alertHideTimeout;

// function to display temporary in-game error/validation messages
function showAlert(message) {
    const alertEl = document.getElementById("alertMessage");
    if (!alertEl) return;

    alertEl.textContent = message;
    alertEl.hidden = false;
    void alertEl.offsetWidth; // Force reflow to trigger opacity transition
    alertEl.style.opacity = "1";

    clearTimeout(alertTimeout);
    clearTimeout(alertHideTimeout);

    alertTimeout = setTimeout(() => {
        alertEl.style.opacity = "0";
        alertHideTimeout = setTimeout(() => {
            alertEl.hidden = true;
        }, 200); // Wait for fade-out transition to finish
    }, 1500);
}

// highlight a previously submitted word in the history list if user enters a duplicate
function highlightDuplicateInHistory(word) {
    let historyListElement = document.getElementById("historyList");
    if (!historyListElement) return;

    for (let child of historyListElement.children) {
        // Match the element using the dataset word attribute
        if (child.dataset.word === word) {
            child.classList.add("duplicateHighlight");
            setTimeout(() => {
                child.classList.remove("duplicateHighlight");
            }, 600);
            break;
        }
    }
}

function constructWordDisplay(word) {
    let newBlock = document.createElement("div");
    newBlock.className = "wordDisplay text-lg gameplayText smoothMovement";
    // Set dataset.word attribute to locate and highlight this block later if a duplicate is entered
    newBlock.dataset.word = word;
    newBlock.innerHTML = word;
    newBlock.style.bottom = "1cap";

    return newBlock;
}

function constructWordHistory(word, lastWord) {
    let newDisplay = constructWordDisplay(word);

    // Re-enabled the letter change and anagram checking to style individual move characters properly
    const letterIdx = checkForLetterChange(lastWord, word);

    if (letterIdx >= 0) {
        // Highlighting the single changed letter between the last word and the new word
        let firstSegment = word.slice(0, letterIdx);
        let secondSegment = "<span class='letterMove'>" + word[letterIdx] + "</span>";
        let thirdSegment = word.slice(letterIdx + 1, word.length);

        newDisplay.innerHTML = firstSegment + secondSegment + thirdSegment;
    } else {
        // For anagrams, apply an animation class and wrap each letter in a span with staggered delay
        newDisplay.classList.add("anagramMove");
        newDisplay.innerHTML = word.split("").map((char, index) => {
            return `<span class="anagramLetter" style="animation-delay: ${index * 60}ms">${char}</span>`;
        }).join("");
    }

    return newDisplay;
}


/*
*  Control functions
*/

const SUBMIT_SOUNDS = ["submit-1", "submit-2", "submit-3", "submit-4"];
let remainingSounds = [...SUBMIT_SOUNDS];

function submitWord() {
    let word = WORD_INPUT.value.toUpperCase();

    // check to ensure exactly 5 letters are entered, showing a custom alert on failure
    if (word.length !== 5) {
        badSubmit();
        showAlert("MUST BE 5 LETTERS");
        return;
    }

    // word list check
    if (!assertValidWord(word)) {
        badSubmit();
        showAlert("NOT IN WORD LIST");
        return;
    }

    // duplicate check
    if (word === STARTING_WORD || HISTORY.includes(word)) {
        badSubmit();
        showAlert("ALREADY DONE THIS WORD");
        highlightDuplicateInHistory(word);
        return;
    }

    let lastWord = STARTING_WORD;
    if (HISTORY.length > 0)
        lastWord = HISTORY[HISTORY.length - 1];

    // Check for a valid move
    let letterIdx = checkForLetterChange(lastWord, word);
    // invalid moves (not 1 letter difference and not an anagram)
    if (letterIdx < 0 && !checkForAnagram(lastWord, word)) {
        badSubmit();
        showAlert("INVALID MOVE");
        return;
    }

    // Move was valid.

    // Add the move to the history
    HISTORY.push(word);
    sessionStorage.setItem("history", HISTORY.toString());

    // Did we win?
    if (word === TARGET_WORD) {
        // We did win! Force the pop-flip victory effect by treating it like an anagram visual,
        // manually building the victory word block and appending it to the history list before ending the game.
        let newDisplay = constructWordDisplay(word);
        newDisplay.classList.add("victoryMove");
        newDisplay.innerHTML = word.split("").map((char, index) => {
            return `<span class="victoryLetter" style="animation-delay: ${index * 60}ms">${char}</span>`;
        }).join("");
        newDisplay.classList.add("wordHistory");
        let historyListElement = document.getElementById("historyList");
        historyListElement.append(newDisplay);
        formatHistory();

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

        let historyListElement = document.getElementById("historyList");
        historyListElement.append(newDisplay);

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

    let historyListElement = document.getElementById("historyList");
    let historyList = historyListElement.children;
    historyListElement.removeChild(historyList[historyList.length - 1]);

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
    // Dynamically toggle mobile layout based on window width
    const isMobileSize = window.innerWidth <= 512;
    if (isMobileSize && !MOBILE_MODE) {
        setMobileMode(true);
    } else if (!isMobileSize && (MOBILE_MODE || MOBILE_MODE === null)) {
        setMobileMode(false);
    }

    // Start by figuring out the pixel dimensions of the word displays
    LG_FONT_SIZE_PX = Number.parseInt(getComputedStyle(document.querySelector(".text-lg")).getPropertyValue("font-size"));
    let PX_PER_CAP = LG_FONT_SIZE_PX * 0.638; // figure out conversion between cap units and px
    let wordDisplayHeight = PX_PER_CAP * 2.25;

    // logic to calculate virtual keyboard height in mobile view to prevent layout overlap
    let keyboardHeight = 0;
    let keyboardContainer = document.getElementById("keyboardContainer");
    let victoryContainer = document.getElementById("victoryContainer");
    let isVictory = victoryContainer && !victoryContainer.hidden;

    if (MOBILE_MODE && !isVictory && keyboardContainer) {
        keyboardHeight = keyboardContainer.offsetHeight || 190;
    }

    // Deduct keyboard height from total window height to compute active/visible viewport area
    let activeHeight = window.innerHeight - keyboardHeight;
    let availableDisplayHeight = activeHeight / 2;

    if (MOBILE_MODE) {
        availableDisplayHeight -= 24; // In mobile mode, credits are at the top, so we need to leave extra room
    }

    // Reposition the main center container relative to the newly calculated active height
    let gameCenterY = activeHeight / 2;
    let centerContainer = document.querySelector(".center");
    if (centerContainer) {
        centerContainer.style.top = gameCenterY + "px";
    }

    // Figure out how many words we can show in the history display (including input box)
    let maxDisplays = Math.floor(availableDisplayHeight / wordDisplayHeight);
    // safety floor of 1 display height to ensure layout doesn't break/vanish on short screens
    if (maxDisplays < 1) maxDisplays = 1;
    let historyDisplayHeight = maxDisplays * 2 + (maxDisplays - 1) * 0.25;

    // Set the display height variable to match
    let r = document.querySelector(":root");
    r.style.setProperty("--history-display-height", historyDisplayHeight + "cap");
}

addEventListener("resize", function (event) {
    correctScreenSize();
});

// scroll listener to temporarily show scrollbars by applying the 'scrolling' class while user scrolls
let scrollTimeout;
document.getElementById("historyList").addEventListener("scroll", function () {
    const historyList = this;
    historyList.classList.add("scrolling");
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function () {
        historyList.classList.remove("scrolling");
    }, 1000); // Hide the scrollbar after 1 second of scroll inactivity
});




//

function startGame(startWord, targetWord, history=[]) {
    resetGame(startWord, targetWord, history);
    // removal of victory-active class to clean up styling when a new game starts
    document.body.classList.remove("victory-active");

    // Storage for persistent levels
    sessionStorage.setItem("startWord", startWord);
    sessionStorage.setItem("targetWord", targetWord);
    sessionStorage.setItem("history", history.toString());

    WORD_INPUT.value = "";
    updateCaret();

    let victoryContainer = document.getElementById("victoryContainer");
    victoryContainer.hidden = true;
    // correctScreenSize invocation to re-calculate UI dimensions since keyboard or victory heights changed
    correctScreenSize();

    // clear history display
    let historyListElement = document.getElementById("historyList");
    historyListElement.replaceChildren();

    let startingWordContainer = constructWordDisplay(STARTING_WORD);
    startingWordContainer.id = "startingWord";
    startingWordContainer.classList.add("startingWord");
    historyListElement.append(startingWordContainer);

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

            historyListElement.append(newDisplay);
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
