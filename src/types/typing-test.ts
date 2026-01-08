export type Language = 'javascript' | 'python' | 'cpp' | 'typescript' | 'java' | 'go' | 'rust' | 'sql' | 'html' | 'css';

export interface Snippet {
  id: string;
  language: Language;
  code: string;
  description: string;
}






