import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Rfp, Bid } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Box, Button, Card, Tabs, Stack, Title, Container, Group } from '@mantine/core';
import BidForm from "@/components/bid-form";
import EmployeeManagement from "@/components/employee-management";
import { DashboardSectionSkeleton, BidCardSkeleton } from "@/components/skeletons";
import { RfpCard } from "@/components/rfp-card";
import { Link } from "wouter";
import { MobileMenu } from "@/components/mobile-menu";
import { MobileDashboardNav } from "@/components/mobile-dashboard-nav";

export default function GovernmentDashboard() {
  const { user, logoutMutation } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [location] = useLocation();

  const { data: rfps, isLoading: loadingRfps } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const { data: bids, isLoading: loadingBids } = useQuery<Bid[]>({
    queryKey: ["/api/rfps/bids"],
  });

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const myRfps = rfps?.filter((rfp) => rfp.organizationId === user?.id);
  const newRfps = rfps?.filter((rfp) =>
    !rfp.featured &&
    new Date(rfp.createdAt) > twentyFourHoursAgo
  );

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
  };

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
              <Tabs.Tab value="rfps">RFP Management</Tabs.Tab>
              <Tabs.Tab value="new">New RFPs</Tabs.Tab>
              <Tabs.Tab value="employees">Employee Management</Tabs.Tab>
            </Tabs.List>

            <Box mt="md">
              <Tabs.Panel value="rfps">
                <Group justify="space-between" align="center" mb="lg">
                  <Title order={2}>My RFPs</Title>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    Create RFP
                  </Button>
                </Group>

                {loadingRfps ? (
                  <DashboardSectionSkeleton count={6} />
                ) : (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {myRfps?.map((rfp) => (
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

                          <Box>
                            <Title order={4} mb="sm">Bids</Title>
                            {loadingBids ? (
                              <Stack gap="sm">
                                {Array.from({ length: 2 }).map((_, i) => (
                                  <Box key={i} p="sm" bg="gray.1" style={{ borderRadius: 8 }}>
                                    <BidCardSkeleton />
                                  </Box>
                                ))}
                              </Stack>
                            ) : (
                              <Stack gap="sm">
                                {bids
                                  ?.filter((bid) => bid.rfpId === rfp.id)
                                  .map((bid) => (
                                    <Box key={bid.id} p="sm" bg="gray.1" style={{ borderRadius: 8 }}>
                                      <Group justify="space-between" mb="xs">
                                        <Box>Bid Amount: ${bid.amount.toLocaleString()}</Box>
                                        <Box>Contractor #{bid.contractorId}</Box>
                                      </Group>
                                      <Box className="text-sm text-muted-foreground line-clamp-3">
                                        {bid.proposal}
                                      </Box>
                                    </Box>
                                  ))}
                              </Stack>
                            )}
                          </Box>
                        </Stack>
                      </Card>
                    ))}
                  </div>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="new">
                <Title order={2} mb="lg">New RFPs (Last 24 Hours)</Title>
                {loadingRfps ? (
                  <DashboardSectionSkeleton count={6} />
                ) : (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {newRfps?.map((rfp) => (
                      <RfpCard
                        key={rfp.id}
                        rfp={rfp}
                        isNew
                      />
                    ))}
                  </div>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="employees">
                <EmployeeManagement />
              </Tabs.Panel>
            </Box>
          </Tabs>
        </div>

        <MobileDashboardNav userType="government" currentPath={location} />
      </Container>
    </Box>
  );
}