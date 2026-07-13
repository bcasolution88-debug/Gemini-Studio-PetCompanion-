import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogIn, LogOut, X } from 'lucide-react';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserAuthModal({ isOpen, onClose }: UserAuthModalProps) {
  const [user, setUser] = useState(auth.currentUser);

  auth.onAuthStateChanged(setUser);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (error) {
      console.error('Sign-in error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-800 rounded-3xl p-8 max-w-sm w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-stone-700">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-stone-900 dark:text-white">Sign In</h2>
        <button 
          onClick={handleSignIn} 
          className="w-full flex items-center justify-center bg-rose-500 text-white rounded-xl px-4 py-3 font-semibold hover:bg-rose-600 transition-colors"
        >
          <LogIn className="w-5 h-5 mr-2" /> Continue with Google
        </button>
      </div>
    </div>
  );
}
