import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rfp, Bid, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Box, Button, Card, TextInput, Tabs, Stack, Title, Container, Group, Modal } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import RfpForm from "@/components/rfp-form";
import { Link } from "wouter";
import { MobileMenu } from "@/components/mobile-menu";
import { MobileDashboardNav } from "@/components/mobile-dashboard-nav";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [featuredPage, setFeaturedPage] = useState(1);
  const [availablePage, setAvailablePage] = useState(1);

  const { data: rfps, isLoading: loadingRfps } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: bids, isLoading: loadingBids } = useQuery<Bid[]>({
    queryKey: ["/api/bids"],
  });

  // Get the users map for easy lookup
  const usersMap = users?.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as { [key: number]: User }) ?? {};

  const myRfps = rfps?.filter((rfp) => rfp.organizationId === user?.id) || [];
  const availableRfps = rfps?.filter((rfp) => rfp.organizationId !== user?.id) || [];
  const featuredRfps = availableRfps.filter((rfp) => rfp.featured);
  const nonFeaturedRfps = availableRfps.filter((rfp) => !rfp.featured);

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
              <Tabs.Tab value="bids">My Bids</Tabs.Tab>
              <Tabs.Tab value="analytics" component={Link} href="/dashboard/analytics">Analytics</Tabs.Tab>
            </Tabs.List>

            <Box mt="md">
              <Tabs.Panel value="rfps">
                <Group justify="space-between" align="center" mb="lg">
                  <Title order={2}>My RFPs</Title>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    Create RFP
                  </Button>
                </Group>

                <Box mb="md">
                  <TextInput
                    placeholder="Search RFPs..."
                    leftSection={<IconSearch size="1rem" />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: '400px' }}
                  />
                </Box>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {myRfps.map((rfp) => (
                    <Card key={rfp.id} padding="md" radius="md" withBorder>
                      <Stack gap="md">
                        <Title order={3}>{rfp.title}</Title>
                        <Box className="text-sm text-muted-foreground line-clamp-3">
                          {rfp.description}
                        </Box>
                        <Stack gap="xs">
                          {bids?.filter(bid => bid.rfpId === rfp.id).map((bid) => (
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
                      </Stack>
                    </Card>
                  ))}
                </div>
              </Tabs.Panel>

              <Tabs.Panel value="bids">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {bids?.map((bid) => (
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
              </Tabs.Panel>
            </Box>
          </Tabs>
        </div>

        <MobileDashboardNav userType="contractor" currentPath={window.location.pathname} />

        <Modal
          opened={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New RFP"
          size="lg"
        >
          <RfpForm onSuccess={handleCreateSuccess} />
        </Modal>
      </Container>
    </Box>
  );
}