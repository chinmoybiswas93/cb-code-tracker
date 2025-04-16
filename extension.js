const vscode = require("vscode");
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Congratulations, your extension "cb-code-tracker" is now active!');

  // Setup data file path
  const dataFilePath = path.join(context.extensionPath, 'data', 'coding-stats.json');
  
  // Ensure data directory exists
  const dataDir = path.dirname(dataFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Load saved time data
  const TODAY_KEY = new Date().toDateString();
  let timeData = loadTimeData(dataFilePath);
  
  let codingStartTime = new Date();
  let totalCodingTime = timeData[TODAY_KEY]?.totalCodingTime || 0;
  let isActive = false;
  let lastActivityTime = new Date();
  
  // Function to load time data from file
  function loadTimeData(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading time data:', error);
    }
    return {};
  }

  // Function to save time data to file
  function saveTimeData() {
    try {
      timeData[TODAY_KEY] = {
        totalCodingTime: totalCodingTime,
        lastSaved: new Date().toISOString()
      };
      fs.writeFileSync(dataFilePath, JSON.stringify(timeData, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving time data:', error);
    }
  }
  
  // Create status bar item
  const timeStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  timeStatusBarItem.command = "cb-code-tracker.showTime";
  timeStatusBarItem.tooltip = "Click to show coding time";

  // Function to format time in HH:MM:SS
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Function to update coding time
  function updateTime() {
    if (isActive) {
      const now = new Date();
      const timeDiff = Math.floor((now.getTime() - lastActivityTime.getTime()) / 1000);
      if (timeDiff < 10) {
        const currentSessionTime = Math.floor((now.getTime() - codingStartTime.getTime()) / 1000);
        totalCodingTime = currentSessionTime + (timeData[TODAY_KEY]?.totalCodingTime || 0);
        timeStatusBarItem.text = `$(clock) ${formatTime(totalCodingTime)}`;
        // Save time data every minute
        if (timeDiff % 60 === 0) {
          saveTimeData();
        }
      } else {
        // More than 10 seconds idle, pause the timer and save
        isActive = false;
        saveTimeData();
        codingStartTime = now;
      }
    } else {
      // Show saved time when inactive
      timeStatusBarItem.text = `$(clock) ${formatTime(totalCodingTime)}`;
    }
  }

  // Function to handle activity
  function handleActivity() {
    const now = new Date();
    if (!isActive) {
      isActive = true;
      codingStartTime = now;
      // Store the current total as the base for the new session
      if (!timeData[TODAY_KEY]) {
        timeData[TODAY_KEY] = {
          totalCodingTime: 0,
          lastSaved: now.toISOString()
        };
      }
    }
    lastActivityTime = now;
  }

  // Set up activity monitoring
  const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(() => {
    handleActivity();
  });

  // Initial update and start intervals
  updateTime();
  const timeInterval = setInterval(updateTime, 1000);
  timeStatusBarItem.show();

  // Register commands
  const statsDisposable = vscode.commands.registerCommand(
    "cb-code-tracker.sts",
    function () {
      // Show stats for all days in a more readable format
      const stats = Object.entries(timeData)
        .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()) // Sort by date, most recent first
        .map(([date, data]) => {
          const formattedTime = formatTime(data.totalCodingTime);
          const lastSaved = data.lastSaved ? new Date(data.lastSaved).toLocaleTimeString() : 'N/A';
          return `${date}: ${formattedTime} (Last saved: ${lastSaved})`;
        })
        .join('\n');
      
      vscode.window.showInformationMessage(`Coding Stats:\n${stats}`, { modal: true });
    }
  );

  const timeDisposable = vscode.commands.registerCommand(
    "cb-code-tracker.showTime",
    function () {
      const message = `Today's coding time: ${formatTime(totalCodingTime)}`;
      vscode.window.showInformationMessage(message);
    }
  );

  // Add all disposables to subscriptions
  context.subscriptions.push(
    statsDisposable,
    timeDisposable,
    timeStatusBarItem,
    onDidChangeTextDocument,
    { dispose: () => {
      clearInterval(timeInterval);
      saveTimeData(); // Save time data when extension is deactivated
    }}
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
