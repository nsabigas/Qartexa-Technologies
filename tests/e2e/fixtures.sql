-- Test fixtures only (not shipped to customers)
insert into auth.users(id,email) values
 ('00000000-0000-0000-0000-000000000001','super@qartexa.test'),('00000000-0000-0000-0000-000000000002','admin@qartexa.test'),
 ('00000000-0000-0000-0000-000000000003','hr@qartexa.test'),('00000000-0000-0000-0000-000000000004','content@qartexa.test'),
 ('00000000-0000-0000-0000-000000000005','editor@qartexa.test');
insert into public.staff(user_id,email,role) values
 ('00000000-0000-0000-0000-000000000001','super@qartexa.test','super_admin'),('00000000-0000-0000-0000-000000000002','admin@qartexa.test','admin'),
 ('00000000-0000-0000-0000-000000000003','hr@qartexa.test','hr'),('00000000-0000-0000-0000-000000000004','content@qartexa.test','content'),
 ('00000000-0000-0000-0000-000000000005','editor@qartexa.test','editor')
 on conflict (user_id) do update set role=excluded.role, active=true;
delete from public.jobs; delete from public.tenders; delete from public.posts;
insert into public.jobs(slug,title_en,title_fr,status,closing_at,department,location,summary_en,description_en) values
 ('network-engineer','Network Engineer','Ingénieur réseau','open',now()+interval '10 days','Infrastructure','Kigali','Build networks.','Design and run networks.'),
 ('expired-analyst','Expired Analyst','Analyste expiré','open',now()-interval '2 minutes','Security','Kigali','Old.','Old role.'),
 ('draft-role','Draft Role','Poste brouillon','draft',null,'Ops','Kigali','Draft.','Draft.');
insert into public.tenders(slug,title_en,reference,status,closing_at,show_in_history,description_en) values
 ('open-tender','Open Tender Alpha','QT-001','open',now()+interval '9 days',false,'Supply of switches.'),
 ('expired-tender','Expired Tender Beta','QT-002','open',now()-interval '3 minutes',false,'Old tender.'),
 ('history-tender','History Tender Gamma','QT-003','closed',now()-interval '20 days',true,'Awarded.');
insert into public.posts(slug,title_en,status,published_at,excerpt_en,body_en) values
 ('live-post','Live Article','published',now()-interval '1 day','Visible.','Body.'),
 ('future-post','Secret Future Article','scheduled',now()+interval '3 days','Hidden.','Body.');
