export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">Terms and Conditions</h1>

        <div className="prose prose-slate max-w-none">
          <p className="lead">
            Please read these terms and conditions carefully before using the FindConstructionBids platform.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using the FindConstructionBids platform, you acknowledge that you have read, 
            understood, and agree to be bound by these Terms and Conditions.
          </p>

          <h2>2. User Accounts</h2>
          <p>
            Users must maintain accurate, complete, and up-to-date account information. 
            Users are responsible for safeguarding their account credentials and for all 
            activities that occur under their account.
          </p>

          <h2>3. Platform Usage</h2>
          <p>
            Users agree to use the platform only for lawful purposes and in accordance 
            with these Terms. Users must not:
          </p>
          <ul>
            <li>Submit false or misleading information</li>
            <li>Interfere with the platform's security features</li>
            <li>Use the platform for unauthorized commercial purposes</li>
            <li>Attempt to access other users' accounts</li>
          </ul>

          <h2>4. RFPs and Bids</h2>
          <p>
            Government organizations are responsible for the accuracy of their RFPs. 
            Contractors must ensure their bids comply with all specified requirements 
            and regulations.
          </p>

          <h2>5. Privacy and Data Protection</h2>
          <p>
            We collect and process personal data in accordance with our Privacy Policy. 
            By using the platform, you consent to such processing and warrant that all 
            data provided is accurate.
          </p>

          <h2>6. Liability</h2>
          <p>
            FindConstructionBids is not liable for any indirect, incidental, special, consequential, 
            or punitive damages resulting from your use of the platform.
          </p>

          <h2>7. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Users will be 
            notified of significant changes via email or platform notifications.
          </p>

          <h2>8. Contact Information</h2>
          <p>
            For questions about these Terms and Conditions, please contact us at:
            info@findconstructionbids.com
          </p>
        </div>
      </main>
    </div>
  );
}