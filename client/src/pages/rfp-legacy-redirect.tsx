import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { RfpDetailSkeleton } from "@/components/skeletons";
import { generateClientSlug } from "@/lib/utils";

export default function RfpLegacyRedirect() {
  const { state, slug } = useParams<{ state: string; slug: string }>();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!state || !slug) return;

    const fetchAndRedirect = async () => {
      try {
        const response = await fetch(`/api/rfps/by-location/${encodeURIComponent(state)}/${encodeURIComponent(slug)}`);
        if (!response.ok) {
          setLocation("/");
          return;
        }
        const rfp = await response.json();
        const searchParams = new URLSearchParams(window.location.search);
        const from = searchParams.get("from");
        const clientSlug = generateClientSlug(rfp.clientName || rfp.organization?.companyName);
        const newUrl = from
          ? `/rfp/${encodeURIComponent(state)}/${encodeURIComponent(clientSlug)}/${slug}?from=${from}`
          : `/rfp/${encodeURIComponent(state)}/${encodeURIComponent(clientSlug)}/${slug}`;
        setLocation(newUrl, { replace: true });
      } catch {
        setLocation("/");
      }
    };

    fetchAndRedirect();
  }, [state, slug, setLocation]);

  return <RfpDetailSkeleton />;
}
