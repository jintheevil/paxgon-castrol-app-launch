import Image from "next/image";

export function LoadingSpinner({ className = "h-20 w-20" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-label="Loading">
      <Image
        src="/assets/Loading.png"
        alt=""
        fill
        sizes="120px"
        className="animate-spin-slow object-contain"
      />
    </div>
  );
}
