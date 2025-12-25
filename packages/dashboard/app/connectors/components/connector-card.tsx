import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Ellipsis, ExternalLink } from "lucide-react";
import { ConnectorMetadata } from "@databite/connect";

export default function ConnectorCard({ item }: { item: ConnectorMetadata }) {
  return (
    <div
      key={item.id}
      className="border border-border bg-background hover:bg-muted transition-colors group"
    >
      <Link
        href={`/connectors/${item.id}`}
        className="w-full h-full flex flex-col cursor-pointer"
      >
        <div className="relative w-full aspect-video flex-1 overflow-hidden">
          <Image
            src={item.logo || ""}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <div className="p-4 border-t border-border flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold font-mono truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {item.author}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer -mr-2 shrink-0"
              >
                <Ellipsis className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 h-fit" align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <ExternalLink />
                  <Link href={`/connectors/${item.id}`}>View</Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Link>
    </div>
  );
}
