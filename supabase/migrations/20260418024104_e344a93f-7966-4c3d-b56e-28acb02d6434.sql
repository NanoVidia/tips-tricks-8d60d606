-- =====================================================
-- جلسات لوحة التحكم
-- =====================================================
CREATE TABLE public.admin_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_sessions_token ON public.admin_sessions(token);
CREATE INDEX idx_admin_sessions_expires ON public.admin_sessions(expires_at);
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
-- لا توجد سياسة قراءة عامة — الوصول فقط عبر service role

-- =====================================================
-- إعدادات عامة (key-value JSON)
-- =====================================================
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_app_settings_key ON public.app_settings(key);
CREATE INDEX idx_app_settings_category ON public.app_settings(category);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read app settings" ON public.app_settings FOR SELECT USING (true);

-- =====================================================
-- نصوص الواجهة (i18n)
-- =====================================================
CREATE TABLE public.app_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  ar TEXT NOT NULL,
  en TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  context TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_translations_key ON public.app_translations(key);
CREATE INDEX idx_translations_category ON public.app_translations(category);
ALTER TABLE public.app_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read translations" ON public.app_translations FOR SELECT USING (true);

-- =====================================================
-- بنك أسئلة MCQ
-- =====================================================
CREATE TABLE public.mcq_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT UNIQUE,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  exams TEXT[] NOT NULL DEFAULT '{}',
  stem TEXT NOT NULL,
  options TEXT[] NOT NULL,
  answer_index INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  reference TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mcq_topic ON public.mcq_questions(topic);
CREATE INDEX idx_mcq_difficulty ON public.mcq_questions(difficulty);
CREATE INDEX idx_mcq_exams ON public.mcq_questions USING GIN(exams);
CREATE INDEX idx_mcq_active ON public.mcq_questions(active);
ALTER TABLE public.mcq_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active mcqs" ON public.mcq_questions FOR SELECT USING (active = true);

-- =====================================================
-- موسوعة الجراحات
-- =====================================================
CREATE TABLE public.surgeries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT UNIQUE,
  category TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  difficulty INTEGER NOT NULL DEFAULT 3,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  pearls TEXT[] NOT NULL DEFAULT '{}',
  references_list TEXT[] NOT NULL DEFAULT '{}',
  video_id TEXT,
  mcqs JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_surgeries_category ON public.surgeries(category);
CREATE INDEX idx_surgeries_difficulty ON public.surgeries(difficulty);
CREATE INDEX idx_surgeries_active ON public.surgeries(active);
ALTER TABLE public.surgeries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active surgeries" ON public.surgeries FOR SELECT USING (active = true);

-- =====================================================
-- حالة اليوم
-- =====================================================
CREATE TABLE public.case_of_the_day (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  answer TEXT NOT NULL,
  references_list TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_case_date ON public.case_of_the_day(case_date);
ALTER TABLE public.case_of_the_day ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active cases" ON public.case_of_the_day FOR SELECT USING (active = true);

-- =====================================================
-- بطاقات الصفحة الرئيسية
-- =====================================================
CREATE TABLE public.home_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  subtitle_ar TEXT,
  subtitle_en TEXT,
  icon TEXT,
  link TEXT,
  color TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_home_slot ON public.home_sections(slot);
CREATE INDEX idx_home_order ON public.home_sections(display_order);
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active home sections" ON public.home_sections FOR SELECT USING (active = true);

-- =====================================================
-- بروتوكولات الطوارئ
-- =====================================================
CREATE TABLE public.tools_protocols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT UNIQUE,
  title TEXT NOT NULL,
  title_ar TEXT,
  color TEXT NOT NULL DEFAULT 'red',
  steps TEXT[] NOT NULL DEFAULT '{}',
  targets TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tools_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active protocols" ON public.tools_protocols FOR SELECT USING (active = true);

-- =====================================================
-- أدوية الحمل
-- =====================================================
CREATE TABLE public.tools_drugs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  trimester TEXT NOT NULL,
  lactation TEXT NOT NULL,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_drugs_name ON public.tools_drugs(name);
CREATE INDEX idx_drugs_category ON public.tools_drugs(category);
ALTER TABLE public.tools_drugs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active drugs" ON public.tools_drugs FOR SELECT USING (active = true);

-- =====================================================
-- الإرشادات الدولية
-- =====================================================
CREATE TABLE public.tools_guidelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  society TEXT NOT NULL,
  region TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'blue',
  items TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tools_guidelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active guidelines" ON public.tools_guidelines FOR SELECT USING (active = true);

-- =====================================================
-- التشخيص التفريقي
-- =====================================================
CREATE TABLE public.tools_ddx (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  presentation TEXT NOT NULL,
  differentials TEXT[] NOT NULL DEFAULT '{}',
  red_flags TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tools_ddx ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active ddx" ON public.tools_ddx FOR SELECT USING (active = true);

-- =====================================================
-- بيانات الامتحانات
-- =====================================================
CREATE TABLE public.exams_meta (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id TEXT NOT NULL UNIQUE,
  authority TEXT NOT NULL,
  country TEXT NOT NULL,
  country_code TEXT NOT NULL,
  flag TEXT NOT NULL,
  platform TEXT NOT NULL,
  exam_name TEXT NOT NULL,
  level TEXT NOT NULL,
  format TEXT NOT NULL,
  duration TEXT NOT NULL,
  questions INTEGER NOT NULL,
  pass_mark TEXT NOT NULL,
  fee_usd TEXT NOT NULL,
  validity_years TEXT NOT NULL,
  register_url TEXT NOT NULL,
  official_url TEXT NOT NULL,
  syllabus TEXT[] NOT NULL DEFAULT '{}',
  refs TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_exams_exam_id ON public.exams_meta(exam_id);
CREATE INDEX idx_exams_country_code ON public.exams_meta(country_code);
ALTER TABLE public.exams_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active exams" ON public.exams_meta FOR SELECT USING (active = true);

-- =====================================================
-- triggers لتحديث updated_at تلقائياً
-- =====================================================
CREATE TRIGGER trg_app_settings_updated BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_translations_updated BEFORE UPDATE ON public.app_translations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_mcq_updated BEFORE UPDATE ON public.mcq_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_surgeries_updated BEFORE UPDATE ON public.surgeries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_case_updated BEFORE UPDATE ON public.case_of_the_day FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_home_updated BEFORE UPDATE ON public.home_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_protocols_updated BEFORE UPDATE ON public.tools_protocols FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_drugs_updated BEFORE UPDATE ON public.tools_drugs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_guidelines_updated BEFORE UPDATE ON public.tools_guidelines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ddx_updated BEFORE UPDATE ON public.tools_ddx FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_exams_updated BEFORE UPDATE ON public.exams_meta FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- دالة تنظيف الجلسات المنتهية (تُستدعى من Edge Function)
-- =====================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_sessions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.admin_sessions WHERE expires_at < now();
$$;