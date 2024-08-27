'use client'

import { HiGlobe } from 'react-icons/hi'
import i18n from './i18n'
import { useState } from 'react'
//import { useTranslation } from 'react-i18next'

function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false)
  //  const { t } = useTranslation()

  const changeLanguage = (lang) => {
    if (isOpen && i18n.language !== lang) {
      i18n.changeLanguage(lang)
    }
    isOpen && setIsOpen(false)
  }

  return (
    <div>
      <button
        type="button"
        className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        <HiGlobe className="inline-block h-5 w-5" />
        <span className="ml-2 flex items-center">
          <span className="mr-1">{i18n.language}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="inline-block h-4 w-4"
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
        <div className="absolute mt-2 w-56 divide-y divide-gray-200 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:divide-gray-600 dark:bg-gray-800">
          <div className="py-1" role="menu" aria-labelledby="user-menu">
            <button
              onClick={() => changeLanguage('en')}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
              role="menuitem"
            >
              English
            </button>
            <button
              onClick={() => changeLanguage('zh')}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
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
