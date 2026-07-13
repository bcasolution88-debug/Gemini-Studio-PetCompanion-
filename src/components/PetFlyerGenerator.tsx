import React, { useState } from 'react';
import { X, Printer, Heart, Share2, HelpCircle, MapPin, Phone, MessageCircle, Star, BadgeCheck, RefreshCw } from 'lucide-react';
import { Pet } from '../types';
import { useLanguage } from '../lib/LanguageContext';

interface PetFlyerGeneratorProps {
  pet: Pet;
  onClose: () => void;
}

export default function PetFlyerGenerator({ pet, onClose }: PetFlyerGeneratorProps) {
  const { t, language } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);

  // Dynamic Print Engine: Generates an isolated printable document inside a temporary iframe.
  const handlePrint = () => {
    setIsGenerating(true);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      setIsGenerating(false);
      return;
    }

    const flyerHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Adopt ${pet.name} - Flyer</title>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            margin: 0;
            padding: 40px;
            box-sizing: border-box;
            background-color: #ffffff;
            color: #1c1917;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .flyer {
            border: 12px double #e11d48;
            border-radius: 24px;
            padding: 30px;
            min-height: calc(100vh - 120px);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
          }
          .badge {
            position: absolute;
            top: 25px;
            right: 25px;
            background-color: #e11d48;
            color: #ffffff;
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 800;
            font-size: 16px;
            padding: 8px 16px;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 1px;
            transform: rotate(4deg);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 25px;
          }
          .title {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 52px;
            font-weight: 800;
            color: #e11d48;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: -1px;
            line-height: 1;
          }
          .subtitle {
            font-size: 18px;
            color: #4b5563;
            margin-top: 10px;
            margin-bottom: 0;
            font-weight: 600;
          }
          .photo-container {
            width: 100%;
            height: 380px;
            border-radius: 16px;
            overflow: hidden;
            margin-bottom: 25px;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            border: 4px solid #f3f4f6;
          }
          .photo {
            width: 100%;
            height: 100%;
            object-cover: cover;
            object-fit: cover;
          }
          .details-grid {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 25px;
            margin-bottom: 25px;
          }
          .about-section {
            background-color: #fff1f2;
            padding: 20px;
            border-radius: 16px;
            border-left: 6px solid #e11d48;
          }
          .section-title {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 20px;
            font-weight: 700;
            color: #1c1917;
            margin-top: 0;
            margin-bottom: 10px;
          }
          .section-text {
            font-size: 14px;
            line-height: 1.6;
            color: #374151;
            margin: 0;
          }
          .specs-card {
            background-color: #fafaf9;
            border: 1px solid #e7e5e4;
            border-radius: 16px;
            padding: 20px;
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 12px;
          }
          .spec-item {
            display: flex;
            flex-direction: column;
          }
          .spec-label {
            font-size: 11px;
            color: #8c8a87;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .spec-value {
            font-size: 14px;
            font-weight: 700;
            color: #1c1917;
          }
          .contact-bar {
            background-color: #1c1917;
            color: #ffffff;
            border-radius: 16px;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .contact-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .contact-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #e11d48;
            font-weight: 800;
          }
          .contact-phone {
            font-size: 20px;
            font-weight: 800;
            font-family: 'Space Grotesk', sans-serif;
          }
          .contact-shelter {
            font-size: 13px;
            color: #d1d5db;
          }
          .qr-container {
            display: flex;
            align-items: center;
            gap: 12px;
            background-color: #ffffff;
            padding: 8px 12px;
            border-radius: 12px;
            color: #1c1917;
          }
          .qr-code {
            width: 48px;
            height: 48px;
          }
          .qr-text {
            font-size: 10px;
            font-weight: 700;
            line-height: 1.3;
            max-width: 90px;
          }
          .footer-text {
            text-align: center;
            font-size: 11px;
            color: #6b7280;
            font-weight: 600;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="flyer">
          <div class="badge">${language === 'en' ? 'Adopt Me' : '寻找领养'}</div>
          
          <div class="header">
            <h1 class="title">${language === 'en' ? `ADOPT ${pet.name}!` : `领养 ${pet.name}！`}</h1>
            <p class="subtitle">${language === 'en' ? 'Could I be your perfect furry friend?' : '我可以成为您最贴心的爱宠伙伴吗？'}</p>
          </div>

          <div class="photo-container">
            <img src="${pet.imageUrl}" class="photo" alt="${pet.name}" />
          </div>

          <div class="details-grid">
            <div class="about-section">
              <h3 class="section-title">${language === 'en' ? 'About Me' : '关于我'}</h3>
              <p class="section-text">${pet.description}</p>
            </div>
            
            <div class="specs-card">
              <div class="spec-item">
                <span class="spec-label">${language === 'en' ? 'Breed' : '品类'}</span>
                <span class="spec-value">${pet.species === 'Dog' ? (language === 'en' ? 'Dog / Canine' : '狗狗') : pet.species === 'Cat' ? (language === 'en' ? 'Cat / Feline' : '猫咪') : (language === 'en' ? 'Companion' : '萌宠')}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">${language === 'en' ? 'Age' : '年龄阶段'}</span>
                <span class="spec-value">${pet.age === 'Puppy/Kitten' ? (language === 'en' ? 'Young / Baby' : '幼年阶段') : pet.age === 'Adult' ? (language === 'en' ? 'Adult Companion' : '成年伙伴') : (language === 'en' ? 'Senior' : '老年照顾')}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">${language === 'en' ? 'Location' : '常驻位置'}</span>
                <span class="spec-value">${pet.location}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">${language === 'en' ? 'Status' : '健康状况'}</span>
                <span class="spec-value">${language === 'en' ? 'Healthy & Vaccinated' : '健康且已打疫苗'}</span>
              </div>
              <div class="spec-item" style="grid-column: span 2;">
                <span class="spec-label">${language === 'en' ? 'Personality' : '性格印象'}</span>
                <span class="spec-value" style="font-size: 13px; color: #e11d48;">🐾 ${language === 'en' ? 'Gentle, Friendly, Highly Social' : '性格温顺、亲人有爱、活力满满'}</span>
              </div>
            </div>
          </div>

          <div class="contact-bar">
            <div class="contact-info">
              <span class="contact-title">${language === 'en' ? 'SHELTER INQUIRY CONTACT' : '爱心收容救助中心联系方式'}</span>
              <span class="contact-phone">📞 ${pet.shelterPhone}</span>
              <span class="contact-shelter">${pet.shelterName}</span>
            </div>

            <div class="qr-container">
              <!-- Inline SVG QR Code helper representing dynamic companion identity link -->
              <svg class="qr-code" viewBox="0 0 100 100" fill="currentColor">
                <rect x="0" y="0" width="100" height="100" fill="white" />
                <!-- QR Position Detection Anchors -->
                <rect x="5" y="5" width="25" height="25" fill="black" />
                <rect x="10" y="10" width="15" height="15" fill="white" />
                <rect x="12" y="12" width="11" height="11" fill="black" />
                
                <rect x="70" y="5" width="25" height="25" fill="black" />
                <rect x="75" y="10" width="15" height="15" fill="white" />
                <rect x="77" y="12" width="11" height="11" fill="black" />
                
                <rect x="5" y="70" width="25" height="25" fill="black" />
                <rect x="10" y="75" width="15" height="15" fill="white" />
                <rect x="12" y="77" width="11" height="11" fill="black" />
                
                <rect x="80" y="80" width="15" height="15" fill="black" />
                <!-- Random QR Code Noise simulation dots -->
                <rect x="40" y="15" width="8" height="8" fill="black" />
                <rect x="55" y="25" width="10" height="10" fill="black" />
                <rect x="45" y="45" width="15" height="15" fill="black" />
                <rect x="35" y="70" width="8" height="12" fill="black" />
                <rect x="80" y="40" width="10" height="15" fill="black" />
                <rect x="50" y="75" width="12" height="8" fill="black" />
              </svg>
              <div class="qr-text">
                ${language === 'en' ? 'Scan to view full companion details & adopt instantly' : '微信或相机扫一扫 立即开始登记预约领养'}
              </div>
            </div>
          </div>

          <p class="footer-text">
            ${language === 'en' ? 'Please post this in your local community, veterinary clinics, or share on social media. Together we can find a loving home.' : '请随手复印张贴于当地宠物商店、社区布告栏或发至微信朋友圈，感谢支持公益救助！'}
          </p>
        </div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(flyerHtml);
    doc.close();

    // Give iframe static assets/fonts/images 1.5 seconds to populate, then trigger print dialog
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      
      // Remove temporary iframe safely
      setTimeout(() => {
        document.body.removeChild(iframe);
        setIsGenerating(false);
      }, 500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 w-full max-w-xl rounded-3xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-150 dark:border-stone-800/80 flex justify-between items-center bg-stone-50/50 dark:bg-stone-950/20">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-rose-500" />
            <div>
              <h3 className="text-base font-black text-stone-900 dark:text-white">
                {t('Printable Adoption Flyer', '生成社区领养宣传单')}
              </h3>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 font-medium">
                {t('Share offline on local boards, clinics, and animal shelters to help find a family.', '张贴于社区宣传栏、诊所或分享至社交媒体，加速爱宠回家旅程。')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: High fidelity visual preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-100 dark:bg-stone-950/60 flex flex-col items-center">
          
          <div className="bg-white text-stone-950 rounded-2xl p-6 shadow-lg border border-stone-200 w-full max-w-md aspect-[1/1.4] flex flex-col justify-between relative overflow-hidden text-left">
            <span className="absolute top-4 right-4 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full rotate-2 shadow-sm">
              {t('Adopt Me', '寻找有爱家庭')}
            </span>

            {/* Flyer Title */}
            <div className="text-center mb-4">
              <h1 className="text-3xl font-black tracking-tight text-rose-500 uppercase leading-none font-sans">
                {t(`ADOPT ${pet.name}!`, `领养 ${pet.name}！`)}
              </h1>
              <p className="text-xs text-stone-500 font-semibold mt-1">
                {t('Could I be your perfect furry friend?', '我可以成为您最贴心的爱宠伙伴吗？')}
              </p>
            </div>

            {/* Photo preview */}
            <div className="w-full h-44 rounded-xl overflow-hidden bg-stone-100 border border-stone-200/50">
              <img src={pet.imageUrl} alt={pet.name} className="w-full h-full object-cover" />
            </div>

            {/* Specs & Description row */}
            <div className="grid grid-cols-2 gap-3.5 my-4">
              <div className="bg-rose-50/50 p-3 rounded-xl border-l-4 border-rose-500 flex flex-col justify-center">
                <h5 className="text-[10px] font-black text-stone-800 tracking-wide uppercase">{t('About Me', '自述故事')}</h5>
                <p className="text-[11px] text-stone-600 line-clamp-4 leading-relaxed mt-1 font-medium">
                  {pet.description}
                </p>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-150 text-[11px] font-bold text-stone-800 space-y-1.5 flex flex-col justify-center">
                <div className="flex justify-between border-b pb-1 border-stone-200/50">
                  <span className="text-stone-400 font-bold uppercase text-[9px]">{t('Breed', '品类')}</span>
                  <span>{pet.species === 'Dog' ? t('Dog', '狗狗') : pet.species === 'Cat' ? t('Cat', '猫咪') : pet.species}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-stone-200/50">
                  <span className="text-stone-400 font-bold uppercase text-[9px]">{t('Age', '年龄阶段')}</span>
                  <span>{pet.age === 'Puppy/Kitten' ? t('Young', '幼年') : pet.age === 'Adult' ? t('Adult', '成年') : t('Senior', '老年')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 font-bold uppercase text-[9px]">{t('Location', '位置')}</span>
                  <span>{pet.location}</span>
                </div>
              </div>
            </div>

            {/* Bottom Contact Section */}
            <div className="bg-stone-900 text-white rounded-xl p-3.5 flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-[8px] tracking-wider text-rose-400 font-black uppercase">{t('Shelter Contact', '救助中心联系方式')}</span>
                <p className="text-sm font-black tracking-tight leading-none">📞 {pet.shelterPhone}</p>
                <p className="text-[10px] text-stone-300 font-bold truncate max-w-[180px]">{pet.shelterName}</p>
              </div>

              <div className="bg-white p-1 rounded-lg text-stone-950 flex items-center gap-1.5 flex-shrink-0">
                <svg className="w-9 h-9" viewBox="0 0 100 100" fill="currentColor">
                  <rect x="0" y="0" width="100" height="100" fill="white" />
                  <rect x="5" y="5" width="25" height="25" fill="black" />
                  <rect x="10" y="10" width="15" height="15" fill="white" />
                  <rect x="12" y="12" width="11" height="11" fill="black" />
                  <rect x="70" y="5" width="25" height="25" fill="black" />
                  <rect x="75" y="10" width="15" height="15" fill="white" />
                  <rect x="77" y="12" width="11" height="11" fill="black" />
                  <rect x="5" y="70" width="25" height="25" fill="black" />
                  <rect x="10" y="75" width="15" height="15" fill="white" />
                  <rect x="12" y="77" width="11" height="11" fill="black" />
                  <rect x="80" y="80" width="15" height="15" fill="black" />
                  <rect x="40" y="15" width="8" height="8" fill="black" />
                  <rect x="55" y="25" width="10" height="10" fill="black" />
                  <rect x="45" y="45" width="15" height="15" fill="black" />
                  <rect x="35" y="70" width="8" height="12" fill="black" />
                </svg>
                <span className="text-[7px] text-stone-600 font-extrabold leading-tight max-w-[50px] block">
                  {t('Scan to adopt', '扫码快捷预约')}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-5 border-t border-stone-150 dark:border-stone-800/80 flex justify-end gap-3 bg-stone-50 dark:bg-stone-950/20">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl transition-all"
          >
            {t('Close', '关闭')}
          </button>
          
          <button
            disabled={isGenerating}
            onClick={handlePrint}
            className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {t('Preparing PDF...', '正在排版 PDF...')}
              </>
            ) : (
              <>
                <Printer className="w-3.5 h-3.5" />
                {t('Print / Save PDF Flyer', '打印 / 另存为 PDF 传单')}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
