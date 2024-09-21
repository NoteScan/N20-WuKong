'use client'

import { useState, useRef, useEffect } from 'react'
import { HiGlobe } from 'react-icons/hi'
import { useTranslation } from 'react-i18next'
import { useCookies } from 'react-cookie'

function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const { t, i18n } = useTranslation()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [cookies, setCookie] = useCookies(['language'])
  const [language, setLanguage] = useState(i18n.language)

  const changeLanguage = (lang: string) => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang)
      setCookie('language', lang, { path: '/' })
      setLanguage(lang) // Update local state to force re-render
    }
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const storedLanguage = cookies.language || 'en'
    if (i18n.language !== storedLanguage) {
      i18n.changeLanguage(storedLanguage)
      setLanguage(storedLanguage) // Update local state to force re-render
    }
  }, [cookies.language, i18n])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center space-x-2 text-sm text-yellow-500 transition-colors duration-200 hover:text-yellow-400"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <HiGlobe className="inline-block h-5 w-5" />
        <span className="ml-2 flex items-center">
          <span className="mr-1">{i18n.language === 'en' ? 'EN' : '中文'}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`inline-block h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md bg-black bg-opacity-90 shadow-lg ring-1 ring-yellow-500 ring-opacity-50">
          <div
            className="py-1"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="language-menu"
          >
            <button
              onClick={() => changeLanguage('en')}
              className="block w-full px-4 py-2 text-left text-sm text-yellow-500 transition-colors duration-200 hover:bg-yellow-500 hover:bg-opacity-20"
              role="menuitem"
            >
              English
            </button>
            <button
              onClick={() => changeLanguage('zh')}
              className="block w-full px-4 py-2 text-left text-sm text-yellow-500 transition-colors duration-200 hover:bg-yellow-500 hover:bg-opacity-20"
              role="menuitem"
            >
              简体中文
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LanguageSelector
