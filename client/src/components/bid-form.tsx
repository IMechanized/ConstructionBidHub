import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

interface RfiFormProps {
  rfpId: number;
  onSuccess?: () => void;
}

export default function RfiForm({ rfpId, onSuccess }: RfiFormProps) {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  
  // Set language from user preference
  useEffect(() => {
    if (user?.language) {
      i18n.changeLanguage(user.language);
    }
  }, [user?.language, i18n]);

  // Schema with translated validation messages
  const rfiSchema = z.object({
    message: z.string().min(1, t('validation.messageRequired')),
  });

  type RfiFormData = z.infer<typeof rfiSchema>;
  const form = useForm<RfiFormData>({
    resolver: zodResolver(rfiSchema),
    defaultValues: {
      message: "",
    },
  });

  const submitRfiMutation = useMutation({
    mutationFn: async (data: RfiFormData) => {
      const res = await apiRequest("POST", `/api/rfps/${rfpId}/rfi`, data);
      return res.json();
    },
    onSuccess: () => {
      form.reset();
      toast({
        title: t('rfi.requestSent'),
        description: t('rfi.requestSuccessful'),
      });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => submitRfiMutation.mutate(data))}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('rfi.questionMessage')}</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder={t('rfi.enterQuestion')} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full"
          disabled={submitRfiMutation.isPending}
        >
          {submitRfiMutation.isPending ? t('common.submitting') : t('rfi.submitRequest')}
        </Button>
      </form>
    </Form>
  );
}