import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLoginSeller } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Lock } from "lucide-react";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const loginMutation = useLoginSeller();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    loginMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        setToken(res.token);
        setLocation("/dashboard");
      }
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-card rounded-xl border shadow-sm p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Log in to SETTLE</h1>
          <p className="text-muted-foreground mt-1">Manage your secure deals</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            
            {loginMutation.isError && (
              <div className="text-sm text-destructive font-medium p-3 bg-destructive/10 rounded-md">
                Invalid credentials or server error.
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Logging in..." : "Log In"}
            </Button>
          </form>
        </Form>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account? <Link href="/register" className="text-primary hover:underline font-medium">Register here</Link>
        </div>
      </div>
    </div>
  );
}
