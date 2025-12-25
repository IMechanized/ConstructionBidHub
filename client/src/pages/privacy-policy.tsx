import { Link } from "wouter";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { LandingPageHeader } from "@/components/landing-page-header";
import { Footer } from "@/components/ui/footer";

export default function PrivacyPolicyPage() {
  const breadcrumbItems = [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Privacy Policy",
      href: "/privacy-policy",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingPageHeader />
      <main className="container mx-auto px-6 py-12 flex-1">
        <BreadcrumbNav items={breadcrumbItems} />
        <h1 className="text-4xl font-bold mb-8" data-testid="text-page-title">Privacy Policy</h1>

        <div className="prose prose-slate max-w-none dark:prose-invert">
          <p className="lead">
            Last updated: December 2024
          </p>
          <p>
            FindConstructionBids ("we," "our," or "us") is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you use our construction bid management platform.
          </p>

          <h2>1. Information We Collect</h2>
          <p>We collect information that you provide directly to us, including:</p>
          
          <h3>Account Information</h3>
          <ul>
            <li>Email address and password</li>
            <li>First name and last name</li>
            <li>Job title</li>
          </ul>

          <h3>Company Information</h3>
          <ul>
            <li>Company name and website</li>
            <li>Business certifications (e.g., MBE, WBE, DBE)</li>
            <li>Trade specializations</li>
            <li>Company logo</li>
          </ul>

          <h3>Contact Information</h3>
          <ul>
            <li>Business telephone and cell phone numbers</li>
            <li>Business email address</li>
          </ul>

          <h3>RFP and Bid Information</h3>
          <ul>
            <li>Request for Proposal (RFP) details including project descriptions, locations, and budgets</li>
            <li>Request for Information (RFI) communications</li>
            <li>Bid submissions and related documents</li>
          </ul>

          <h3>Automatically Collected Information</h3>
          <ul>
            <li>IP address and browser type</li>
            <li>Device information</li>
            <li>Usage data and analytics (page views, RFP interactions)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul>
            <li>Provide, maintain, and improve our platform</li>
            <li>Connect government organizations with qualified contractors</li>
            <li>Facilitate the RFP/RFI process and bid submissions</li>
            <li>Send you notifications about bid opportunities and updates</li>
            <li>Generate analytics and performance reports</li>
            <li>Verify business certifications and compliance</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>3. Third-Party Services</h2>
          <p>
            We use trusted third-party services to help operate our platform. These services may have 
            access to your information only as necessary to perform their functions:
          </p>
          <ul>
            <li>
              <strong>Cloudinary</strong> - For secure image and document storage (company logos, RFP documents). 
              <a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline"> View their Privacy Policy</a>
            </li>
            <li>
              <strong>Amazon Web Services (AWS)</strong> - For cloud infrastructure and file storage. 
              <a href="https://aws.amazon.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline"> View their Privacy Policy</a>
            </li>
          </ul>

          <h2>4. Information Sharing</h2>
          <p>We may share your information in the following circumstances:</p>
          <ul>
            <li>
              <strong>Between Platform Users:</strong> Company profiles and bid information may be visible 
              to other registered users as part of the RFP process
            </li>
            <li>
              <strong>Service Providers:</strong> With third-party vendors who assist in operating our platform
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law or to protect our rights
            </li>
            <li>
              <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets
            </li>
          </ul>

          <h2>5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal 
            information, including:
          </p>
          <ul>
            <li>Encryption of data in transit and at rest</li>
            <li>Secure password hashing</li>
            <li>Regular security assessments</li>
            <li>Access controls and authentication</li>
          </ul>
          <p>
            However, no method of transmission over the Internet or electronic storage is 100% secure. 
            We cannot guarantee absolute security.
          </p>

          <h2>6. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed to 
            provide you services. We may retain certain information as required by law or for legitimate 
            business purposes, such as maintaining records for Good Faith Effort documentation.
          </p>

          <h2>7. Your Rights</h2>
          <p>Depending on your location, you may have the following rights:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Portability:</strong> Request your data in a portable format</li>
            <li><strong>Opt-out:</strong> Opt out of marketing communications</li>
          </ul>
          <p>
            To exercise these rights, please contact us using the information provided below.
          </p>

          <h2>8. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to enhance your experience, analyze platform usage, 
            and provide personalized content. You can control cookie preferences through your browser settings.
          </p>
          <p>We use the following types of cookies:</p>
          <ul>
            <li><strong>Essential Cookies:</strong> Required for platform functionality</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how users interact with the platform</li>
            <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
          </ul>

          <h2>9. Children's Privacy</h2>
          <p>
            Our platform is not intended for individuals under the age of 18. We do not knowingly collect 
            personal information from children. If we learn that we have collected information from a child, 
            we will take steps to delete it promptly.
          </p>

          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes 
            by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our data practices, please contact us at:
          </p>
          <ul>
            <li>Email: info@findconstructionbids.com</li>
            <li>Phone: (203) 520-1544</li>
          </ul>

          <div className="mt-8 pt-8 border-t">
            <p className="text-muted-foreground">
              See also our <Link href="/terms" className="text-primary hover:underline">Terms and Conditions</Link>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
