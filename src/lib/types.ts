export type ModuleStatus = 'completed' | 'inprogress' | 'locked';

export interface Module {
  title: string;
  description: string;
  href: string;
  status: ModuleStatus;
}
