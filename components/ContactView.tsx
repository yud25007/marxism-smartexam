import React from 'react';
import { Button } from './Button';
import { ArrowLeft, MessageCircle, Heart } from 'lucide-react';

interface ContactViewProps {
  onGoHome: () => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ onGoHome }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-red-200/30 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-200/30 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 py-8 relative z-10 flex-1 flex flex-col">
        <div className="mb-6">
          <Button variant="ghost" onClick={onGoHome} className="hover:bg-white/50">
            <ArrowLeft size={20} className="mr-2" />
            返回首页
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-full max-w-4xl">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">联系我们</h1>
              <p className="text-gray-600 text-lg">关注公众号，获取最新题库动态与支持</p>
            </div>

            {/* Glassmorphism Card */}
            <div className="relative backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] rounded-3xl p-8 md:p-12 overflow-hidden">
              {/* Shine effect */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

              <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
                
                {/* Section 1: Official Account */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-white p-2 rounded-xl shadow-sm rotate-1 hover:rotate-0 transition-transform duration-300">
                    {/* Placeholder for Image 1: WeChat Search Banner */}
                    <img 
                      src="https://files.catbox.moe/kfv5m6.png" 
                      alt="微信搜一搜 清言观" 
                      className="w-full max-w-[300px] rounded-lg"
                    />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
                      <MessageCircle className="text-green-600" /> 
                      官方公众号
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">微信搜一搜“清言观”</p>
                  </div>
                </div>

                {/* Section 2: Personal/Support */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-white p-2 rounded-full shadow-sm -rotate-1 hover:rotate-0 transition-transform duration-300">
                     {/* Placeholder for Image 2: Support Code */}
                    <img 
                      src="https://files.catbox.moe/607887.jpg" 
                      alt="感谢支持" 
                      className="w-48 h-48 md:w-56 md:h-56 rounded-full object-cover"
                    />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
                      <Heart className="text-red-500" fill="currentColor" /> 
                      支持与反馈
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">感谢您的支持，一起努力！</p>
                  </div>
                </div>

              </div>
              
              <div className="mt-10 text-center border-t border-gray-200/50 pt-6">
                <p className="text-gray-700 font-medium">如有任何问题，请直接在微信公众号后台私信留言。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};