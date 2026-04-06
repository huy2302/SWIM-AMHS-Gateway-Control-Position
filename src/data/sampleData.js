/**
 * Sample data for the Swim Monitor application.
 * Contains mock statistics, account data, log templates, and log entries for demonstration purposes.
 */

// Sample statistics for server, AMQP, and AMHS systems
export const SAMPLE_STATS = {
  server: {
    "Console Connection": "Connected (Supervisor)",
    "Server running on host": "Nova",
    "Server running since": "11/12/25 09:06:27",
    "Last account modification": "26/11/25 09:32:10",
    "Server Software Version": "1.2.0.0",
    "Run State": "Running: Standalone",
    "Memory Usage (MB)": "Allocated 112, Unused 50",
    "Disk Space (GB)": "Free 129.2 GB, Total 1.9 TB",
  },
  amqp: {
    "Total received from AMQP": "1,245",
    "Total sent to AMQP": "850",
    "Total in AMQP Incoming Queues": "0",
    "Total in AMQP Outgoing Queues": "0",
    "Total in AMQP Error Queues": "0",
    "Number of active connections": "1",
  },
  amhs: {
    "Total received from AMHS": "932",
    "Total sent to AMHS": "1,001",
    "Number of active connections": "2",
    "Total AMHS Errors": "0",
    "AMC Tables Version": "OPER282",
  },
};

// Sample account data for different connection types
export const ACCOUNT_DATA = [
  {
    id: 1,
    name: "AMQP Nova",
    type: "AMQP",
    mode: "",
    activation: "Disabled",
    bind: "",
    server: "Nova",
  },
  {
    id: 2,
    name: "DWD OPMET via AMQP",
    type: "AMQP",
    mode: "",
    activation: "Enabled",
    bind: "Bound Active",
    server: "test.swim.dwd.de",
  },
  {
    id: 3,
    name: "From AMHS",
    type: "X400Gateway",
    mode: "",
    activation: "Enabled",
    bind: "Bound Active",
    server: "localhost (x400mt)",
  },
  {
    id: 4,
    name: "To AMHS",
    type: "X400Gateway",
    mode: "",
    activation: "Enabled",
    bind: "Bound Active",
    server: "localhost (x400mt)",
  },
];

// Sample log message templates for different log levels
export const LOG_TEMPLATES = [
  {
    level: "INFO",
    message: "Receiving AFTN message from AMHS: FPL-HVN123-IS...",
  },
  {
    level: "INFO",
    message: "Mapping Field 15 (Route) to FIXM 4.2: [VVB - PANTO - ADOSI]",
  },
  {
    level: "SUCCESS",
    message: "Successfully pushed to Solace Topic: aviation/fpl/hvn123",
  },
  {
    level: "WARN",
    message: "Latency detected: AMQP response delayed by 450ms",
  },
  {
    level: "ERROR",
    message:
      "Mapping Failed: Invalid Coordinate Format in Field 15 at Tan Son Nhat (VVTS)",
  },
  { level: "INFO", message: "Heartbeat sent to STBY1: System Healthy" },
  {
    level: "INFO",
    message:
      "SID/STAR 2025 Configuration Updated: New coordinates for Runway 25L",
  },
  { level: "WARN", message: "High CPU Usage: Java Heap Space at 85%" },
  { level: "SUCCESS", message: "AMHS Connection Re-established on Port 102" },
];

// Sample log data entries
export const LOG_DATA = [
  {
    id: 1,
    timestamp: "11/12/25 09:06:28",
    level: "INFO",
    thread: "SWIMGateway",
    message:
      "The license is valid C:\\Users\\Leo\\AppData\\Roaming\\Galadrium\\SWIMGateway\\license.lic",
  },
  {
    id: 2,
    timestamp: "11/12/25 09:06:28",
    level: "INFO",
    thread: "AMHS QMGR",
    message: "Starting the AMHS QMGR thread",
  },
  {
    id: 3,
    timestamp: "11/12/25 09:06:30",
    level: "WARNING",
    thread: "AMQPAccount-DWD OPMET",
    message:
      "Connection refused: getsockopt: test.swim.dwd.de/141.38.3.211:5671",
  },
  {
    id: 4,
    timestamp: "11/12/25 09:14:35",
    level: "FINE",
    thread: "Threading",
    message: "No server restart will be needed",
  },
];
