export interface Task {
  id: string;
  type: string;
  goal: string;
  context: {
    repo?: string;
    relatedFiles?: string[];
    constraints?: string[];
    [key: string]: any;
  };
  maxLoops: number;
  successCriteria: string[];
}

export interface TaskResult {
  success: boolean;
  findings: string[];
  patchApplied?: string;
  output?: string;
  error?: string;
}

export interface Message {
  sender: string;
  recipient: string;
  content: string;
  timestamp: string;
}

import { StorageProvider } from '@seokit/core';

export interface Context {
  projectId: string;
  workingDir: string;
  messages: Message[];
  memory: Record<string, any>;
  storage: StorageProvider;
}

export interface Agent {
  name: string;
  run(task: Task, context: Context): Promise<TaskResult>;
}
