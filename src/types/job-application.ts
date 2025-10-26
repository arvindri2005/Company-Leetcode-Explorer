export interface JobApplication {
  id: string;
  userId: string;
  companyName: string;
  position: string;
  status: "Saved" | "Applied" | "Interview" | "Offer" | "Rejected";
  dateApplied: string;
  location?: string;
  jobType?: "REMOTE" | "FULL TIME" | "PART TIME" | "CONTRACT";
  companyLogoUrl?: string;
}
