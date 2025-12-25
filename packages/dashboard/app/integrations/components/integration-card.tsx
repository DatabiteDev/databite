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
import { getIntegrationsWithConnectors } from "@databite/connect";

export default function IntegrationCard({
  item,
}: {
  item: Awaited<ReturnType<typeof getIntegrationsWithConnectors>>[number];
}) {
  return (
    <div
      key={item.integration.id}
      className="border border-border bg-background hover:bg-muted transition-colors group"
    >
      <Link
        href={`/integrations/${item.integration.id}`}
        className="w-full h-full flex flex-col cursor-pointer"
      >
        <div className="relative w-full aspect-video flex-1 overflow-hidden">
          <Image
            src={item.connector.logo || ""}
            alt={item.integration.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <div className="p-4 border-t border-border flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold font-mono truncate">
              {item.integration.name}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {item.connector.author}
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
                  <Link href={`/integrations/${item.integration.id}`}>
                    View
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Link>
    </div>
  );
}
