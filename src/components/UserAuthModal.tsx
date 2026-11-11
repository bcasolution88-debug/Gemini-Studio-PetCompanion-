import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogIn, X } from 'lucide-react';
import Modal from './ui/Modal';
import { IconButton } from './ui/IconButton';
import { useLanguage } from '../lib/LanguageContext';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserAuthModal({ isOpen, onClose }: UserAuthModalProps) {
  const [user, setUser] = useState(auth.currentUser);
  const { t } = useLanguage();

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

  const titleId = 'user-auth-title';

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      size="sm"
      panelClassName="p-8"
    >
      <IconButton
        aria-label={t('Close sign-in dialog', '关闭登录对话框')}
        icon={<X className="w-5 h-5" />}
        onClick={onClose}
        className="absolute top-4 right-4"
      />
      <h2
        id={titleId}
        className="text-h2 font-bold mb-6 text-stone-900 dark:text-white"
      >
        {t('Sign In', '登录')}
      </h2>
      <button
        onClick={handleSignIn}
        className="w-full flex items-center justify-center bg-brand-500 text-white rounded-control px-4 py-3 font-semibold hover:bg-brand-600 transition-colors"
      >
        <LogIn className="w-5 h-5 mr-2" aria-hidden="true" />
        {t('Continue with Google', '使用 Google 继续')}
      </button>
      {user && (
        <p className="mt-4 text-caption text-stone-500 dark:text-stone-400 text-center">
          {t('Already signed in as', '已登录为')} {user.displayName ?? user.email}
        </p>
      )}
    </Modal>
  );
}
