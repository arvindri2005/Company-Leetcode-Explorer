
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// ESM dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CWD = process.cwd();
const UI_DIR = path.join(CWD, 'src', 'components', 'ui');
const INDEX_FILE = path.join(UI_DIR, 'index.ts');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  info: (msg: string) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}✔ ${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}✖ ${msg}${colors.reset}`),
};

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function toPascalCase(str: string): string {
  return str
    .replace(/(^\w|-\w)/g, (clear) => clear.replace(/-/, '').toUpperCase());
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

const templates = {
  component: (name: string, camelName: string) => `import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const ${camelName}Variants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ${name}Props
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof ${camelName}Variants> {}

function ${name}({ className, variant, size, ...props }: ${name}Props) {
  return (
    <div
      className={cn(${camelName}Variants({ variant, size, className }))}
      {...props}
    />
  );
}

export { ${name}, ${camelName}Variants };
`,

  test: (name: string, kebabName: string) => `
import { render, screen } from "@testing-library/react";
import { ${name} } from "./${kebabName}";

describe("${name}", () => {
  it("renders correctly with default props", () => {
    render(<${name}>Default</${name}>);
    const element = screen.getByText("Default");
    expect(element).toBeInTheDocument();
    expect(element).toHaveClass("bg-primary");
  });

  it("applies variant classes", () => {
    render(<${name} variant="destructive">Destructive</${name}>);
    const element = screen.getByText("Destructive");
    expect(element).toHaveClass("bg-destructive");
  });

  it("applies size classes", () => {
    render(<${name} size="sm">Small</${name}>);
    const element = screen.getByText("Small");
    expect(element).toHaveClass("h-9");
  });
});
`,

  story: (name: string, kebabName: string) => `
import type { Meta, StoryObj } from "@storybook/react";
import { ${name} } from "./${kebabName}";

const meta = {
  title: "UI/${name}",
  component: ${name},
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
  },
} satisfies Meta<typeof ${name}>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "default",
    children: "${name}",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Destructive",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary",
  },
};
`,
};

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function updateIndexFile(kebabName: string) {
  if (!fs.existsSync(INDEX_FILE)) {
    log.warn(`Index file not found at ${INDEX_FILE}, creating it.`);
    fs.writeFileSync(INDEX_FILE, '');
  }

  const exportStatement = `export * from "./${kebabName}";`;
  const content = fs.readFileSync(INDEX_FILE, 'utf-8');
  
  if (content.includes(exportStatement)) {
    log.info('Export already exists in index.ts');
    return;
  }

  const lines = content.split('\n').filter(Boolean);
  lines.push(exportStatement);
  lines.sort();

  fs.writeFileSync(INDEX_FILE, lines.join('\n') + '\n');
  log.success(`Updated ${path.basename(INDEX_FILE)}`);
}

async function main() {
  const args = process.argv.slice(2);
  let componentName = args[0];

  if (!componentName) {
    componentName = await prompt(`${colors.cyan}? Component name (e.g. UserCard): ${colors.reset}`);
  }

  if (!componentName) {
    log.error('Component name is required.');
    process.exit(1);
  }

  const kebabName = toKebabCase(componentName);
  const pascalName = toPascalCase(componentName);
  const camelName = toCamelCase(componentName);

  log.info(`Generating component: ${colors.bold}${pascalName}${colors.reset} (${kebabName})`);

  const files = [
    {
      name: `${kebabName}.tsx`,
      content: templates.component(pascalName, camelName),
    },
    {
      name: `${kebabName}.test.tsx`,
      content: templates.test(pascalName, kebabName),
    },
    {
      name: `${kebabName}.stories.tsx`,
      content: templates.story(pascalName, kebabName),
    },
  ];

  let hasError = false;

  for (const file of files) {
    const filePath = path.join(UI_DIR, file.name);
    
    if (fs.existsSync(filePath)) {
      log.warn(`File ${file.name} already exists. Skipping.`);
      continue;
    }

    try {
      fs.writeFileSync(filePath, file.content);
      log.success(`Created ${file.name}`);
    } catch (err: any) {
      log.error(`Failed to create ${file.name}: ${err.message}`);
      hasError = true;
    }
  }

  if (!hasError) {
    try {
      updateIndexFile(kebabName);
    } catch (err: any) {
      log.error(`Failed to update index.ts: ${err.message}`);
    }
    console.log(`\n${colors.green}${colors.bold}✨ Component generated successfully!${colors.reset}\n`);
  } else {
    process.exit(1);
  }
}

main().catch((err) => {
  log.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
