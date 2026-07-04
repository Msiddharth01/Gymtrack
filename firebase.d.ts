import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

declare module '../../firebase/config' {
  export const auth: Auth;
  export const db: Firestore;
}
