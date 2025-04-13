import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const kycFormSchema = z.object({
  organizationName: z.string().min(2, {
    message: 'Organization name must be at least 2 characters.',
  }),
  organizationType: z.enum(['agency', 'company', 'non-profit', 'educational', 'other'], {
    required_error: 'Please select the type of your organization.',
  }),
  organizationRole: z.string().min(2, {
    message: 'Your role in the organization is required.',
  }),
  kycInformation: z.string().min(20, {
    message: 'Please provide detailed information for verification (at least 20 characters).',
  }),
  website: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  registrationNumber: z.string().optional(),
  contactEmail: z.string().email({ message: 'Please enter a valid email address.' }),
  contactPhone: z.string().optional(),
});

type KYCFormValues = z.infer<typeof kycFormSchema>;

interface KYCVerificationFormProps {
  onComplete: () => void;
  initialData?: Partial<KYCFormValues>;
}

export default function KYCVerificationForm({ onComplete, initialData }: KYCVerificationFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<KYCFormValues>({
    resolver: zodResolver(kycFormSchema),
    defaultValues: {
      organizationName: initialData?.organizationName || '',
      organizationType: (initialData?.organizationType as any) || 'company',
      organizationRole: initialData?.organizationRole || '',
      kycInformation: initialData?.kycInformation || '',
      website: initialData?.website || '',
      registrationNumber: initialData?.registrationNumber || '',
      contactEmail: initialData?.contactEmail || user?.email || '',
      contactPhone: initialData?.contactPhone || '',
    },
  });

  async function onSubmit(values: KYCFormValues) {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to submit KYC verification.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Format the KYC information to include all relevant details
      const formattedKYCInfo = `
Organization Name: ${values.organizationName}
Organization Type: ${values.organizationType}
Your Role: ${values.organizationRole}
Website: ${values.website || 'Not provided'}
Registration Number: ${values.registrationNumber || 'Not provided'}
Contact Email: ${values.contactEmail}
Contact Phone: ${values.contactPhone || 'Not provided'}

Additional Information:
${values.kycInformation}
      `.trim();

      // Submit KYC information to the server
      const response = await fetch('/api/user/kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationName: values.organizationName,
          organizationType: values.organizationType,
          organizationRole: values.organizationRole,
          kycInformation: formattedKYCInfo,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit KYC verification');
      }

      toast({
        title: 'Verification submitted',
        description: 'Your KYC verification has been submitted and is pending review.',
      });

      // Call the onComplete callback to notify the parent component
      onComplete();
    } catch (error) {
      console.error('Error submitting KYC verification:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit KYC verification',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Organization Verification (KYC)</CardTitle>
        <CardDescription>
          Please provide information about your organization for verification purposes. This is required for creating opportunities as an organization or agency.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your organization's name" {...field} />
                    </FormControl>
                    <FormDescription>
                      The official name of your organization.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="agency">Government Agency</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="non-profit">Non-Profit Organization</SelectItem>
                        <SelectItem value="educational">Educational Institution</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The type of organization you represent.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="organizationRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Role</FormLabel>
                    <FormControl>
                      <Input placeholder="Your position in the organization" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your position or role within the organization.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      The official website of your organization (optional).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Business/organization registration number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your organization's registration or license number (optional).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input placeholder="contact@organization.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      An official email for verification purposes.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Organization phone number" {...field} />
                  </FormControl>
                  <FormDescription>
                    A phone number for verification purposes (optional).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="kycInformation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Verification Information</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide any additional information that will help us verify your organization..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide any additional details that will help us verify your organization.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Verification"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <p className="text-sm text-muted-foreground">
          Your information will be reviewed by our team. This process typically takes 1-2 business days.
        </p>
      </CardFooter>
    </Card>
  );
}