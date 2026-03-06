import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, X, Clock, AlertCircle, CheckCircle2, Menu, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

const kycSchema = (t: any) => z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"), // Translation for validation can be added if needed
  idType: z.string().min(1, "Please select an ID type"),
});

// IndexedDB logic for file persistence
const DB_NAME = "kyc_file_db";
const STORE_NAME = "files";
const FILE_KEY = "current_document";

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const KYC = () => {
  const { language, isRTL } = useLanguage();
  const t = translations[language].kyc;
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { setIsMobileSidebarOpen } = useOutletContext<any>() || { setIsMobileSidebarOpen: () => { } };
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecovered, setIsRecovered] = useState(false);
  const [fileRecovered, setFileRecovered] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  // Persistence keys
  const STORAGE_KEY_NAME = "kyc_draft_name";
  const STORAGE_KEY_TYPE = "kyc_draft_type";

  const form = useForm<z.infer<ReturnType<typeof kycSchema>>>({
    resolver: zodResolver(kycSchema(t)),
    defaultValues: {
      fullName: localStorage.getItem(STORAGE_KEY_NAME) || profile?.display_name || "",
      idType: localStorage.getItem(STORAGE_KEY_TYPE) || ""
    },
  });

  // Handle preview and cleanup
  React.useEffect(() => {
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  // Restore data from Persistence on mount
  React.useEffect(() => {
    const restoreData = async () => {
      try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readonly");
        const request = tx.objectStore(STORE_NAME).get(FILE_KEY);

        request.onsuccess = () => {
          if (request.result instanceof File) {
            setFile(request.result);
            setFileRecovered(true);
            setIsRecovered(true);
            console.log("KYC: File recovered successfully");
          } else {
            console.log("KYC: No file found in IndexedDB");
          }
          setIsRestoring(false);
        };

        request.onerror = (e) => {
          console.error("KYC: Error reading from IndexedDB", e);
          setIsRestoring(false);
        };

        const savedName = localStorage.getItem(STORAGE_KEY_NAME);
        const savedType = localStorage.getItem(STORAGE_KEY_TYPE);
        if (savedName || savedType) {
          setIsRecovered(true);
        }
      } catch (err) {
        console.error("KYC: Failed to restore draft:", err);
        setIsRestoring(false);
      }
    };

    restoreData();
  }, []);

  // Persist form fields to localStorage
  const fullNameValue = form.watch("fullName");
  const idTypeValue = form.watch("idType");

  React.useEffect(() => {
    if (fullNameValue) localStorage.setItem(STORAGE_KEY_NAME, fullNameValue);
  }, [fullNameValue]);

  React.useEffect(() => {
    if (idTypeValue) localStorage.setItem(STORAGE_KEY_TYPE, idTypeValue);
  }, [idTypeValue]);

  const handleFileChange = async (newFile: File | null) => {
    if (newFile && newFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "The identity document must be smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    setFile(newFile);
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      if (newFile) {
        tx.objectStore(STORE_NAME).put(newFile, FILE_KEY);
      } else {
        tx.objectStore(STORE_NAME).delete(FILE_KEY);
      }
    } catch (err) {
      console.error("Failed to sync KYC document to IndexedDB:", err);
    }
  };

  const clearPersistence = async () => {
    localStorage.removeItem(STORAGE_KEY_NAME);
    localStorage.removeItem(STORAGE_KEY_TYPE);
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(FILE_KEY);
    } catch (err) {
      console.error("Failed to clear KYC draft from IndexedDB:", err);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  }, []);

  const onSubmit = async (values: z.infer<ReturnType<typeof kycSchema>>) => {
    if (!file) {
      toast({ title: "Missing Document", description: "Please upload an identity document.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const fileExt = file.name.split(".").pop();
      const storageId = profile?.id || profile?.user_id;
      const filePath = `${storageId}/kyc-${Date.now()}.${fileExt}`;

      console.log("KYC: Starting upload to path:", filePath);

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error("KYC: Storage upload error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("receipts")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase.from("profiles").update({
        kyc_status: "pending" as any,
        display_name: values.fullName,
        kyc_document_url: publicUrl,
        kyc_rejection_reason: null, // Clear any previous reasons on re-submit
        show_kyc_notification: false // Hide notification on re-submit
      }).eq("user_id", profile?.user_id);

      if (updateError) throw updateError;

      toast({
        title: "KYC Submitted",
        description: `Thank you, ${values.fullName}. Your documents are under review.`
      });

      await clearPersistence();
      await refreshProfile();
      form.reset();
      setFile(null);
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profile?.kyc_status && profile.kyc_status !== 'none' && profile.kyc_status !== 'rejected') {
    const status = profile.kyc_status;
    const isPending = status === 'pending';
    const isApproved = status === 'approved';

    return (
      <div className="pt-20 pb-12 container mx-auto px-4 max-w-xl text-center">
        <div className={cn(
          "mb-6 w-20 h-20 rounded-full flex items-center justify-center mx-auto",
          isApproved ? "bg-primary/20" : isPending ? "bg-yellow-500/20" : "bg-destructive/20"
        )}>
          {isApproved ? <CheckCircle2 className="w-10 h-10 text-primary" /> :
            isPending ? <Clock className="w-10 h-10 text-yellow-500" /> :
              <AlertCircle className="w-10 h-10 text-destructive" />}
        </div>
        <h2 className="text-3xl font-display font-bold mb-2">
          {isApproved ? t.verified : isPending ? t.underReview : t.failed}
        </h2>
        <p className="text-muted-foreground">
          {isApproved ? t.verifiedDesc :
            isPending ? t.underReviewDesc :
              t.failedDesc}
        </p>
        <Button onClick={() => navigate("/dashboard")} className="mt-8 gap-2" variant="outline">
          {t.goDashboard}
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-10 pb-12 container mx-auto px-4 max-w-xl">
      <div className={cn("md:hidden flex mb-6", isRTL ? "justify-start" : "justify-end")}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="h-10 w-10 bg-primary/10 text-primary border border-primary/20"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass">
          <CardHeader>
            {profile?.kyc_status === 'rejected' && (
              <Alert variant="destructive" className="mb-6 glass-strong border-destructive/50">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t.reSubmission}</AlertTitle>
                <AlertDescription>
                  {profile.kyc_rejection_reason || t.failedDesc}
                </AlertDescription>
              </Alert>
            )}
            <CardTitle className={cn("font-display text-2xl", isRTL && "text-right")}>{t.title}</CardTitle>
            <CardDescription className={cn(isRTL && "text-right")}>{t.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            {isRecovered && !isRestoring && !isSubmitting && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 w-fit flex items-center gap-2 mx-auto mb-6"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  {fileRecovered ? "Document & Form Recovered" : "Form Draft Recovered"}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); clearPersistence(); window.location.reload(); }}
                  className="ml-1 p-0.5 hover:bg-primary/20 rounded-full transition-colors"
                  title="Clear Draft"
                >
                  <X className="w-3 h-3 text-primary" />
                </button>
              </motion.div>
            )}

            {isRecovered && !fileRecovered && !isRestoring && (
              <Alert className="mb-6 bg-yellow-500/10 border-yellow-500/50 text-yellow-600">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Document Missing</AlertTitle>
                <AlertDescription className="text-xs">
                  Your form data was recovered, but the document needs to be re-selected.
                </AlertDescription>
              </Alert>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={cn("block", isRTL && "text-right")}>{t.fullName}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.fullNamePlaceholder} className={cn("bg-muted/30 border-border/50", isRTL && "text-right")} {...field} />
                    </FormControl>
                    <FormMessage className={cn(isRTL && "text-right")} />
                  </FormItem>
                )} />

                <FormField control={form.control} name="idType" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={cn("block", isRTL && "text-right")}>{t.idType}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={cn("bg-muted/30 border-border/50", isRTL && "flex-row-reverse")}>
                          <SelectValue placeholder={t.idTypePlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass-strong">
                        <SelectItem value="passport" className={cn(isRTL && "text-right")}>{t.passport}</SelectItem>
                        <SelectItem value="drivers_license" className={cn(isRTL && "text-right")}>{t.driversLicense}</SelectItem>
                        <SelectItem value="national_id" className={cn(isRTL && "text-right")}>{t.nationalId}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className={cn(isRTL && "text-right")} />
                  </FormItem>
                )} />

                {/* Drag and drop */}
                <div>
                  <label className={cn("text-sm font-medium leading-none mb-2 block", isRTL && "text-right")}>{t.uploadLabel}</label>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={async (e) => {
                      handleDrop(e);
                      if (e.dataTransfer.files?.[0]) {
                        await handleFileChange(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer relative overflow-hidden
                        ${dragActive ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/40"}
                      `}
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                    />
                    {previewUrl ? (
                      <div className="relative group mx-auto w-32 h-32 rounded-lg overflow-hidden border border-border shadow-md">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        {isSubmitting && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={(e) => { e.stopPropagation(); handleFileChange(null); }}
                            className="bg-destructive text-white p-1.5 rounded-full hover:scale-110 transition-transform disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : file ? (
                      <div className={cn("flex items-center justify-center gap-2", isRTL && "flex-row-reverse")}>
                        {isSubmitting ? (
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                          <FileText className="w-5 h-5 text-primary" />
                        )}
                        <span className="text-sm text-foreground truncate max-w-[150px]">{file.name}</span>
                        {!isSubmitting && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleFileChange(null); }}>
                            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">{t.uploadDesc}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t.uploadLimit}</p>
                      </>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || isRestoring}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-emerald font-bold h-12"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="animate-pulse">{t.submitting}</span>
                    </div>
                  ) : isRestoring ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Restoring draft...</span>
                    </div>
                  ) : t.submit}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default KYC;
