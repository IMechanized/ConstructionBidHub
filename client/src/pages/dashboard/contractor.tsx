import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Rfp, Bid } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Box, Button, Card, TextInput, Tabs, Stack, Title, Container, Group } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import BidForm from "@/components/bid-form";
import EmployeeManagement from "@/components/employee-management";
import { DashboardSectionSkeleton, BidCardSkeleton } from "@/components/skeletons";
import SettingsForm from "@/components/settings-form";
import { Link } from "wouter";
import { MobileMenu } from "@/components/mobile-menu";
import { MobileDashboardNav } from "@/components/mobile-dashboard-nav";

export default function ContractorDashboard() {
  const { user, logoutMutation } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [location] = useLocation();

  const { data: rfps, isLoading: loadingRfps } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const { data: bids, isLoading: loadingBids } = useQuery<Bid[]>({
    queryKey: ["/api/rfps/bids"],
  });

  const filteredRfps = rfps?.filter(
    (rfp) =>
      rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const myBids = bids?.filter((bid) => bid.contractorId === user?.id);

  return (
    <Box className="min-h-screen bg-white dark:bg-gray-900 pb-16 md:pb-0">
      <Box component="header" className="border-b sticky top-0 bg-white dark:bg-gray-900 z-50">
        <Container size="lg">
          <Group justify="space-between" align="center" h={56}>
            <Link href="/" className="text-xl md:text-2xl font-bold hover:text-primary transition-colors truncate flex-shrink">
              FindConstructionBids
            </Link>
            <MobileMenu
              companyName={user?.companyName}
              logo={user?.logo}
              onLogout={() => logoutMutation.mutate()}
            />
          </Group>
        </Container>
      </Box>

      <Container size="lg" py="md">
        <div className="hidden md:block">
          <Tabs defaultValue="rfps">
            <Tabs.List grow>
              <Tabs.Tab value="rfps">Available RFPs</Tabs.Tab>
              <Tabs.Tab value="bids">My Bids</Tabs.Tab>
              <Tabs.Tab value="employees">Employee Management</Tabs.Tab>
              <Tabs.Tab value="settings">Settings</Tabs.Tab>
            </Tabs.List>

            <Box mt="md">
              <Tabs.Panel value="rfps">
                <Box mb="md">
                  <TextInput
                    placeholder="Search RFPs..."
                    leftSection={<IconSearch size="1rem" />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: '400px' }}
                  />
                </Box>

                {loadingRfps ? (
                  <DashboardSectionSkeleton count={6} />
                ) : (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredRfps?.map((rfp) => (
                      <Card key={rfp.id} padding="md" radius="md" withBorder>
                        <Stack gap="md">
                          <Title order={3}>{rfp.title}</Title>
                          <Box className="text-sm text-muted-foreground line-clamp-3">
                            {rfp.description}
                          </Box>
                          <Stack gap="xs">
                            <Group justify="space-between">
                              <Box className="font-medium">Location:</Box>
                              <Box>{rfp.jobLocation}</Box>
                            </Group>
                            <Group justify="space-between">
                              <Box className="font-medium">Budget:</Box>
                              <Box>
                                {rfp.budgetMin
                                  ? `$${rfp.budgetMin.toLocaleString()}`
                                  : "Not specified"}
                              </Box>
                            </Group>
                            <Group justify="space-between">
                              <Box className="font-medium">Walkthrough:</Box>
                              <Box>{new Date(rfp.walkthroughDate).toLocaleString()}</Box>
                            </Group>
                            <Group justify="space-between">
                              <Box className="font-medium">RFI Due:</Box>
                              <Box>{new Date(rfp.rfiDate).toLocaleString()}</Box>
                            </Group>
                            <Group justify="space-between">
                              <Box className="font-medium">Deadline:</Box>
                              <Box>{new Date(rfp.deadline).toLocaleString()}</Box>
                            </Group>
                          </Stack>

                          {rfp.certificationGoals && (
                            <Stack gap="xs">
                              <Box className="font-medium">Certification Goals:</Box>
                              <Box className="text-sm text-muted-foreground">
                                {rfp.certificationGoals}
                              </Box>
                            </Stack>
                          )}

                          <BidForm rfpId={rfp.id} />
                        </Stack>
                      </Card>
                    ))}
                  </div>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="bids">
                {loadingBids ? (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} padding="md" radius="md" withBorder>
                        <BidCardSkeleton />
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {myBids?.map((bid) => (
                      <Card key={bid.id} padding="md" radius="md" withBorder>
                        <Stack gap="md">
                          <Title order={3}>Bid for RFP #{bid.rfpId}</Title>
                          <Box className="text-sm text-muted-foreground line-clamp-3">
                            {bid.proposal}
                          </Box>
                          <Box className="text-sm">
                            Amount: ${bid.amount.toLocaleString()}
                          </Box>
                        </Stack>
                      </Card>
                    ))}
                  </div>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="employees">
                <EmployeeManagement />
              </Tabs.Panel>

              <Tabs.Panel value="settings">
                <SettingsForm />
              </Tabs.Panel>
            </Box>
          </Tabs>
        </div>

        <MobileDashboardNav userType="contractor" currentPath={location} />
      </Container>
    </Box>
  );
}