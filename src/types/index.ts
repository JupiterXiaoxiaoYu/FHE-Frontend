export interface Task {
  id: string;
  bankId: string;
  businessType: string;
  status: 'pending' | 'completed';
  result?: string;
}

export interface Bank {
  id: string;
  publicKey: string;
  weId: string;
}

export interface User {
  publicKey: string;
  fhePublicKey: string;
  evaluationKey: string;
}