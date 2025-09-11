import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-white shadow-xl border-0 relative">
        {/* Language Switcher in top left corner */}
        <div className="absolute top-4 left-4 z-10">
          <LanguageSwitcher />
        </div>
        
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-8">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-bold text-lg mr-2">
              E
            </div>
            <span className="text-xl font-semibold text-gray-900">{t('emadrasa')}</span>
          </div>
          <h1 className={`text-xl font-semibold text-gray-900 mb-2 ${language === 'ar' ? 'text-right' : ''}`}>
            {t('resetPassword')}
          </h1>
          <p className={`text-sm text-gray-500 ${language === 'ar' ? 'text-right' : ''}`}>
            {t('resetPasswordSubtitle')}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'text-right block' : ''}`}>
              {t('emailAddress')}
            </label>
            <Input
              id="email"
              type="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full ${language === 'ar' ? 'text-right' : ''}`}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
          
          <Button className="w-full">
            {t('sendResetLink')}
          </Button>
          
          <div className="text-center">
            <Link 
              to="/" 
              className={`inline-flex items-center text-sm text-primary hover:underline ${language === 'ar' ? 'flex-row-reverse' : ''}`}
            >
              <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'ml-1 rotate-180' : 'mr-1'}`} />
              {t('backToSignIn')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
