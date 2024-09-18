import Link from './Link'
import siteMetadata from '@/data/siteMetadata'
import SocialIcon from '@/components/social-icons'

export default function Footer() {
  return (
    <footer className="bg-black bg-opacity-80 py-8 text-yellow-500">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center">
          <div className="mb-6 flex space-x-6">
            <SocialIcon kind="mail" href={`mailto:${siteMetadata.email}`} size={6} />
            <SocialIcon kind="github" href={siteMetadata.github} size={6} />
            <SocialIcon kind="facebook" href={siteMetadata.facebook} size={6} />
            <SocialIcon kind="youtube" href={siteMetadata.youtube} size={6} />
            <SocialIcon kind="x" href={siteMetadata.x} size={6} />
          </div>
          <div className="w-full max-w-2xl border-t border-yellow-700 pt-6">
            <div className="flex flex-wrap justify-center space-x-4 text-sm">
              <div>{siteMetadata.author}</div>
              <div className="hidden sm:block">•</div>
              <div>{`© ${new Date().getFullYear()}`}</div>
              <div className="hidden sm:block">•</div>
              <Link href="/" className="transition-colors duration-200 hover:text-yellow-400">
                {siteMetadata.title}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
