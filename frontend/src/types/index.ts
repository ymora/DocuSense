export interface FileInfo {
  path: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'archived' | 'unregistered' | 'unanalyzed';
  analysis?: any;
  lastModified?: number;
  fileId?: string;
  error?: string;
}

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: TreeNode[];
  status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'archived' | 'unregistered' | 'unanalyzed';
  lastModified?: number;
  fileId?: string;
  error?: string;
}

export interface AnalysisTask {
  id: string;
  filePath: string;
  fileName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'archived';
  progress: number;
  error?: string;
  strategy?: string;
  promptId?: string;
  iaMode?: 'openai' | 'local';
}

export interface ContextualPrompt {
  success: boolean;
  contextual_prompt?: string;
  file_path?: string;
  prompt_type?: string;
  error?: string;
}

export type PromptType = 'general' | 'summary' | 'extraction' | 'classification' | 'questions' | 'action_items'; 