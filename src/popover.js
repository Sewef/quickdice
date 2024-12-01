import DiceBox from "@3d-dice/dice-box-deterministic";
import OBR from "@owlbear-rodeo/sdk";

function getQueryParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split("&");

    for (const pair of pairs) {
        const [key, value] = pair.split("=");
        if (key) {
            params[decodeURIComponent(key)] = decodeURIComponent(value || "");
        }
    }

    return params;
}

class QueueProcessor {
    constructor(processFunction, cancelFunction, 
                preProcessFunction = null, 
                postProcessFunction = null, 
                enqueueFunction = null,
                delay = 0) {
        this.queue = [];
        this.processing = false;
        this.processFunction = processFunction;
        this.cancelFunction = cancelFunction;
        this.preProcessFunction = preProcessFunction;
        this.postProcessFunction = postProcessFunction;
        this.enqueueFunction = enqueueFunction;
        this.delay = delay;
        this.currentItem = null;
    }

    enqueue(data) {
        if (!data || typeof data.id === 'undefined') {
            throw new Error("Data item must have an 'id' property.");
        }
        this.queue.push(data);
        if (this.enqueueFunction) {
            this.enqueueFunction(data);
        }
        this.startProcessing();
    }

    startProcessing() {
        if (!this.processing) {
            this.processing = true;
            this.processNext();
        }
    }

    async processNext() {
        if (this.queue.length === 0) {
            this.processing = false;
            this.currentItem = null;
            return;
        }
        const data = this.queue[0];
        this.currentItem = data;
        if (this.preProcessFunction) {
            this.preProcessFunction(data);
        }
        try {
            await this.processFunction(data);
        } catch (error) {
            console.error(`Error processing data with id ${data.id}:`, error);
        }

        this.currentItem = null;
        setTimeout(async () => {
            if (this.postProcessFunction) {
                await this.postProcessFunction(data);
            }
            this.queue.shift();
            this.processNext();
        }, this.delay);
    }

    remove(id) {
        if (this.currentItem && this.currentItem.id === id) {
            if (this.cancelFunction) {
                this.cancelFunction(this.currentItem);
                this.processing = false;
                if (this.postProcessFunction) {
                    this.postProcessFunction(this.currentItem);
                }
                this.startProcessing();
            }
            return true;
        }

        const index = this.queue.findIndex(item => item.id === id);
        if (index !== -1) {
            this.queue.splice(index, 1);
            return true;
        }

        return false;
    }

    cancel() {
        if (this.currentItem) {
            if (this.cancelFunction) {
                this.cancelFunction(this.currentItem);
                if (this.postProcessFunction) {
                    this.postProcessFunction(this.currentItem);
                }
                this.processing = false;
                this.startProcessing();
            }
            return true;
        }
    }

    peek() {
        return this.queue[0];
    }

    isEmpty() {
        return this.queue.length === 0;
    }

    size() {
        return this.queue.length;
    }

    clear() {
        this.queue = [];
    }
}

const defaultConfig = {
    assetPath: '/assets/dice-box/',
    container: '#popover-container',
    id: 'popover-dice-canvas',
    gravity: 1.6,
    mass: 1,
    friction: 0.5,
    restitution: 0.3,
    angularDamping: 0.2,
    linearDamping: 0.3,
    spinForce: 5,
    throwForce: 4,
    startingHeight: 10,
    settleTimeout: 4000,
    scale: 7,
    lightIntensity: 1,
    enableShadows: true,
    shadowTransparency: 0.8,
    theme: 'smooth',
    themeColor: '#eeeeee',
    preloadThemes: ['gemstone', 'dice-of-rolling', 'smooth', 'rock', 'rust', 'blue-green-metal'],
    autoResize: false
};
  
const rollQueueProcessor = new QueueProcessor(rollDice, clearDice, showPopover, hidePopover, printQueue, 2000);
let diceBox;
let canvasWidth = 100;
let canvasHeight = 100;
let displayWidth = 100;
let displayHeight = 100;

async function resizeCanvas() {

    diceBox.setDimensions(canvasWidth, canvasHeight);

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate the scaling factor to maintain aspect ratio
    const widthRatio = viewportWidth / canvasWidth;
    const heightRatio = viewportHeight / canvasHeight;
    const scale = Math.min(1, 0.9 * widthRatio, 0.9 * heightRatio); // Ensure we don't scale up beyond original size

    // Compute the display dimensions
    displayWidth = Math.floor(canvasWidth * scale);
    displayHeight = Math.floor(canvasHeight * scale);

    await OBR.popover.setWidth("quickdice-popover", displayWidth);
    await OBR.popover.setHeight("quickdice-popover", displayHeight);

    const canvas = document.getElementById('popover-dice-canvas');
    const container = document.getElementById('popover-container');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '10';
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    container.style.width = displayWidth + 'px';
    container.style.height = displayHeight + 'px';
}

async function createDiceBox() {
    const diceCanvas = document.getElementById('popover-dice-canvas');
    if (diceCanvas) {
        diceCanvas.remove();
    }

    diceBox = new DiceBox({... defaultConfig, ... { canvasWidth: canvasWidth, canvasHeight: canvasHeight }});

    await diceBox.init();
    await resizeCanvas();

    return diceBox;
}

async function rollDice(data) {
    const { id, playerName, width, height, diceArray, config, seed, simSpeed } = data;
    canvasWidth = width
    canvasHeight = height;
    resizeCanvas();
    return diceBox.roll(diceArray, { ...defaultConfig, ...config }, seed, simSpeed);
} 

function clearDice() {
    diceBox.clear();
}

function printQueue() {
    const queueDisplay = document.getElementById('queue-display');
    if (!queueDisplay) {
        console.error('Element with ID "queue-display" not found.');
        return;
    }

    const { queue } = rollQueueProcessor;
    let [first, ...rest] = queue;


    queueDisplay.innerHTML = '';

    const fragment = document.createDocumentFragment();

    const createQueueItem = (item, isCurrent = false) => {
        const span = document.createElement('span');
        span.classList.add('queue-item');
        if (isCurrent) {
            span.classList.add('current-item');
        }
        span.textContent = item.playerName;
        return span;
    };

    if (first && first.playerName) {
        const currentSpan = createQueueItem(first, true);
        fragment.appendChild(currentSpan);
    }

    rest.forEach(item => {
        if (item.playerName) {
            const itemSpan = createQueueItem(item);
            fragment.appendChild(itemSpan);
        }
    });

    queueDisplay.appendChild(fragment);
}

function showPopover() {
    printQueue();
    document.body.style.display = 'block';
    document.body.style.pointerEvents = 'auto';
}

async function hidePopover() {
    document.body.style.display = 'none';
    document.body.style.pointerEvents = 'none';
    await OBR.popover.setWidth("quickdice-popover", 1);
    await OBR.popover.setHeight("quickdice-popover", 1);
}

OBR.onReady(async () => {

    const params = getQueryParams();

    canvasWidth = params.width;
    canvasHeight = params.height;

    diceBox = await createDiceBox();
    
    hidePopover();

    document.getElementById('popover-container').onclick = () => {
        rollQueueProcessor.cancel();
    };
    OBR.broadcast.onMessage("quickdice.popoverRoll", async (event) => {
        rollQueueProcessor.enqueue(event.data);
    });
    OBR.broadcast.onMessage("quickdice.popoverRemove", async (event) => {
        rollQueueProcessor.remove(event.data.id);
    });
    OBR.broadcast.onMessage("quickdice.popoverResize", async (event) => {
        canvasWidth = event.data.width;
        canvasHeight = event.data.height;
        resizeCanvas();
    });

});
