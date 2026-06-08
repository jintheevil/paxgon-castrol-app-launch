import Image from "next/image";

export function F6Logo({ className = "w-64 h-64" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-label="F6 logo">
      <Image
        src="/assets/WSMS.png"
        alt="F6 WSMS"
        width={1024}
        height={1024}
        priority
        className="h-full w-full object-contain drop-shadow-[0_20px_40px_rgba(242,108,42,0.45)]"
      />
    </div>
  );
}
