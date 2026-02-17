const input = document.getElementById("command_input");
const output = document.getElementById("output");
const cursor = document.querySelector(".cursor");
const wrapper = document.querySelector(".input_wrapper");
const ghost = document.querySelector(".ghost_text");

// Real Caret following Cursor
function updateCursorPosition() {
  const textBeforeCaret = input.value.substring(0, input.selectionStart);

  const tempSpan = document.createElement("span");
  tempSpan.style.visibility = "hidden";
  tempSpan.style.position = "absolute";
  tempSpan.style.whiteSpace = "pre";
  tempSpan.style.font = window.getComputedStyle(input).font;

  tempSpan.textContent = textBeforeCaret || " ";

  document.body.appendChild(tempSpan);

  const textWidth = tempSpan.getBoundingClientRect().width;

  // Optional Upgrade: Dynamic Cursor Width (match one character width)
  tempSpan.textContent = "M";
  const charWidth = tempSpan.getBoundingClientRect().width;

  document.body.removeChild(tempSpan);

  cursor.style.left = textWidth + "px";
  cursor.style.width = charWidth + "px";

  ghost.style.left = cursor.style.left;
}

// Live Typing Validation
function updateTypingState() {
  const value = input.value.toLowerCase().trim();

  wrapper.classList.remove("typing-valid", "typing-invalid");

  if (value === "") return;

  const commandList = Object.keys(commands);

  const hasMatch = commandList.some((cmd) => cmd.startsWith(value));

  if (hasMatch) {
    wrapper.classList.add("typing-valid");
  } else {
    wrapper.classList.add("typing-invalid");
  }
}

// Command History
let commandHistory = [];
let historyIndex = -1;
let tempInput = "";

// Tab Auto-Complete
let tabPressCount = 0;

input.addEventListener("keydown", function (e) {
  if (e.key === "Tab") {
    e.preventDefault();

    const value = input.value.toLowerCase().trim();
    const commandList = Object.keys(commands);

    if (value === "") return;

    const matches = commandList.filter((cmd) => cmd.startsWith(value));

    if (matches.length === 1) {
      // Single Match > Auto Complete
      input.value += ghost.textContent;
      ghost.textContent = "";
      updateTypingState();
      updateCursorPosition();
      tabPressCount = 0;
    } else if (matches.length > 1) {
      tabPressCount++;

      if (tabPressCount === 2) {
        printOutput("");
        matches.forEach((match) => {
          printOutput(match);
        });
        printOutput("");
        scrollToBottom();
        tabPressCount = 0;
      }
    }
  }
});

// Ghost Text for Auto-Complete
function updateGhostText() {
  const value = input.value.toLowerCase();
  const commandList = Object.keys(commands);

  if (value === "") {
    ghost.textContent = "";
    return;
  }

  const match = commandList.find((cmd) => cmd.startsWith(value));

  if (match && match !== value) {
    const remaining = match.slice(value.length);
    ghost.textContent = remaining;
  } else {
    ghost.textContent = "";
  }
}

// Event Listeners
input.addEventListener("keydown", function (e) {
  // Enter
  if (e.key === "Enter") {
    e.preventDefault();

    const command = input.value.trim();
    const lowerCommand = command.toLowerCase();

    if (command !== "") {
      // Normalize (so HELP and help are treated the same)
      const normalizedCommand = command.toLowerCase();

      const alreadyExists = commandHistory.some(
        (cmd) => cmd.toLowerCase() === normalizedCommand,
      );

      if (!alreadyExists) {
        commandHistory.push(command);
      }

      historyIndex = commandHistory.length;
    }

    const isValid = commands.hasOwnProperty(lowerCommand);

    printCommand(command, isValid);
    runCommand(command);

    input.value = "";
    ghost.textContent = "";
    updateTypingState(); // Reset Color
    updateCursorPosition();
  }

  // Arrow Up
  if (e.key === "ArrowUp") {
    e.preventDefault();

    if (historyIndex === commandHistory.length) {
      tempInput = input.value; // save current typed text
    }

    if (historyIndex > 0) {
      historyIndex--;
      input.value = commandHistory[historyIndex];
    }

    input.setSelectionRange(input.value.length, input.value.length);

    updateTypingState();
    updateGhostText();
    updateCursorPosition();
  }

  // Arrow Down
  if (e.key === "ArrowDown") {
    e.preventDefault();

    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      input.value = commandHistory[historyIndex];
    } else {
      historyIndex = commandHistory.length;
      input.value = tempInput; // restore original typed text
    }

    input.setSelectionRange(input.value.length, input.value.length);

    updateTypingState();
    updateGhostText();
    updateCursorPosition();
  }
});

// Input / Click / Caret Movement
input.addEventListener("input", () => {
  tabPressCount = 0;
  updateTypingState();
  updateCursorPosition();
  updateGhostText();
});

input.addEventListener("click", updateCursorPosition);
input.addEventListener("keyup", updateCursorPosition);

// Auto Focus anywhere Click
document.getElementById("terminal_window").addEventListener("click", () => {
  input.focus();
});

// Initialize Cursor Position
updateCursorPosition();

// Print Functions
function printCommand(cmd, isValid) {
  const line = document.createElement("div");
  line.classList.add("command-line");

  const promptSpan = document.createElement("span");
  promptSpan.classList.add("prompt-text");
  promptSpan.textContent = "aaditya@portfolio:~$ ";

  const commandSpan = document.createElement("span");
  commandSpan.textContent = cmd;

  if (isValid) {
    commandSpan.classList.add("typing-valid");
  } else {
    commandSpan.classList.add("typing-invalid");
  }

  line.appendChild(promptSpan);
  line.appendChild(commandSpan);

  output.appendChild(line);
  scrollToBottom();
}

function printOutput(text, className = "output-line") {
  const line = document.createElement("div");
  line.classList.add(className);

  // Handle Blank Line
  if (!text) {
    line.innerHTML = "&nbsp;";
  } else {
    line.textContent = text;
  }

  output.appendChild(line);
  scrollToBottom();
}

function scrollToBottom() {
  const terminal = document.getElementById("terminal");
  terminal.scrollTop = terminal.scrollHeight;
}

// Levenshtein Distance Algorithm
function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Closest Match
function getClosestCommand(input) {
  const commandList = Object.keys(commands);

  let closest = null;
  let minDistance = Infinity;

  commandList.forEach((cmd) => {
    const distance = levenshteinDistance(input, cmd);
    if (distance < minDistance) {
      minDistance = distance;
      closest = cmd;
    }
  });

  // Only suggest if it's reasonably close
  return minDistance <= 2 ? closest : null;
}

// Command Execution
function runCommand(cmd) {
  const command = cmd.toLowerCase();

  if (commands.hasOwnProperty(command)) {
    commands[command]();
  } else {
    printOutput(`command not found: ${cmd}`, "error-line");

    const suggestion = getClosestCommand(command);

    if (suggestion) {
      printOutput(`Did you mean '${suggestion}'?`, "error-line");
    }

    printOutput(`type 'help' to see available commands`, "error-line");
  }
}

// Commands
const commands = {
  help: () => printHelp(),

  about: () => {
    printOutput("Hi, I'm Aaditya Dahiya");
    printOutput("CSE Undergrad | Developer | Designer");
    printOutput("Passionate about AI, UI/UX and building impactful products.");
  },

  resume: () => {
    printOutput("Resume Options:");
    printOutput("view resume");
    printOutput("download resume");
  },

  "view resume": () => {
    window.open("resume.pdf", "_blank");
  },

  "download resume": () => {
    const link = document.createElement("a");
    link.href = "resume.pdf";
    link.download = "Resume.pdf";
    link.click();
  },

  skills: () => {
    printOutput("Technical Skills:");
    printOutput("Languages: C++, Python, JavaScript");
    printOutput("Frameworks: React, Node.js");
    printOutput("AI/ML: TensorFlow, Scikit-learn");
  },

  projects: () => {
    printOutput("Projects:");
    printOutput("1. Penny AI - Smart Finance Tracker");
    printOutput("2. ShellFolio");
    printOutput("3. AR Navigation Concept App");
  },

  contributions: () => {
    printOutput("Opening GitHub Profile...");
    commands.github();
  },

  contact: () => {
    printOutput("Contact Information:");
    printOutput("Email: iamaadityadahiya@gmail.com");
    printOutput("Phone: +91-9310535433");
  },

  linktree: () => {
    window.open("https://linktr.ee/aadityadahiya", "_blank");
  },

  github: () => {
    window.open("https://github.com/ItsAadityaDahiya", "_blank");
  },

  linkedin: () => {
    window.open("https://www.linkedin.com/in/iamaadityadahiya", "_blank");
  },

  clear: () => {
    output.innerHTML = "";
  },

  hidden: () => {
    printOutput("Hidden commands:");
    printOutput("");
    printOutput("history");
    printOutput("history -c");
    printOutput("myself");
    printOutput("ascii");
  },

  history: () => {
    if (commandHistory.length === 0) {
      printOutput("No commands in history.");
      return;
    }

    commandHistory.forEach((cmd, index) => {
      printOutput(`${index + 1}  ${cmd}`);
    });
  },

  "history -c": () => {
    if (commandHistory.length === 0) {
      printOutput("History is already empty.");
      return;
    }

    commandHistory = [];
    historyIndex = -1;

    printOutput("Command history cleared.");
  },

  myself: () => {
    printOutput("Aaditya Dahiya");
  },

  ascii: () => {
    printOutput(
      `
     █████╗  █████╗  ██████╗  ██╗████████╗██╗   ██╗ █████╗ 
    ██╔══██╗██╔══██╗ ██╔══██╗ ██║╚══██╔══╝╚██╗ ██╔╝██╔══██╗
    ███████║███████║ ██║  ██║ ██║   ██║    ╚████╔╝ ███████║
    ██╔══██║██╔══██║ ██║  ██║ ██║   ██║     ╚██╔╝  ██╔══██║
    ██║  ██║██║  ██║ ██████╔╝ ██║   ██║      ██║   ██║  ██║
    ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ╚═╝   ╚═╝      ╚═╝   ╚═╝  ╚═╝
       ██████╗   █████╗  ██╗  ██╗ ██╗ ██╗   ██╗  █████╗ 
       ██╔══██╗ ██╔══██╗ ██║  ██║ ██║ ╚██╗ ██╔╝ ██╔══██╗
       ██║  ██║ ███████║ ███████║ ██║  ╚████╔╝  ███████║
       ██║  ██║ ██╔══██║ ██╔══██║ ██║   ╚██╔╝   ██╔══██║
       ██████╔╝ ██║  ██║ ██║  ██║ ██║    ██║    ██║  ██║
       ╚═════╝  ╚═╝  ╚═╝ ╚═╝  ╚═╝ ╚═╝    ╚═╝    ╚═╝  ╚═╝
    `,
      2,
    );
  },
};

// Help Text
const helpCommands = [
  ["help", "Show available commands"],
  ["about", "Display information about Aaditya"],
  ["resume", "Resume options"],
  ["skills", "List of skills"],
  ["projects", "Show projects preview"],
  ["contributions", "Open GitHub profile"],
  ["contact", "Show contact details"],
  ["linktree", "Open Linktree"],
  ["github", "Open GitHub"],
  ["linkedin", "Open LinkedIn"],
  ["clear", "Clear terminal"],
  ["hidden", "Show hidden commands"],
];

function printHelp() {
  printOutput("Available commands:\n");
  printOutput("");

  const longestCommand = Math.max(...helpCommands.map((cmd) => cmd[0].length));

  helpCommands.forEach(([command, description]) => {
    const paddedCommand = command.padEnd(longestCommand + 4, " ");
    printOutput(`  ${paddedCommand}${description}`);
  });
}

// Boot Message
printOutput("Microsoft Windows [Version 10.0.22621.1]", "system-line");
printOutput("(c) Microsoft Corporation. All rights reserved.\n", "system-line");
printOutput("Type 'help' to view available commands.\n", "system-line");
