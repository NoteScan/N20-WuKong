'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState } from 'react'
import Link from './Link'
import headerNavLinks from '@/data/headerNavLinks'

const MobileNav = () => {
  const [navShow, setNavShow] = useState(false)

  const onToggleNav = () => {
    setNavShow((status) => {
      document.body.style.overflow = status ? 'auto' : 'hidden'
      return !status
    })
  }

  return (
    <>
      <button
        aria-label="Toggle Menu"
        onClick={onToggleNav}
        className="text-yellow-500 transition-colors duration-200 hover:text-yellow-400 sm:hidden"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-8 w-8"
        >
          <path
            fillRule="evenodd"
            d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <Transition show={navShow} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50 overflow-hidden" onClose={onToggleNav}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black/70" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="transform transition ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-300"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-black bg-opacity-90 p-6 text-yellow-500">
              <div className="flex justify-end">
                <button
                  className="rounded-md text-yellow-500 hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  onClick={onToggleNav}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <nav className="mt-8">
                {headerNavLinks.map((link) => (
                  <div key={link.title} className="py-4">
                    <Link
                      href={link.href}
                      className="text-2xl font-bold tracking-widest text-yellow-500 transition-colors duration-200 hover:text-yellow-400"
                      onClick={onToggleNav}
                    >
                      {link.title}
                    </Link>
                  </div>
                ))}
              </nav>
            </div>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  )
}

export default MobileNav
