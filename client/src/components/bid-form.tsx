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

const rfiSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(1, "Please enter your question or message"),
});

type RfiFormData = z.infer<typeof rfiSchema>;

export default function RfiForm({ rfpId }: { rfpId: number }) {
  const { toast } = useToast();
  const form = useForm<RfiFormData>({
    resolver: zodResolver(rfiSchema),
    defaultValues: {
      email: "",
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
        title: "Request Sent",
        description: "Your request for information has been submitted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="Enter your email address"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question/Message</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Enter your questions or request for additional information..." 
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
          Submit Request
        </Button>
      </form>
    </Form>
  );
}