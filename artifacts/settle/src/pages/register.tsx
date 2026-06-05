import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegisterSeller } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Lock } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email(),
  phone: z.string().min(9, "Valid phone is required"),
  walletAddress: z.string().min(5, "Wallet address/MoMo number required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const registerMutation = useRegisterSeller();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", phone: "", walletAddress: "", password: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    registerMutation.mutate({ data: values }, {
      onSuccess: () => {
        // Ideally register returns auth token, but if not we can redirect to login
        setLocation("/login");
      }
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4 py-12">
      <div className="w-full max-w-md bg-card rounded-xl border shadow-sm p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-muted-foreground mt-1">Start securing your transactions</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name or Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Trading" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="054XXXXXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="walletAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payout MoMo Number / Wallet</FormLabel>
                  <FormControl>
                    <Input placeholder="054XXXXXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {registerMutation.isError && (
              <div className="text-sm text-destructive font-medium p-3 bg-destructive/10 rounded-md">
                Registration failed. Please check your details.
              </div>
            )}

            <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "Registering..." : "Create Account"}
            </Button>
          </form>
        </Form>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Log in</Link>
        </div>
      </div>
    </div>
  );
}
