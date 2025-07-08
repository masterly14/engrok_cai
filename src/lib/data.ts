export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status?: string;
  tags: string[];
  lastContact: string;
  notes?: string;
  value?: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Stage {
  id: string;
  name: string;
  color: string;
}
