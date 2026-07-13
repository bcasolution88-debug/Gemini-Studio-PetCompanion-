import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, Phone, Home, Heart, Shield, CheckCircle, 
  Sparkles, Award, ClipboardCheck, ArrowRight, ArrowLeft 
} from 'lucide-react';
import { Pet } from '../types';
import { useLanguage } from '../lib/LanguageContext';

interface ApplyToAdoptFormProps {
  pet: Pet;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function ApplyToAdoptForm({ pet, onCancel, onSuccess }: ApplyToAdoptFormProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [homeType, setHomeType] = useState('House'); // House, Apartment, Condo, Other
  const [ownOrRent, setOwnOrRent] = useState('Own'); // Own, Rent
  const [hasLandlordPermission, setHasLandlordPermission] = useState('Yes');
  const [hasOtherPets, setHasOtherPets] = useState('No');
  const [otherPetsDetails, setOtherPetsDetails] = useState('');
  const [hasChildren, setHasChildren] = useState('No');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate'); // Beginner, Intermediate, Expert
  const [hoursAlone, setHoursAlone] = useState('2-4'); // <2, 2-4, 4-8, 8+
  const [motivation, setMotivation] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const [formErrors, setFormErrors] = useState<string | null>(null);

  const nextStep = () => {
    // Basic validation before moving forward
    if (step === 1) {
      if (!fullName.trim() || !email.trim() || !phone.trim()) {
        setFormErrors(t('Please fill in all contact details.', '请填写完整的联系人信息。'));
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setFormErrors(t('Please enter a valid email address.', '请输入有效的电子邮箱。'));
        return;
      }
    }
    setFormErrors(null);
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setFormErrors(null);
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeToTerms) {
      setFormErrors(t('You must agree to the adoption guidelines and home checks.', '您必须同意宠物领养准则及实地家访。'));
      return;
    }

    setIsSubmitting(true);
    setFormErrors(null);

    // Prepare adoption application model
    const application = {
      id: `app-${Date.now()}`,
      petId: pet.id,
      petName: pet.name,
      petImageUrl: pet.imageUrl,
      type: 'formal_application',
      status: 'pending',
      inquirerName: fullName,
      inquirerEmail: email,
      inquirerPhone: phone,
      homeType,
      ownOrRent,
      hasLandlordPermission: ownOrRent === 'Rent' ? hasLandlordPermission : 'N/A',
      hasOtherPets,
      otherPetsDetails: hasOtherPets === 'Yes' ? otherPetsDetails : '',
      hasChildren,
      experienceLevel,
      hoursAlone,
      inquirerMessage: motivation,
      timestamp: Date.now()
    };

    try {
      // Fetch current inquiries/applications list from localStorage
      const savedInquiries = localStorage.getItem('adoption_inquiries');
      const list = savedInquiries ? JSON.parse(savedInquiries) : [];
      list.push(application);
      localStorage.setItem('adoption_inquiries', JSON.stringify(list));

      // Trigger custom event to update Stats Dashboard
      window.dispatchEvent(new CustomEvent('inquiry-submitted'));

      // Play soft success synthesizer tone
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }

      // Small artificial delay for premium look & feel
      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess();
      }, 1200);

    } catch (err: any) {
      console.error(err);
      setFormErrors(t('An error occurred while saving your application.', '保存领养申请时遇到错误，请重试。'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-stone-50 dark:bg-stone-900/60 p-6 rounded-3xl border border-rose-100 dark:border-stone-800 space-y-5 animate-fade-in shadow-inner relative overflow-hidden">
      {/* Decorative top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-400 via-orange-400 to-rose-500" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-stone-800 pb-3">
        <div className="space-y-1">
          <h4 className="text-sm font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
            <ClipboardCheck className="w-4 h-4 text-rose-500" />
            {t('Formal Adoption Application', '正式领养申请评估表')}
          </h4>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 font-bold">
            {t('Apply to give a forever home to', '申请给')} <span className="text-orange-500 font-black">{pet.name}</span> {t('with professional vetting', '一个温暖且有爱保障的一生之托')}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
        >
          {t('Cancel', '取消返回')}
        </button>
      </div>

      {/* Progress Tracker */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${step >= 1 ? 'bg-rose-500 text-white' : 'bg-stone-200 dark:bg-stone-850 text-stone-500'}`}>1</div>
          <span className={`text-[10px] font-bold ${step === 1 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-stone-400'}`}>{t('Contact', '联络信息')}</span>
        </div>
        <div className="flex-1 h-[2px] bg-stone-200 dark:bg-stone-800 mx-2" />
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${step >= 2 ? 'bg-rose-500 text-white' : 'bg-stone-200 dark:bg-stone-850 text-stone-500'}`}>2</div>
          <span className={`text-[10px] font-bold ${step === 2 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-stone-400'}`}>{t('Environment', '居住与家庭状况')}</span>
        </div>
        <div className="flex-1 h-[2px] bg-stone-200 dark:bg-stone-800 mx-2" />
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${step >= 3 ? 'bg-rose-500 text-white' : 'bg-stone-200 dark:bg-stone-850 text-stone-500'}`}>3</div>
          <span className={`text-[10px] font-bold ${step === 3 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-stone-400'}`}>{t('Vetting', '经验与承诺')}</span>
        </div>
      </div>

      {formErrors && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-2 animate-shake">
          <Shield className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>{formErrors}</span>
        </div>
      )}

      {/* Form Steps */}
      <div className="min-h-[180px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                    {t('Applicant Name', '申请人姓名 *')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('Enter your full name', '请输入您的真实姓名')}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none font-semibold"
                    />
                    <User className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                    {t('Email Address', '电子邮箱 *')}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none font-semibold"
                    />
                    <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                  {t('Phone Number', '联系电话 *')}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('Enter phone number', '请输入手机号码或座机电话')}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none font-semibold"
                  />
                  <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Home Type */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                    {t('Living Environment', '住房类型')}
                  </label>
                  <select
                    value={homeType}
                    onChange={(e) => setHomeType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none font-bold"
                  >
                    <option value="House">{t('House / Villa', '独立别墅/大平层')}</option>
                    <option value="Apartment">{t('Apartment', '普通公寓/套房')}</option>
                    <option value="Condo">{t('Condo / Townhouse', '联排别墅/商品房')}</option>
                    <option value="Other">{t('Other', '其他居住场所')}</option>
                  </select>
                </div>

                {/* Own or Rent */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                    {t('Home Ownership', '住房性质')}
                  </label>
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 cursor-pointer">
                      <input
                        type="radio"
                        name="ownOrRent"
                        checked={ownOrRent === 'Own'}
                        onChange={() => setOwnOrRent('Own')}
                        className="text-rose-500 focus:ring-rose-500"
                      />
                      {t('Own Home', '自有房产')}
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 cursor-pointer">
                      <input
                        type="radio"
                        name="ownOrRent"
                        checked={ownOrRent === 'Rent'}
                        onChange={() => setOwnOrRent('Rent')}
                        className="text-rose-500 focus:ring-rose-500"
                      />
                      {t('Renting', '租房居住')}
                    </label>
                  </div>
                </div>
              </div>

              {ownOrRent === 'Rent' && (
                <div className="p-3 bg-rose-500/5 dark:bg-rose-500/10 rounded-xl border border-rose-500/10 space-y-1 animate-fade-in">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                    {t('Landlord/Family Permission?', '房东及家庭成员是否同意养宠？')}
                  </label>
                  <div className="flex gap-4 pt-0.5">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 cursor-pointer">
                      <input
                        type="radio"
                        name="landlordPermission"
                        checked={hasLandlordPermission === 'Yes'}
                        onChange={() => setHasLandlordPermission('Yes')}
                      />
                      {t('Yes, confirmed', '是，已确认并完全同意')}
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 cursor-pointer">
                      <input
                        type="radio"
                        name="landlordPermission"
                        checked={hasLandlordPermission === 'No'}
                        onChange={() => setHasLandlordPermission('No')}
                      />
                      {t('Not sure yet', '尚在沟通确认中')}
                    </label>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Household Children */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                    {t('Are there children in the home?', '家里是否有儿童/幼儿？')}
                  </label>
                  <select
                    value={hasChildren}
                    onChange={(e) => setHasChildren(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none font-bold"
                  >
                    <option value="No">{t('No Children', '否 (没有/全是成年人)')}</option>
                    <option value="Yes - Under 5">{t('Yes, under 5 years old', '是 (有5岁以下低龄幼儿)')}</option>
                    <option value="Yes - School Age">{t('Yes, school-aged children', '是 (有学龄段青少年)')}</option>
                  </select>
                </div>

                {/* Has Other Pets */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                    {t('Any other pets at home?', '目前家里是否养了其他宠物？')}
                  </label>
                  <select
                    value={hasOtherPets}
                    onChange={(e) => setHasOtherPets(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none font-bold"
                  >
                    <option value="No">{t('No other pets', '否 (无其他宠物)')}</option>
                    <option value="Yes">{t('Yes, have other pets', '是 (有其他宠物)')}</option>
                  </select>
                </div>
              </div>

              {hasOtherPets === 'Yes' && (
                <div className="space-y-1 animate-fade-in">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                    {t('Details of current pets', '简述现有宠物情况 (品种、年龄、相处状况)')}
                  </label>
                  <input
                    type="text"
                    value={otherPetsDetails}
                    onChange={(e) => setOtherPetsDetails(e.target.value)}
                    placeholder={t('e.g., One 3yr old neutered male cat', '例如：一只3岁已绝育的橘猫')}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none font-semibold"
                  />
                </div>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Experience Level */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                    {t('Pet Care Experience', '养宠经验水平')}
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none font-bold"
                  >
                    <option value="Beginner">{t('First-time owner', '新手小白 (首次养宠)')}</option>
                    <option value="Intermediate">{t('Some experience', '有一定经验 (曾照料过宠物)')}</option>
                    <option value="Expert">{t('Experienced owner', '养宠达人 (多年资深养宠经历)')}</option>
                  </select>
                </div>

                {/* Hours Left Alone */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                    {t('Pet alone time per day', '宠物每天独处时长')}
                  </label>
                  <select
                    value={hoursAlone}
                    onChange={(e) => setHoursAlone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none font-bold"
                  >
                    <option value="<2">{t('Less than 2 hours', '少于 2 小时 (多人在家或居家办公)')}</option>
                    <option value="2-4">{t('2 to 4 hours', '2 - 4 小时 (短暂外出或轮班)')}</option>
                    <option value="4-8">{t('4 to 8 hours', '4 - 8 小时 (朝九晚五上班族)')}</option>
                    <option value="8+">{t('Over 8 hours', '8 小时以上 (独居且工作繁忙)')}</option>
                  </select>
                </div>
              </div>

              {/* Motivation */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                  {t('Adoption Motivation & Background', '为什么您是最适合它的领养家庭？')}
                </label>
                <textarea
                  rows={3}
                  required
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder={t('Tell us about your household routine, experience, and commitment...', '说说您会如何疼爱陪伴它，日常如何分配时间和精力来照料它，如有特定经验更佳...')}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none font-semibold resize-none"
                />
              </div>

              {/* Aggrement Checkbox */}
              <label className="flex items-start gap-2.5 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-0.5 rounded text-rose-500 focus:ring-rose-500 cursor-pointer"
                />
                <span className="text-[10px] font-bold text-stone-600 dark:text-stone-300 leading-normal">
                  {t(
                    'I certify all information is accurate. I agree to vet checks, and potential follow-up house visits to verify suitable pet environment.',
                    '我保证以上所填信息均真实无误。我同意在后续接受收容救助中心的相关家访及资质复审，保障宠物获得良好的成长照料。'
                  )}
                </span>
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200/60 dark:border-stone-800">
        <div>
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-black rounded-xl transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t('Back', '上一步')}
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        <div>
          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-xl transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-500/10"
            >
              {t('Next Step', '继续下一步')}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 disabled:from-stone-300 disabled:to-stone-400 text-white text-xs font-black rounded-xl transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/10"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('Submitting...', '提交中...')}
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  {t('Submit Application', '立即提交领养申请')}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
