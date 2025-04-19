const vscode = require('vscode');
const TimeTrackingService = require('./src/services/TimeTrackingService');
const { COMMANDS } = require('./src/constants/config');

// Create output channel for logging
const outputChannel = vscode.window.createOutputChannel('CB Code Tracker');

/**
 * Handles errors in a consistent way across the extension
 * @param {string} message Error context message
 * @param {Error} error The error object
 * @param {boolean} [showToUser=true] Whether to show error to user
 */
function handleError(message, error, showToUser = true) {
    // Log to output channel
    outputChannel.appendLine(`[ERROR] ${message}: ${error.stack || error.message}`);
    outputChannel.show();
    
    // Only show non-telemetry errors to user if showToUser is true
    if (showToUser && !error.message?.includes('telemetry')) {
        vscode.window.showErrorMessage(`${message}: ${error.message}`);
    }
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    try {
        outputChannel.appendLine('Activating CB Code Tracker extension...');
        const timeTrackingService = new TimeTrackingService(context, outputChannel);
        
        // Register commands
        const statsCommand = vscode.commands.registerCommand(
            COMMANDS.SHOW_STATS,
            () => {
                try {
                    timeTrackingService.showStats();
                } catch (error) {
                    handleError('Error showing stats', error);
                }
            }
        );

        const timeCommand = vscode.commands.registerCommand(
            COMMANDS.SHOW_TIME,
            () => {
                try {
                    timeTrackingService.showTime();
                } catch (error) {
                    handleError('Error showing time', error);
                }
            }
        );

        // Set up activity monitoring with error handling
        const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(
            () => {
                try {
                    timeTrackingService.handleActivity();
                } catch (error) {
                    handleError('Error handling activity', error, false);
                }
            }
        );

        // Start the time tracking service
        const timeInterval = timeTrackingService.start();

        // Add all disposables to subscriptions
        context.subscriptions.push(
            outputChannel,
            statsCommand,
            timeCommand,
            onDidChangeTextDocument,
            { dispose: () => {
                try {
                    clearInterval(timeInterval);
                    timeTrackingService.dispose();
                } catch (error) {
                    handleError('Error disposing extension', error);
                }
            }}
        );

        outputChannel.appendLine('Extension activated successfully!');
    } catch (error) {
        handleError('Error activating extension', error);
    }
}

function deactivate() {
    outputChannel.appendLine('Extension deactivating...');
}

module.exports = {
    activate,
    deactivate
};
