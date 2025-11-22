"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Pencil,
  Trash2,
  Search,
  ArrowLeft,
  Building2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import {
  fetchAllCompaniesAction,
  updateCompanyAction,
  deleteCompanyAction,
  bulkDeleteCompaniesAction,
} from "@/app/actions/manage-companies.actions";
import type { Company } from "@/types";

export default function ManageCompaniesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    website: string;
    logo: string;
    relatedCompanies: string;
  }>({
    name: "",
    description: "",
    website: "",
    logo: "",
    relatedCompanies: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Delete State
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCompanies(companies);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      setFilteredCompanies(
        companies.filter((c) =>
          c.name.toLowerCase().includes(lowerQuery)
        )
      );
    }
    // Clear selection when filter changes to avoid confusion
    setSelectedIds(new Set());
  }, [searchQuery, companies]);

  const loadCompanies = async () => {
    setIsLoading(true);
    try {
      const result = await fetchAllCompaniesAction();
      setCompanies(result.companies);
      setFilteredCompanies(result.companies);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Failed to load companies:", error);
      toast({
        title: "Error",
        description: "Failed to load companies.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCompanies.length && filteredCompanies.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCompanies.map((c) => c.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleEditClick = (company: Company) => {
    setEditingCompany(company);
    setEditForm({
      name: company.name,
      description: company.description || "",
      website: company.website || "",
      logo: company.logo || "",
      relatedCompanies: (company.relatedCompanies || []).join(", "),
    });
    setIsEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingCompany || !user) return;

    setIsSaving(true);
    try {
      const relatedCompaniesArray = editForm.relatedCompanies
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const updates: Partial<Company> = {
        name: editForm.name,
        description: editForm.description,
        website: editForm.website,
        logo: editForm.logo,
        relatedCompanies: relatedCompaniesArray,
      };

      const result = await updateCompanyAction(user.uid, editingCompany.id, updates);

      if (result.success) {
        toast({
          title: "Success",
          description: "Company updated successfully.",
        });
        setIsEditOpen(false);
        loadCompanies(); // Reload data
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update company.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (company: Company) => {
    setCompanyToDelete(company);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!companyToDelete || !user) return;

    setIsDeleting(true);
    try {
      const result = await deleteCompanyAction(user.uid, companyToDelete.id);

      if (result.success) {
        toast({
          title: "Success",
          description: `Company "${companyToDelete.name}" deleted.`,
        });
        setIsDeleteOpen(false);
        setCompanyToDelete(null);
        loadCompanies(); // Reload data
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete company.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.size === 0 || !user) return;

    setIsBulkDeleting(true);
    try {
      const result = await bulkDeleteCompaniesAction(
        user.uid,
        Array.from(selectedIds)
      );

      if (result.success) {
        toast({
          title: "Success",
          description: `${result.deletedCount || selectedIds.size} companies deleted.`,
        });
        setIsBulkDeleteOpen(false);
        setSelectedIds(new Set());
        loadCompanies(); // Reload data
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to bulk delete companies.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="container py-10 space-y-8">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Companies</h1>
          <p className="text-muted-foreground">
            View, edit, or delete companies.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 max-w-sm flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>
        
        {selectedIds.size > 0 && (
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => setIsBulkDeleteOpen(true)}
            className="ml-4"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected ({selectedIds.size})
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={filteredCompanies.length > 0 && selectedIds.size === filteredCompanies.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-[80px]">Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Slug</TableHead>
                <TableHead className="hidden md:table-cell">Problem Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No companies found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((company) => (
                  <TableRow key={company.id} data-state={selectedIds.has(company.id) && "selected"}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.has(company.id)}
                        onCheckedChange={() => toggleSelectOne(company.id)}
                        aria-label={`Select ${company.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      {company.logo ? (
                        <img
                          src={company.logo}
                          alt={company.name}
                          className="h-8 w-8 object-contain rounded-sm"
                        />
                      ) : (
                        <div className="h-8 w-8 bg-muted rounded-sm flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {company.slug}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {company.problemCount}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(company)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteClick(company)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>
              Update company details below. Slug cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug (Read-only)</Label>
              <Input
                id="slug"
                value={editingCompany?.slug || ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                value={editForm.logo}
                onChange={(e) => setEditForm({ ...editForm, logo: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="related">Related Companies (comma-separated)</Label>
              <Input
                id="related"
                value={editForm.relatedCompanies}
                onChange={(e) => setEditForm({ ...editForm, relatedCompanies: e.target.value })}
                placeholder="Google, Facebook, Amazon"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the company
              <span className="font-semibold text-foreground"> "{companyToDelete?.name}" </span>
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Alert */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete 
              <span className="font-semibold text-foreground"> {selectedIds.size} companies </span>
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleBulkDeleteConfirm();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete All"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
