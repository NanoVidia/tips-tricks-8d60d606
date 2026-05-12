UPDATE public.app_settings
SET value = jsonb_build_object(
  'plans', jsonb_build_object(
    'monthly',  jsonb_build_object('product_id','tt_monthly',  'price', 7.99,   'label_en','Monthly',  'label_ar','شهري'),
    'yearly',   jsonb_build_object('product_id','tt_yearly',   'price', 49.99,  'label_en','Yearly',   'label_ar','سنوي', 'savings','48%'),
    'lifetime', jsonb_build_object('product_id','tt_lifetime', 'price', 119.99, 'label_en','Lifetime', 'label_ar','مدى الحياة')
  ),
  'currency', 'USD',
  'trial_days', 7,
  'free_features', jsonb_build_array('case_of_the_day','ai_assistant'),
  'locked_features', jsonb_build_array('mcq_bank','exams','scenarios','surgery_library','tools','calculators','daily_mcq')
),
updated_at = now()
WHERE key = 'billing_plans';