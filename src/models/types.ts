export interface Person {
  id: string;
  name: string;
  email: string;
}

export interface Meeting {
  id: string;
  time: string; // ISO string
  participants: string[];
}
