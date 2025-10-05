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
      "description": "Two departments each need two different printers. Both currently have one, but neither can finish without the other – can you avoid deadlock?",
      "tags": ["Resource Allocation", "Beginner"],
      "imageUrl": "https://images.unsplash.com/photo-1588829608152-e7accc3c7eef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxvZmZpY2UlMjBwcmludGVyfGVufDB8fHx8MTc1OTY3MzE5MXww&ixlib=rb-4.1.0&q=80&w=1080",
      "content": {
        "processes": ["Dept A", "Dept B"],
        "resources": ["Printer 1", "Printer 2"],
        "allocationMatrix": [{ "row": [1,0] }, { "row": [0,1] }],
        "maxMatrix": [{ "row": [1,1] }, { "row": [1,1] }],
        "initialAvailableResources": [0,0],
        "objective": "Arrange requests/releases so both departments print, but avoid deadlock."
      }
    },
    {
      "id": "db-connection-overload",
      "title": "Database Connection Overload",
      "description": "Three services compete for limited DB connections. Carefully allocate connections to keep all services running without a deadlock.",
      "tags": ["Threads", "Intermediate"],
      "imageUrl": "https://images.unsplash.com/photo-1691435828932-911a7801adfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxzZXJ2ZXIlMjByb29tfGVufDB8fHx8MTc1OTU5MzU2OHww&ixlib=rb-4.1.0&q=80&w=1080",
      "content": {
        "processes": ["Service Alpha", "Service Beta", "Service Gamma"],
        "resources": ["DB Connection"],
        "allocationMatrix": [{ "row": [2] }, { "row": [1] }, { "row": [1] }],
        "maxMatrix": [{ "row": [3] }, { "row": [3] }, { "row": [3] }],
        "initialAvailableResources": [1],
        "objective": "Grant or delay resource requests so every service can finish. Watch for unsafe states!"
      }
    },
    {
      "id": "assembly-race",
      "title": "Manufacturing Assembly Race",
      "description": "Three assembly lines must work together, sharing four robot arms. Can you allocate robot arms to avoid deadlock and keep production humming?",
      "tags": ["Resource Allocation", "Advanced", "Real-World"],
      "imageUrl": "https://picsum.photos/seed/assembly/1080/720",
      "content": {
        "processes": ["Line 1", "Line 2", "Line 3"],
        "resources": ["Robot Arm A", "Robot Arm B", "Robot Arm C", "Robot Arm D"],
        "allocationMatrix": [{ "row": [1,0,1,0] }, { "row": [0,1,0,1] }, { "row": [1,1,0,0] }],
        "maxMatrix": [{ "row": [2,0,1,1] }, { "row": [1,2,1,1] }, { "row": [1,1,1,1] }],
        "initialAvailableResources": [0,0,1,0],
        "objective": "Adjust allocations so all lines complete without system deadlock."
      }
    }
  ];
