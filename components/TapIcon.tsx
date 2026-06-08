import Image from "next/image";

export function TapIcon({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden>
      <Image
        src="/assets/Tap-Icon.png"
        alt=""
        fill
        sizes="80px"
        className="object-contain"
      />
    </div>
  );
}
