import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Send, Paperclip, Download, Loader2, Check, Trash2 } from "lucide-react";
import type { Rfi, RfiMessage, RfiAttachment, User } from "@shared/schema";

interface RfiConversationProps {
  rfi: Rfi & { organization?: User };
  onClose?: () => void;
  rfpId?: number; // For invalidating RFI list
}

type MessageWithDetails = RfiMessage & {
  sender: User;
  attachments?: RfiAttachment[];
};

export function RfiConversation({ rfi, onClose, rfpId }: RfiConversationProps) {
  // Get RFP details to check ownership
  const { data: rfpDetails } = useQuery<{id: number, organizationId: number}>({
    queryKey: [`/api/rfps/${rfi.rfpId}`],
    enabled: !!rfi.rfpId,
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch conversation messages
  const { data: messages = [], isLoading } = useQuery<MessageWithDetails[]>({
    queryKey: [`/api/rfis/${rfi.id}/messages`],
    refetchInterval: 5000, // Poll for new messages every 5 seconds
  });

  // Mark as responded mutation  
  const markRespondedMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", `/api/rfps/${rfi.rfpId}/rfi/${rfi.id}/status`, { status: "responded" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rfis/received"] });
      toast({
        title: "RFI marked as responded",
        description: "The RFI status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update RFI status",
        variant: "destructive",
      });
    },
  });

  // Delete RFI mutation
  const deleteRfiMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/rfis/${rfi.id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rfis/received"] });
      if (onClose) {
        onClose();
      }
      toast({
        title: "RFI deleted",
        description: "The RFI conversation has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete RFI",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, attachments }: { message: string; attachments?: FileList }) => {
      if (attachments && attachments.length > 0) {
        // Handle file uploads with message
        const formData = new FormData();
        formData.append("message", message);
        
        Array.from(attachments).forEach((file) => {
          formData.append("attachment", file);
        });

        const response = await fetch(`/api/rfis/${rfi.id}/messages`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to send message");
        }

        return response.json();
      } else {
        // Send text-only message
        const response = await apiRequest("POST", `/api/rfis/${rfi.id}/messages`, { message });
        return response.json();
      }
    },
    onSuccess: () => {
      setMessage("");
      setAttachments(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      queryClient.invalidateQueries({ queryKey: [`/api/rfis/${rfi.id}/messages`] });
      // Also invalidate the RFI list to reflect status changes
      if (rfpId) {
        queryClient.invalidateQueries({ queryKey: [`/api/rfps/${rfpId}/rfi`] });
      }
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !attachments?.length) return;
    
    sendMessageMutation.mutate({ message: message.trim(), attachments: attachments || undefined });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachments(e.target.files);
  };

  const handleDownloadAttachment = (attachment: RfiAttachment) => {
    // Use the secure download endpoint that handles authentication
    const link = document.createElement('a');
    link.href = `/api/attachments/${attachment.id}/download`;
    link.download = attachment.filename;
    link.target = '_blank';
    link.click();
  };

  // Check if current user can mark as responded (RFP owner)
  const isRfpOwner = user && rfpDetails && user.id === rfpDetails.organizationId;
  const canMarkAsResponded = isRfpOwner;
  
  // Check if current user can delete (RFI submitter or RFP owner)
  const canDelete = user && (user.email === rfi.email || isRfpOwner);

  const handleMarkAsResponded = () => {
    markRespondedMutation.mutate();
  };

  const handleDeleteRfi = () => {
    deleteRfiMutation.mutate();
  };

  return (
    <Card className="flex flex-col h-[600px] max-w-4xl mx-auto">
      <CardHeader className="border-b">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">RFI Conversation</h3>
            <p className="text-sm text-muted-foreground">
              From: {rfi.organization?.companyName || rfi.email}
            </p>
            <p className="text-sm text-muted-foreground">
              Submitted: {format(new Date(rfi.createdAt), "PPp")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={rfi.status === "pending" ? "secondary" : "default"}>
              {rfi.status}
            </Badge>
            
            {/* Mark as Responded Button - Only for RFP owners when status is pending */}
            {canMarkAsResponded && rfi.status === "pending" && user?.email !== rfi.email && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAsResponded}
                disabled={markRespondedMutation.isPending}
                data-testid="mark-responded-button"
              >
                {markRespondedMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span className="ml-1">Mark Responded</span>
              </Button>
            )}
            
            {/* Delete Button - For RFI submitters or RFP owners */}
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="delete-rfi-button"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete RFI Conversation</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this RFI conversation? This action cannot be undone and will permanently delete all messages and attachments.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteRfi}
                      disabled={deleteRfiMutation.isPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteRfiMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Delete RFI
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>
        
        {/* Original RFI Message */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-1">Original Question:</p>
          <p className="text-sm">{rfi.message}</p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="messages-area">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.senderId === user?.id ? "flex-row-reverse" : ""
                }`}
                data-testid={`message-${msg.id}`}
              >
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback>
                    {msg.sender.companyName?.charAt(0) || msg.sender.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`flex-1 max-w-[70%] sm:max-w-[80%] md:max-w-[70%] ${
                  msg.senderId === user?.id ? "text-right" : ""
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                    <span className="text-xs text-muted-foreground truncate">
                      {msg.sender.companyName || msg.sender.email}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                    </span>
                  </div>
                  
                  <div className={`rounded-lg p-3 ${
                    msg.senderId === user?.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    
                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.attachments.map((attachment) => (
                          <button
                            key={attachment.id}
                            onClick={() => handleDownloadAttachment(attachment)}
                            className="flex items-center gap-2 text-xs hover:underline"
                            data-testid={`attachment-${attachment.id}`}
                          >
                            <Download className="h-3 w-3" />
                            {attachment.filename}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Area */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    handleSendMessage(e);
                  }
                }}
                data-testid="message-input"
              />
              <div className="flex sm:flex-col gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="attach-file-button"
                  className="px-3 sm:px-2"
                >
                  <Paperclip className="h-4 w-4" />
                  <span className="sm:hidden ml-1">Attach</span>
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={(!message.trim() && !attachments?.length) || sendMessageMutation.isPending}
                  data-testid="send-message-button"
                  className="px-3 sm:px-2"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="sm:hidden ml-1">
                    {sendMessageMutation.isPending ? "Sending..." : "Send"}
                  </span>
                </Button>
              </div>
            </div>
            
            {/* File Input */}
            <Input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
            />
            
            {/* Selected Files Display */}
            {attachments && attachments.length > 0 && (
              <div className="flex flex-wrap gap-2" data-testid="selected-files">
                {Array.from(attachments).map((file, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {file.name}
                  </Badge>
                ))}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              <span className="hidden sm:inline">Press Ctrl+Enter to send • </span>Attach files: PDF, DOC, Images, TXT
            </p>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}