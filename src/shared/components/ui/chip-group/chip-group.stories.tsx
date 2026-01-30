import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { ChipGroup } from "./chip-group";

const meta = {
  title: "UI/ChipGroup",
  component: ChipGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    multiple: {
      control: "boolean",
    },
  },
  args: {
    onChange: () => {},
  },
} satisfies Meta<typeof ChipGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const options = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "angular", label: "Angular" },
  { value: "svelte", label: "Svelte" },
  { value: "nextjs", label: "Next.js" },
];

export const SingleSelection: Story = {
  args: {
    options,
    value: "react",
  },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useState(args.value);
    return (
      <ChipGroup
        {...args}
        value={value}
        onChange={(val) => {
          setValue(val);
          args.onChange();
        }}
      />
    );
  },
};

export const MultipleSelection: Story = {
  args: {
    options,
    value: ["react", "nextjs"],
    multiple: true,
  },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useState(args.value);
    return (
      <ChipGroup
        {...args}
        value={value}
        onChange={(val) => {
          setValue(val);
          args.onChange();
        }}
      />
    );
  },
};






