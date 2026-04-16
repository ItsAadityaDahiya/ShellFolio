const input = document.getElementById("command_input");
const output = document.getElementById("output");
const cursor = document.querySelector(".cursor");
const wrapper = document.querySelector(".input_wrapper");
const ghost = document.querySelector(".ghost_text");

// Hidden Span for measuring text width
const measureSpan = document.createElement("span");
measureSpan.style.visibility = "hidden";
measureSpan.style.position = "absolute";
measureSpan.style.whiteSpace = "pre";
measureSpan.style.top = "-9999px";
measureSpan.style.left = "-9999px";
document.body.appendChild(measureSpan);

const DEFAULT_USERNAME = "aaditya";
const PROMPT = `${DEFAULT_USERNAME}@shellfolio:~$ `;
document.getElementById("prompt_display").textContent = PROMPT;

function delayedOutput(text, className = "output-line", delay = 100) {
  setTimeout(() => {
    printOutput(text, className);
  }, delay);
}

// Real Caret following Cursor
function updateCursorPosition() {
  const textBeforeCaret = input.value.substring(0, input.selectionStart);

  measureSpan.style.font = window.getComputedStyle(input).font;
  measureSpan.textContent = textBeforeCaret || "";

  const textWidth = measureSpan.getBoundingClientRect().width;

  // Dynamic Cursor Width (match one character width)
  measureSpan.textContent = "M";
  const charWidth = measureSpan.getBoundingClientRect().width;

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

  const base = value.split(" ")[0];

  let hasMatch = commandList.some((cmd) => cmd.startsWith(base));

  if (!hasMatch && currentContext && contextOptions[currentContext]) {
    hasMatch = contextOptions[currentContext].some((opt) =>
      opt.startsWith(base),
    );
  }

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
let currentContext = null;

// Tab Counter
let tabPressCount = 0;

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
  const value = input.value.toLowerCase().trim();

  // Tab Auto-Complete
  if (e.key === "Tab") {
    e.preventDefault();

    if (!value) return;

    const matches = Object.keys(commands).filter((cmd) =>
      cmd.startsWith(value),
    );

    if (matches.length === 1) {
      input.value += ghost.textContent;
      ghost.textContent = "";
      updateTypingState();
      updateCursorPosition();
      tabPressCount = 0;
    } else if (matches.length > 1) {
      tabPressCount++;
      if (tabPressCount === 2) {
        printOutput("");
        matches.forEach((cmd) => printOutput(cmd, "output-line"));
        printOutput("");
        scrollToBottom();
        tabPressCount = 0;
      }
    }
  }

  // Enter Key -> Execute Command
  else if (e.key === "Enter") {
    e.preventDefault();

    const command = input.value.trim();
    const lowerCommand = command.toLowerCase();

    if (
      command &&
      !commandHistory.some((c) => c.toLowerCase() === lowerCommand)
    ) {
      commandHistory.push(command);
    }

    historyIndex = commandHistory.length;

    const base = lowerCommand.split(" ")[0];

    let isValid = commands.hasOwnProperty(base);

    if (!isValid && currentContext && contextOptions[currentContext]) {
      isValid = contextOptions[currentContext].includes(lowerCommand);
    }

    printCommand(command, isValid);
    runCommand(command);

    input.value = "";
    tempInput = "";
    ghost.textContent = "";
    updateTypingState();
    updateCursorPosition();
  }

  // Arrow Up -> Command History Navigation
  else if (e.key === "ArrowUp") {
    e.preventDefault();

    if (commandHistory.length === 0) return;

    if (historyIndex === commandHistory.length) {
      tempInput = input.value;
    }

    let found = false;

    while (historyIndex > 0) {
      historyIndex--;
      const candidate = commandHistory[historyIndex];
      const baseCommand = candidate.split(" ")[0].toLowerCase();

      if (commands.hasOwnProperty(baseCommand)) {
        input.value = candidate;
        found = true;
        break;
      }
    }

    if (!found) {
      historyIndex = commandHistory.length;
      input.value = tempInput;
    }

    input.setSelectionRange(input.value.length, input.value.length);
    updateTypingState();
    updateGhostText();
    updateCursorPosition();
  }

  // Arrow Down -> Command History Navigation
  else if (e.key === "ArrowDown") {
    e.preventDefault();

    if (commandHistory.length === 0) return;

    while (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      const candidate = commandHistory[historyIndex];
      const baseCommand = candidate.toLowerCase().split(" ")[0];

      if (commands.hasOwnProperty(baseCommand)) {
        input.value = candidate;
        input.setSelectionRange(input.value.length, input.value.length);
        updateTypingState();
        updateGhostText();
        updateCursorPosition();
        return;
      }
    }

    // If No Valid Command found ahead
    historyIndex = commandHistory.length;
    input.value = tempInput;

    input.setSelectionRange(input.value.length, input.value.length);
    updateTypingState();
    updateGhostText();
    updateCursorPosition();
  }

  // Reset Tab Counter on other keys
  if (e.key !== "Tab") {
    tabPressCount = 0;
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

// Auto Focus anywhere click
document.getElementById("terminal_window").addEventListener("click", () => {
  input.focus();
});

// Initialize Cursor Position
updateCursorPosition();
input.focus();

// Print Functions
function printCommand(cmd, isValid) {
  const line = document.createElement("div");
  line.classList.add("command-line");

  const promptSpan = document.createElement("span");
  promptSpan.classList.add("prompt-text");
  promptSpan.textContent = PROMPT;

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

  return minDistance <= 2 ? closest : null;
}

// Command Execution
function runCommand(cmd) {
  const command = cmd.toLowerCase().trim();

  if (commands[command]) {
    commands[command](command);
    return;
  }

  const base = command.split(" ")[0];

  if (commands[base]) {
    commands[base](command);
    return;
  }

  if (currentContext && commands[currentContext]) {
    commands[currentContext](currentContext + " " + command);
    return;
  }

  printOutput(`Command not found: ${cmd}`, "error-line");

  const suggestion = getClosestCommand(command);
  if (suggestion) {
    printOutput(`Did you mean '${suggestion}'?`, "error-line");
  }

  printOutput(`Type 'help' to see available commands`, "error-line");
}

// Commands
const commands = {
  help: () => printHelp(),

  theme: (cmd) => {
    const args = cmd.split(" ").slice(1).join(" ").trim();

    if (!args) {
      currentContext = "theme";

      printOutput("Theme:");
      printOutput("light");
      printOutput("dark");
      printOutput("Type 'exit' to leave this mode");
      return;
    }

    currentContext = null;

    if (args.includes("light")) {
      document.body.classList.add("light-mode");
      printOutput("Switched to Light Mode");
    } else if (args.includes("dark")) {
      document.body.classList.remove("light-mode");
      printOutput("Switched to Dark Mode");
    } else {
      printOutput("Invalid theme option");
    }
  },

  about: () => {
    printOutput("Hi, I'm Aaditya Dahiya");
    printOutput("CSE Undergrad | Full Stack Developer | Graphic Designer");
    printOutput(
      "A developer-designer crafting intelligent and visually compelling solutions.",
    );
  },

  resume: () => {
    printOutput("Resume options:");
    printOutput("view resume");
    printOutput("download resume");
  },

  "view resume": () => {
    window.open(
      "https://drive.google.com/file/d/1eooCIVj3EZ_a356dBheD7GHYj9nsShSq/preview",
      "_blank",
    );
  },

  "download resume": () => {
    window.open(
      "https://drive.google.com/uc?export=download&id=1eooCIVj3EZ_a356dBheD7GHYj9nsShSq",
      "_blank",
    );
  },

  skills: () => {
    printOutput("Technical Skills:");
    printOutput("Languages: C, C++, Python, Java, Dart, Flutter, JS");
    printOutput("Frameworks: React, Node.js");
    printOutput("Design: Figma, Blender, Canva, AutoCAD");
    printOutput("Others: Git, SQL");
  },

  projects: () => {
    printOutput("Projects:");
    printOutput("1. Finova - Personal Finance Assistant");
    printOutput("2. ShellFolio");
    printOutput("3. Tempora");
    printOutput("Type 'open' to open project");
  },

  open: (cmd) => {
    const args = cmd.split(" ").slice(1).join(" ").trim();

    if (!args) {
      currentContext = "open";

      printOutput("Available projects:");
      printOutput("finova");
      printOutput("tempora");
      printOutput("shellfolio");
      printOutput("Type 'exit' to leave this mode");
      return;
    }

    currentContext = null;

    if (args.includes("finova")) {
      printOutput("Opening Finova...");
      window.open("https://your-finova-link.com", "_blank");
    } else if (args.includes("tempora")) {
      printOutput("Opening Tempora...");
      window.open("https://your-tempora-link.com", "_blank");
    } else if (args.includes("shellfolio")) {
      printOutput("You're already inside ShellFolio");
    } else {
      printOutput("Project not found");
    }
  },

  contributions: () => {
    commands.github();
  },

  contact: () => {
    printOutput("Contact Information:");
    printOutput("Email: iamaadityadahiya@gmail.com");
    printOutput("Phone: +91-9310535433");
  },

  linktree: () => {
    delayedOutput("Opening Linktree...", "output-line", 120);
    window.open("https://linktr.ee/aadityadahiya", "_blank");
  },

  github: () => {
    delayedOutput("Opening GitHub Profile...", "output-line", 120);
    window.open("https://github.com/ItsAadityaDahiya", "_blank");
  },

  linkedin: () => {
    delayedOutput("Opening LinkedIn Profile...", "output-line", 120);
    window.open("https://www.linkedin.com/in/iamaadityadahiya", "_blank");
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
      printOutput("History is already empty.", "error-line");
      return;
    }

    commandHistory = [];
    historyIndex = -1;

    printOutput("Command history cleared.");
  },

  clear: () => {
    output.innerHTML = "";
  },

  exit: () => {
    if (!currentContext) {
      printOutput("No active mode to exit", "error-line");
      return;
    }

    printOutput(`Exited '${currentContext}' mode`);
    currentContext = null;
  },

  hidden: () => {
    printOutput("Hidden commands:");
    printOutput("");
    printOutput("sudo");
    printOutput("whoami");
    printOutput("ascii");
  },

  whoami: () => {
    printOutput("Aaditya Dahiya");
  },

  sudo: () => {
    printOutput("Permission Denied: You are not ROOT", "error-line");
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
    );
  },
};

const contextOptions = {
  theme: ["light", "dark"],
  open: ["finova", "tempora", "shellfolio"],
};

// Help Text
const helpCommands = [
  ["help", "Show available commands"],
  ["theme", "Switch theme"],
  ["about", "Display personal information"],
  ["resume", "Resume options"],
  ["skills", "List of skills"],
  ["projects", "Show projects preview"],
  ["contributions", "Open GitHub profile"],
  ["contact", "Show contact details"],
  ["linktree", "Open Linktree"],
  ["github", "Open GitHub"],
  ["linkedin", "Open LinkedIn"],
  ["clear", "Clear terminal"],
  ["history", "Show command history"],
  ["history -c", "Clear command history"],
  ["hidden", "Show hidden commands"],
];

function printHelp() {
  printOutput("Available commands:");
  printOutput("");

  const longestCommand = Math.max(...helpCommands.map((cmd) => cmd[0].length));

  helpCommands.forEach(([command, description]) => {
    const paddedCommand = command.padEnd(longestCommand + 4, " ");
    printOutput(`  ${paddedCommand}${description}`);
  });
}

// Boot Message
printOutput("ShellFolio [Version 1.0.0]", "system-line");
printOutput("(c) Aaditya Dahiya. All rights reserved.", "system-line");
printOutput("Type 'help' to view available commands.", "system-line");
