import { useState } from 'react';
import { Menu, X, Users, Heart, Bot, MapPin, Search } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import UserAuth from './UserAuth';
import { useLanguage } from '../lib/LanguageContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const navLinks = [
    { name: t('Community', '社区互动'), icon: Users, href: '/community' },
    { name: t('Adoption', '宠物领养'), icon: Heart, href: '/adoption' },
    { name: t('AI Helper', 'AI 助手'), icon: Bot, href: '/ai-helper' },
    { name: t('Map Tracking', '地图服务'), icon: MapPin, href: '/map' },
  ];


  return (
    <nav className="bg-white dark:bg-stone-900 shadow-sm border-b border-gray-100 dark:border-stone-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-semibold text-rose-500">PetCompanion</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center space-x-6">
            <div className="flex sm:space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-gray-600 dark:text-stone-300 hover:text-rose-500 dark:hover:text-rose-400 flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200"
                >
                  <link.icon className="mr-2 h-4 w-4" />
                  {link.name}
                </a>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder={t('Search...', '搜索...')}
                className="border border-gray-200 dark:border-stone-800 bg-white dark:bg-stone-950 rounded-full px-4 py-1.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-stone-950 dark:text-white"
              />
              <Search className="absolute left-3 top-2 h-4 w-4 text-gray-400" />
            </div>
            
            {/* Bilingual Switcher */}
            <button
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-stone-200 dark:border-stone-800 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-850 transition-all cursor-pointer shadow-sm active:scale-95"
              title={t('Switch Language', '切换语言')}
            >
              <span className={language === 'zh' ? 'text-rose-500 font-extrabold' : ''}>中</span>
              <span className="text-stone-300 dark:text-stone-700">/</span>
              <span className={language === 'en' ? 'text-rose-500 font-extrabold' : ''}>EN</span>
            </button>

             <ThemeToggle />
             <UserAuth />
           </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-rose-500 dark:text-stone-400 dark:hover:text-rose-400"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="sm:hidden border-t border-gray-100 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-3 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-600 dark:text-stone-300 hover:text-rose-500 block py-2 text-base font-medium transition-colors duration-200 flex items-center"
                onClick={() => setIsOpen(false)}
              >
                <link.icon className="mr-3 h-5 w-5" />
                {link.name}
              </a>
            ))}
          </div>
          
          <div className="pt-3 border-t border-gray-100 dark:border-stone-800 flex items-center justify-between">
            <button
              onClick={() => {
                setLanguage(language === 'zh' ? 'en' : 'zh');
                setIsOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-800 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <span>{t('语言: 中文', 'Language: Chinese')}</span>
              <span>/</span>
              <span>{language === 'zh' ? 'English' : '中文'}</span>
            </button>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <UserAuth />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
