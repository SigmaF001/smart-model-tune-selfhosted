import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountSecurity } from "./AccountSecurity";

const mocks = vi.hoisted(() => ({
  manageAccount: vi.fn(),
  post: vi.fn(),
  clearLocalAuth: vi.fn(),
  clearAppliedTuningRuns: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { email: "user@example.com" }, manageAccount: mocks.manageAccount }),
}));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
vi.mock("@/api/client", () => ({ api: { post: mocks.post } }));
vi.mock("@/auth/keycloak", () => ({ clearLocalAuth: mocks.clearLocalAuth }));
vi.mock("@/lib/tuningGenerator", () => ({ clearAppliedTuningRuns: mocks.clearAppliedTuningRuns }));

describe("AccountSecurity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.post.mockRejectedValue(new Error("retry"));
  });

  it("opens the Keycloak account console for password and MFA management", () => {
    render(<AccountSecurity />);
    fireEvent.click(screen.getByRole("button", { name: "security.changePassword" }));
    fireEvent.click(screen.getByRole("button", { name: "security.manageMfa" }));
    expect(mocks.manageAccount).toHaveBeenCalledTimes(2);
  });

  it("requires the exact email before requesting account deletion", async () => {
    render(<AccountSecurity />);
    fireEvent.click(screen.getByRole("button", { name: "security.delete" }));

    const deleteButton = screen.getByRole("button", { name: "security.deletePermanently" });
    expect(deleteButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText("security.emailConfirmation"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(deleteButton);

    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith(
      "/api/v1/account/delete",
      { confirmation_email: "user@example.com" },
    ));
    expect(await screen.findByRole("alert")).toHaveTextContent("retry");
  });
});
