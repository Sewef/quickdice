// main.js
import './style.css';
import { setupDiceRoller } from './diceRoller.js';

document.querySelector('#app').innerHTML = `
  <div class="container">
    <div class="results">
      <div id="attackRolls" class="attack-rolls"></div>
      <div id="damageResults" class="damage-results"></div>
    </div>
    <div class="controls">
      <input type="text" id="attackCommand" placeholder="e.g., 5n+4 vs 16 dealing 2d6+3+1d4fi" />
      <button id="rollButton" title="Roll">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 1 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
        </svg>
      </button>
    </div>
    <div class="history">
      <h2>Roll History:</h2>
      <ul id="rollHistory"></ul>
    </div>
    <div>
      Example: 5n+4 vs 16 dealing 2d6+3+1d4fi. Here 5n+6 means 5 attack rolls with +6. Replace n by a or d for adv. or disadv. 
      The AC comes after vs. The damage comes after dealing. Damage types can be indicated with characters and strings, like 'fi'.
    </div>
  </div>
`;

// Initialize the Dice Roller
setupDiceRoller();
