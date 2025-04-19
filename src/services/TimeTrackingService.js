const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const {
  IDLE_TIMEOUT_SECONDS,
  STATUS_BAR_PRIORITY,
} = require("../constants/config");

class TimeTrackingService {
  constructor(context, outputChannel) {
    this.context = context;
    this.outputChannel = outputChannel;
    this.dataFilePath = path.join(
      context.extensionPath,
      "data",
      "coding-stats.json"
    );
    this.todayKey = new Date().toDateString();
    this.timeData = this.loadTimeData();

    this.codingStartTime = new Date();
    this.sessionTime = 0;
    this.totalCodingTime = this.timeData[this.todayKey]?.totalCodingTime || 0;
    this.isActive = false;
    this.lastActivityTime = new Date();

    this.statusBarItem = this.createStatusBarItem();
    this.initializeDataDirectory();
  }

  initializeDataDirectory() {
    try {
      const dataDir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
    } catch (error) {
      this.handleError("Failed to initialize data directory", error);
    }
  }

  createStatusBarItem() {
    const statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      STATUS_BAR_PRIORITY
    );
    statusBarItem.command = "cb-code-tracker.showTime";
    statusBarItem.tooltip = "Click to show coding time";
    return statusBarItem;
  }

  loadTimeData() {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const data = Buffer.from(fs.readFileSync(this.dataFilePath)).toString(
          "utf8"
        );
        const parsed = JSON.parse(data);
        return parsed;
      }
    } catch (error) {
      this.handleError("Error loading time data", error);
    }
    return {};
  }

  saveTimeData() {
    try {
      const currentTotal = this.totalCodingTime + this.sessionTime;
      this.timeData[this.todayKey] = {
        totalCodingTime: currentTotal,
        lastSaved: new Date().toISOString(),
      };
      const dataBuffer = Buffer.from(
        JSON.stringify(this.timeData, null, 2),
        "utf8"
      );
      fs.writeFileSync(this.dataFilePath, dataBuffer);
      this.outputChannel.appendLine(
        `Time data saved successfully. Today's total: ${this.formatTime(
          currentTotal
        )}`
      );
    } catch (error) {
      this.handleError("Error saving time data", error);
    }
  }

  handleError(message, error) {
    this.outputChannel.appendLine(
      `[ERROR] ${message}: ${error.stack || error.message}`
    );
    if (message.includes("loading") || message.includes("saving")) {
      vscode.window.showErrorMessage(`${message}: ${error.message}`);
    }
  }

  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  updateTime() {
    if (this.isActive) {
      const now = new Date();
      const timeDiff = Math.floor(
        (now.getTime() - this.lastActivityTime.getTime()) / 1000
      );
      if (timeDiff < IDLE_TIMEOUT_SECONDS) {
        this.sessionTime = Math.floor(
          (now.getTime() - this.codingStartTime.getTime()) / 1000
        );
        const totalTime = this.totalCodingTime + this.sessionTime;
        this.statusBarItem.text = `$(clock) ${this.formatTime(totalTime)}`;
        if (timeDiff % 60 === 0) {
          this.saveTimeData();
        }
      } else {
        this.isActive = false;
        this.totalCodingTime += this.sessionTime;
        this.sessionTime = 0;
        this.saveTimeData();
      }
    } else {
      this.statusBarItem.text = `$(clock) ${this.formatTime(
        this.totalCodingTime
      )}`;
    }
  }

  handleActivity() {
    const now = new Date();
    if (!this.isActive) {
      this.isActive = true;
      this.codingStartTime = now;
      this.sessionTime = 0;
      if (!this.timeData[this.todayKey]) {
        this.timeData[this.todayKey] = {
          totalCodingTime: 0,
          lastSaved: now.toISOString(),
        };
      }
    }
    this.lastActivityTime = now;
  }

  showStats() {
    const stats = Object.entries(this.timeData)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([date, data]) => {
        const formattedTime = this.formatTime(data.totalCodingTime);
        const lastSaved = data.lastSaved
          ? new Date(data.lastSaved).toLocaleTimeString()
          : "N/A";
        return `${date}: ${formattedTime} (Last saved: ${lastSaved})`;
      })
      .join("\n");

    vscode.window.showInformationMessage(`Coding Stats:\n${stats}`, {
      modal: true,
    });
  }

  showTime() {
    const message = `Today's coding time: ${this.formatTime(
      this.totalCodingTime
    )}`;
    vscode.window.showInformationMessage(message);
  }

  dispose() {
    this.saveTimeData();
    this.statusBarItem.dispose();
  }

  start() {
    this.updateTime();
    this.statusBarItem.show();
    return setInterval(() => this.updateTime(), 1000);
  }
}

module.exports = TimeTrackingService;
