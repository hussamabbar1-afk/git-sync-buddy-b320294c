# ZunftEcho — تدقيق أدوات النمو وقاعدة التوجيه

آخر تحديث: 14 سبتمبر 2026، 20:15 `Europe/Berlin`.
إضافة تشغيلية فقط؛ لا تبديل للأولوية أو بوابات القانونيات/الإنفاق/الموافقة أو التجارب الحالية.

## نتيجة التدقيق الحي

«يعمل MCP» لا يعني أن مصدر البيانات أو كل عملية مدفوعة أو الحساب المقصود تحقق بالكامل.
لم تُختبر عمليات الإثراء المدفوعة؛ عدم اختبارها لحماية الحصة ليس إثباتًا لتعطلها.

| الأداة | التصنيف التشغيلي | الدليل الحي | الخطة والحصة المتاحة | ما لم يتحقق بعد |
| --- | --- | --- | --- | --- |
| Clay | PARTIALLY CONNECTED | `get_current_workspace`: `1373289`، `Personal Workspace` | الخطة وActions وData Credits غير مكشوفة | هوية صاحب Workspace، رصيد الحساب وتنفيذ البحث/الإثراء؛ صفحة الويب Session expired |
| AI Vibe Prospecting | PARTIALLY CONNECTED | `get_dataset` أعاد قائمة فعلية، 0 datasets؛ لا إنشاء/تصدير | الخطة والرصيد وحدود اليوم غير مكشوفة | هوية الحساب وملاءمة نتائج SHK والتكلفة؛ Hub يعيد إلى تسجيل دخول Explorium |
| Hunter | PARTIALLY CONNECTED | `get_account_details` مصادق ويعيد حصة Free | 50 searches و100 verifications و50 credits، المستخدم0 في كل عداد؛ reset14 أكتوبر2026 | واجهة MCP لا تكشف اسم/بريد صاحب الحساب؛ تأكيد الحساب المقصود خلف تسجيل دخول الويب. قراءة الحصة تعمل، البحث/الإثراء غير مختبرين |
| Semrush | BLOCKED BY PLAN | استدعاء اكتشاف `projects` يرفض لعدم كفاية API units | اسم الخطة والعدد المتبقي غير متاحين؛ الموصل يذكر اشتراكًا نشطًا دون تفاصيل مستقلة | لا تقرير قابل للتنفيذ مثبت، ولا `execute_report`؛ صفحة mcp-access تعيد لتسجيل الدخول |
| GSC Wizard | FULLY CONNECTED | الحساب `hussamabbar55@gmail.com`؛ الخاصية `sc-domain:zunftecho.de`؛ ملخص Search Console فعلي | `subscription:null`؛ لا اشتراك مدفوع مكتشف. URL inspection:0/2000 مستخدم،2000 متبقٍ اليوم | هذا الحكم لـGSC فقط؛ GA4 غير مربوط (`ga4PropertyId:null`)؛ حصص/تسعير الميزات الأخرى غير مثبتة |
| Metricool | OWNER ACTION REQUIRED | MCP يعيد Brand6962406 للحسابsuffix55، `networksData:{}` | خطة الحساب والعداد المتبقي غير مكشوفين؛ لا شبكات | التطبيق عند Login؛ YouTube يحتاج ربطًا وOAuth. LinkedIn غير متاح إذا كانت الخطة Free؛ لا ترقية |
| vidIQ | OWNER ACTION REQUIRED | MCP مصادق بحسابsuffix55؛ `user_channels:[]` | `type:limited`،150/150 renewable،0 add-on؛ reset14 أكتوبر2026،15:48 Berlin تقريبًا | اسم الخطة غير معلن؛ لا نسميها Free كحقيقة. التطبيق عند Login؛ قناة ZunftEcho غير مرتبطة |

Hunter ليس محجوبًا عن قراءة الحصة؛ تصنيف PARTIALLY يخص تحقق الحساب/العمليات الكاملة، لا ادعاء أن تسجيل دخول المتصفح شرط لقراءة MCP.
وبالمثل Clay/Vibe/Metricool/vidIQ ترد عبر MCP حتى حين جلسة الويب غير مسجلة.
إجابة Semrush ليست تقريرًا ناجحًا رغم `isError:false`؛ تعذر القراءة لا يثبت أن الرصيد بالضبط0.

## العمليات المجانية والمستهلكة والبوابات

| الأداة | مجاني/قراءة قبل الرصيد | مستهلك للحصة أو الرصيد | ترقية/حدود غير مثبتة | أفضل استخدام وأرخص بديل |
| --- | --- | --- | --- | --- |
| Clay | Workspace/catalog/status أولًا؛ المستند الرسمي يعفي list sourcing والفلاتر/formulas وCSV export من Actions | Enrichment عادة1 Action مع Data Credits متغيرة؛ AI/waterfalls قد يجمعان تكاليف متعددة | بعض المرشحات المتقدمة/Functions تحتاج أهلية؛ MCP search لا يُفترض مجانيًا بكل تفاصيله؛ تحقق السعر والخطة أولًا | سد فجوة مؤهلة في شركة/مسؤول محدد. موقع الشركة/Impressum وHunter Discover أولًا |
| Vibe | Metadata واسترجاع القوائم؛ exploration/sample/statistics موصوفة مجانية، و`estimate_cost:true` حين توفره العملية | Base fetch عند materialization نحو1 credit/entity وفق الوثائق، وenrichment/events إضافية؛ التصدير ليس مجانيًا | Intent premium؛ حدود اليوم/التصدير والخطة الحالية مجهولة؛ لا export تلقائي | معاينة شركات/مسؤولين بمعايير ضيقة ثم تأهيل؛ البحث العام وHunter Discover غالبًا أرخص |
| Hunter | Account/usage، `find_companies`، `email_count`، قوائم metadata | MCP/API Domain Search:1 credit لكل1–10 عناوين راجعة/نطاق؛ Finder1 عند العثور؛ Verifier0.5 وEnrichment0.2 وفق الوثائق الحالية، مع عدم إثبات نموذج حسابنا legacy/separate counters | Free Discover محدود بالصفحة الأولى حتى100؛ فلاتر/pagination تتبع الخطة. قبل أي صرف تحقق من عدادات الحساب ونموذج التكلفة، ولا تجمع عدادات50+100+50 | اكتشاف شركات SHK ثم بريد مهني مفقود فقط؛ البريد الرسمي المنشور أرخص من إعادة كشفه |
| Semrush | Metadata/schema قبل report إن أمكن؛ الاكتشاف الحالي محجوب أصلًا | التقارير البحثية/Projects عند التنفيذ قد تستهلك API units، والتكلفة تختلف بحسب التقرير والصفوف | الوحدات غير كافية حاليًا؛ لا شراء أو اقتراح ترقية افتراضي. Free web allowances غير مثبتة | بيانات سوق/منافسين لا يوفرها GSC؛ البحث العام للمقارنة النوعية أرخص، ولا نستبدله بادعاء search volume |
| GSC Wizard | Account/sites وقراءات first-party ضمن الحصص؛ تم تنفيذ summary فقط | Inspection يستهلك حصة Google اليومية؛ bulk inspections تتطلب حاجة. حدود crawler/report/ميزات إضافية غير معلنة | لا paid subscription مكتشف لا يعني كل الميزات مجانية بلا حدود | Query/page/CTR/indexing للموقع نفسه؛ Search Console الأصلي بديل مجاني |
| Metricool | Brand metadata؛ MCP نفسه متاح حتىFree. قراءات analytics بعد ربط الشبكة ضمن خطة الحساب | Free العام:20 منشورًا منشورًا/شهر،30 يوم تاريخ،5 AI text credits؛ المتبقي الفعلي غير معلوم | Free لاLinkedIn/X؛ reports/integrations وبعض approvals مدفوعة. API التقليدي Advanced/Custom مختلف عن MCP | تحليلات/تنسيق عضوي بعد الربط عند فائدة فعلية؛ Studio وLinkedIn الأصليان مجانيان الآن |
| vidIQ | Balance/channels/authorization وقراءة job status:0 حسب وصف الأدوات | غالبية keyword/title/thumbnail scoring/YouTube stats/analytics/lookups:5/طلب؛ short watch10،long watch25،thumbnail generate/refine22؛ script1/minute؛ video generation متغير وليس اختبارًا مجانيًا | حدود الخطة/توليد مكثف أو إضافات رصيد لا تُفتح تلقائيًا؛ لا تفسر150 كميزانية شراء | سؤال keywords/packaging مؤثر عند قرار تجربة لاحق؛ Studio للتحليلات الفعلية وكتابة محلية للعناوين أرخص |

مفاتيح BYO في Clay قد تلغي Clay Data Credits لكن تبقي Actions وفاتورة المزوّد الخارجي؛ ليست تكلفة إجمالية صفرية.
وصف Hunter API يختلف عن كشف العناوين في واجهة الويب؛ لا نقل للتسعير بين المسارين دون تحقق.
مجانية العملية لا تمنح إذن إرسال أو نشر أو ربط أو رفع بيانات. تحقق البريد لا يساوي الموافقة على التسويق.

## قاعدة التوجيه الدائمة — تطبق قبل كل استخدام

1. ابدأ بـCURRENT STATE والمخرجات الموجودة؛ افحص مفتاح `domain + decision-maker + purpose` في قوائم المشروع قبل أي lookup. لا إعادة للجهات/الرسائل/التجارب المكتملة.
2. اختر أصغر سؤال تجاري مؤثر؛ حدّد المخرج والحقول المطلوبة. لا «enrich everything»، ولا هواتف/بريد شخصي غير مطلوب، ولا دفعة لمجرد اختبار أداة.
3. المصادر العامة/الحساب الأصلي أولًا حين تكفي بجودة مهنية. لا تنقل بيانات عملاء/قائمة خاصة إلى أداة جديدة دون أساس وموافقة لازمة.
4. استخدم جدول التوجيه أدناه. fallback مشروط بفجوة حقيقية، وليس waterfall يمر بكل المزودين على الشركة نفسها.
5. قبل عملية credits: تحقق من الحساب والخطة والحصة، واقرأ schema/cost estimate؛ التكلفة/الحصة المجهولة ليست0. توقف فقط هذا المسار إذا لم يمكن ضبط حد الصرف.
6. بعد انتهاء التدقيق وتحقق الحساب، تسمح الحصة المجانية المعروفة بطلب صغير مبرر ومحدود عند حاجة فعلية ضمن السلطة القائمة؛ لا bulk export/اشتراك/شراء، وموافقة التصدير الخاصة بـVibe تبقى لازمة. أي صرف كبير أو مالي يحتاج موافقة.
7. سجل التكلفة المتوقعة/الفعلية والنتيجة والحصة بعد batch صغير؛ أعد استخدام النتائج. لا مزود credits ثانٍ إلا إذا التحقق المتقاطع يغير قرارًا تجاريًا مهمًا، مع تسجيل السبب.
8. حافظ على Attribution: لا تعديل B/C/Workflow أو title/thumbnail/CTA أثناء قياسها؛ لا نشر/جدولة مكرر عند وصل Metricool، ولا استيراد Queue لتبدو الأداة نشطة.

| المهمة | المسار الافتراضي الآن | fallback عند فجوة فعلية |
| --- | --- | --- |
| شركات SHK محلية وتأهيل شركاء | مواقع الشركات/أدلة رسمية + Hunter Discover المجاني بعد تأكيد الحساب | Vibe sample/estimate بعد تحقق الحساب؛ Clay search معلوم التكلفة؛ Apollo Web فقط لحاجة جديدة،API المحجوب لا يُعاد |
| مسؤول قرار | Impressum/About + LinkedIn مهني ومرجع رسمي | Vibe/Clay معاينة موجهة،لا استخراج اتصالات شامل |
| بريد مهني | المصدر الرسمي الموجود؛ Hunter EmailCount مجاني قبل كشف مفقود | Hunter Finder/Domain Search محدود؛ Vibe/Clay فقط إذا فجوة مهمة وتكلفة أفضل مثبتة |
| تحقق Deliverability | لا طلب إن لم توجد حاجة/قناة مسموحة؛ Hunter لحالة محددة معلومة التكلفة | مصدر رسمي؛ لاVerifier ثانٍ لمجرد زيادة الثقة،ولا توقع يقين role/catch-all |
| SEO أداء الموقع وفهرسته | GSC Wizard الخاصية الصحيحة، نافذة بيانات مكتملة | GSC الأصلي؛ inspection محدد فقط،لا إعادة Bing Submit المكتمل |
| SEO السوق/المنافسين | بحث عام نوعي أولًا | Semrush فقط إذا وحدات موجودة بالفعل وتكلفة التقرير معروفة؛ لا ندعي حجم بحث من GSC صغير |
| YouTube الأداء والنشر الحالي | Studio الأصلي،قراءة دون play/CTA | vidIQ بعد ربط القناة لسؤال إضافي يبرر5credits،لا تكرار إحصاءات مجانية |
| YouTube keywords/packaging لاحق | صياغة محلية وبحث نوعي | vidIQ واحد موجه؛ لا عدةtitle generators ولا تغيير تجربة نشطة |
| Social scheduling/analytics | Native Studio/LinkedIn يحافظان على Queue | Metricool بعد OAuth والخطة،YouTube أولًا؛ LinkedIn Native إذاFree |
| بريد/ردود الشركاء | صندوقا المشروعsuffix4/55 ومسار alias الصحيح فقط | لا ربط Gmail مختلف أو Hunter sequences/Clay campaign تلقائي |

## نقاط الاستئناف وطلب المالك الأدنى

لا كلمة مرور/OTP/API key أو رابطstate/token محفوظ هنا. صفحات التدقيق فُتحت وقرئت دون تسجيل دخول/اختيار هوية/قبول OAuth.

| الترتيب | الصفحة المفتوحة/نقطة التوقف | إجراء المالك | تحقق Work بعده |
| --- | --- | --- | --- |
| 1 vidIQ | `https://app.vidiq.com/auth/login`؛ Chrome458451870 محفوظHandoff | الدخول إلى الحساب المقصود، ثم ربط قناةZunftEcho والموافقة علىOAuth بنفسه؛ لا قناة شخصية بديلة | `user_channels` يحتوي القناة الصحيحة `UCp_6QWMLCckl7rC9j_-ImqA` / `@zunftecho`؛ بعدهاauthorization0credits إذا احتاج refresh. الأداةauthorize لا تضيف قناة جديدة |
| 2 Metricool | `https://app.metricool.com/login`؛ Chrome458451867 محفوظ | الدخولsuffix55؛ ربطYouTubeZunftEcho داخلBrand6962406 والموافقة بنفسه | Brand networks يظهرYouTubeID الصحيح؛ قراءةplan/planner counter. LinkedIn فقط إذاالخطة القائمة تدعمه وبعد تحقق شخصية/صفحة المالك،لا ترقية |
| 3 Clay | `https://app.clay.com/workspaces/1373289`؛ Chrome458451861 محفوظ،sessionexpired | تسجيل الدخول للحساب القائم وتأكيدWorkspace1373289؛ عرضBilling/Usage فقط،بلا إنشاء جديد | مطابقةWorkspace،الخطة،Actions/DataCredits المتبقية والتكلفة؛ ثم اختبار صغير مبرر عند حاجة |
| 4 Vibe | `https://app.vibeprospecting.ai/lists`؛ Chrome458451864 محفوظ عندExplorium Login | الدخول للحساب القائم وتأكيدالهوية/عرضالحصة فقط | خطة/credits/daily cap فيHub قبلestimate/sample،لا export |
| 5 Hunter | `https://hunter.io/users/sign_in`؛ login فقط،لا ضرورة OAuth جديد مثبتة | تأكيدبريدالحساب/الفريق المقصود منالحساب القائم عند أول استخدام | قراءةحصة0/50،0/100،0/50 ونموذجالتسعير؛ لا إعادة ربط إذاMCPصحيح |
| 6 Semrush | `https://www.semrush.com/mcp-access`؛ يعيد إلىLogin | اختياري: تأكيدحساب/وحدات موجودة أصلًا فقط؛ لا شراء | إن ظلت الوحداتغيركافية،يبقىBLOCKED؛ لا إطلاق تقرير أو trial |

يمكن للمالك إنجاز1ثم2 أولًا؛ باقي المسارات لا تنتظر اكتمال كل الاتصالات. لا إعادة إنشاءBrand/Workspace/account.
لا يفترض Work أن نجاح تسجيل الدخول أنهى OAuth؛ يتحقق من IDs ومصدرالبيانات بعده.

## خط أساس الرصيد والبيانات

- Hunter: Free،searches used0/remaining50،verifications0/100،credits0/50. حقل`calls.available75` deprecated/imprecise؛ لا استخدامه للميزانية ولا جمع العدادات.
- vidIQ:150renewable،0add-on؛ استدعاءاbalance/channels أظهرا`_credits.used:0`؛ لم ينفذ أي طلب5credits أوتوليد.
- GSC: inspection0/2000؛ لم تُنفذinspection. ملخص7 أيام5–11 سبتمبر أعاد2clicks/5impressions/CTR40%/avg.position1.6429؛ settledThrough12سبتمبر وfirstIncomplete13سبتمبر،تاريخالتقريرAmerica/Los_Angeles. عينةضئيلة ليستLead/إثباتقناةرابحة أوتحويل؛ لاGA4ربط.
- Clay/Vibe: metadata/catalog فقط،لابحث/إثراء/تصدير؛ استهلاكcredits غير مكشوف،لا ندعي قياس0 منعدادحسابغيرمتاح.
- Semrush: catalog/permission gate فقط،لاexecute_report؛ لاunitsمقاسة. Metricool:Brandmetadata فقط،لاpost/analyticsلشبكةغيرمربوطة.
- ShortB: تحققStudio بعدReload14سبتمبر20:14 بأنه **علني**،المصدر`youtube-check-video-02`؛ لاplay/CTA/حفظ/تعديل أوقياسviews جديد. C/Workflow والmonitor18:35القائم لم يتغيرا.

سجل أي batch لاحق هنا أو في سجل تنفيذه: `timestamp | task/entity | provider/operation | reason | expected units | actual units | remaining | result/status | cache/source`.
لا إعادةتدقيقشامل عند كل جلسة؛ أعدفقط الحساب/الحصة المتغيرة قبل صرف أو بعدتغيير اتصال.

## مصادر حدود المزودين

- [Hunter API](https://help.hunter.io/en/articles/1970956-hunter-api) و[Free Discover API limits](https://hunter.io/api-documentation).
- [Clay Actions & Data Credits](https://university.clay.com/docs/actions-data-credits).
- [Explorium Vibe Prospecting: estimation/sample/export](https://developers.explorium.ai/mcp-docs/vibeprospecting).
- [Metricool Free مقابل المدفوع](https://help.metricool.com/main-differences-between-free-and-paid-plans-bl0v9) و[MCP مقابل API وحدود الخطة](https://help.metricool.com/mcp-limits-and-plan-requirements-h72jg).
- vidIQ: تكلفة كلعملية منmetadataالموصل الحية14سبتمبر2026؛ الرصيدوالقنوات منMCP. Semrush: gateالموصل الحي،لا تسعير أووحداتمفترضة.

مهارةplugin-management وجهت التمييز بين التثبيت والاتصال؛ مهارةcomputer-use أوقفت خطواتالدخول/الأمان عند تسليمها للمالك وفقطلبه. لا استبدالMasterDirective.
