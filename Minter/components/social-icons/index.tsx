import { Mail, Github, Facebook, Youtube, X } from './icons'

const components = {
  mail: Mail,
  github: Github,
  facebook: Facebook,
  youtube: Youtube,
  x: X,
}

type SocialIconProps = {
  kind: keyof typeof components
  href: string | undefined
  size?: number
}

const SocialIcon = ({ kind, href, size = 8 }: SocialIconProps) => {
  if (
    !href ||
    (kind === 'mail' && !/^mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(href))
  )
    return null

  const SocialSvg = components[kind]

  return (
    <a
      className="group relative inline-block"
      target="_blank"
      rel="noopener noreferrer"
      href={href}
    >
      <span className="sr-only">{kind}</span>
      <div className="absolute inset-0 scale-75 transform rounded-full bg-yellow-500 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-20"></div>
      <SocialSvg
        className={`h-${size} w-${size} text-yellow-500 transition-all duration-300 group-hover:scale-110 group-hover:text-yellow-400`}
      />
    </a>
  )
}

export default SocialIcon
