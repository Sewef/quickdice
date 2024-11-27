import OBR from "@owlbear-rodeo/sdk";
import DiceBox from "@3d-dice/dice-box-deterministic";

// Wait for OBR to be ready
OBR.onReady(() => {
    // Function to get query parameters
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

    const params = getQueryParams();

    const id = params.id;
    const dimensions = JSON.parse(params.dimensions);
    const config = JSON.parse(params.config);
    const diceArray = JSON.parse(params.diceArray);
    const seed = JSON.parse(params.seed);
    const simSpeed = JSON.parse(params.simSpeed);

    // Modify config to set container and unique canvas id
    //config.assetPath = '/assets/dice-box'
    config.container = '#container';
    config.id = 'dice-canvas-' + id; // Ensure uniqueness
    let isRolling = true;

    // Create the dice box
    const diceBox = createDiceBox(dimensions, config);

    if (!diceBox) {
        console.error("Failed to create DiceBox");
        return;
    }

    diceBox.init().then(() => {
        diceBox.roll(diceArray, {}, seed, simSpeed);

        // Close after 8 seconds if still rolling
        setTimeout(() => {
            if (isRolling) {
                closePopover(id);
            }
        }, config.settleTimeout + 3000);

        // When roll is finished
        diceBox.onRollComplete = (result) => {
            isRolling = false;
            setTimeout(() => closePopover(id), 3000);
        };
    });

    // When user clicks on the popover
    document.getElementById('container').addEventListener('click', () => {
        closePopover(id);
    });

    function closePopover(popoverId) {
        OBR.popover.close(popoverId).catch((error) => {
            console.error("Error closing popover:", error);
        });
    }

    // Function to create the dice box
    function createDiceBox(dimensions, config) {

        const diceBox = new DiceBox(config);

        const container = document.querySelector(config.container);
        if (!container) {
            console.error("Container not found");
            return null;
        }

        const canvas = document.getElementById(config.id);
        console.log("canvas", canvas)
        canvas.style.pointerEvents = "none"; // Allow click-through
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = dimensions.width.toString() + 'px';
        canvas.style.height = dimensions.height.toString() + 'px';
        container.style.width = dimensions.width.toString() + 'px';
        container.style.height = dimensions.height.toString() + 'px';
        canvas.style.display = 'block';
        canvas.style.zIndex = '10';

        // Resize canvas to have same size as original
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
    

        return diceBox;
    }
});
