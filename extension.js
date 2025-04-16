const vscode = require("vscode");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Congratulations, your extension "cb-code-tracker" is now active!');

  // Create status bar item
  const timeStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100  // Higher priority to position it more to the left
  );
  timeStatusBarItem.command = "cb-code-tracker.showTime";
  timeStatusBarItem.tooltip = "Click to show current time";

  // Function to update time
  function updateTime() {
    const currentTime = new Date().toLocaleTimeString();
    timeStatusBarItem.text = `$(clock) ${currentTime}`;
  }

  // Initial update and start interval
  updateTime();
  const timeInterval = setInterval(updateTime, 1000);
  timeStatusBarItem.show();

  // Register commands
  const statsDisposable = vscode.commands.registerCommand(
    "cb-code-tracker.sts",
    function () {
      vscode.window.showInformationMessage("Stat: CB Personal Coding Expert!");
    }
  );

  const timeDisposable = vscode.commands.registerCommand(
    "cb-code-tracker.showTime",
    function () {
      const currentTime = new Date().toLocaleTimeString();
      vscode.window.showInformationMessage(`Current Time: ${currentTime}`);
    }
  );

  // Add all disposables to subscriptions
  context.subscriptions.push(
    statsDisposable,
    timeDisposable,
    timeStatusBarItem,
    { dispose: () => clearInterval(timeInterval) }
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
