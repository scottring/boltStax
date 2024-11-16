import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface UserData {
  id: string;
  email: string;
  companyId: string;
  role: 'admin' | 'user';
  name: string;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, inviteToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData({
            id: user.uid,
            email: user.email!,
            companyId: userDoc.data().companyId,
            role: userDoc.data().role,
            name: userDoc.data().name
          });
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, name: string, inviteToken?: string) => {
    // Create the user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    let companyId: string;
    let role: 'admin' | 'user';

    if (inviteToken) {
      // Verify invite token and get company information
      const inviteDoc = await getDoc(doc(db, 'invites', inviteToken));
      if (!inviteDoc.exists()) {
        throw new Error('Invalid invite token');
      }

      const inviteData = inviteDoc.data();
      if (inviteData.email !== email) {
        throw new Error('Email does not match invitation');
      }

      companyId = inviteData.companyId;
      role = inviteData.role;
    } else {
      // Create new company for self-registration
      const companyDoc = await setDoc(doc(db, 'companies', user.uid), {
        name: `${name}'s Company`,
        createdAt: Timestamp.now(),
        createdBy: user.uid
      });
      companyId = user.uid;
      role = 'admin';
    }

    // Create user profile
    await setDoc(doc(db, 'users', user.uid), {
      email,
      name,
      companyId,
      role,
      createdAt: Timestamp.now()
    });

    // If this was an invite, mark it as used
    if (inviteToken) {
      await setDoc(doc(db, 'invites', inviteToken), {
        usedAt: Timestamp.now(),
        usedBy: user.uid
      }, { merge: true });
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const value = {
    currentUser,
    userData,
    loading,
    signIn,
    signUp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
