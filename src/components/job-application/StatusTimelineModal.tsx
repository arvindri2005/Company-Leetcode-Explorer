import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { JobApplication } from "@/types/job-application";

interface StatusTimelineModalProps {
  application: JobApplication;
  children: React.ReactNode;
}

export default function StatusTimelineModal({
  application,
  children,
}: StatusTimelineModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Status Timeline for {application.companyName} -{" "}
            {application.position}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <ul>
            {application.statusHistory.map((history, index) => (
              <li key={index} className="mb-2">
                <strong>{history.status}</strong> -{" "}
                {new Date(history.date).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
