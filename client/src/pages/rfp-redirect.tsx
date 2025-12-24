import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { RfpDetailSkeleton } from "@/components/skeletons";

export default function RfpRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!id) return;

    const fetchAndRedirect = async () => {
      try {
        const response = await fetch(`/api/rfps/${id}`);
        if (!response.ok) {
          setLocation("/");
          return;
        }
        const rfp = await response.json();
        const searchParams = new URLSearchParams(window.location.search);
        const from = searchParams.get("from");
        const newUrl = from
          ? `/rfp/${encodeURIComponent(rfp.jobState)}/${rfp.slug || rfp.id}?from=${from}`
          : `/rfp/${encodeURIComponent(rfp.jobState)}/${rfp.slug || rfp.id}`;
        setLocation(newUrl, { replace: true });
      } catch {
        setLocation("/");
      }
    };

    fetchAndRedirect();
  }, [id, setLocation]);

  return <RfpDetailSkeleton />;
}
