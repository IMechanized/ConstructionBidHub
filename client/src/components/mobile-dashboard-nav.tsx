import { Box, UnstyledButton, Stack, rem } from '@mantine/core';
import { IconFileText, IconLayoutDashboard, IconAlertCircle } from '@tabler/icons-react';
import { Link } from "wouter";

interface MobileDashboardNavProps {
  userType: "contractor";
  currentPath: string;
}

export function MobileDashboardNav({ userType, currentPath }: MobileDashboardNavProps) {
  const navItems = [
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
      label: "Analytics",
      icon: IconAlertCircle,
      href: "/dashboard/analytics",
      active: currentPath === "/dashboard/analytics"
    }
  ];

  return (
    <Box className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t z-50">
      <Stack h={64} justify="center" align="center" gap={0}>
        <div className="flex w-full justify-around items-stretch">
          {navItems.map((item) => (
            <UnstyledButton
              key={item.label}
              component={Link}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
    </Box>
  );
}