import { db } from "./db";
import { users, rfps, bids } from "../shared/schema";
import { hashPassword } from "./auth";
import { faker } from "@faker-js/faker";

async function seed() {
  console.log("🌱 Starting seeding...");

  // Create 10 user accounts
  const userIds: number[] = [];

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
    "Green Building Professional"
  ];

  for (let i = 0; i < 10; i++) {
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

  // Generate 30 RFPs
  const rfpIds: number[] = [];

  const generateDescription = () => {
    const projectOverview = faker.lorem.paragraph(4);
    const background = faker.lorem.paragraph(3);
    const objectives = Array.from({ length: 5 }, () => faker.lorem.sentence()).join('\n');
    const scope = faker.lorem.paragraph(3);
    const requirements = Array.from({ length: 6 }, () => `- ${faker.lorem.sentence()}`).join('\n');
    const qualifications = Array.from({ length: 4 }, () => `- ${faker.lorem.sentence()}`).join('\n');
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

  for (let i = 0; i < 30; i++) {
    const startDate = faker.date.future();
    const [rfp] = await db.insert(rfps).values({
      title: faker.company.catchPhrase(),
      description: generateDescription(),
      walkthroughDate: faker.date.between({ from: startDate, to: faker.date.future({ refDate: startDate }) }),
      rfiDate: faker.date.between({ from: startDate, to: faker.date.future({ refDate: startDate }) }),
      deadline: faker.date.between({ from: startDate, to: faker.date.future({ refDate: startDate, years: 1 }) }),
      budgetMin: faker.number.int({ min: 50000, max: 5000000 }),
      certificationGoals: faker.helpers.arrayElement(certifications),
      jobLocation: `${faker.location.city()}, ${faker.location.state()}`,
      portfolioLink: faker.internet.url(),
      status: faker.helpers.arrayElement(["open", "closed"]),
      organizationId: faker.helpers.arrayElement(userIds),
      featured: faker.datatype.boolean(),
    }).returning({ id: rfps.id });

    rfpIds.push(rfp.id);
  }

  // Generate bids for RFPs
  for (const rfpId of rfpIds) {
    // Generate 2-5 bids per RFP
    const numBids = faker.number.int({ min: 2, max: 5 });

    for (let i = 0; i < numBids; i++) {
      // Ensure contractor is different from RFP creator
      const availableContractors = userIds.filter(id => id !== rfpId);

      await db.insert(bids).values({
        rfpId: rfpId,
        contractorId: faker.helpers.arrayElement(availableContractors),
        amount: faker.number.int({ min: 45000, max: 6000000 }),
        proposal: `Executive Summary:
${faker.lorem.paragraph(3)}

Technical Approach:
${faker.lorem.paragraph(2)}

Key Advantages:
- ${faker.lorem.sentence()}
- ${faker.lorem.sentence()}
- ${faker.lorem.sentence()}

Project Timeline:
${faker.lorem.paragraph()}

Cost Breakdown:
${faker.lorem.paragraph(2)}

Team Qualifications:
${faker.lorem.paragraph()}`,
      });
    }
  }

  console.log("✅ Seeding complete!");
}

seed().catch(console.error);