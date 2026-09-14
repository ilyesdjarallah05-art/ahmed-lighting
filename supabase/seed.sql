-- Optional sample lighting catalog with full French, Arabic and English data. Run AFTER schema.sql.
insert into public.products(
  active, featured, sale_price, stock, gallery, created_at, id,
  name, name_ar, name_en, sku, category_id, price, colors, temperatures,
  material, material_ar, material_en, dimensions, wattage,
  description, description_ar, description_en,
  image_off, image_on, badge, badge_ar, badge_en
) values
(
  true, true, null, 20, ARRAY[]::text[], '2026-09-01T12:00:00Z', '00000000-0000-4000-8000-000000000001',
  'Suspension en lin Forma', 'ثريا كتان فورما', 'Forma linen pendant', 'ZT-P001', 'pendants', 18500, ARRAY['Ivory','Beige']::text[], ARRAY['2700K']::text[],
  'Lin · acier thermolaqué', 'كتان · فولاذ مطلي', 'Linen · powder-coated steel', 'Ø 45 × H 28 cm', 'E27 · max. 40W',
  'Une courbe douce. Une lueur apaisante. Forma apporte de la chaleur au cœur de votre maison grâce à son abat-jour en lin sculptural et sa lumière délicatement diffusée.',
  'انحناءة انسيابية وتوهج دافئ ومريح. تضفي ثريا فورما لمسة راقية على منزلك بفضل غطائها الكتاني المتقن وإضاءتها الموزعة بنعومة.',
  'A gentle curve. A softer glow. Forma brings warmth to the heart of your home with its sculptural linen shade and beautifully diffused light.',
  '/assets/pendant-off.webp', '/assets/pendant-on.webp', 'Édition lumière', 'إصدار الإضاءة', 'The light edit'
),
(
  true, true, null, 20, ARRAY[]::text[], '2026-09-01T12:00:00Z', '00000000-0000-4000-8000-000000000002',
  'Lampe à poser en céramique Alba', 'مصباح طاولة سيراميك ألبا', 'Alba ceramic table lamp', 'ZT-T001', 'table-lamps', 12500, ARRAY['Ivory']::text[], ARRAY['2700K']::text[],
  'Céramique texturée · lin', 'سيراميك ذو ملمس · كتان', 'Textured ceramic · linen', 'Ø 30 × H 42 cm', 'E27 · max. 25W',
  'Une présence discrète, un grand caractère. Alba associe une base en céramique subtilement texturée à un abat-jour arrondi pour une lumière intime et douce.',
  'حجم مثالي وشخصية مميزة. يجمع مصباح ألبا بين قاعدة سيراميكية أنيقة ذات ملمس فريد وغطاء دائري يمنح إضاءة حميمية ودافئة.',
  'A little light, a lot of character. Alba pairs a softly textured ceramic base with a rounded shade for a warm, intimate glow.',
  '/assets/table-off.webp', '/assets/table-on.webp', 'Un favori discret', 'الأكثر طلباً', 'A quiet favorite'
),
(
  true, true, 21000, 20, ARRAY[]::text[], '2026-09-01T12:00:00Z', '00000000-0000-4000-8000-000000000003',
  'Lampadaire élancé Linea', 'مصباح أرضي لينيا', 'Linea floor lamp', 'ZT-F001', 'floor-lamps', 23500, ARRAY['Black','Beige']::text[], ARRAY['2700K']::text[],
  'Acier thermolaqué · lin', 'فولاذ مطلي · كتان', 'Powder-coated steel · linen', 'Ø 32 × H 155 cm', 'E27 · max. 40W',
  'Lignes épurées, proportions étudiées. Linea diffuse une douce nappe lumineuse sans encombrer la pièce.',
  'خطوط رشيقة وتناسق متقن. يخلق مصباح لينيا الأرضي هالة من الضوء الناعم دون أن يشغل مساحة الغرفة.',
  'Slim lines, considered proportions. Linea creates a pool of soft light without taking over the room.',
  '/assets/floor-off.webp', '/assets/floor-on.webp', 'Prix spécial', 'سعر خاص', 'Special price'
),
(
  true, true, null, 20, ARRAY[]::text[], '2026-09-01T12:00:00Z', '00000000-0000-4000-8000-000000000004',
  'Spot sur rail orientable Axis', 'سبوت مسار متحرك أكسيس', 'Axis track spotlight', 'ZT-S001', 'spotlights', 4800, ARRAY['Black']::text[], ARRAY['3000K','4000K']::text[],
  'Aluminium', 'ألومنيوم', 'Aluminium', 'Ø 6 × L 15 cm', '12W LED',
  'Mettez en lumière ce qui compte. Axis offre un faisceau net et directionnel avec sa tête pivotante et sa finition mate sobre.',
  'سلط الضوء على التفاصيل التي تستحق. يوفر سبوت أكسيس إضاءة موجهة ونقية بفضل رأسه القابل للتعديل ولمسته النهائية غير اللامعة.',
  'Put the focus where it belongs. Axis delivers a clean, directional beam with an adjustable head and a discreet matte finish.',
  '/assets/spotlight-off.webp', '/assets/spotlight-on.webp', '', '', ''
),
(
  true, false, null, 20, ARRAY[]::text[], '2026-09-01T12:00:00Z', '00000000-0000-4000-8000-000000000005',
  'Spot encastré de plafond Ora', 'سبوت سقف مدمج أورا', 'Ora recessed downlight', 'ZT-D001', 'downlights', 2200, ARRAY['White']::text[], ARRAY['3000K','4000K']::text[],
  'Aluminium · diffuseur dépoli', 'ألومنيوم · موزع غير لامع', 'Aluminium · frosted diffuser', 'Ø 9 cm · découpe Ø 7.5 cm', '7W LED',
  'Une finition affleurante et une lumière reposante. Ora s''intègre discrètement dans le plafond pour un éclairage régulier et confortable.',
  'مظهر انسيابي وراحة بصرية متكاملة. يندمج سبوت أورا بسلاسة داخل السقف ليمنح توزيعاً ضوئياً متوازناً ومريحاً للعين.',
  'A clean finish and a comfortable glow. Ora sits neatly within the ceiling for discreet, evenly distributed lighting.',
  '/assets/downlight-off.webp', '/assets/downlight-on.webp', '', '', ''
),
(
  true, false, null, 20, ARRAY[]::text[], '2026-09-01T12:00:00Z', '00000000-0000-4000-8000-000000000006',
  'Plafonnier en laiton Halo', 'مصباح سقف نحاسي هالو', 'Halo brass ceiling lamp', 'ZT-C001', 'ceiling-lamps', 16800, ARRAY['Brass']::text[], ARRAY['3000K']::text[],
  'Laiton brossé · diffuseur acrylique', 'نحاس مصقول · موزع أكريليك', 'Brushed brass · acrylic diffuser', 'Ø 50 × H 7 cm', '36W LED',
  'Un cercle de lumière chaleureuse. Halo apporte une présence sculpturale discrète à votre plafond grâce à son laiton brossé et son anneau lumineux continu.',
  'دائرة من الضوء الدافئ الساحر. يمنح مصباح هالو لمسة جمالية راقية لسقف منزلك بنحاسه المصقول وحلقته المضيئة المتصلة.',
  'A circle of warm light. Halo brings an understated sculptural presence to your ceiling with a brushed brass finish and a continuous ring of illumination.',
  '/assets/ceiling-off.webp', '/assets/ceiling-on.webp', 'Nouvelle perspective', 'منظور جديد', 'New perspective'
)
on conflict (id) do nothing;
