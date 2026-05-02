const input = document.getElementById("command_input");
const output = document.getElementById("output");
const cursor = document.querySelector(".cursor");
const wrapper = document.querySelector(".input_wrapper");
const ghost = document.querySelector(".ghost_text");

// Hidden Span
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

// Cursor & Ghost Text
function delayedOutput(text, className = "output-line", delay = 100) {
  setTimeout(() => printOutput(text, className), delay);
}

function updateCursorPosition() {
  const textBeforeCaret = input.value.substring(0, input.selectionStart);

  measureSpan.style.font = window.getComputedStyle(input).font;
  measureSpan.textContent = textBeforeCaret || "";

  const textWidth = measureSpan.getBoundingClientRect().width;

  measureSpan.textContent = "M";
  const charWidth = measureSpan.getBoundingClientRect().width;

  cursor.style.left = textWidth + "px";
  cursor.style.width = charWidth + "px";

  ghost.style.left = cursor.style.left;
}

// Typing Validation
function updateTypingState() {
  const value = input.value.toLowerCase().trim();

  wrapper.classList.remove("typing-valid", "typing-invalid");
  if (value === "") return;

  const commandList = Object.keys(commands);

  const hasMatch =
    commandList.some((cmd) => cmd.startsWith(value)) ||
    commandList.some(
      (cmd) => !cmd.includes(" ") && value.startsWith(cmd + " "),
    );

  wrapper.classList.add(hasMatch ? "typing-valid" : "typing-invalid");
}

// Command History
let commandHistory = [];
let historyIndex = -1;
let tempInput = "";

// Tab Counter
let tabPressCount = 0;

// Ghost Text
function updateGhostText() {
  const value = input.value.toLowerCase();

  if (value === "") {
    ghost.textContent = "";
    return;
  }

  const commandList = Object.keys(commands);
  const match = commandList.find(
    (cmd) => cmd.startsWith(value) && cmd !== value,
  );

  ghost.textContent = match ? match.slice(value.length) : "";
}

// Event Listeners
input.addEventListener("keydown", function (e) {
  const value = input.value.toLowerCase().trim();

  if (e.key === "Tab") {
    e.preventDefault();
    if (!value) return;

    const matches = Object.keys(commands).filter((cmd) =>
      cmd.startsWith(value),
    );

    if (matches.length === 1) {
      input.value = matches[0];
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
  } else if (e.key === "Enter") {
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

    printCommand(command, isValidCommand(lowerCommand));
    runCommand(command);

    input.value = "";
    tempInput = "";
    ghost.textContent = "";
    updateTypingState();
    updateCursorPosition();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (commandHistory.length === 0) return;
    if (historyIndex === commandHistory.length) tempInput = input.value;

    let found = false;
    while (historyIndex > 0) {
      historyIndex--;
      const candidate = commandHistory[historyIndex];
      const base = candidate.split(" ")[0].toLowerCase();
      if (commands.hasOwnProperty(base)) {
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
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    if (commandHistory.length === 0) return;

    while (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      const candidate = commandHistory[historyIndex];
      const base = candidate.toLowerCase().split(" ")[0];
      if (commands.hasOwnProperty(base)) {
        input.value = candidate;
        input.setSelectionRange(input.value.length, input.value.length);
        updateTypingState();
        updateGhostText();
        updateCursorPosition();
        return;
      }
    }

    historyIndex = commandHistory.length;
    input.value = tempInput;
    input.setSelectionRange(input.value.length, input.value.length);
    updateTypingState();
    updateGhostText();
    updateCursorPosition();
  }

  if (e.key !== "Tab") tabPressCount = 0;
});

input.addEventListener("input", () => {
  tabPressCount = 0;
  updateTypingState();
  updateCursorPosition();
  updateGhostText();
});

input.addEventListener("click", updateCursorPosition);
input.addEventListener("keyup", updateCursorPosition);

document.getElementById("terminal_window").addEventListener("click", () => {
  input.focus();
});

// Re-focus input when returning to the tab
window.addEventListener("focus", () => {
  input.focus();
});

// Print Helpers
function printCommand(cmd, isValid) {
  const line = document.createElement("div");
  line.classList.add("command-line");

  const promptSpan = document.createElement("span");
  promptSpan.classList.add("prompt-text");
  promptSpan.textContent = PROMPT;

  const commandSpan = document.createElement("span");
  commandSpan.textContent = cmd;
  commandSpan.classList.add(isValid ? "typing-valid" : "typing-invalid");

  line.appendChild(promptSpan);
  line.appendChild(commandSpan);
  output.appendChild(line);
  scrollToBottom();
}

function printOutput(text, className = "output-line") {
  const line = document.createElement("div");
  line.classList.add(className);
  line.innerHTML = text ? "" : "&nbsp;";
  if (text) line.textContent = text;
  output.appendChild(line);
  scrollToBottom();
}

function printClickable(displayText, commandToRun, className = "option-line") {
  const line = document.createElement("div");
  line.classList.add(className, "clickable-option");

  const arrow = document.createElement("span");
  arrow.textContent = "  \u2192 ";
  arrow.style.opacity = "0.5";

  const label = document.createElement("span");
  label.textContent = displayText;

  line.appendChild(arrow);
  line.appendChild(label);

  line.addEventListener("click", (e) => {
    e.stopPropagation();
    printCommand(commandToRun, isValidCommand(commandToRun.toLowerCase()));
    runCommand(commandToRun);
    if (
      !commandHistory.some(
        (c) => c.toLowerCase() === commandToRun.toLowerCase(),
      )
    ) {
      commandHistory.push(commandToRun);
    }
    historyIndex = commandHistory.length;
    input.value = "";
    ghost.textContent = "";
    updateTypingState();
    updateCursorPosition();
    input.focus();
  });
  output.appendChild(line);
  scrollToBottom();
}

function printLink(displayText, url, className = "option-line") {
  const line = document.createElement("div");
  line.classList.add(className, "clickable-option");

  const arrow = document.createElement("span");
  arrow.textContent = "  \u2192 ";
  arrow.style.opacity = "0.5";

  const label = document.createElement("span");
  label.textContent = displayText;

  line.appendChild(arrow);
  line.appendChild(label);

  line.addEventListener("click", (e) => {
    e.stopPropagation();
    window.open(url, "_blank");
    input.focus();
  });
  output.appendChild(line);
  scrollToBottom();
}

function scrollToBottom() {
  const terminal = document.getElementById("terminal");
  terminal.scrollTop = terminal.scrollHeight;
}

// Command Validation
function isValidCommand(lowerCmd) {
  if (commands.hasOwnProperty(lowerCmd)) return true;
  const base = lowerCmd.split(" ")[0];
  return commands.hasOwnProperty(base);
}

// Levenshtein Distance Algorithm
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1,
            );
    }
  }
  return matrix[b.length][a.length];
}

function getClosestCommand(inp) {
  const commandList = Object.keys(commands).filter((c) => !c.includes(" "));
  let closest = null,
    minDist = Infinity;
  commandList.forEach((cmd) => {
    const d = levenshteinDistance(inp, cmd);
    if (d < minDist) {
      minDist = d;
      closest = cmd;
    }
  });
  return minDist <= 2 ? closest : null;
}

// Command Runner
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

  printOutput("Command not found: " + cmd, "error-line");
  const suggestion = getClosestCommand(command);
  if (suggestion) {
    printOutput("Did you mean '" + suggestion + "'?", "error-line");
    printOutput("Type 'help' to see available commands", "error-line");
  }
}

const projectData = {
  finova: {
    name: "Finova - Multilingual Personal Finance Assistant",
    desc: "An AI - powered smart finance tracker with budgeting, expense analysis, and insights.",
    tech: "Dart, Flutter, Supabase, Gemini API",
    github: "https://github.com/ItsAadityaDahiya/Finova",
    live: null,
  },
  shellfolio: {
    name: "ShellFolio",
    desc: "A terminal - style portfolio with fuzzy search, autocomplete, and themes.",
    tech: "Vanilla JS, HTML, CSS",
    github: "https://github.com/ItsAadityaDahiya/ShellFolio",
    live: "https://itsaadityadahiya.github.io/ShellFolio",
  },
  tempora: {
    name: "Tempora",
    desc: "A productivity and time-management app for scheduling and habit tracking.",
    tech: "React, Node.js, Python",
    github: "https://github.com/ItsAadityaDahiya/Tempora",
    live: null,
  },
};

// Commands
const commands = {
  help: () => printHelp(),

  theme: () => {
    printOutput("Theme options:");
    printClickable("light  - switch to light mode", "theme light");
    printClickable("dark   - switch to dark mode", "theme dark");
  },

  "theme light": () => {
    document.body.classList.add("light-mode");
    printOutput("Switched to Light Mode");
  },

  "theme dark": () => {
    document.body.classList.remove("light-mode");
    printOutput("Switched to Dark Mode");
  },

  about: () => {
    printOutput("Hi, I'm Aaditya Dahiya");
    printOutput("CSE Undergrad | Full Stack Developer | Graphic Designer");
    printOutput(
      "A developer-designer crafting intelligent and visually compelling solutions.",
    );
  },

  resume: () => {
    printOutput("Resume:");
    printClickable("view resume", "view resume");
    printClickable("download resume", "download resume");
  },

  "view resume": () => {
    printOutput("Opening resume");
    window.open(
      "https://drive.google.com/file/d/1eooCIVj3EZ_a356dBheD7GHYj9nsShSq/preview",
      "_blank",
    );
  },

  "download resume": () => {
    printOutput("Downloading resume");
    window.open(
      "https://drive.google.com/uc?export=download&id=1eooCIVj3EZ_a356dBheD7GHYj9nsShSq",
      "_blank",
    );
  },

  skills: () => {
    printOutput("Technical Skills:");
    printOutput("");
    printOutput("  Languages:   C, C++, Python, Java, Dart, JS");
    printOutput("  Frameworks:  React, Node.js, Flutter");
    printOutput("  Design:      Figma, Blender, Canva, AutoCAD");
    printOutput("  Tools:       Git, SQL");
  },

  projects: () => {
    printOutput("Projects:");
    printOutput("");
    printClickable(
      "finova     - Multilingual Personal Finance Assistant",
      "project finova",
    );
    printClickable(
      "shellfolio - This terminal portfolio",
      "project shellfolio",
    );
    printClickable(
      "tempora    - Productivity & habit tracker",
      "project tempora",
    );
    printOutput("");
    printOutput("  Run 'project <name>' for complete details.", "system-line");
  },

  project: (cmd) => {
    const name = cmd.split(" ").slice(1).join(" ").trim().toLowerCase();

    if (!name) {
      printOutput("Usage: project <name>", "error-line");
      printOutput("Available: finova, shellfolio, tempora", "error-line");
      return;
    }

    const proj = projectData[name];
    if (!proj) {
      printOutput("Project '" + name + "' not found.", "error-line");
      printOutput("Available: finova, shellfolio, tempora", "error-line");
      return;
    }

    printOutput("  " + proj.name);
    printOutput("  " + proj.desc);
    printOutput("  Tech: " + proj.tech);
    printOutput("");
    if (name === "shellfolio") {
      printOutput("  You're already inside it. Look around!", "system-line");
      printOutput("");
      printLink("Open on GitHub", proj.github);
      if (proj.live) printLink("Open Live Demo", proj.live);
    } else {
      printLink("Open on GitHub", proj.github);
      if (proj.live) printLink("Open Live Demo", proj.live);
    }
  },

  contact: () => {
    printOutput("Contact:");
    printOutput("");

    printOutput("  Aaditya Dahiya");

    const emailParts = ["iamaadityadahiya", "@", "gmail.com"];
    const email = emailParts.join("");
    const emailLine = document.createElement("div");
    emailLine.classList.add("output-line", "clickable-option");
    emailLine.textContent = "  Email: " + email;
    emailLine.addEventListener("click", (ev) => {
      ev.stopPropagation();
      navigator.clipboard.writeText(email).then(() => {
        emailLine.textContent = "  Email copied to clipboard!";
        setTimeout(() => {
          emailLine.textContent = "  Email: " + email;
        }, 1800);
      });
      input.focus();
    });
    output.appendChild(emailLine);
    scrollToBottom();

    const phoneParts = ["+91", "9310535433"];
    const phone = phoneParts.join("-");
    const phoneLine = document.createElement("div");
    phoneLine.classList.add("output-line", "clickable-option");
    phoneLine.textContent = "  Phone: " + phone;
    phoneLine.addEventListener("click", (ev) => {
      ev.stopPropagation();
      navigator.clipboard.writeText(phoneParts[1]).then(() => {
        phoneLine.textContent = "  Phone copied to clipboard!";
        setTimeout(() => {
          phoneLine.textContent = "  Phone: " + phone;
        }, 1800);
      });
      input.focus();
    });
    output.appendChild(phoneLine);
    scrollToBottom();

    printOutput("");
    printOutput("  Click to copy to clipboard.", "system-line");
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
    commandHistory.forEach((cmd, i) =>
      printOutput(String(i + 1).padStart(3) + "  " + cmd),
    );
  },

  "history -c": () => {
    if (commandHistory.length === 0) {
      printOutput("History is already empty.", "error-line");
      return;
    }
    commandHistory = [];
    historyIndex = -1;
    printOutput("Command history cleared.", "system-line");
  },

  clear: () => {
    output.innerHTML = "";
  },

  whoami: () => {
    printOutput("Aaditya Dahiya");
  },

  sudo: () => {
    printOutput("Permission Denied: you are not root.", "error-line");
    printOutput("Nice try though.", "system-line");
  },

  ascii: () => {
    printOutput(`
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
    `);
  },

  hidden: () => {
    printOutput("Hidden commands:");
    printOutput("");
    printOutput("  whoami");
    printOutput("  sudo");
    printOutput("  ascii");
  },
};

// Help Text
const helpCommands = [
  ["help", "Show available commands"],
  ["theme", "Switch colour theme"],
  ["about", "Personal information"],
  ["resume", "View or download resume"],
  ["skills", "Technical skills"],
  ["projects", "Browse projects"],
  ["project <name>", "Detailed project info"],
  ["contact", "Contact details"],
  ["github", "Open GitHub profile"],
  ["linkedin", "Open LinkedIn"],
  ["linktree", "Open Linktree"],
  ["history", "Show command history"],
  ["history -c", "Clear command history"],
  ["clear", "Clear the terminal"],
  ["hidden", "List hidden commands"],
];

function printHelp() {
  printOutput("Available commands:");
  printOutput("");

  const longest = Math.max(...helpCommands.map((c) => c[0].length));
  helpCommands.forEach(([cmd, desc]) => {
    printOutput("  " + cmd.padEnd(longest + 4) + desc);
  });

  printOutput("");
  printOutput(
    "  Tab to autocomplete  |  \u2191\u2193 for history",
    "system-line",
  );
  printOutput("  Some commands are hidden. Stay curious.", "system-line");
}

// Boot Message
printOutput("ShellFolio [Version 1.0.0]", "system-line");
printOutput("(c) Aaditya Dahiya. All rights reserved.", "system-line");
printOutput("Type 'help' to view available commands.", "system-line");

updateCursorPosition();
input.focus();
