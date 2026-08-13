'use client';

import { CheckCircle, Phone, Users, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn, getAvatarInitials } from '@/lib/utils';
import type { UnifiedUser } from '@/types/admin';

interface ReviewApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'approve' | 'reject';
  user: UnifiedUser | null;
  notes: string;
  onNotesChange: (notes: string) => void;
  isTestUser: boolean;
  onIsTestUserChange: (isTestUser: boolean) => void;
  submitting: boolean;
  onSubmit: () => void;
}

/** Approve/reject confirmation for a pending mentor or mentee application. */
export function ReviewApplicationDialog({
  open,
  onOpenChange,
  action,
  user,
  notes,
  onNotesChange,
  isTestUser,
  onIsTestUserChange,
  submitting,
  onSubmit,
}: ReviewApplicationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === 'approve' ? 'Approve Application' : 'Reject Application'}
          </DialogTitle>
          <DialogDescription>
            {action === 'approve'
              ? `Are you sure you want to approve ${user?.name || 'this user'}'s ${user?.applicationInfo?.type || 'mentor'} application?`
              : `Are you sure you want to reject ${user?.name || 'this user'}'s ${user?.applicationInfo?.type || 'mentor'} application?`
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="review-notes" className={cn(
              "flex items-center gap-2",
              action === 'approve' ? "text-brand" : "text-destructive"
            )}>
              {action === 'approve' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )}
              {action === 'approve' ? 'Notes (optional)' : 'Reason for rejection (required)'}
            </Label>
            <Textarea
              id="review-notes"
              placeholder={action === 'approve'
                ? 'Add any notes about this approval...'
                : 'Please provide a reason for rejecting this application...'
              }
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>
          {action === 'approve' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="review-test-user"
                checked={isTestUser}
                onCheckedChange={(checked) => onIsTestUserChange(checked === true)}
              />
              <Label
                htmlFor="review-test-user"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Mark as test user
              </Label>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting || (action === 'reject' && !notes.trim())}
            variant={action === 'reject' ? 'destructive' : 'default'}
          >
            {submitting ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface UserActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionType: 'suspend' | 'delete' | null;
  user: UnifiedUser | null;
  processing: boolean;
  onConfirm: () => void;
}

/** Confirmation for suspending or deleting a single account. */
export function UserActionDialog({
  open,
  onOpenChange,
  actionType,
  user,
  processing,
  onConfirm,
}: UserActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {actionType === 'suspend' ? 'Suspend User' : 'Delete User'}
          </DialogTitle>
          <DialogDescription>
            {actionType === 'suspend'
              ? `Are you sure you want to suspend ${user?.name || 'this user'}? They will no longer be able to access their account.`
              : `Are you sure you want to delete ${user?.name || 'this user'}? This action cannot be undone.`
            }
          </DialogDescription>
        </DialogHeader>
        {user && (
          <div className="py-4">
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.image || undefined} alt={user.name || ''} />
                <AvatarFallback>{getAvatarInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name || 'Unknown User'}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={processing}
            variant="destructive"
          >
            {processing
              ? 'Processing...'
              : actionType === 'suspend'
                ? 'Suspend User'
                : 'Delete User'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UnifiedUser | null;
  formData: { name: string; phone: string };
  onFormDataChange: (update: (prev: { name: string; phone: string }) => { name: string; phone: string }) => void;
  saving: boolean;
  onSave: () => void;
}

/** Edits the two writable fields on a registered account. */
export function EditUserDialog({
  open,
  onOpenChange,
  user,
  formData,
  onFormDataChange,
  saving,
  onSave,
}: EditUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information for {user?.name || 'this user'}
          </DialogDescription>
        </DialogHeader>
        {user && (
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg mb-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.image || undefined} alt={user.name || ''} />
                <AvatarFallback>{getAvatarInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name || 'Unknown User'}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-navy flex items-center gap-2">
                <Users className="w-4 h-4" />
                Name
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => onFormDataChange(prev => ({ ...prev, name: e.target.value }))}
                placeholder="User name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="text-periwinkle flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone
              </Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => onFormDataChange(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
