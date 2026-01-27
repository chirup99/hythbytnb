
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 flex items-center justify-center">
      <Card className="max-w-3xl w-full bg-gray-900 border-gray-800">
        <CardContent className="p-8 space-y-6">
          <h1 className="text-3xl font-bold border-b border-gray-800 pb-4">Privacy Policy</h1>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Introduction</h2>
            <p className="text-gray-400">
              Perala is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our application.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Information Collection</h2>
            <p className="text-gray-400">
              We collect information you provide directly to us when you create an account, such as your email address and profile information via Google or Cognito authentication.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Use of Information</h2>
            <p className="text-gray-400">
              We use the information we collect to provide, maintain, and improve our services, including personalizing your experience and communicating with you about your account.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Data Sharing</h2>
            <p className="text-gray-400">
              We do not share your personal information with third parties except as necessary to provide our services or as required by law.
            </p>
          </section>

          <section className="space-y-4 border-t border-gray-800 pt-6">
            <p className="text-sm text-gray-500">
              Last updated: January 27, 2026
            </p>
          </section>
          
          <div className="pt-4">
            <a href="/" className="text-indigo-400 hover:text-indigo-300 underline">Back to Home</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
