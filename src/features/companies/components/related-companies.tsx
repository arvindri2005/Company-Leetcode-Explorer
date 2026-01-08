import Link from "next/link";
import { slugify } from "@/lib/utils";
import { ArrowRight, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RelatedCompaniesProps {
  companies: string[];
}

export default function RelatedCompanies({ companies }: RelatedCompaniesProps) {
  if (!companies || companies.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <CardHeader className="pb-3 bg-muted/30 border-b">
        <h2 className="font-semibold leading-none tracking-tight flex items-center text-lg">
          <Building2 className="mr-2 h-5 w-5 text-primary" />
          Related Companies
        </h2>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col divide-y divide-border">
          {companies.map((companyName) => {
            const slug = slugify(companyName);
            return (
              <Link
                key={slug}
                href={`/company/${slug}`}
                className="group flex items-center justify-between p-4 hover:bg-muted/50 transition-all duration-200"
              >
                <span className="font-medium text-sm text-foreground/90 group-hover:text-primary transition-colors capitalize">
                  {companyName}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 duration-200" />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}






