import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogIn, LogOut } from 'lucide-react';
import UserAuthModal from './UserAuthModal';

export default function UserAuth() {
  const [user, setUser] = useState(auth.currentUser);
  const [isModalOpen, setIsModalOpen] = useState(false);

  auth.onAuthStateChanged(setUser);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {user ? (
        <div className="flex items-center space-x-2">
          <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full" />
          <span className="text-sm font-medium text-stone-900">{user.displayName}</span>
          <button onClick={handleSignOut} className="p-2 bg-stone-100 rounded-full hover:bg-stone-200">
            <LogOut className="w-5 h-5 text-stone-600" />
          </button>
        </div>
      ) : (
        <>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-rose-500 text-white rounded-xl px-4 py-2 font-semibold hover:bg-rose-600 transition-colors">
            <LogIn className="w-5 h-5 mr-2" /> Sign In
          </button>
          <UserAuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
      )}
    </div>
  );
}
