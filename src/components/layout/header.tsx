import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          오답노트
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/notes">
            <Button variant="ghost">내 오답노트</Button>
          </Link>
          <Link href="/capture">
            <Button>문제 촬영하기</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
