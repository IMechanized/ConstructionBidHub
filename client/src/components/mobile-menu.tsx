import { Drawer, Button, Avatar, Text, Stack, Divider } from '@mantine/core';
import { IconMenu2 } from '@tabler/icons-react';
import { Link } from "wouter";
import { useState } from 'react';

interface MobileMenuProps {
  companyName?: string;
  logo?: string | null;
  onLogout: () => void;
}

export function MobileMenu({ companyName, logo, onLogout }: MobileMenuProps) {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Button
        variant="subtle"
        size="lg"
        className="md:hidden p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
        onClick={() => setOpened(true)}
      >
        <IconMenu2 size={24} />
      </Button>

      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
        position="right"
        size="85%"
        title="Menu"
      >
        <Stack gap="xl" mt="xl">
          {logo && (
            <Avatar
              src={logo}
              alt={`${companyName} logo`}
              size="xl"
              radius="xl"
              mx="auto"
            />
          )}
          {companyName && (
            <Text ta="center" size="lg" fw={500}>
              {companyName}
            </Text>
          )}

          <Divider my="sm" />

          <Button
            component={Link}
            href="/dashboard"
            variant="subtle"
            fullWidth
            size="lg"
            h={56}
            className="hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => setOpened(false)}
          >
            Dashboard
          </Button>

          <Button
            variant="subtle"
            fullWidth
            size="lg"
            h={56}
            className="hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => {
              onLogout();
              setOpened(false);
            }}
          >
            Logout
          </Button>
        </Stack>
      </Drawer>
    </>
  );
}