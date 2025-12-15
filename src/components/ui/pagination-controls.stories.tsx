import type { Meta, StoryObj } from "@storybook/react";
import { PaginationControls } from "./pagination-controls";

const meta = {
  title: "UI/PaginationControls",
  component: PaginationControls,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    currentPage: { control: "number" },
    totalPages: { control: "number" },
    baseUrl: { control: "text" },
    hideOnSinglePage: { control: "boolean" },
    hasNextPage: { control: "boolean" },
  },
} satisfies Meta<typeof PaginationControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    currentPage: 1,
    totalPages: 10,
    baseUrl: "/items",
  },
};

export const MiddlePage: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
    baseUrl: "/items",
  },
};

export const LastPage: Story = {
  args: {
    currentPage: 10,
    totalPages: 10,
    baseUrl: "/items",
  },
};

export const SinglePageHidden: Story = {
  args: {
    currentPage: 1,
    totalPages: 1,
    baseUrl: "/items",
    hideOnSinglePage: true,
  },
};

export const SinglePageShown: Story = {
  args: {
    currentPage: 1,
    totalPages: 1,
    baseUrl: "/items",
    hideOnSinglePage: false,
  },
};

export const InfinitePagination: Story = {
  args: {
    currentPage: 1,
    totalPages: 0, 
    hasNextPage: true,
    baseUrl: "/items",
  },
};
