import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import type { Meta, StoryObj } from '@storybook/react';
import { type User } from "@supabase/supabase-js";

import UserInfoCard from './user-info-card';

const meta: Meta<typeof UserInfoCard> = {
  title: 'Profile/UserInfoCard',
  component: UserInfoCard,
  decorators: [
    (Story) => {
      const methods = useForm({
        defaultValues: {
          displayName: 'Test User',
        },
      });
      return (
        <FormProvider {...methods}>
          <Story />
        </FormProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof UserInfoCard>;

const mockUser = {
  id: '123',
  aud: 'authenticated',
  email: 'test@example.com',
  email_confirmed_at: '2023-01-01T00:00:00.000Z',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user_metadata: {
    display_name: 'Test User',
    avatar_url: 'https://github.com/shadcn.png',
  },
  app_metadata: {},
} as unknown as User;

export const Default: Story = {
  args: {
    user: mockUser,
    isEditingDisplayName: false,
    setIsEditingDisplayName: () => {},
    onSubmitDisplayName: async () => {},
    isSubmittingDisplayName: false,
    handleLogout: async () => {},
    getInitials: (name) => name ? name.substring(0, 2).toUpperCase() : 'AU',
  },
};

export const Editing: Story = {
  args: {
    ...Default.args,
    isEditingDisplayName: true,
  },
};
