import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Camera, FileText } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          나만의 오답노트 만들기
        </h1>
        <p className="text-xl text-muted-foreground">
          문제를 촬영하고, 과목별로 정리해서 시험지로 만들어보세요.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/capture">
          <Button size="lg" className="h-16 px-8 text-lg gap-2">
            <Camera className="w-6 h-6" />
            문제 촬영하기
          </Button>
        </Link>
        <Link href="/notes">
          <Button size="lg" variant="outline" className="h-16 px-8 text-lg gap-2">
            <FileText className="w-6 h-6" />
            내 오답노트 보기
          </Button>
        </Link>
      </div>
    </div>
  );
}
