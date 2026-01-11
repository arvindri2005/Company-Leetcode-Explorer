
import type { Meta, StoryObj } from "@storybook/react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";

const meta = {
  title: "UI/Accordion",
  component: Accordion,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "radio",
      options: ["single", "multiple"],
      description: "Determines whether one or multiple items can be opened at the same time.",
    },
    collapsible: {
      control: "boolean",
      description: "When type is \"single\", allows closing content when clicking trigger for an open item.",
      if: { arg: "type", eq: "single" },
    },
    disabled: {
        control: "boolean",
        description: "Disables all accordion items (custom implementation for story)",
    }
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    type: "single",
    collapsible: true,
    className: "w-[450px]",
  },
  render: (args) => (
    <Accordion {...args}>
      <AccordionItem value="item-1" disabled={args.disabled}>
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" disabled={args.disabled}>
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that matches the other
          components&apos; aesthetic.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3" disabled={args.disabled}>
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>
          Yes. It&apos;s animated by default, but you can disable it if you prefer.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  args: {
    type: "multiple",
    className: "w-[450px]",
  },
  render: (args) => (
    <Accordion {...args}>
      <AccordionItem value="item-1" disabled={args.disabled}>
        <AccordionTrigger>First Item</AccordionTrigger>
        <AccordionContent>
          Here is the content for the first item. You can open multiple items at once.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" disabled={args.disabled}>
        <AccordionTrigger>Second Item</AccordionTrigger>
        <AccordionContent>
          Here is the content for the second item. You can open multiple items at once.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};






