export interface Scenario {
    id: string;
    title: string;
    description: string;
    tags: string[];
    imageUrl: string;
    content: {
      processes: string[];
      resources: string[];
      allocationMatrix: { row: number[] }[];
      maxMatrix: { row: number[] }[];
      initialAvailableResources: number[];
      objective: string;
    }
  }
  
  export const scenariosSeedData: Scenario[] = [
    {
      "id": "printer-queue-jam",
      "title": "The Printer Queue Jam",
      "description": "Two departments are trying to print large documents, but the printers are gridlocked. Can you sort it out?",
      "tags": ["Resource Allocation", "Beginner"],
      "imageUrl": "https://images.unsplash.com/photo-1588829608152-e7accc3c7eef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxvZmZpY2UlMjBwcmludGVyfGVufDB8fHx8MTc1OTY3MzE5MXww&ixlib=rb-4.1.0&q=80&w=1080",
      "content": {
        "processes": ["Dept A", "Dept B"],
        "resources": ["Printer 1", "Scanner 1"],
        "allocationMatrix": [{ "row": [1,0] }, { "row": [0,1] }],
        "maxMatrix": [{ "row": [1,1] }, { "row": [1,1] }],
        "initialAvailableResources": [0,0],
        "objective": "A deadlock has occurred. Identify the circular wait and determine a recovery strategy."
      }
    },
    {
      "id": "database-locks-dilemma",
      "title": "Database Deadlock Dilemma",
      "description": "Multiple transactions are stuck, waiting on each other to release table locks. Find the deadlock and resolve it.",
      "tags": ["Cycle Detection", "Intermediate"],
      "imageUrl": "https://images.unsplash.com/photo-1691435828932-911a7801adfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxzZXJ2ZXIlMjByb29tfGVufDB8fHx8MTc1OTU5MzU2OHww&ixlib=rb-4.1.0&q=80&w=1080",
      "content": {
        "processes": ["T1", "T2", "T3"],
        "resources": ["Table A", "Table B", "Table C"],
        "allocationMatrix": [{ "row": [1,0,0] }, { "row": [0,1,0] }, { "row": [0,0,1] }],
        "maxMatrix": [{ "row": [1,1,0] }, { "row": [0,1,1] }, { "row": [1,0,1] }],
        "initialAvailableResources": [0,0,0],
        "objective": "Analyze the resource graph to find the cycle and determine which process to terminate to break the deadlock."
      }
    },
    {
      "id": "bankers-algorithm-challenge",
      "title": "The Banker of Wall Street",
      "description": "You're a banker managing loans. Use Banker's algorithm to ensure the bank never enters an unsafe state by granting or denying requests.",
      "tags": ["Banker's Algorithm", "Advanced"],
      "imageUrl": "https://images.unsplash.com/photo-1648275913341-7973ae7bc9b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxzdG9jayUyMG1hcmtldHxlbnwwfHx8fDE3NTk1NzU5NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "content": {
        "processes": ["Client 1", "Client 2", "Client 3", "Client 4"],
        "resources": ["Loan A", "Loan B", "Loan C"],
        "allocationMatrix": [{ "row": [0,1,0] }, { "row": [2,0,0] }, { "row": [3,0,2] }, { "row": [2,1,1] }],
        "maxMatrix": [{ "row": [7,5,3] }, { "row": [3,2,2] }, { "row": [9,0,2] }, { "row": [4,2,2] }],
        "initialAvailableResources": [3,3,2],
        "objective": "A new request arrives from Client 2 for [1,0,2]. Determine if granting this request will lead to an unsafe state using the Banker's algorithm."
      }
    }
  ];
