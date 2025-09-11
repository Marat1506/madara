import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Index() {
  const [email, setEmail] = useState("kayna23@gmail.com");
  const [password, setPassword] = useState("••••••••••••");
  const [rememberMe, setRememberMe] = useState(false);
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleLogin = () => {
    // Simple navigation to dashboard - in real app you'd validate credentials
    navigate('/dashboard');
  };

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
            {t('welcome')}
          </h1>
          <p className={`text-sm text-gray-500 ${language === 'ar' ? 'text-right' : ''}`}>
            {t('loginSubtitle')}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'text-right block' : ''}`}>
              {t('email')}
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full ${language === 'ar' ? 'text-right' : ''}`}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'text-right block' : ''}`}>
              {t('password')}
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full ${language === 'ar' ? 'text-right' : ''}`}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
          
          <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center space-x-2 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <label 
                htmlFor="remember" 
                className="text-sm text-gray-600 cursor-pointer"
              >
                {t('rememberMe')}
              </label>
            </div>
            <Link 
              to="/forgot-password" 
              className="text-sm text-primary hover:underline"
            >
              {t('forgotPassword')}
            </Link>
          </div>
          
          <Button className="w-full" onClick={handleLogin}>
            {t('signIn')}
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t('alreadyHaveAccount')}{" "}
              <a href="#" className="text-primary hover:underline">
                {t('logIn')}
              </a>
            </p>
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
}
