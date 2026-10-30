import Image from 'next/image'

interface BrandLogoProps {
  large?: boolean
}

export default function BrandLogo({ large = false }: BrandLogoProps) {
  return large ? (
    <Image
      src="/logo.svg"
      alt="ITPC Takecare — ระบบดูแลนักเรียนรายเคส"
      width={341}
      height={120}
      priority
      style={{ display: 'block', width: '100%', maxWidth: 270, height: 'auto', margin: '0 auto' }}
    />
  ) : (
    <Image
      src="/icon.svg"
      alt=""
      aria-hidden="true"
      width={42}
      height={42}
      style={{ display: 'block', flexShrink: 0 }}
    />
  )
}
