import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";

// Configuration Firebase (à remplacer par tes propres clés)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD1XwJQJ5J5QJ5J5QJ5J5QJ5J5QJ5J",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "tennis-prono.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "tennis-prono",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "tennis-prono.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abc123"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Types
interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds: number;
  awayOdds: number;
  startTime: Date;
  tournament: string;
  status: 'upcoming' | 'live' | 'finished';
  winner?: string;
  sets?: number;
}

interface Pronostic {
  id: string;
  userId: string;
  matchId: string;
  winner: 'home' | 'away';
  sets: number;
  points: number;
  isCorrect: boolean;
  timestamp: Date;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  totalPoints: number;
  correctPronostics: number;
  totalPronostics: number;
}

// Collections
const matchesRef = collection(db, "matches");
const pronosticsRef = collection(db, "pronostics");
const usersRef = collection(db, "users");

// Fonctions Auth
export const signUp = async (email: string, password: string, name: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  await setDoc(doc(usersRef, user.uid), {
    id: user.uid,
    email: user.email,
    name,
    totalPoints: 0,
    correctPronostics: 0,
    totalPronostics: 0,
    createdAt: Timestamp.now()
  });
  
  return user;
};

export const signIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const signOutUser = async () => {
  await signOut(auth);
};

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      resolve(user);
    });
  });
};

// Fonctions Matches
export const addMatch = async (match: Match) => {
  await setDoc(doc(matchesRef, match.id), match);
};

export const getMatches = async (): Promise<Match[]> => {
  const snapshot = await getDocs(matchesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
};

export const getMatchById = async (id: string): Promise<Match | null> => {
  const docRef = doc(matchesRef, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Match) : null;
};

export const updateMatchResult = async (matchId: string, winner: 'home' | 'away', sets: number) => {
  await updateDoc(doc(matchesRef, matchId), {
    status: 'finished',
    winner,
    sets
  });
};

// Fonctions Pronostics
export const addPronostic = async (userId: string, matchId: string, winner: 'home' | 'away', sets: number, points: number) => {
  const pronosticId = `${userId}_${matchId}`;
  await setDoc(doc(pronosticsRef, pronosticId), {
    id: pronosticId,
    userId,
    matchId,
    winner,
    sets,
    points,
    isCorrect: false,
    timestamp: Timestamp.now()
  });
  
  // Mettre à jour le compteur de pronostics de l'utilisateur
  await updateDoc(doc(usersRef, userId), {
    totalPronostics: arrayUnion(pronosticId)
  });
};

export const getPronosticsByUser = async (userId: string): Promise<Pronostic[]> => {
  const q = query(pronosticsRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pronostic));
};

export const getPronosticsByMatch = async (matchId: string): Promise<Pronostic[]> => {
  const q = query(pronosticsRef, where("matchId", "==", matchId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pronostic));
};

// Fonctions Users
export const getUserById = async (userId: string): Promise<UserData | null> => {
  const docRef = doc(usersRef, userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as UserData) : null;
};

export const getAllUsers = async (): Promise<UserData[]> => {
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
};

export const updateUserPoints = async (userId: string, points: number, isCorrect: boolean) => {
  const userRef = doc(usersRef, userId);
  await updateDoc(userRef, {
    totalPoints: isCorrect ? (await getUserById(userId))!.totalPoints + points : (await getUserById(userId))!.totalPoints,
    correctPronostics: isCorrect ? (await getUserById(userId))!.correctPronostics + 1 : (await getUserById(userId))!.correctPronostics
  });
};

// Fonction pour vérifier et mettre à jour les pronostics après un match
export const checkAndUpdatePronostics = async (matchId: string) => {
  const match = await getMatchById(matchId);
  if (!match || !match.winner || !match.sets) return;
  
  const pronostics = await getPronosticsByMatch(matchId);
  for (const pronostic of pronostics) {
    const isCorrect = pronostic.winner === match.winner && pronostic.sets === match.sets;
    const points = isCorrect ? pronostic.points * 2 : (pronostic.winner === match.winner ? pronostic.points : 0);
    
    await updateDoc(doc(pronosticsRef, pronostic.id), {
      isCorrect
    });
    
    if (points > 0) {
      await updateUserPoints(pronostic.userId, points, pronostic.winner === match.winner);
    }
  }
};

export { db, auth, matchesRef, pronosticsRef, usersRef };
