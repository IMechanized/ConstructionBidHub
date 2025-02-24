export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">About GovBids</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="lead">
            GovBids is a comprehensive construction bid management platform that revolutionizes 
            how government organizations and contractors interact through intelligent RFP creation, 
            bidding, and management workflows.
          </p>

          <h2>Our Mission</h2>
          <p>
            We strive to streamline the government contracting process by providing a modern, 
            efficient platform that connects government organizations with qualified contractors, 
            ensuring transparency and fairness in the bidding process.
          </p>

          <h2>What We Offer</h2>
          <ul>
            <li>Intelligent RFP Creation and Management</li>
            <li>Streamlined Bidding Process</li>
            <li>Contractor Qualification and Verification</li>
            <li>Real-time Analytics and Reporting</li>
            <li>Secure Document Management</li>
            <li>Compliance Tracking</li>
          </ul>

          <h2>Our Values</h2>
          <p>
            At GovBids, we believe in transparency, efficiency, and fairness. Our platform 
            is designed to level the playing field for all contractors while helping government 
            organizations make informed decisions about their construction projects.
          </p>
        </div>
      </main>
    </div>
  );
}
