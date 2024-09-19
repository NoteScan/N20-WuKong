'use client'

import { WalletConnectReact, useReactWalletStore } from 'n20-connect/dist/react'
import 'n20-connect/dist/style/index.css'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'
import N20Wallet from './n20-wallet'
import { interpolate, sleep } from './n20-wallet/n20_utils'
import { useState, useEffect, useRef } from 'react'

let n20_wallet: N20Wallet | undefined = undefined
let difficulty = 0n
let tick_name = 'WUKONG'

function App() {
  const { resolvedTheme } = useTheme()
  const ext_wallet = useReactWalletStore((state) => state)
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [particles, setParticles] = useState<
    Array<{ x: number; y: number; size: number; speed: number }>
  >([])
  const [showCelebration, setShowCelebration] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const createParticles = () => {
      const newParticles = Array.from({ length: 50 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 2 + 0.5,
      }))
      setParticles(newParticles)
    }

    createParticles()
    window.addEventListener('resize', createParticles)

    return () => window.removeEventListener('resize', createParticles)
  }, [])

  useEffect(() => {
    let animationId: number

    const animateParticles = () => {
      if (!isLoading) {
        setParticles((prevParticles) =>
          prevParticles.map((particle) => ({
            ...particle,
            y: (particle.y + particle.speed) % window.innerHeight,
          }))
        )
        animationId = requestAnimationFrame(animateParticles)
      }
    }

    animationId = requestAnimationFrame(animateParticles)
    return () => cancelAnimationFrame(animationId)
  }, [isLoading])

  useEffect(() => {
    if (showCelebration) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0
        videoRef.current.play()
      }
      const timer = setTimeout(() => setShowCelebration(false), 3000) // Celebration lasts for 3 seconds
      return () => clearTimeout(timer)
    }
  }, [showCelebration])

  const onConnectSuccess = async (wallet: any) => {
    if (wallet === undefined) {
      alert('N20 wallet not initailized' + wallet.publicKey)
    }
    n20_wallet = new N20Wallet(wallet)

    if (
      n20_wallet.btc_wallet.network === 'BTCtestnet' ||
      n20_wallet.btc_wallet.network === 'testnet'
    ) {
      tick_name = 'WUKONG#8'
    } else {
      tick_name = 'WUKONG'
    }

    getTokenList()
  }

  const onChangeNetwork = async () => {
    const currentNetwork = n20_wallet?.btc_wallet?.network
    switch (currentNetwork) {
      case 'BTCtestnet':
        n20_wallet?.btc_wallet?.switchNetwork('BTClivenet')
        break
      case 'BTClivenet':
        n20_wallet?.btc_wallet?.switchNetwork('BTCtestnet')
        break
      case 'livenet':
        n20_wallet?.btc_wallet?.switchNetwork('testnet')
        break
      case 'testnet':
        n20_wallet?.btc_wallet?.switchNetwork('livenet')
        break
    }
    window.location.reload()
  }

  const onConnectError = async (error: any) => {
    alert('n20-connect connect error' + error)
  }

  const onDisconnectSuccess = async () => {
    n20_wallet = undefined
  }

  const getTokenList = async () => {
    const token_list = await n20_wallet!.tokenList()
    for (let i = 0; i < token_list.length; i++) {
      if (token_list[i].tick === tick_name) {
        const info_box = document.getElementById('info') as HTMLDivElement
        const confirmed = BigInt(token_list[i].confirmed) / 10n ** BigInt(token_list[i].dec)
        const unconfirmed = BigInt(token_list[i].unconfirmed) / 10n ** BigInt(token_list[i].dec)
        info_box.innerHTML =
          tick_name +
          ': ' +
          confirmed +
          '/' +
          unconfirmed +
          ' ' +
          t('difficulty') +
          (difficulty + 1n) +
          '/' +
          9n
        break
      }
    }
  }

  const onMint = async () => {
    if (n20_wallet == undefined) {
      alert(t('connect_wallet'))
      return false
    }

    setIsLoading(true)

    const tokenInfo = await n20_wallet.tokenInfo(tick_name)

    if (tokenInfo === null) {
      alert(t('notoken'))
      setIsLoading(false)
      return false
    }

    const maxSupply = BigInt(tokenInfo.max)
    const amount = BigInt(tokenInfo.lim)

    const send_button = document.getElementById('mint') as HTMLButtonElement
    const result_box = document.getElementById('result') as HTMLDivElement
    const notic_box = document.getElementById('notice') as HTMLDivElement

    send_button.disabled = true
    result_box.innerHTML = ''

    let retry = 0

    while (retry < 2) {
      try {
        const res = await n20_wallet.mintWuKong(
          tick_name,
          amount,
          difficulty,
          notic_box,
          result_box,
          t
        )

        if (res.success) {
          notic_box.innerHTML = t('completed')

          // Shorten the transaction ID
          const shortTxId = `${res.txId.slice(0, 6)}...${res.txId.slice(-6)}`

          result_box.innerHTML =
            `<a href="${interpolate(n20_wallet.config.explorer[0].tx, { txId: res.txId })}" ` +
            `target="_blank" class="break-all">` +
            `txId: ${shortTxId}` +
            `</a>`

          getTokenList()
          setShowCelebration(true) // Trigger celebration effect
          break
        } else if (res.error.code === 400) {
          if ('details' in res.error && BigInt(res.error.details.total) === maxSupply) {
            notic_box.innerHTML = t('finished')
            result_box.innerHTML = ''
            break
          } else if (
            'details' in res.error &&
            difficulty !== BigInt(res.error.details.total) / (maxSupply / 9n)
          ) {
            difficulty = BigInt(res.error.details.total) / (maxSupply / 9n)
            notic_box.innerHTML = t('diff_change')
            getTokenList()
            await sleep(3000)
            retry += 1
          } else {
            notic_box.innerHTML = t('failed')
            notic_box.innerHTML += res.error.message
            result_box.innerHTML = ''
            break
          }
        } else {
          notic_box.innerHTML = t('failed')
          notic_box.innerHTML += res.error.message
          result_box.innerHTML = ''
          break
        }
      } catch (error) {
        notic_box.innerHTML = error.message
        result_box.innerHTML = ''
        break
      }
    }

    send_button.disabled = false
    setIsLoading(false)
    return false
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-yellow-500">
      {/* Regular particle effect */}
      {!isLoading && (
        <div className="pointer-events-none absolute inset-0">
          {particles.map((particle, index) => (
            <div
              key={index}
              className="absolute rounded-full bg-yellow-500 opacity-50"
              style={{
                left: `${particle.x}px`,
                top: `${particle.y}px`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <br></br>
      <div className="container relative z-10 mx-auto px-4 py-8">
        <h1 className="text-shadow-glow mb-8 text-center text-4xl font-bold text-yellow-500">
          {t('site_description')}
        </h1>

        <div className="rounded-lg border border-yellow-500 bg-gray-900 bg-opacity-80 p-6 shadow-lg">
          <div className="mb-6 flex flex-col items-center justify-between md:flex-row">
            <div className="mb-4 md:mb-0">
              {n20_wallet === undefined && (
                <div className="animate-pulse font-mono text-sm text-yellow-500">
                  {t('connect_wallet')}
                </div>
              )}
            </div>
            <div>
              <WalletConnectReact
                config={{
                  network: 'BTCtestnet',
                  defaultConnectorId: 'chainbow',
                }}
                theme="dark"
                onConnectSuccess={onConnectSuccess}
                onConnectError={onConnectError}
                onDisconnectSuccess={onDisconnectSuccess}
              />
              {n20_wallet !== undefined && (
                <div className="mt-2 text-center font-medium text-yellow-500 underline transition-colors hover:text-yellow-400">
                  <a onClick={() => onChangeNetwork()} href="/">
                    {n20_wallet.btc_wallet.network}
                  </a>
                </div>
              )}
            </div>
          </div>

          <form className="space-y-4">
            <div className="rounded-lg border border-yellow-600 bg-gray-800 p-4">
              <div className="font-mono text-sm text-yellow-400" id="info">
                {tick_name}
              </div>
            </div>
            <div className="flex justify-center">
              <button
                id="mint"
                type="button"
                className={`transform rounded-full bg-yellow-600 px-8 py-3 font-bold text-black transition duration-300 ease-in-out hover:scale-105 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isLoading ? 'animate-pulse' : ''
                }`}
                onClick={() => onMint()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg
                      className="-ml-1 mr-3 h-5 w-5 animate-spin text-black"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t('minting')}
                  </span>
                ) : (
                  <>
                    <svg
                      className="mr-2 inline-block h-5 w-5"
                      aria-hidden="true"
                      focusable="false"
                      data-prefix="fab"
                      data-icon="bitcoin"
                      role="img"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                    >
                      <path
                        fill="currentColor"
                        d="M504 256c0 136.1-111 248-248 248S8 392.1 8 256 119 8 256 8s248 111 248 248zm-141.7-35.33c4.937-32.1-20.19-50.74-54.55-62.57l11.15-44.7-27.21-6.781-10.85 43.52c-7.154-1.783-14.5-3.464-21.8-5.13l10.93-43.81-27.2-6.781-11.15 44.69c-5.922-1.349-11.73-2.682-17.38-4.084l.031-.14-37.53-9.37-7.239 29.06s20.19 4.627 19.76 4.913c11.02 2.751 13.01 10.04 12.68 15.82l-12.7 50.92c.76 .194 1.744 .473 2.829 .907-.907-.225-1.876-.473-2.876-.713l-17.8 71.34c-1.349 3.348-4.767 8.37-12.47 6.464 .271 .395-19.78-4.937-19.78-4.937l-13.51 31.15 35.41 8.827c6.588 1.651 13.05 3.379 19.4 5.006l-11.26 45.21 27.18 6.781 11.15-44.73a1038 1038 0 0 0 21.69 5.627l-11.11 44.52 27.21 6.781 11.26-45.13c46.4 8.781 81.3 5.239 95.99-36.73 11.84-33.79-.589-53.28-25-65.99 17.78-4.098 31.17-15.79 34.75-39.95zm-62.18 87.18c-8.41 33.79-65.31 15.52-83.75 10.94l14.94-59.9c18.45 4.603 77.6 13.72 68.81 48.96zm8.417-87.67c-7.673 30.74-55.03 15.12-70.39 11.29l13.55-54.33c15.36 3.828 64.84 10.97 56.85 43.03z"
                      ></path>
                    </svg>
                    {t('mint')}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-yellow-600 bg-gray-800 p-4">
              <div className="font-mono text-sm text-yellow-400" id="notice">
                {t('notice')}
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-yellow-600 bg-gray-800 p-4">
              <div
                className="break-all text-center font-mono text-sm text-yellow-500 underline"
                id="result"
              ></div>
            </div>
          </div>
        </div>
      </div>
      {/* Celebration video */}
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full object-cover ${
          showCelebration ? 'opacity-100' : 'opacity-15'
        } transition-opacity duration-300`}
        src="/static/images/jg.mp4"
        muted
        playsInline
      />
    </div>
  )
}

export default App
