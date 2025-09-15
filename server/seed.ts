/**
 * Database Seeding Script
 * Creates test data for the FindConstructionBids platform including:
 * - User accounts (both contractors and government organizations)
 * - RFPs with varied requirements and deadlines
 * - Employee records
 * - RFI samples
 */

import { db } from "./db";
import { users, rfps, rfis } from "../shared/schema";
import { hashPassword } from "./auth";
import { faker } from "@faker-js/faker";

async function seed() {
  console.log("🌱 Starting seeding...");

  // Sample data for realistic construction industry details
  const trades = [
    "General Contractor",
    "Electrical",
    "Plumbing",
    "HVAC",
    "Roofing",
    "Masonry",
    "Carpentry",
    "Painting",
    "Landscaping",
    "Interior Design"
  ];

  const certifications = [
    "LEED Certified",
    "EPA Lead-Safe",
    "OSHA 30",
    "Master Electrician",
    "Master Plumber",
    "Energy Star Partner",
    "Green Building Professional",
    "Minority-Owned Business Enterprise (MBE)",
    "Women-Owned Business Enterprise (WBE)",
    "Service-Disabled Veteran-Owned Business"
  ];

  // Create 20 user accounts
  const userIds: number[] = [];

  for (let i = 0; i < 20; i++) {
    const [user] = await db.insert(users).values({
      email: faker.internet.email(),
      password: await hashPassword("password123"),
      companyName: faker.company.name(),
      contact: faker.person.fullName(),
      telephone: faker.phone.number(),
      cell: faker.phone.number(),
      businessEmail: faker.internet.email(),
      isMinorityOwned: faker.datatype.boolean(),
      minorityGroup: faker.helpers.arrayElement(["Asian", "Black", "Hispanic", "Native American", null]),
      trade: faker.helpers.arrayElement(trades),
      certificationName: faker.helpers.arrayElement([...certifications, null]),
      onboardingComplete: true,
      status: "active",
    }).returning({ id: users.id });

    userIds.push(user.id);
  }

  // Generate detailed RFP descriptions with specific sections
  const generateDescription = () => {
    const projectScope = [
      "New Construction",
      "Renovation",
      "Retrofit",
      "Maintenance",
      "Emergency Repair",
      "Upgrade",
      "Expansion"
    ];

    const buildingTypes = [
      "Office Building",
      "School",
      "Hospital",
      "Government Facility",
      "Community Center",
      "Library",
      "Fire Station",
      "Police Station",
      "Public Housing",
      "Transportation Hub"
    ];

    const projectOverview = `${faker.helpers.arrayElement(projectScope)} project for ${faker.helpers.arrayElement(buildingTypes)} located in ${faker.location.city()}, ${faker.location.state()}.`;
    const background = faker.lorem.paragraph(3);
    const objectives = Array.from({ length: 5 }, () => `- ${faker.commerce.productDescription()}`).join('\n');
    const scope = faker.lorem.paragraph(3);
    const requirements = Array.from({ length: 6 }, () => `- ${faker.lorem.sentence()}`).join('\n');
    const qualifications = Array.from({ length: 4 }, () => `- ${faker.company.catchPhrase()}`).join('\n');
    const timeline = faker.lorem.paragraph(2);
    const evaluation = Array.from({ length: 3 }, () => `- ${faker.lorem.sentence()}`).join('\n');

    return `Project Overview:
${projectOverview}

Background:
${background}

Project Objectives:
${objectives}

Scope of Work:
${scope}

Technical Requirements:
${requirements}

Required Qualifications:
${qualifications}

Project Timeline:
${timeline}

Evaluation Criteria:
${evaluation}`;
  };

  // Generate 50 RFPs
  const rfpIds: number[] = [];

  for (let i = 0; i < 50; i++) {
    // Generate dates ensuring logical sequence
    const now = new Date();

    const walkthroughDate = faker.date.between({
      from: now,
      to: faker.date.future({ years: 1, refDate: now })
    });

    const rfiDate = faker.date.between({
      from: walkthroughDate,
      to: faker.date.future({ years: 1/12, refDate: walkthroughDate })
    });

    const deadline = faker.date.between({
      from: rfiDate,
      to: faker.date.future({ years: 1/6, refDate: rfiDate })
    });

    const [rfp] = await db.insert(rfps).values({
      title: `${faker.helpers.arrayElement([
        "Construction of",
        "Renovation for",
        "Upgrade to",
        "Maintenance of",
        "Expansion of"
      ])} ${faker.company.catchPhrase()}`,
      description: generateDescription(),
      walkthroughDate,
      rfiDate,
      deadline,
      budgetMin: faker.number.int({ min: 50000, max: 5000000 }),
      certificationGoals: faker.helpers.arrayElements(certifications, { min: 1, max: 3 }),
      jobStreet: faker.location.streetAddress(),
      jobCity: faker.location.city(),
      jobState: faker.location.state(),
      jobZip: faker.location.zipCode(),
      portfolioLink: faker.internet.url(),
      status: faker.helpers.arrayElement(["open", "closed"]),
      organizationId: faker.helpers.arrayElement(userIds),
      featured: faker.datatype.boolean(),
    }).returning({ id: rfps.id });

    rfpIds.push(rfp.id);
  }

  // Generate RFIs for the RFPs
  for (const rfpId of rfpIds) {
    // Generate 2-5 RFIs per RFP
    const numRfis = faker.number.int({ min: 2, max: 5 });

    for (let i = 0; i < numRfis; i++) {
      // Get a random contractor (different from RFP creator)
      const availableContractors = userIds.filter(id => id !== rfpId);

      await db.insert(rfis).values({
        rfpId,
        email: faker.internet.email(),
        message: `Question regarding ${faker.helpers.arrayElement([
          "technical specifications",
          "timeline requirements",
          "budget constraints",
          "certification requirements",
          "material specifications",
          "safety protocols",
          "warranty terms"
        ])}:\n\n${faker.lorem.paragraph(3)}`,
        status: faker.helpers.arrayElement(["pending", "responded"]),
      });
    }
  }

  console.log("✅ Seeding complete!");
}

seed().catch(console.error);