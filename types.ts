
export enum AgentRole {
  TEAM_LEADER = 'Team Leader',
  PRODUCT_MANAGER = 'Product Manager',
  ARCHITECT = 'Architect',
  ENGINEER = 'Engineer',
  DATA_ANALYST = 'Data Analyst'
}

export interface Agent {
  id: string;
  role: AgentRole;
  name: string;
  description: string;
  icon: string;
  color: string; // Tailwind color class identifier
  textColor: string;
  borderColor: string;
  bgColor: string;
  systemPromptSnippet: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  agentId?: string; // If model, which agent is speaking
  content: string;
  timestamp: number;
}

export interface Artifact {
  id: string;
  title: string;
  type: 'code' | 'markdown' | 'plan';
  content: string;
  language?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export type ChatStatus = 'idle' | 'thinking' | 'streaming' | 'error';
