import Image from "next/image";
import logo from "@/public/images/logo.png";

export function Logo() {
  return (
    <div className="relative w-10 aspect-square p-0 m-0">
      <Image
        fill
        src={logo}
        alt={"Databite Logo"}
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}
