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
import { getInviteData, addSupplierToCompany } from '../services/supplierInvitations';

interface UserData {
  id: string;
  email: string;
  companyId: string;
  role: 'admin' | 'user' | 'supplier';
  name: string;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, inviteCode?: string) => Promise<void>;
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

  const signUp = async (email: string, password: string, name: string, inviteCode?: string) => {
    let companyId: string;
    let role: 'admin' | 'user' | 'supplier';
    let userCredential;

    if (inviteCode) {
      // Verify invite code and get invitation data
      const inviteData = await getInviteData(inviteCode);
      
      if (!inviteData) {
        throw new Error('Invalid invite code');
      }

      if (inviteData.email !== email) {
        throw new Error('Email does not match invitation');
      }

      // Create new company for the invited user
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      companyId = userCredential.user.uid;
      role = inviteData.role;

      // Create company document
      await setDoc(doc(db, 'companies', companyId), {
        name: inviteData.name,
        createdAt: Timestamp.now(),
        createdBy: userCredential.user.uid,
        contactName: inviteData.contactName,
        email: email,
        suppliers: [], // Companies they supply to
        customers: [], // Companies they buy from
        notes: inviteData.notes
      });

      // Add relationship between companies
      await addSupplierToCompany(inviteData.invitingCompanyId, companyId);
    } else {
      // Self-registration creates a new company
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      companyId = userCredential.user.uid;
      role = 'admin';

      // Create new company
      await setDoc(doc(db, 'companies', companyId), {
        name: `${name}'s Company`,
        createdAt: Timestamp.now(),
        createdBy: userCredential.user.uid,
        suppliers: [], // Companies they supply to
        customers: [], // Companies they buy from
      });
    }

    // Create user profile
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      name,
      companyId,
      role,
      createdAt: Timestamp.now()
    });
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
