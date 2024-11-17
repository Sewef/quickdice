// main.js
import './style.css';
import { setupDiceRoller } from './diceRoller.js';
import OBR from "@owlbear-rodeo/sdk";

document.addEventListener("DOMContentLoaded", (event) => {
  document.querySelector('#app').innerHTML = `
    <div class="container" id="container">
      <div class="controls">
        <input type="text" id="attackCommand" class="code-font" placeholder="e.g. 5<n/a/d>+4 vs 16 dmg 2d6fi+3bl+1d4" />
        <button id="rollButton" title="Roll">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 1 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
          </svg>
        </button>
        <div class="options">
          <!-- Replace the info checkbox with a dropdown menu -->
          <select id="viewSelector">
            <option value="history" selected>Log</option>
            <option value="info">Info</option>
            <option value="commands">Commands</option>
          </select>
          <label for="viewSelector"></label>
          <label>
            <input type="checkbox" id="hiddenRoll" />
            Hidden
          </label>
          <label>
            <input type="checkbox" id="physicalRoll" />
            Physical
          </label>
          <label>
            <input type="range" id="physicalSlider" min="0" max="100" value="50" />
          </label>
        </div>
      </div>
      <div class="history" id="history"></div>
      <div class="history" id="infobox" style="display: none;">
    <p>
        <h2>Ability Checks/Attack Rolls</h2>
        <ul>
            <li>Use <span class="code-font">1n</span>, <span class="code-font">1a</span>, or <span class="code-font">1d</span> for a d20 roll that is normal, with advantage, or with disadvantage, respectively.</li>
            <li>Use <span class="code-font">3n</span> for 3 rolls.</li>
            <li>Use <span class="code-font">3n+2+1d4</span> or <span class="code-font">3n + 2 + 1d4</span> for 3 rolls, each with a bonus of +2 and +1d4.</li>
            <li>Spaces are always ignored.</li>
        </ul>
    </p>
    <p>
        <h2>Difficulty/Armor Class</h2>
        <ul>
            <li>The keyword <span class="code-font">vs</span> specifies that a difficulty class follows.
                <ul>
                    <li>For example, <span class="code-font">2n+1 vs 13</span> will roll 2 ability checks with +1 against a difficulty class of 13.</li>
                </ul>
            </li>
            <li>Successful rolls are highlighted in green, and critical successes in gold.</li>
            <li>You can also use the keyword <span class="code-font">atk</span> to explicitly signify the ability check/attack roll.
                <ul>
                    <li>The commands <span class="code-font">13 atk 2n+1</span>, <span class="code-font">atk 2n+1 vs 13</span>, and <span class="code-font">vs 13 atk 2n+1</span> are all equivalent.</li>
                </ul>
            </li>
        </ul>
    </p>
    <p>
        <h2>Damage Rolls</h2>
        <ul>
            <li>Use <span class="code-font">1d6</span>, <span class="code-font">3d8</span>, <span class="code-font">2d12</span>, <span class="code-font">4d7</span> etc. for damage rolls.</li>
            <li>You can also add them together like <span class="code-font">1d6 + 3d8 + 2d12 + 3</span>.</li>
            <li>Again, spaces are always ignored.</li>
            <li>Use the keyword <span class="code-font">dmg</span> to combine damage rolls with attack rolls:
                <ul>
                    <li>For example, <span class="code-font">2n+1 vs 13 dmg 1d8+2</span> or <span class="code-font">1d8+2 atk 2n+1 vs 13</span>.</li>
                </ul>
            </li>
            <li> Only those attacks which hit will have damage rolled, and those with crits will have double the number of damage dice.</li>
            <li>The first keyword can usually be left out, and the first component is interpreted according to the priorities:
                <span class="code-font">atk &gt; vs &gt; dmg &gt; hp &gt; res &gt; vul &gt; imm</span>.
            </li>
            <li>The resulting damage is first summed up for each attack roll, and then totaled.</li>
            <li>The damage numbers are colored according to their magnitude.</li>
        </ul>
    </p>
    <p>
        <h2>Damage Types</h2>
        <ul>
            <li>A damage type can be any string, but the intended usage is that the first two letters of the standard D&D damage types indicate it.
                <ul>
                    <li>For example, <span class="code-font">fi</span> for fire, <span class="code-font">co</span> for cold, and so on.</li>
                </ul>
            </li>
            <li>When specifying a damage roll, you can add them behind each damage instance:
                <ul class="my-ul">
                    <li>For example, <span class="code-font">1d6fi + 3d8co + 2d12 + 3ac</span>.</li>
                </ul>
            </li>
            <li>The resulting damage will be grouped by these damage types.</li>
            <li>You can also add "meaningless" damage types to the ability check/attack roll to choose one of a set of colors for the physical dice.
                <ul>
                    <li>This looks like <span class="code-font">2nfi</span> for 2 rolls with "fire dice".</li>
                </ul>
            </li>
            <li>Note that if there is a bonus die, you should still write <span class="code-font">2nfi+1d4+1d8+2</span>; then all attack roll dice will be fire-themed.</li>
        </ul>
    </p>
    <p>
        <h2>Hitpoints</h2>
        <ul>
            <li>With <span class="code-font">2d12+1d4 hp 87</span>, you can roll damage against 87 hitpoints, and the reduced hitpoints will be displayed.</li>
            <li>You can of course combine this into previous rolls:
                <ul>
                    <li>For example, <span class="code-font">58 atk 3d+1d4 vs 17 dmg 3d8fi+1d12co</span> will perform 3 attacks with disadvantage and +1d4 against 17 AC, roll for damage, and subtract it all from 58 hitpoints.</li>
                </ul>
            </li>
            <li>Again, the <span class="code-font">hp</span> keyword could be left out because the parser can still interpret the command.</li>
        </ul>
    </p>
    <p>
        <h2>Resistances, Vulnerabilities, and Immunities</h2>
        <p>Consider the command <span class="code-font">3d+1d4 vs 17 dmg 3d8fi+1d12co+3bl+1d6ne hp 107 res fi vul co+bl imm ne</span>.
            Here, the new hitpoints will be computed respecting fire resistance, cold and bludgeoning vulnerability, and acid immunity.
        </p>
    </p>
    <p>
        <h2>Roll Log and Keyboard Shortcuts</h2>
        <ul>
            <li>The roll log is shared with other players if the "hidden" checkbox is not selected.</li>
            <li>You can click on entries to load their command into the command input.</li>
            <li>When the extension is in focus:
                <ul>
                    <li><strong>CTRL+S</strong> to select the command input.</li>
                    <li><strong>CTRL+I</strong> to toggle the info box.</li>
                    <li><strong>CTRL+H</strong> to toggle whether the roll results will be shared with other players.</li>
                    <li><strong>CTRL+P</strong> to toggle the usage of physical dice rolls.</li>
                </ul>
            </li>
        </ul>
    </p>
    <p>
        <h2>Saving and loading commands</h2>
        <ul>
            <li>Use <span class="code-font">save myname</span and <span class="code-font">load myname</span> to save and
            load commands. ></li>
            <li>Your saved commands can be seen in dropdown menu under "commands".</li>
        </ul>
    </p>
      </div>
      <div class="history" id="commands" style="display: none;">
        <!-- Commands Content -->
        <b>Saved Commands:</b> <br>
        <ul id="commandsList">
        </ul>
      </div>
    </div>
  `;

  const viewSelector = document.getElementById('viewSelector');
  const historyDiv = document.getElementById('history');
  const infoDiv = document.getElementById('infobox');
  const commandsDiv = document.getElementById('commands');

  viewSelector.addEventListener('change', (event) => {
    const selectedView = event.target.value;
    switch (selectedView) {
      case 'info':
        infoDiv.style.display = 'block';
        historyDiv.style.display = 'none';
        commandsDiv.style.display = 'none';
        break;
      case 'commands':
        commandsDiv.style.display = 'block';
        infoDiv.style.display = 'none';
        historyDiv.style.display = 'none';
        break;
      default:
        historyDiv.style.display = 'block';
        infoDiv.style.display = 'none';
        commandsDiv.style.display = 'none';
    }
  });

  // Initialize the display based on the initial selection
  const initializeView = () => {
    const selectedView = viewSelector.value;
    switch (selectedView) {
      case 'info':
        infoDiv.style.display = 'block';
        historyDiv.style.display = 'none';
        commandsDiv.style.display = 'none';
        break;
      case 'commands':
        commandsDiv.style.display = 'block';
        infoDiv.style.display = 'none';
        historyDiv.style.display = 'none';
        break;
      default:
        historyDiv.style.display = 'block';
        infoDiv.style.display = 'none';
        commandsDiv.style.display = 'none';
    }
  };

  initializeView();

  OBR.onReady(() => OBR.player.getId().then((userId) => {
    setupDiceRoller(userId);
  }));
});
