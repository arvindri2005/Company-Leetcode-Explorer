import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

describe("Tabs", () => {
  it("renders correctly and switches tabs", async () => {
    // 1. Setup the userEvent instance before rendering
    const user = userEvent.setup();

    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    // Initial check
    expect(screen.getByText("Content 1")).toBeInTheDocument();
    expect(screen.queryByText("Content 2")).not.toBeInTheDocument();

    // 2. Use `await user.click` instead of fireEvent
    const tab2 = screen.getByText("Tab 2");
    await user.click(tab2);

    // 3. Use `findByText` (which is async) to wait for the element to appear
    expect(await screen.findByText("Content 2")).toBeInTheDocument();
    
    // 4. Verify Content 1 is gone
    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
  });
});





