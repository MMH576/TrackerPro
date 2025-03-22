'use client';

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signIn, signInWithGoogle } from "@/lib/supabase"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" })
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  })

  useEffect(() => {
    // Check for error or success messages from URL params
    const errorMessage = searchParams.get('error')
    const successMessage = searchParams.get('message')
    
    if (errorMessage) setError(decodeURIComponent(errorMessage))
    if (successMessage) setMessage(decodeURIComponent(successMessage))
  }, [searchParams])

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log("Attempting login with:", data.email)
      const { data: userData, error } = await signIn(data.email, data.password)
      
      if (error) {
        console.error("Login error from Supabase:", error)
        throw error
      }
      
      if (userData?.user) {
        console.log("Login successful, user found:", userData.user.email)
        console.log("Session data:", userData.session)
        console.log("Redirecting to dashboard...")
        
        // Add a small delay before redirecting to ensure session is properly saved
        setTimeout(() => {
          console.log("Executing redirect now...")
          // Force navigation to dashboard after successful login
          window.location.href = '/dashboard'
        }, 500)
      } else {
        console.error("Login returned without error but no user data")
        throw new Error("Login failed. No user data returned.")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Failed to sign in. Please check your credentials.")
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { error } = await signInWithGoogle()
      if (error) throw error
      // The redirect is handled by the OAuth flow
    } catch (err: any) {
      console.error("Google sign-in error:", err)
      setError(err.message || "Failed to sign in with Google. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="bg-primary h-12 w-12 rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground text-2xl font-bold">H</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">HabitHero</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {message && (
            <Alert className="mb-4">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger 
                value="login" 
                onClick={() => router.push('/auth/register')}
                className="cursor-pointer"
              >
                Register
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    {...register("email")}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="text-sm text-primary underline-offset-4 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    {...register("password")}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              Google
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

