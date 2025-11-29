import { BreadcrumbNav } from "@/components/breadcrumb-nav";

export default function AboutPage() {
  const breadcrumbItems = [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "About",
      href: "/about",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-12">
        <BreadcrumbNav items={breadcrumbItems} />
        <h1 className="text-4xl font-bold mb-8">Helping You Meet Participation Goals & Good Faith Efforts</h1>

        <div className="prose prose-slate max-w-none">
          <p className="lead">
            findconstructionbids.com helps contractors, owners, and agencies efficiently meet participation goals 
            and document Good Faith Efforts.
          </p>

          <p>
            Our platform lets you solicit bids from qualified firms and keep a clear record of outreach, 
            responses, and award decisions — all in one place. This makes it easier to demonstrate compliance 
            and submit complete Good Faith Effort documentation.
          </p>

          <h2>Key items you can track:</h2>
          <ul>
            <li>Company name</li>
            <li>Certification status</li>
            <li>Trade / scope</li>
            <li>Date solicited</li>
            <li>Bid received</li>
            <li>Bid amount</li>
            <li>Award decision</li>
            <li>Notes</li>
          </ul>
        </div>
      </main>
    </div>
  );
}