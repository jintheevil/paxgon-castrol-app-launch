import Image from "next/image";

export function GoldBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <Image
        src="/assets/Standby-BG.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
}
