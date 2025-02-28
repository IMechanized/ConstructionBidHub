import { Box, Navbar, UnstyledButton, Stack, rem } from '@mantine/core';
import { IconFileText, IconUsers, IconSettings, IconLayoutDashboard, IconAlertCircle } from '@tabler/icons-react';
import { Link } from "wouter";

interface MobileDashboardNavProps {
  userType: "government" | "contractor";
  currentPath: string;
}

export function MobileDashboardNav({ userType, currentPath }: MobileDashboardNavProps) {
  const navItems = userType === "government" 
    ? [
        {
          label: "RFPs",
          icon: IconFileText,
          href: "/dashboard",
          active: currentPath === "/dashboard"
        },
        {
          label: "New",
          icon: IconAlertCircle,
          href: "/dashboard/new",
          active: currentPath === "/dashboard/new"
        },
        {
          label: "Team",
          icon: IconUsers,
          href: "/dashboard/employees",
          active: currentPath === "/dashboard/employees"
        }
      ]
    : [
        {
          label: "RFPs",
          icon: IconFileText,
          href: "/dashboard",
          active: currentPath === "/dashboard"
        },
        {
          label: "Bids",
          icon: IconLayoutDashboard,
          href: "/dashboard/bids",
          active: currentPath === "/dashboard/bids"
        },
        {
          label: "Team",
          icon: IconUsers,
          href: "/dashboard/employees",
          active: currentPath === "/dashboard/employees"
        },
        {
          label: "Settings",
          icon: IconSettings,
          href: "/dashboard/settings",
          active: currentPath === "/dashboard/settings"
        }
      ];

  return (
    <Box className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t z-50">
      <Navbar height={64} p="md">
        <Navbar.Section grow>
          <Stack justify="center" align="center" gap={0}>
            <div className="flex w-full justify-around">
              {navItems.map((item) => (
                <UnstyledButton
                  key={item.label}
                  component={Link}
                  href={item.href}
                  className="flex-1 flex flex-col items-center justify-center px-2"
                  style={{
                    color: item.active ? 'var(--mantine-color-blue-6)' : 'inherit',
                  }}
                >
                  <item.icon
                    style={{ width: rem(24), height: rem(24) }}
                    stroke={1.5}
                  />
                  <Box mt={4} style={{ fontSize: rem(12) }}>
                    {item.label}
                  </Box>
                </UnstyledButton>
              ))}
            </div>
          </Stack>
        </Navbar.Section>
      </Navbar>
    </Box>
  );
}