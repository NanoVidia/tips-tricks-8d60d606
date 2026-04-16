export interface ClinicalItem {
  id: string;
  title: string;
  titleAr: string;
  situation: string;
  situationAr: string;
  action: string;
  actionAr: string;
  script: string;
  scriptAr: string;
}

export const clinicData: ClinicalItem[] = [
  {
    id: "c1",
    title: "First Prenatal Visit",
    titleAr: "أول زيارة ما قبل الولادة",
    situation: "New patient presenting at 8 weeks gestation for initial prenatal assessment.",
    situationAr: "مريضة جديدة تحضر في الأسبوع الثامن من الحمل للتقييم الأولي.",
    action: "Complete history, baseline labs (CBC, blood type, Rh, rubella, hepatitis B/C, HIV, UA), dating ultrasound, and initiate prenatal vitamins.",
    actionAr: "أخذ التاريخ المرضي الكامل، الفحوصات الأساسية (تعداد الدم، فصيلة الدم، الحصبة الألمانية، التهاب الكبد، فيروس نقص المناعة)، أشعة تحديد العمر، وبدء الفيتامينات.",
    script: "Welcome! Today we'll do a full check-up, some blood tests, and an ultrasound to confirm your due date. Do you have any concerns?",
    scriptAr: "أهلاً بكِ! سنجري اليوم فحصاً شاملاً وبعض التحاليل وأشعة لتأكيد موعد الولادة. هل لديكِ أي مخاوف؟",
  },
  {
    id: "c2",
    title: "Abnormal Pap Smear Follow-up",
    titleAr: "متابعة مسحة عنق الرحم غير الطبيعية",
    situation: "Patient returns with ASCUS Pap result, HPV positive.",
    situationAr: "عودة المريضة بنتيجة مسحة غير طبيعية مع إيجابية فيروس الورم الحليمي.",
    action: "Schedule colposcopy with biopsy. Explain procedure, risks, and follow-up plan per ASCCP guidelines.",
    actionAr: "جدولة منظار عنق الرحم مع خزعة. شرح الإجراء والمخاطر وخطة المتابعة حسب الإرشادات.",
    script: "Your Pap test showed some changes we need to look at more closely. We'll do a colposcopy — it's a quick, safe procedure. Most results turn out fine.",
    scriptAr: "أظهرت المسحة بعض التغيرات التي نحتاج لفحصها عن قرب. سنجري منظاراً — إجراء سريع وآمن. معظم النتائج تكون طبيعية.",
  },
  {
    id: "c3",
    title: "Gestational Diabetes Screening",
    titleAr: "فحص سكري الحمل",
    situation: "28-week patient due for glucose challenge test (GCT).",
    situationAr: "مريضة في الأسبوع 28 مستحقة لفحص تحدي الجلوكوز.",
    action: "Administer 50g GCT. If ≥140 mg/dL, proceed with 3-hour 100g OGTT. Counsel on dietary modifications.",
    actionAr: "إجراء فحص الجلوكوز 50 غرام. إذا ≥140، إجراء فحص 3 ساعات. تقديم نصائح غذائية.",
    script: "At 28 weeks, we screen for gestational diabetes. You'll drink a sweet solution and we'll check your blood sugar after one hour.",
    scriptAr: "في الأسبوع 28 نفحص سكري الحمل. ستشربين محلولاً حلواً ونفحص السكر بعد ساعة.",
  },
  {
    id: "c4",
    title: "Preeclampsia Assessment",
    titleAr: "تقييم تسمم الحمل",
    situation: "32-week patient with new-onset BP 150/95 and 1+ proteinuria.",
    situationAr: "مريضة في الأسبوع 32 مع ارتفاع ضغط جديد 150/95 وبروتين في البول.",
    action: "Admit for observation. Labs: CBC, CMP, LDH, uric acid, 24h urine protein. Administer betamethasone. Consider magnesium sulfate.",
    actionAr: "إدخال للمراقبة. تحاليل شاملة وبروتين البول. إعطاء بيتاميثازون. النظر في كبريتات المغنيسيوم.",
    script: "Your blood pressure is high and there's protein in your urine. We need to monitor you closely in the hospital to keep you and baby safe.",
    scriptAr: "ضغطك مرتفع ويوجد بروتين في البول. نحتاج لمراقبتك في المستشفى للحفاظ على سلامتك وسلامة الجنين.",
  },
];

export const orLaborData: ClinicalItem[] = [
  {
    id: "o1",
    title: "Emergency C-Section Prep",
    titleAr: "التحضير للقيصرية الطارئة",
    situation: "Category I cesarean for non-reassuring fetal heart tracing with prolonged decelerations.",
    situationAr: "قيصرية طارئة فئة أولى لتتبع قلب جنين غير مطمئن مع تباطؤ مطول.",
    action: "Call anesthesia STAT. Prep OR, Foley, IV access x2. Type & crossmatch 2 units PRBCs. Left uterine displacement. Decision-to-incision <30 min.",
    actionAr: "استدعاء التخدير فوراً. تحضير غرفة العمليات، قسطرة، وصول وريدي مزدوج. فصيلة دم ووحدتين. إمالة الرحم يساراً. القرار للشق <30 دقيقة.",
    script: "We need to deliver your baby quickly by cesarean. The team is ready. You'll be safe — we do this regularly.",
    scriptAr: "نحتاج لولادة طفلك بسرعة عن طريق القيصرية. الفريق جاهز. ستكونين بأمان — نقوم بهذا بانتظام.",
  },
  {
    id: "o2",
    title: "Shoulder Dystocia Management",
    titleAr: "إدارة عسر ولادة الكتف",
    situation: "Delivery complicated by shoulder dystocia after head delivery.",
    situationAr: "ولادة متعسرة بسبب انحشار الكتف بعد خروج الرأس.",
    action: "Call for help. McRoberts maneuver + suprapubic pressure. If unresolved: Rubin II, Woods screw, posterior arm delivery. Document times.",
    actionAr: "طلب المساعدة. مناورة ماكروبرتس + ضغط فوق العانة. إذا لم تنجح: مناورة روبن، الذراع الخلفية. توثيق الأوقات.",
    script: "I need you to pull your knees up to your chest right now. Your baby's shoulder is stuck and we're going to help.",
    scriptAr: "أحتاج منكِ أن تسحبي ركبتيكِ نحو صدرك الآن. كتف طفلك محشور وسنساعد.",
  },
  {
    id: "o3",
    title: "Postpartum Hemorrhage",
    titleAr: "نزيف ما بعد الولادة",
    situation: "EBL >1000ml within 1 hour postpartum, uterine atony suspected.",
    situationAr: "فقدان دم >1000 مل خلال ساعة بعد الولادة، يُشتبه بارتخاء الرحم.",
    action: "Bimanual uterine massage. Oxytocin 40U in 1L NS. Methylergonovine 0.2mg IM. Misoprostol 800mcg PR. Activate MTP if ongoing.",
    actionAr: "تدليك الرحم بكلتا اليدين. أوكسيتوسين. ميثيلإرغونوفين. ميزوبروستول. تفعيل بروتوكول نقل الدم الشامل إذا استمر.",
    script: "You're bleeding more than expected. We're giving medications and massaging your uterus. The team is here and you're being well cared for.",
    scriptAr: "لديكِ نزيف أكثر من المتوقع. نعطيكِ أدوية وندلك الرحم. الفريق هنا وأنتِ بأيدٍ أمينة.",
  },
  {
    id: "o4",
    title: "Operative Vaginal Delivery",
    titleAr: "الولادة المهبلية بالأدوات",
    situation: "Prolonged second stage, vertex at +2, OA position, adequate anesthesia.",
    situationAr: "مرحلة ثانية مطولة، رأس في +2، وضعية أمامية، تخدير كافٍ.",
    action: "Confirm criteria met (full dilation, ruptured membranes, known position). Apply vacuum/forceps. Communicate with patient. Prepare for cesarean backup.",
    actionAr: "تأكيد استيفاء المعايير (توسع كامل، أغشية ممزقة، وضعية معروفة). تطبيق الشفط/الملقط. التواصل مع المريضة. تحضير القيصرية احتياطاً.",
    script: "Pushing has been going on for a while. I'd like to use a gentle suction cup to help guide your baby out. It's safe and we'll stop if it's not working.",
    scriptAr: "الدفع استمر لفترة. أود استخدام كوب شفط لطيف لمساعدة طفلك بالخروج. إنه آمن وسنتوقف إذا لم ينجح.",
  },
];

export const behaviorData: ClinicalItem[] = [
  {
    id: "b1",
    title: "Breaking Bad News – Fetal Demise",
    titleAr: "إبلاغ الأخبار السيئة – وفاة الجنين",
    situation: "Ultrasound confirms intrauterine fetal demise at 20 weeks.",
    situationAr: "الأشعة تؤكد وفاة الجنين داخل الرحم في الأسبوع 20.",
    action: "Use SPIKES protocol. Private room, sit at eye level, allow silence. Offer chaplain/social work. Discuss delivery options (induction vs D&E).",
    actionAr: "استخدام بروتوكول SPIKES. غرفة خاصة، الجلوس بمستوى العين، السماح بالصمت. عرض الدعم النفسي. مناقشة خيارات الولادة.",
    script: "I'm so sorry — the ultrasound shows your baby no longer has a heartbeat. I know this is devastating. Take all the time you need. We're here for you.",
    scriptAr: "أنا آسف جداً — الأشعة تُظهر أن طفلك لم يعد لديه نبض. أعلم أن هذا مدمر. خذي كل الوقت الذي تحتاجينه. نحن هنا من أجلك.",
  },
  {
    id: "b2",
    title: "Informed Consent – Hysterectomy",
    titleAr: "الموافقة المستنيرة – استئصال الرحم",
    situation: "Planned total abdominal hysterectomy for symptomatic fibroids.",
    situationAr: "استئصال رحم كلي مخطط لأورام ليفية عرضية.",
    action: "Explain procedure, risks (bleeding, infection, organ injury, VTE), alternatives (myomectomy, UAE, medical management), and expected recovery.",
    actionAr: "شرح الإجراء والمخاطر (نزيف، عدوى، إصابة أعضاء) والبدائل (استئصال الورم، الإدارة الدوائية) والتعافي المتوقع.",
    script: "We'll remove the uterus through an abdominal incision. Risks include bleeding and infection, but serious complications are uncommon. Recovery is about 6 weeks.",
    scriptAr: "سنزيل الرحم من خلال شق في البطن. المخاطر تشمل النزيف والعدوى، لكن المضاعفات الخطيرة غير شائعة. التعافي حوالي 6 أسابيع.",
  },
  {
    id: "b3",
    title: "Adolescent Confidentiality",
    titleAr: "سرية المراهقين",
    situation: "16-year-old requests STI testing without parental knowledge.",
    situationAr: "مراهقة 16 عاماً تطلب فحص الأمراض المنقولة جنسياً دون علم الوالدين.",
    action: "Review state minor consent laws. Provide confidential testing per guidelines. Screen for abuse/coercion. Offer contraception counseling.",
    actionAr: "مراجعة قوانين موافقة القاصرين. تقديم الفحص السري. الفحص للإساءة/الإكراه. تقديم استشارات منع الحمل.",
    script: "What we discuss stays between us unless there's a safety concern. Let's make sure you're healthy and answer any questions you have.",
    scriptAr: "ما نناقشه يبقى بيننا ما لم يكن هناك قلق على السلامة. لنتأكد من صحتك ونجيب على أسئلتك.",
  },
  {
    id: "b4",
    title: "Patient Refusal of Treatment",
    titleAr: "رفض المريضة للعلاج",
    situation: "Term patient with ruptured membranes refuses induction, requests expectant management.",
    situationAr: "مريضة في نهاية الحمل مع تمزق أغشية ترفض التحريض وتطلب إدارة توقعية.",
    action: "Document informed refusal. Explain risks (chorioamnionitis, cord prolapse). Establish monitoring plan. Involve ethics if needed.",
    actionAr: "توثيق الرفض المستنير. شرح المخاطر (التهاب الأغشية، هبوط الحبل السري). وضع خطة مراقبة.",
    script: "I respect your decision. Let me explain the risks so you can make the most informed choice. We'll monitor you closely either way.",
    scriptAr: "أحترم قرارك. دعيني أشرح المخاطر حتى تتخذي القرار الأكثر استنارة. سنراقبك عن كثب في كلتا الحالتين.",
  },
];

export const qaData: ClinicalItem[] = [
  {
    id: "q1",
    title: "When to start progesterone for preterm prevention?",
    titleAr: "متى نبدأ البروجسترون للوقاية من الولادة المبكرة؟",
    situation: "Patient with history of prior spontaneous preterm birth <37 weeks.",
    situationAr: "مريضة لديها تاريخ ولادة مبكرة تلقائية سابقة <37 أسبوع.",
    action: "Start 17-OHP (250mg IM weekly) at 16–20 weeks, continue through 36 weeks. Consider cervical length screening at 16 weeks.",
    actionAr: "بدء 17-OHP (250 ملغ عضلياً أسبوعياً) في الأسبوع 16-20، ومتابعة حتى 36 أسبوعاً. النظر في فحص طول عنق الرحم.",
    script: "Because of your previous preterm delivery, we'll start weekly progesterone shots at 16 weeks to help reduce that risk this time.",
    scriptAr: "بسبب ولادتك المبكرة السابقة، سنبدأ حقن بروجسترون أسبوعية في الأسبوع 16 لتقليل هذا الخطر.",
  },
  {
    id: "q2",
    title: "GBS prophylaxis indications?",
    titleAr: "مؤشرات الوقاية من بكتيريا GBS؟",
    situation: "Patient in labor with unknown GBS status.",
    situationAr: "مريضة في المخاض مع حالة GBS غير معروفة.",
    action: "Give intrapartum prophylaxis if: <37 wks, ROM ≥18h, or intrapartum fever ≥38°C. Penicillin G 5M units IV then 2.5M q4h.",
    actionAr: "إعطاء الوقاية أثناء المخاض إذا: <37 أسبوع، تمزق أغشية ≥18 ساعة، أو حمى ≥38 درجة. بنسلين وريدي.",
    script: "Since we don't have your GBS test result and you have a risk factor, we'll give you antibiotics during labor to protect the baby.",
    scriptAr: "بما أنه ليس لدينا نتيجة فحص GBS ولديكِ عامل خطر، سنعطيكِ مضادات حيوية أثناء المخاض لحماية الطفل.",
  },
  {
    id: "q3",
    title: "Magnesium sulfate dosing for eclampsia?",
    titleAr: "جرعات كبريتات المغنيسيوم للإرجاج؟",
    situation: "Eclamptic seizure in a preeclamptic patient at 34 weeks.",
    situationAr: "نوبة إرجاج في مريضة تسمم حمل في الأسبوع 34.",
    action: "Loading: MgSO4 4–6g IV over 15–20 min. Maintenance: 1–2g/hr IV. Monitor reflexes, RR, UO hourly. Antidote: calcium gluconate 1g IV.",
    actionAr: "جرعة تحميل: 4-6 غرام وريدياً خلال 15-20 دقيقة. صيانة: 1-2 غرام/ساعة. مراقبة المنعكسات والتنفس وإخراج البول. الترياق: غلوكونات الكالسيوم.",
    script: "You had a seizure from high blood pressure. We're giving magnesium through your IV to prevent more seizures and planning delivery.",
    scriptAr: "حدثت لكِ نوبة بسبب ارتفاع ضغط الدم. نعطيكِ مغنيسيوم عبر الوريد لمنع نوبات أخرى ونخطط للولادة.",
  },
  {
    id: "q4",
    title: "Rh immunoglobulin timing?",
    titleAr: "توقيت الغلوبولين المناعي Rh؟",
    situation: "Rh-negative mother at 28 weeks with no antibodies detected.",
    situationAr: "أم سالبة Rh في الأسبوع 28 بدون أجسام مضادة.",
    action: "RhoGAM 300mcg IM at 28 weeks. Repeat within 72 hours postpartum if infant Rh-positive. Also give after any sensitizing event.",
    actionAr: "RhoGAM 300 ميكروغرام عضلياً في الأسبوع 28. تكرار خلال 72 ساعة بعد الولادة إذا كان الرضيع Rh إيجابي.",
    script: "Your blood type is Rh-negative. We'll give you a protective shot now at 28 weeks, and again after delivery if needed, to prevent complications in future pregnancies.",
    scriptAr: "فصيلة دمك سالبة Rh. سنعطيكِ حقنة وقائية الآن في الأسبوع 28، ومرة أخرى بعد الولادة إذا لزم الأمر، لمنع مضاعفات في الحمل المستقبلي.",
  },
];

export const allData = { clinic: clinicData, or: orLaborData, behavior: behaviorData, qa: qaData };
