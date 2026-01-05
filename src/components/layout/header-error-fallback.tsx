import Link from "next/link";
import Image from "next/image";

export function HeaderErrorFallback() {
  return (
    <nav className="sticky top-0 w-full bg-background/95 backdrop-blur-lg z-50 py-4 border-b border-border">
      <div className="container mx-auto flex justify-between items-center px-8">
        <Link
          href="/"
          className="text-2xl font-bold text-primary no-underline flex items-center gap-2"
        >
           <Image
              src="/icon.png"
              alt="App Icon"
              width={32}
              height={32}
              className="mr-2"
            />
          Byte To Offer
        </Link>
        <div className="text-sm text-muted-foreground">
          Navigation temporarily unavailable
        </div>
      </div>
    </nav>
  );
}
