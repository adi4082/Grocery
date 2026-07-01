import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp, 
  getDocFromServer 
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { UserProfile, StructuredAddress } from "../types";

// Helper to generate an unique customer ID
export function generateRandomCustomerId(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `QN${digits}`;
}

// Generate a random referral code
export function generateReferralCode(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase();
  const digits = Math.floor(100 + Math.random() * 900);
  return `QN_${cleanName}_${digits}`;
}

// Duplicate Mobile check
export async function isMobileRegistered(phone: string): Promise<boolean> {
  const path = "users";
  try {
    const q = query(collection(db, path), where("phone", "==", phone.trim()));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return false;
  }
}

// Duplicate Email check
export async function isEmailRegistered(email: string): Promise<boolean> {
  if (!email || !email.trim()) return false;
  const path = "users";
  try {
    const q = query(collection(db, path), where("email", "==", email.trim().toLowerCase()));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return false;
  }
}

// Get single User Profile
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// Create User Profile in Firestore
export async function createUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const uid = profile.uid;
  if (!uid) throw new Error("UID is required to create a user profile.");
  const path = `users/${uid}`;

  const customerId = generateRandomCustomerId();
  const referralCode = generateReferralCode(profile.name || "USER");

  const fullProfile: UserProfile = {
    uid,
    name: profile.name || "Premium Customer",
    email: profile.email || `${profile.phone?.replace(/[^0-9]/g, "")}@quicknow.com`,
    phone: profile.phone || "",
    role: "customer",
    walletBalance: profile.walletBalance || 0,
    loyaltyPoints: profile.loyaltyPoints || 0,
    addresses: profile.addresses || [],
    structuredAddresses: profile.structuredAddresses || [],
    referralCode,
    referredBy: profile.referredBy || "",
    recentlyViewed: [],
    customerId,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    status: "Active",
    orderCount: 0,
    photoUrl: profile.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
    savedProducts: []
  };

  try {
    // Save to Firestore with server timestamp metadata
    await setDoc(doc(db, "users", uid), {
      ...fullProfile,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });
    return fullProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

// Update User Profile
export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, {
      ...updates,
      lastLogin: new Date().toISOString() // update timestamp
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Fetch user addresses from subcollection
export async function getStructuredAddresses(uid: string): Promise<StructuredAddress[]> {
  const path = `users/${uid}/addresses`;
  try {
    const snapshot = await getDocs(collection(db, "users", uid, "addresses"));
    const list: StructuredAddress[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as StructuredAddress);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Add/Update structured address
export async function saveStructuredAddress(uid: string, address: StructuredAddress): Promise<void> {
  const path = `users/${uid}/addresses/${address.id}`;
  try {
    const addrRef = doc(db, "users", uid, "addresses", address.id);
    await setDoc(addrRef, address);

    // Sync to user.addresses simple list for backwards compatibility
    const profile = await getUserProfile(uid);
    if (profile) {
      const currentStructured = await getStructuredAddresses(uid);
      
      // Update isDefault across other addresses if this is default
      if (address.isDefault) {
        for (const addr of currentStructured) {
          if (addr.id !== address.id && addr.isDefault) {
            await updateDoc(doc(db, "users", uid, "addresses", addr.id), { isDefault: false });
          }
        }
      }

      const updatedStructured = await getStructuredAddresses(uid);
      const simpleList = updatedStructured.map(addr => 
        `${addr.type}: ${addr.houseFlat}, ${addr.buildingName ? addr.buildingName + ", " : ""}${addr.streetArea}, ${addr.city}, ${addr.state} - ${addr.pinCode}`
      );

      await updateDoc(doc(db, "users", uid), {
        addresses: simpleList,
        structuredAddresses: updatedStructured
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete structured address
export async function deleteStructuredAddress(uid: string, addressId: string): Promise<void> {
  const path = `users/${uid}/addresses/${addressId}`;
  try {
    await deleteDoc(doc(db, "users", uid, "addresses", addressId));

    // Update parent list
    const updatedStructured = await getStructuredAddresses(uid);
    const simpleList = updatedStructured.map(addr => 
      `${addr.type}: ${addr.houseFlat}, ${addr.buildingName ? addr.buildingName + ", " : ""}${addr.streetArea}, ${addr.city}, ${addr.state} - ${addr.pinCode}`
    );

    await updateDoc(doc(db, "users", uid), {
      addresses: simpleList,
      structuredAddresses: updatedStructured
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Fetch all registered customers (for Admin Panel)
export async function getAllCustomers(): Promise<UserProfile[]> {
  const path = "users";
  try {
    const snapshot = await getDocs(collection(db, "users"));
    const list: UserProfile[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      list.push({
        ...data,
        createdAt: data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).toISOString() : data.createdAt
      } as UserProfile);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Admin block/unblock customer
export async function toggleCustomerStatus(uid: string, currentStatus: "Active" | "Blocked"): Promise<"Active" | "Blocked"> {
  const newStatus = currentStatus === "Active" ? "Blocked" : "Active";
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, "users", uid), { status: newStatus });
    return newStatus;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

// Admin delete customer
export async function adminDeleteCustomer(uid: string): Promise<void> {
  const path = `users/${uid}`;
  try {
    await deleteDoc(doc(db, "users", uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// Admin update reward/wallet balance
export async function adminUpdateCustomerBalances(uid: string, wallet: number, points: number): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, "users", uid), {
      walletBalance: wallet,
      loyaltyPoints: points
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}
