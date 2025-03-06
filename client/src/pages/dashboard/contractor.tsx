import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Rfp, Rfi } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Card, TextInput, Tabs, Stack, Title, Container, Group, Box, Button } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import EmployeeManagement from "@/components/employee-management";
import { DashboardSectionSkeleton } from "@/components/skeletons";
import SettingsForm from "@/components/settings-form";
import { Link } from "wouter";
import { MobileMenu } from "@/components/mobile-menu";
import { MobileDashboardNav } from "@/components/mobile-dashboard-nav";
import { format } from "date-fns";

export default function ContractorDashboard() {
  const { user, logoutMutation } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [location] = useLocation();

  const { data: rfps, isLoading: loadingRfps } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const { data: rfis, isLoading: loadingRfis } = useQuery<(Rfi & { rfp: Rfp | null })[]>({
    queryKey: ["/api/rfis"],
  });

  const filteredRfps = rfps?.filter(
    (rfp) =>
      rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <Tabs.Tab value="rfis">My RFIs</Tabs.Tab>
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

                          {/*Removed RfiForm*/}
                        </Stack>
                      </Card>
                    ))}
                  </div>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="rfis">
                {loadingRfis ? (
                  <DashboardSectionSkeleton count={3} />
                ) : (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {rfis?.map((rfi) => (
                      <Card key={rfi.id} padding="md" radius="md" withBorder>
                        <Stack gap="md">
                          <Title order={3}>{rfi.rfp?.title || "Unknown RFP"}</Title>
                          <Box className="text-sm text-muted-foreground">
                            {rfi.message}
                          </Box>
                          <Box className="text-sm">
                            <Stack gap="xs">
                              <Group justify="space-between">
                                <Box className="font-medium">Status:</Box>
                                <Box className="capitalize">{rfi.status}</Box>
                              </Group>
                              <Group justify="space-between">
                                <Box className="font-medium">Submitted:</Box>
                                <Box>{format(new Date(rfi.createdAt), "PPp")}</Box>
                              </Group>
                            </Stack>
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