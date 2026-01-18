import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import type { Meta, StoryObj } from '@storybook/react';
import { type User } from 'firebase/auth';

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
  uid: '123',
  displayName: 'Test User',
  email: 'test@example.com',
  emailVerified: true,
  metadata: { creationTime: new Date().toISOString() },
  photoURL: 'https://github.com/shadcn.png',
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
