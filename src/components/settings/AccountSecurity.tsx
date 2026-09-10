import { useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { api } from "@/api/client";
import { clearLocalAuth } from "@/auth/keycloak";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { clearAppliedTuningRuns } from "@/lib/tuningGenerator";

function DeleteAccountControl() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const email = user?.email || "";
  const matches = Boolean(email) && confirmation.trim().toLowerCase() === email.toLowerCase();

  const handleDelete = async (event: React.MouseEvent) => {
    event.preventDefault();
    if (!matches || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post<void>("/api/v1/account/delete", { confirmation_email: email });
      localStorage.removeItem("slm_engine_meta");
      clearAppliedTuningRuns();
      clearLocalAuth();
      window.location.assign("/");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Account deletion failed.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>{t("security.delete")}</Button>
      <AlertDialog open={open} onOpenChange={(next) => {
        if (submitting) return;
        setOpen(next);
        if (!next) {
          setConfirmation("");
          setError("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("security.deleteAccountTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("security.deleteAccountWarning")}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <p className="text-sm">{t("security.deleteAccountPrompt")}</p>
            <code className="block rounded bg-muted px-3 py-2 text-xs">{email}</code>
            <Label htmlFor="delete-account-confirmation">{t("security.emailConfirmation")}</Label>
            <Input id="delete-account-confirmation" type="email" autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={submitting} />
            <p className="text-xs text-muted-foreground">{t("security.engineDataNotDeleted")}</p>
            {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>{t("security.cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={!matches || submitting} onClick={handleDelete}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("security.deletePermanently")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function AccountSecurity() {
  const { t } = useLanguage();
  const { manageAccount } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" /> {t("security.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">{t("security.password")}</p>
            <p className="text-xs text-muted-foreground">{t("security.passwordDescription")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void manageAccount()}>{t("security.changePassword")}</Button>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">{t("security.mfa")}</p>
            <p className="text-xs text-muted-foreground">{t("security.mfaDescription")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void manageAccount()}>{t("security.manageMfa")}</Button>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-destructive">{t("security.deleteAccount")}</p>
            <p className="text-xs text-muted-foreground">{t("security.deleteAccountDescription")}</p>
          </div>
          <DeleteAccountControl />
        </div>
      </CardContent>
    </Card>
  );
}
