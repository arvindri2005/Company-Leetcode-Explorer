import React from "react"
import { render, screen } from "@testing-library/react"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb"

describe("Breadcrumb", () => {
  it("renders breadcrumb structure correctly", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Current Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )

    const nav = screen.getByRole("navigation")
    expect(nav).toHaveAttribute("aria-label", "breadcrumb")

    const list = screen.getByRole("list")
    expect(list).toBeInTheDocument()

    const link = screen.getByRole("link", { name: /home/i })
    expect(link).toHaveAttribute("href", "/")

    const currentPage = screen.getByText("Current Page")
    expect(currentPage).toHaveAttribute("aria-current", "page")
  })

  it("renders separators correctly", () => {
    render(
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator data-testid="separator" />
                <BreadcrumbItem>
                    <BreadcrumbPage>Current Page</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    )

    const separator = screen.getByTestId("separator")
    expect(separator).toBeInTheDocument()
    expect(separator).toHaveAttribute("aria-hidden", "true")
  })
})
