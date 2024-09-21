'use client'

import { useState, useEffect } from 'react'
import siteMetadata from '@/data/siteMetadata'
import headerNavLinks from '@/data/headerNavLinks'
import Logo from '@/data/logo.svg'
import Link from './Link'
import MobileNav from './MobileNav'
import { I18nextProvider } from 'react-i18next'
import i18next from './i18n'
import LanguageSelector from './Language'

const Header = () => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-black bg-opacity-80 shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" aria-label={siteMetadata.headerTitle}>
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10">
              <Logo className="h-full w-full text-yellow-500" />
            </div>
          </div>
        </Link>
        <nav className="flex items-center space-x-4 sm:space-x-6">
          {headerNavLinks
            .filter((link) => link.href !== '/')
            .map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="hidden text-sm font-medium text-yellow-500 transition-colors duration-200 hover:text-yellow-400 sm:inline-block"
              >
                {link.title}
              </Link>
            ))}
          <I18nextProvider i18n={i18next}>
            <LanguageSelector />
          </I18nextProvider>
          <MobileNav />
        </nav>
      </div>
    </header>
  )
}

export default Header
