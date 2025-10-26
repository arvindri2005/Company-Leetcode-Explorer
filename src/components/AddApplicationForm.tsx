"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { addJobApplication } from "@/lib/firestore/jobApplications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobApplication } from "@/types/job-application";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function AddApplicationForm() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [location, setLocation] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [status, setStatus] =
    useState<JobApplication["status"]>("Saved");
  const [jobType, setJobType] =
    useState<JobApplication["jobType"]>("FULL TIME");
  const [dateApplied, setDateApplied] = useState(
    new Date().toISOString().split("T")[0]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast({
            title: "Authentication Error",
            description: "You must be logged in to add an application.",
            variant: "destructive",
        });
        return;
    };

    const newApplication: Omit<JobApplication, "id"> = {
      userId: user.uid,
      companyName,
      position,
      location,
      companyLogoUrl,
      status,
      jobType,
      dateApplied,
    };

    try {
        const id = await addJobApplication(newApplication);
        toast({
            title: "Application Added",
            description: "Your job application has been successfully added.",
        });
        router.push("/applications");
    } catch (error) {
        console.error("Failed to add job application:", error);
        toast({
            title: "Error",
            description: "Failed to add job application. Please try again.",
            variant: "destructive",
        });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="position">Position</Label>
        <Input
          id="position"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., San Francisco, CA"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="companyLogoUrl">Company Logo URL</Label>
        <Input
          id="companyLogoUrl"
          value={companyLogoUrl}
          onChange={(e) => setCompanyLogoUrl(e.target.value)}
          placeholder="https://example.com/logo.png"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
            value={status}
            onValueChange={(value) =>
                setStatus(value as JobApplication["status"])
            }
            >
            <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Saved">Saved</SelectItem>
                <SelectItem value="Applied">Applied</SelectItem>
                <SelectItem value="Interview">Interview</SelectItem>
                <SelectItem value="Offer">Offer</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
            </Select>
        </div>
        <div className="space-y-2">
            <Label htmlFor="jobType">Job Type</Label>
            <Select
            value={jobType}
            onValueChange={(value) =>
                setJobType(value as JobApplication["jobType"])
            }
            >
            <SelectTrigger id="jobType">
                <SelectValue placeholder="Select job type" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="FULL TIME">Full Time</SelectItem>
                <SelectItem value="PART TIME">Part Time</SelectItem>
                <SelectItem value="REMOTE">Remote</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
            </SelectContent>
            </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="dateApplied">Date Applied</Label>
        <Input
          id="dateApplied"
          type="date"
          value={dateApplied}
          onChange={(e) => setDateApplied(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full">Add Application</Button>
    </form>
  );
}
