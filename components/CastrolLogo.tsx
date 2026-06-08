import Image from "next/image";

export function CastrolLogo({ className = "h-10" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-label="Castrol Auto Service">
      <Image
        src="/assets/CAS-logo.png"
        alt="Castrol Auto Service"
        width={400}
        height={120}
        priority
        className="h-full w-auto object-contain"
      />
    </div>
  );
}
